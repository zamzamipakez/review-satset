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

const RimapLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#purple-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
      <line x1="9" y1="3" x2="9" y2="18"></line>
      <line x1="15" y1="6" x2="15" y2="21"></line>
    </svg>
    <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      Rimap
    </h1>
  </div>
);

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
        } else { alert('Pilih nama target dari daftar yang muncul.'); }
      });
    }
  }, [step]);

  const startScanner = () => {
    if (!window.Html5Qrcode) { alert("Memuat sistem kamera, tunggu sebentar..."); return; }
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
      alert("Akses kamera ditolak oleh browser Anda.");
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
          setKode(kodeKartu); setDbPin(data.pin); setStep(2); 
        } else { alert("Kartu belum pernah diaktifkan."); }
      } else { alert("Kode kartu tidak valid."); }
    } catch (error) { alert("Sistem Error: " + error.message); }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlace) { alert('Pilih target baru terlebih dahulu!'); return; }
    if (inputPin !== dbPin) { alert('PIN Salah! Anda tidak berhak mengubah kartu ini.'); return; }
    try {
      await updateDoc(doc(db, "kartu_review", kode), {
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url
      });
      alert('Berhasil! Rute kartu telah diperbarui.');
      window.location.href = selectedPlace.url;
    } catch (error) { alert('Gagal memperbarui: ' + error.message); }
  };

  return (
    <>
      <style>{`
        .white-futuristic-bg { background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        .glass-card { background: #ffffff; border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 24px; box-shadow: 0 20px 40px rgba(139, 92, 246, 0.08), 0 1px 3px rgba(0,0,0,0.05); }
        .cyber-input-light { background: #f1f5f9; border: 1px solid #e2e8f0; color: #1e293b; transition: all 0.3s ease; }
        .cyber-input-light:focus { border-color: #8b5cf6; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15); outline: none; background: #ffffff; }
        .btn-gradient-purple { background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white; transition: all 0.3s; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3); }
        .btn-gradient-purple:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
        .btn-outline { background: #ffffff; border: 1px solid #e2e8f0; color: #475569; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .btn-outline:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .pac-container { border-radius: 12px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; font-family: 'Inter', sans-serif !important; }
        .pac-item { padding: 12px !important; cursor: pointer !important; font-size: 14px !important; border-top: 1px solid #f1f5f9 !important; }
        .pac-item:hover { background-color: #f8fafc !important; }
        #qr-reader { border: none !important; }
      `}</style>

      <div className="white-futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} strategy="afterInteractive" />

        <div className="glass-card" style={{ padding: '40px', maxWidth: '420px', width: '100%' }}>
          <RimapLogo />
          
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Pusat Pengeditan</h2>
                <p style={{ margin: '0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Gunakan kamera untuk memindai QR kartu Anda, atau masukkan ID secara manual untuk mengubah lokasi rute ulasan.</p>
              </div>
              
              {!scannerActive ? (
                <button onClick={startScanner} className="btn-outline" style={{ width: '100%', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Buka Kamera Pemindai
                </button>
              ) : (
                <div style={{ marginBottom: '24px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <div id="qr-reader" style={{ width: '100%' }}></div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
                <span style={{ padding: '0 12px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>ATAU KETIK MANUAL</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <input type="text" value={manualKode} onChange={(e) => setManualKode(e.target.value)} placeholder="Contoh: RVW-123456" className="cyber-input-light" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              
              <button onClick={() => cekKartu(manualKode)} disabled={loading} className="btn-gradient-purple" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', letterSpacing: '0.5px' }}>
                {loading ? 'Mencari Data...' : 'Cari Kartu'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Perbarui Rute Bisnis</h2>
                <div style={{ display: 'inline-block', background: '#f5f3ff', border: '1px solid #ede9fe', padding: '6px 16px', borderRadius: '20px', color: '#8b5cf6', fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>
                  ID: {kode}
                </div>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>1. Tentukan Nama Bisnis Baru</label>
                  <input ref={inputRef} type="text" placeholder="Ketik lokasi baru..." className="cyber-input-light" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>2. Masukkan PIN Lama Anda</label>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8' }}>Dibutuhkan untuk memverifikasi kepemilikan kartu.</p>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type={showPin ? "text" : "password"} value={inputPin} onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required className="cyber-input-light" style={{ width: '100%', padding: '14px 50px 14px 16px', borderRadius: '12px', fontSize: '18px', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '4px' }} />
                    <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showPin ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-gradient-purple" style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' }}>
                  Simpan Perubahan
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
