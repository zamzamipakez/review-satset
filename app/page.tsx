// @ts-nocheck
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Autocomplete from 'react-google-autocomplete';

// Menghubungkan ke Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Komponen Utama Aplikasi
function KartuReviewApp() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');

  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!kode) {
      setLoading(false);
      return;
    }

    async function cekKartu() {
      // Mengecek apakah kode kartu sudah ada di database
      const { data, error } = await supabase
        .from('kartu_review')
        .select('*')
        .eq('kode', kode)
        .single();

      if (data && data.google_url) {
        // Jika sudah terdaftar, langsung alihkan ke Google Maps
        window.location.href = data.google_url;
      } else {
        // Jika belum terdaftar, buka halaman form
        setLoading(false);
      }
    }

    cekKartu();
  }, [kode]);

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !pin) {
      alert('Pilih nama bisnis dan isi PIN terlebih dahulu!');
      return;
    }

    // Menyimpan data ke database Supabase
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
      alert('Berhasil disimpan! Halaman akan dialihkan.');
      window.location.href = selectedPlace.url;
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Memuat kartu...</div>;
  if (!kode) return <div style={{textAlign: 'center', marginTop: '50px'}}>Kode kartu tidak ditemukan. Pastikan Anda scan dari kartu NFC atau QR Code.</div>;

  return (
    <div style={{maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif'}}>
      <h2>Aktivasi Kartu Review</h2>
      <p>Kode Kartu: <b>{kode}</b></p>
      
      <form onSubmit={handleSimpan}>
        <div style={{marginBottom: '15px'}}>
          <label>Cari Nama Bisnis / Toko:</label>
          <Autocomplete
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            onPlaceSelected={(place) => {
              if (place && place.url) {
                setSelectedPlace({ name: place.name, url: place.url });
              } else {
                alert('Data tempat tidak lengkap. Pilih dari daftar dropdown yang muncul.');
              }
            }}
            options={{
              types: ['establishment'],
            }}
            style={{width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px'}}
            placeholder="Ketik nama toko (contoh: Kopi Kenangan)..."
          />
        </div>

        <div style={{marginBottom: '15px'}}>
          <label>PIN Pengaman (untuk edit nanti):</label>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="Masukkan PIN angka (contoh: 123456)" 
            style={{width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px'}}
            required
          />
        </div>

        <button type="submit" style={{width: '100%', padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
          Simpan & Hubungkan Kartu
        </button>
      </form>
    </div>
  );
}

// Fitur Suspense (Ruang Tunggu) agar Vercel tidak error saat proses build
export default function Home() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', marginTop: '50px'}}>Mempersiapkan sistem...</div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
