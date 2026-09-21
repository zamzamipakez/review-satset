// @ts-nocheck
"use client";

import { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";

// --- 1. GANTI FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCO4FA-hC18iM6sKuIONIq0H3ryW8Cjk-k",
  authDomain: "review-satset.firebaseapp.com",
  projectId: "review-satset",
  storageBucket: "review-satset.firebasestorage.app",
  messagingSenderId: "1057136032394",
  appId: "1:1057136032394:web:5a35de9c6bdefcd6cc0b73",
  measurementId: "G-V3G3L35QE9"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. GANTI DENGAN URL APPS SCRIPT DARI TAHAP 1 ---
const GOOGLE_SHEETS_URL = "ISI_DENGAN_URL_APPS_SCRIPT_KAMU";

const RimapLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#admin-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="admin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
      <line x1="9" y1="3" x2="9" y2="18"></line>
      <line x1="15" y1="6" x2="15" y2="21"></line>
    </svg>
    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      Rimap Admin
    </h1>
  </div>
);

export default function AdminRahasia() {
  const [jumlah, setJumlah] = useState(50);
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  const generateKode = async () => {
    if (jumlah > 500) { alert("Maksimal 500 kode!"); return; }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const newRowsForSheets = [];
      let teksHasil = "Kode Unik\tLink Lengkap\n";

      for (let i = 0; i < jumlah; i++) {
        const karakter = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
        let randomCode = 'RVW-';
        for (let j = 0; j < 6; j++) { randomCode += karakter.charAt(Math.floor(Math.random() * karakter.length)); }
        
        // Simpan ke Firebase dengan status "baru_cetak" untuk memicu halaman QC
        const docRef = doc(db, "kartu_review", randomCode);
        batch.set(docRef, { status: "baru_cetak" });

        // Siapkan data untuk Google Sheets
        newRowsForSheets.push({
          kode: randomCode,
          link: `https://review-satset.vercel.app/?kode=${randomCode}`,
          status: "Baru Dicetak"
        });

        teksHasil += `${randomCode}\thttps://review-satset.vercel.app/?kode=${randomCode}\n`;
      }

      await batch.commit(); // Eksekusi ke Firebase

      // Tembak data ke Google Sheets dengan metode no-cors
      fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'appendBatch', rows: newRowsForSheets })
      }).catch(err => console.error("Sheets error:", err));

      setHasil(teksHasil);
      alert(`Berhasil membuat ${jumlah} kode dan sinkronisasi ke Sheets!`);
    } catch (error) { 
      alert("Gagal: " + error.message); 
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        .white-futuristic-bg { background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        .glass-card { background: #ffffff; border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 20px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.08); }
        .cyber-input-light { background: #f1f5f9; border: 1px solid #e2e8f0; color: #1e293b; transition: all 0.3s ease; }
        .cyber-input-light:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); outline: none; }
        .btn-gradient-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; transition: all 0.3s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3); border: none; }
        .btn-gradient-green:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
      `}</style>
      <div className="white-futuristic-bg" style={{ minHeight: '100vh', padding: '40px 20px' }}>
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
          <RimapLogo />
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px' }}>Pusat Produksi Terpusat</h2>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Data akan otomatis masuk ke Firebase dan Google Sheets tanpa copy-paste.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Jumlah Kartu</label>
              <input type="number" value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))} max="500" className="cyber-input-light" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <button onClick={generateKode} disabled={loading} className="btn-gradient-green" style={{ padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
              {loading ? 'Menyinkronkan...' : 'Produksi & Sinkronisasi'}
            </button>
          </div>

          <textarea 
            value={hasil} readOnly rows={12} 
            className="cyber-input-light"
            style={{ width: '100%', padding: '16px', borderRadius: '10px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre' }} 
            placeholder="Hasil kode akan muncul di sini sebagai cadangan. Data sudah otomatis terkirim ke Sheets."
          ></textarea>
        </div>
      </div>
    </>
  );
}
