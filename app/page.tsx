'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kode) {
      // Di sini nanti kita cek ke database Supabase
      console.log("Kode NFC yang di-scan:", kode);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [kode]);

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Review Satset</h1>
      {loading ? (
        <p>Memuat data...</p>
      ) : kode ? (
        <div>
          <p>Chip NFC terdeteksi dengan Kode: <strong>{kode}</strong></p>
          <p>Sistem database dan form setup akan segera aktif di sini.</p>
        </div>
      ) : (
        <p>Silakan scan kartu NFC Anda atau gunakan tautan yang valid.</p>
      )}
    </main>
  );
}
