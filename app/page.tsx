// @ts-nocheck
"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Ikon Mata (Eye Icon) SVG
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

function KartuReviewApp() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');

  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (!kode) {
      setLoading(false);
      return;
    }

    async function cekKartu() {
      const { data, error } = await supabase
        .from('kartu_review')
        .select('*')
        .eq('kode', kode)
        .single();

      if (data && data.google_url) {
        window.location.href = data.google_url;
      } else {
        setLoading(false);
      }
    }

    cekKartu();
  }, [kode]);

  const initAutocomplete = () => {
    if (!window.google || !inputRef.current) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'url'],
      types: ['establishment'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name && place.url) {
        setSelectedPlace({ name: place.name, url: place.url });
      } else {
        alert('Pilih nama bisnis dari daftar otomatis yang muncul.');
      }
    });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !pin) {
      alert('Pilih nama bisnis dan isi PIN terlebih dahulu!');
      return;
    }
    
    if (pin.length !== 4) {
      alert('PIN harus terdiri dari 4 digit angka!');
      return;
    }

    const { error } = await supabase
      .from('kartu_review')
      .upsert({
        kode: kode,
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url,
        pin: pin
      }, { onConflict: 'kode' });

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Kartu berhasil diaktifkan!');
      window.location.href = selectedPlace.url;
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif'}}>Memeriksa kartu...</div>;
  if (!kode) return <div style={{textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif'}}>Kode kartu tidak ditemukan.</div>;

  return (
    <div style={{
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onReady={initAutocomplete}
      />

      <div style={{
        backgroundColor: '#ffffff',
        padding: '32px',
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          Aktivasi Kartu
        </h2>
        
        <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
          Kode kartu: <b style={{ color: '#374151' }}>{kode}</b>. Isi semua kolom di bawah untuk mengaktifkan kartu.
        </p>

        <form onSubmit={handleSimpan}>
          {/* Kolom 1: Nama Bisnis */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
              Nama Bisnis
            </label>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Ketik nama bisnis untuk cari otomatis" 
              style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: '12px', 
                fontSize: '15px', 
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Kolom 2: PIN */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
              Buat PIN (4 Digit Angka)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPin ? "text" : "password"} 
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="••••" 
                style={{
                  width: '100%', 
                  padding: '12px 45px 12px 16px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: showPin ? 'normal' : '2px'
                }}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPin ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Tombol Aktifkan */}
          <button 
            type="submit" 
            style={{
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#0070f3', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '24px', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: '16px', 
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#005bb5'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#0070f3'}
          >
            Aktifkan Kartu
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif'}}>Memuat form aktivasi...</div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
