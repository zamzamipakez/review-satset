// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
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

export default function EditKartuPage() {
  const [step, setStep] = useState(1);
  const [kode, setKode] = useState('');
  const [manualKode, setManualKode] = useState('');
  const [dbPin, setDbPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const inputRef = useRef(null);
  
  useEffect(() => {
    if (step === 2 && window.google && inputRef.current) {
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
          alert('Pilih nama target dari daftar yang muncul.');
        }
      });
    }
  }, [step]);

  const startScanner = () => {
    if (!window.Html5Qrcode) {
      alert("Memuat modul optik, tunggu sebentar...");
      return;
    }
    setScannerActive(true);
    const html5QrCode = new window.Html5Qrcode("qr-reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        let extractedKode = decodedText;
        if (decodedText.includes('?kode=')) {
          const url = new URL(decodedText);
          extractedKode = url.searchParams.get("kode");
        }
        if (extractedKode) {
          html5QrCode.stop().then(() => {
            setScannerActive(false);
            cekKartu(extractedKode);
          });
        }
      },
      (error) => {}
    ).catch(err => {
      alert("Akses optik (kamera) ditolak sistem.");
      setScannerActive(false);
    });
  };

  const cekKartu = async (kodeKartu) => {
    if (!kodeKartu) return;
    setLoading(true);
    try {
      const docRef = doc(db, "kartu_review", kodeKartu);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.google_url && data.pin) {
          setKode(kodeKartu);
          setDbPin(data.pin); 
          setStep(2); 
        } else {
          alert("Kartu belum diinisialisasi di sistem utama.");
        }
      } else {
        alert("Kode identitas tidak valid.");
      }
    } catch (error) {
      alert("Sistem Error: " + error.message);
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlace) {
      alert('Pilih target baru terlebih dahulu!');
      return;
    }
    if (inputPin !== dbPin) {
      alert('SECURITY BREACH: PIN Salah! Akses ditolak.');
      return;
    }
    try {
      await updateDoc(doc(db, "kartu_review", kode), {
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url
      });
      alert('Override berhasil! Target kartu telah diperbarui.');
      window.location.href = selectedPlace.url;
    } catch (error) {
      alert('Gagal menembus database: ' + error.message);
    }
  };

  return (
    <>
      <style>{`
        .futuristic-bg { background-color: #050505; background-image: radial-gradient(circle at 50% 0%, #1a1a2e 0%, #050505 70%); font-family: 'Inter', system-ui, sans-serif; }
        .glass-panel { background: rgba(20, 20, 30, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 10px 40px rgba(122, 0, 255, 0.15); }
        .neon-text-purple { background: linear-gradient(90deg, #b388ff 0%, #7a00ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .cyber-input { background: rgba(0, 0, 0, 0.4) !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; color: #fff !important; transition: all 0.3s ease !important; }
        .cyber-input:focus { border-color: #b388ff !important; box-shadow: 0 0 15px rgba(179, 136, 255, 0.2) !important; outline: none !important; }
        .btn-neon-purple { background: linear-gradient(90deg, #b388ff 0%, #7a00ff 100%); color: #fff; transition: all 0.4s ease; background-size: 200% auto; }
        .btn-neon-purple:hover { background-position: right center; box-shadow: 0 0 20px rgba(122, 0, 255, 0.4); transform: translateY(-2px); }
        .btn-outline-cyber { background: rgba(0,0,0,0.3); border: 1px solid #00f2fe; color: #00f2fe; transition: all 0.3s; }
        .btn-outline-cyber:hover { background: rgba(0, 242, 254, 0.1); box-shadow: 0 0 15px rgba(0, 242, 254, 0.3); }
        .pac-container { background-color: #1a1a2e !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; box-shadow: 0 5px 20px rgba(0,0,0,0.5) !important; }
        .pac-item { color: #a1a1aa !important; border-top: 1px solid rgba(255,255,255,0.05) !important; padding: 10px !important; cursor: pointer !important; }
        .pac-item:hover { background-color: rgba(179, 136, 255, 0.1) !important; }
        .pac-item-query { color: #fff !important; font-weight: 600 !important; }
        #qr-reader { border: none !important; }
        #qr-reader__scan_region { background: rgba(0,0,0,0.5); }
        #qr-reader__dashboard { background: transparent; color: #fff; }
      `}</style>

      <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} strategy="afterInteractive" />

        <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', maxWidth: '420px', width: '100%' }}>
          
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 className="neon-text-purple" style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>SYSTEM OVERRIDE</h2>
                <p style={{ margin: '0', color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>Scan optik QR untuk mengubah jalur koneksi NFC.</p>
              </div>
              
              {!scannerActive ? (
                <button onClick={startScanner} className="btn-outline-cyber" style={{ width: '100%', padding: '16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Inisiasi Kamera Pemindai
                </button>
              ) : (
                <div style={{ marginBottom: '24px', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.3)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.1)' }}>
                  <div id="qr-reader" style={{ width: '100%' }}></div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ padding: '0 12px', color: '#6b7280', fontSize: '12px', letterSpacing: '2px' }}>MANUAL</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <input type="text" value={manualKode} onChange={(e) => setManualKode(e.target.value)} placeholder="Input ID Kartu (ex: RVW-123)" className="cyber-input" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              
              <button onClick={() => cekKartu(manualKode)} disabled={loading} className="btn-neon-purple" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', letterSpacing: '1px' }}>
                {loading ? 'MEMINDAI...' : 'AKSES DATA'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 className="neon-text-purple" style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>UPDATE TARGET</h2>
                <div style={{ display: 'inline-block', background: 'rgba(179, 136, 255, 0.1)', border: '1px solid rgba(179, 136, 255, 0.3)', padding: '6px 16px', borderRadius: '20px', color: '#b388ff', fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>
                  ID: {kode}
                </div>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Target Lokasi Baru</label>
                  <input ref={inputRef} type="text" placeholder="Ketik lokasi target..." className="cyber-input" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#a1a1aa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>2. Verifikasi PIN</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type={showPin ? "text" : "password"} value={inputPin} onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required className="cyber-input" style={{ width: '100%', padding: '16px 50px 16px 16px', borderRadius: '12px', fontSize: '18px', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '4px' }} />
                    <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showPin ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-neon-purple" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Timpa Data
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
