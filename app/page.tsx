// @ts-nocheck
"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function KartuReviewApp() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');

  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [pin, setPin] = useState('');
  
  // Menggunakan useRef untuk mencegah input kehilangan fokus saat diketik
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

  // Fungsi ini dipanggil otomatis ketika script Google Maps selesai dimuat
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
        alert('Pastikan Anda memilih nama tempat dari daftar dropdown yang muncul.');
      }
    });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !pin) {
      alert('Pilih nama bisnis dari dropdown dan isi PIN terlebih dahulu!');
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
      alert('Berhasil diaktifkan! Halaman akan dialihkan ke profil bisnis Anda.');
      window.location.href = selectedPlace.url;
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Memeriksa chip...</div>;
  if (!kode) return <div style={{textAlign: 'center', marginTop: '50px'}}>Kode kartu tidak valid. Pastikan scan langsung dari fisik kartu.</div>;

  return (
    <div style={{maxWidth: '420px', margin: '40px auto', padding: '30px 20px', fontFamily: 'sans-serif', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)'}}>
      <h2 style={{textAlign: 'center', margin: '0 0 5px 0', color: '#1a1a1a'}}>Aktivasi Kartu Review</h2>
      <p style={{textAlign: 'center', margin: '0 0 25px 0', color: '#666', fontSize: '14px'}}>
        ID Kartu: <b style={{color: '#000'}}>{kode}</b>
      </p>
      
      {/* Memuat API Google Maps secara Native */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onReady={initAutocomplete}
      />

      <form onSubmit={handleSimpan}>
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px'}}>1. Cari Nama Bisnis / Toko:</label>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Ketik lalu pilih dari dropdown..." 
            style={{width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none'}}
          />
        </div>

        <div style={{marginBottom: '25px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px'}}>2. Buat PIN Pengaman:</label>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="Contoh: 123456" 
            style={{width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none'}}
            required
          />
          <small style={{display: 'block', marginTop: '6px', color: '#71717a', fontSize: '12px'}}>
            PIN rahasia ini digunakan jika Anda ingin mengganti link toko di masa depan.
          </small>
        </div>

        <button type="submit" style={{width: '100%', padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.2s'}}>
          Simpan & Hubungkan Kartu
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', marginTop: '50px'}}>Memuat sistem aktivasi...</div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
