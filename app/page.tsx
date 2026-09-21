// @ts-nocheck
"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// --- GANTI BAGIAN INI DENGAN KODE FIREBASE MILIKMU ---
const firebaseConfig = {
  apiKey: "AIzaSyCO4FA-hC18iM6sKuIONIq0H3ryW8Cjk-k",
  authDomain: "review-satset.firebaseapp.com",
  projectId: "review-satset",
  storageBucket: "review-satset.firebasestorage.app",
  messagingSenderId: "1057136032394",
  appId: "1:1057136032394:web:5a35de9c6bdefcd6cc0b73",
  measurementId: "G-V3G3L35QE9"
};
// -----------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Komponen Ikon & Logo Rimap
const RimapLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#blue-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0070f3" />
          <stop offset="100%" stopColor="#00c6ff" />
        </linearGradient>
      </defs>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
      <line x1="9" y1="3" x2="9" y2="18"></line>
      <line x1="15" y1="6" x2="15" y2="21"></line>
    </svg>
    <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      Rimap
    </h1>
  </div>
);

const EyeIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
const EyeOffIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> );

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
    if (!kode) { setLoading(false); return; }
    async function cekKartu() {
      try {
        const docRef = doc(db, "kartu_review", kode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (docSnap.data().google_url) window.location.href = docSnap.data().google_url;
          else { setIsValidCode(true); setLoading(false); }
        } else { setIsValidCode(false); setLoading(false); }
      } catch (error) { setLoading(false); }
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
        const directReviewUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
        setSelectedPlace({ name: place.name, url: directReviewUrl });
      } else { alert('Pilih nama bisnis dari daftar otomatis yang muncul.'); }
    });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !pin || pin.length !== 4) {
      alert('Pilih nama bisnis dari dropdown dan pastikan PIN 4 digit angka!');
      return;
    }
    try {
      await updateDoc(doc(db, "kartu_review", kode), {
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url,
        pin: pin
      });
      alert('Kartu Rimap Anda berhasil diaktifkan!');
      window.location.href = selectedPlace.url;
    } catch (error) { alert('Gagal menyimpan: ' + error.message); }
  };

  if (loading) return <div className="white-futuristic-bg min-h-screen flex items-center justify-center text-gray-500">Memeriksa status kartu...</div>;
  
  return (
    <>
      <style>{`
        .white-futuristic-bg { background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        .glass-card { background: #ffffff; border: 1px solid rgba(0, 112, 243, 0.1); border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 112, 243, 0.08), 0 1px 3px rgba(0,0,0,0.05); }
        .cyber-input-light { background: #f1f5f9; border: 1px solid #e2e8f0; color: #1e293b; transition: all 0.3s ease; }
        .cyber-input-light:focus { border-color: #0070f3; box-shadow: 0 0 0 4px rgba(0, 112, 243, 0.15); outline: none; background: #ffffff; }
        .btn-gradient { background: linear-gradient(135deg, #0070f3 0%, #00c6ff 100%); color: white; transition: all 0.3s; box-shadow: 0 4px 14px rgba(0, 112, 243, 0.3); }
        .btn-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 112, 243, 0.4); }
        .pac-container { border-radius: 12px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; font-family: 'Inter', sans-serif !important; }
        .pac-item { padding: 12px !important; cursor: pointer !important; font-size: 14px !important; border-top: 1px solid #f1f5f9 !important; }
        .pac-item:hover { background-color: #f8fafc !important; }
      `}</style>

      <div className="white-futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} onReady={initAutocomplete} />
        
        {(!kode || !isValidCode) ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <RimapLogo />
            <div style={{ color: '#ef4444', fontSize: '50px', marginBottom: '15px' }}>✖</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700' }}>Akses Ditolak</h2>
            <p style={{ margin: '0', color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>Kode <b>{kode || 'Kosong'}</b> tidak terdaftar di sistem. Gunakan kartu fisik Rimap yang resmi.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '40px', maxWidth: '420px', width: '100%' }}>
            <RimapLogo />
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Aktivasi Kartu Baru</h2>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                Selamat datang! Silakan lengkapi data di bawah ini untuk menghubungkan kartu ini dengan halaman ulasan Google bisnis Anda.
              </p>
              <div style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '20px', color: '#0070f3', fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>
                ID: {kode}
              </div>
            </div>

            <form onSubmit={handleSimpan}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>1. Cari Nama Bisnis Anda</label>
                <input ref={inputRef} type="text" placeholder="Ketik lalu pilih dari daftar..." className="cyber-input-light" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>2. Buat PIN Keamanan (4 Digit)</label>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8' }}>Ingat PIN ini untuk mengubah pengaturan kartu di masa depan.</p>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required className="cyber-input-light" style={{ width: '100%', padding: '14px 50px 14px 16px', borderRadius: '12px', fontSize: '18px', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '4px' }} />
                  <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPin ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' }}>
                Aktifkan Kartu Rimap
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}></div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
