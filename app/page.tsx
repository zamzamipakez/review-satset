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
    if (!kode) {
      setLoading(false);
      return;
    }
    async function cekKartu() {
      try {
        const docRef = doc(db, "kartu_review", kode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (docSnap.data().google_url) {
            window.location.href = docSnap.data().google_url;
          } else {
            setIsValidCode(true);
            setLoading(false);
          }
        } else {
          setIsValidCode(false);
          setLoading(false);
        }
      } catch (error) {
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

  if (loading) return <div className="futuristic-bg text-white min-h-screen flex items-center justify-center">Memeriksa jaringan...</div>;
  
  return (
    <>
      <style>{`
        .futuristic-bg {
          background-color: #050505;
          background-image: radial-gradient(circle at 50% 0%, #1a1a2e 0%, #050505 70%);
          font-family: 'Inter', system-ui, sans-serif;
        }
        .glass-panel {
          background: rgba(20, 20, 30, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px rgba(0, 212, 255, 0.1);
        }
        .neon-text {
          background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cyber-input {
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #fff !important;
          transition: all 0.3s ease !important;
        }
        .cyber-input:focus {
          border-color: #00f2fe !important;
          box-shadow: 0 0 15px rgba(0, 242, 254, 0.2) !important;
          outline: none !important;
        }
        .btn-neon {
          background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
          color: #000;
          transition: all 0.4s ease;
          background-size: 200% auto;
        }
        .btn-neon:hover {
          background-position: right center;
          box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
          transform: translateY(-2px);
        }
        /* Custom Google Maps Dropdown Styling */
        .pac-container {
          background-color: #1a1a2e !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 5px 20px rgba(0,0,0,0.5) !important;
        }
        .pac-item { color: #a1a1aa !important; border-top: 1px solid rgba(255,255,255,0.05) !important; padding: 10px !important; cursor: pointer !important; }
        .pac-item:hover { background-color: rgba(0, 242, 254, 0.1) !important; }
        .pac-item-query { color: #fff !important; font-weight: 600 !important; }
      `}</style>

      <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} onReady={initAutocomplete} />
        
        {(!kode || !isValidCode) ? (
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <div style={{ color: '#ef4444', fontSize: '50px', marginBottom: '15px', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>✖</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '24px', fontWeight: '700' }}>Akses Ditolak</h2>
            <p style={{ margin: '0', color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>Kode <b>{kode || 'Kosong'}</b> tidak terdaftar di mainframe. Gunakan kartu fisik yang resmi.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', maxWidth: '420px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 className="neon-text" style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>INITIATE NFC</h2>
              <div style={{ display: 'inline-block', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '6px 16px', borderRadius: '20px', color: '#00f2fe', fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>
                ID: {kode}
              </div>
            </div>

            <form onSubmit={handleSimpan}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tujuan Bisnis</label>
                <input ref={inputRef} type="text" placeholder="Ketik lokasi target..." className="cyber-input" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Security PIN (4 Digit)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required className="cyber-input" style={{ width: '100%', padding: '16px 50px 16px 16px', borderRadius: '12px', fontSize: '18px', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '4px' }} />
                  <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPin ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-neon" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Aktifkan Sistem
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
    <Suspense fallback={<div style={{ backgroundColor: '#050505', minHeight: '100vh' }}></div>}>
      <KartuReviewApp />
    </Suspense>
  );
}
