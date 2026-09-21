// @ts-nocheck
"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// --- GANTI BAGIAN INI DENGAN KODE FIREBASE MILIKMU ---
const firebaseConfig = {
  apiKey: "ISI_DENGAN_API_KEY_FIREBASE",
  authDomain: "ISI_DENGAN_AUTH_DOMAIN",
  projectId: "ISI_DENGAN_PROJECT_ID",
  storageBucket: "ISI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "ISI_DENGAN_SENDER_ID",
  appId: "ISI_DENGAN_APP_ID"
};
// -----------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

function KartuReviewApp() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');

  const [loading, setLoading] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
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
      try {
        const docRef = doc(db, "kartu_review", kode);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // KODE VALID DITEMUKAN DI DATABASE
          if (docSnap.data().google_url) {
            // Jika sudah pernah didaftarkan pembeli, langsung arahkan ke Google Review
            window.location.href = docSnap.data().google_url;
          } else {
            // Jika valid tapi belum didaftarkan, buka form registrasi
            setIsValidCode(true);
            setLoading(false);
          }
        } else {
          // KODE TIDAK DITEMUKAN (TOLAK AKSES)
          setIsValidCode(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error cek kartu:", error);
        setLoading(false);
      }
    }

    cekKartu();
  }, [kode]);

  const initAutocomplete = () => {
    if (!window.google || !inputRef.current) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'place_id'],
      types: ['establishment'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name && place.place_id) {
        // Merakit link langsung ke form review Google
        const directReviewUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
        setSelectedPlace({ name: place.name, url: directReviewUrl });
      } else {
        alert('Pilih nama bisnis dari daftar otomatis yang muncul.');
      }
    });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !pin || pin.length !== 4) {
      alert('Pilih nama bisnis dari dropdown dan pastikan PIN 4 digit angka!');
      return;
    }

    try {
      // Menyimpan data ke Firebase menggunakan updateDoc karena dokumen sudah ada
      await updateDoc(doc(db, "kartu_review", kode), {
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url,
        pin: pin
      });
      alert('Kartu berhasil diaktifkan!');
      window.location.href = selectedPlace.url;
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif'}}>Memeriksa keamanan kartu...</div>;
  
  // TAMPILAN BLOKIR (JIKA KODE TIDAK ADA ATAU SALAH)
  if (!kode || !isValidCode) return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: '20px', fontFamily: 'sans-serif'}}>
      <div style={{backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '350px'}}>
        <div style={{color: '#dc2626', fontSize: '40px', marginBottom: '10px'}}>✖</div>
        <h2 style={{margin: '0 0 10px 0', color: '#111827'}}>Akses Ditolak</h2>
        <p style={{margin: '0', color: '#6b7280', fontSize: '15px'}}>Kode kartu <b>{kode || 'Kosong'}</b> tidak terdaftar di sistem kami. Pastikan Anda memindai kartu fisik yang resmi.</p>
      </div>
    </div>
  );

  // TAMPILAN HALAMAN REGISTRASI (JIKA KODE VALID)
  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} onReady={initAutocomplete} />
      
      <div style={{backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', maxWidth: '400px', width: '100%'}}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>Aktivasi Kartu</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>Kode kartu: <b style={{ color: '#374151' }}>{kode}</b>. Isi semua kolom di bawah.</p>

        <form onSubmit={handleSimpan}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Nama Bisnis</label>
            <input ref={inputRef} type="text" placeholder="Ketik nama bisnis untuk cari otomatis" style={{width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'}} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Buat PIN (4 Digit Angka)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required style={{width: '100%', padding: '12px 45px 12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '2px'}} />
              <button type="button" onClick={() => setShowPin(!showPin)} style={{position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{showPin ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
          </div>

          <button type="submit" style={{width: '100%', padding: '14px', backgroundColor: '#0070f3', color: '#ffffff', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', transition: 'background-color 0.2s'}} onMouseOver={(e) => e.target.style.backgroundColor = '#005bb5'} onMouseOut={(e) => e.target.style.backgroundColor = '#0070f3'}>Aktifkan Kartu</button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', marginTop: '50px'}}>Memuat form aktivasi...</div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
