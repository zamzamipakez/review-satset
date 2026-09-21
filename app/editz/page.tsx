// @ts-nocheck
"use client";

import { useState, useRef } from 'react';
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

const EyeIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
const EyeOffIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> );

export default function EditKartuPage() {
  const [step, setStep] = useState(1); // Step 1: Scan QR, Step 2: Form Edit
  const [kode, setKode] = useState('');
  const [manualKode, setManualKode] = useState('');
  const [dbPin, setDbPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const inputRef = useRef(null);

  const startScanner = () => {
    if (!window.Html5Qrcode) {
      alert("Sistem kamera sedang memuat, silakan coba beberapa detik lagi.");
      return;
    }
    setScannerActive(true);
    const html5QrCode = new window.Html5Qrcode("qr-reader");
    html5QrCode.start(
      { facingMode: "environment" }, // Pakai kamera belakang
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        let extractedKode = decodedText;
        // Jika yang ter-scan adalah URL lengkap, ambil ID uniknya saja
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
      (error) => {} // Abaikan error frame kosong
    ).catch(err => {
      alert("Gagal mengakses kamera. Pastikan browser (Chrome/Safari) diizinkan mengakses kamera.");
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
          setDbPin(data.pin); // Simpan PIN asli dari database secara rahasia
          setStep(2); // Lompat ke halaman 2 (Form Edit)
        } else {
          alert("Kartu ini belum diaktifkan. Silakan lakukan aktivasi awal terlebih dahulu.");
        }
      } else {
        alert("Kode kartu tidak valid atau tidak terdaftar di sistem.");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlace) {
      alert('Pilih nama bisnis baru terlebih dahulu!');
      return;
    }
    // VERIFIKASI PIN
    if (inputPin !== dbPin) {
      alert('PIN yang Anda masukkan SALAH! Akses ditolak.');
      return;
    }

    try {
      await updateDoc(doc(db, "kartu_review", kode), {
        nama_bisnis: selectedPlace.name,
        google_url: selectedPlace.url
      });
      alert('Berhasil! Link Google Review pada kartu telah diperbarui.');
      window.location.href = selectedPlace.url;
    } catch (error) {
      alert('Gagal menyimpan perubahan: ' + error.message);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
      
      {/* Memuat Sistem QR Scanner dan Google Maps API */}
      <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
      {step === 2 && (
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} onReady={initAutocomplete} />
      )}

      <div style={{backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', maxWidth: '400px', width: '100%'}}>
        
        {/* BAGIAN 1: SCANNER & INPUT MANUAL */}
        {step === 1 && (
          <>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center' }}>Edit Tujuan Kartu</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.5', textAlign: 'center' }}>Scan stiker QR pada kartu untuk mengubah tautan review Google.</p>
            
            {!scannerActive ? (
              <button onClick={startScanner} style={{width: '100%', padding: '14px', backgroundColor: '#000', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', marginBottom: '20px'}}>
                📸 Buka Kamera & Scan QR
              </button>
            ) : (
              <div style={{marginBottom: '20px', overflow: 'hidden', borderRadius: '12px', border: '2px solid #e5e7eb'}}>
                <div id="qr-reader" style={{width: '100%'}}></div>
              </div>
            )}

            <div style={{display: 'flex', alignItems: 'center', margin: '20px 0'}}>
              <hr style={{flex: 1, border: 'none', borderTop: '1px solid #e5e7eb'}} />
              <span style={{padding: '0 10px', color: '#9ca3af', fontSize: '14px'}}>ATAU</span>
              <hr style={{flex: 1, border: 'none', borderTop: '1px solid #e5e7eb'}} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Masukkan Kode Manual</label>
              <input type="text" value={manualKode} onChange={(e) => setManualKode(e.target.value)} placeholder="Contoh: RVW-123456" style={{width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'}} />
            </div>
            
            <button onClick={() => cekKartu(manualKode)} disabled={loading} style={{width: '100%', padding: '14px', backgroundColor: '#0070f3', color: '#ffffff', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '16px'}}>
              {loading ? 'Memeriksa...' : 'Cari Identitas Kartu'}
            </button>
          </>
        )}

        {/* BAGIAN 2: FORM PENGUBAHAN TUJUAN */}
        {step === 2 && (
          <>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>Perbarui Tujuan</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>Kode kartu: <b style={{ color: '#374151' }}>{kode}</b>.</p>

            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>1. Pilih Nama Bisnis Baru</label>
                <input ref={inputRef} type="text" placeholder="Ketik nama bisnis untuk cari otomatis" style={{width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'}} />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>2. Masukkan PIN Lama (Verifikasi)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPin ? "text" : "password"} value={inputPin} onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="••••" required style={{width: '100%', padding: '12px 45px 12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', letterSpacing: showPin ? 'normal' : '2px'}} />
                  <button type="button" onClick={() => setShowPin(!showPin)} style={{position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{showPin ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
              </div>

              <button type="submit" style={{width: '100%', padding: '14px', backgroundColor: '#0070f3', color: '#ffffff', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '16px'}}>
                Simpan Perubahan
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
