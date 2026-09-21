// @ts-nocheck
"use client";

import { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";

// --- MASUKKAN KODE FIREBASE LO DI SINI ---
const firebaseConfig = {
  apiKey: "ISI_DENGAN_API_KEY_FIREBASE",
  authDomain: "ISI_DENGAN_AUTH_DOMAIN",
  projectId: "ISI_DENGAN_PROJECT_ID",
  storageBucket: "ISI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "ISI_DENGAN_SENDER_ID",
  appId: "ISI_DENGAN_APP_ID"
};
// -----------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function AdminRahasia() {
  const [jumlah, setJumlah] = useState(100);
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  const generateKode = async () => {
    // Firebase membatasi maksimal 500 data sekali kirim untuk fitur Batch
    if (jumlah > 500) {
      alert("Maksimal 500 kode sekali proses agar server tidak error!");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      // Header untuk Excel. \t (Tab) akan memisahkan teks menjadi dua kolom saat di-paste ke Excel.
      let teksHasil = "Kode Unik\tLink Lengkap\n"; 

      for (let i = 0; i < jumlah; i++) {
        // Membuat kode acak. Karakter O, 0, 1, I dihapus agar pembeli tidak salah baca
        const karakter = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
        let randomCode = 'RVW-';
        for (let j = 0; j < 6; j++) {
          randomCode += karakter.charAt(Math.floor(Math.random() * karakter.length));
        }

        // Mendaftarkan kode ke Firebase
        const docRef = doc(db, "kartu_review", randomCode);
        batch.set(docRef, { status: "ready" });

        // Menyimpan teks untuk di-copy ke Excel
        teksHasil += `${randomCode}\thttps://review-satset.vercel.app/?kode=${randomCode}\n`;
      }

      // Menembak semua data ke Firebase secara bersamaan
      await batch.commit();
      setHasil(teksHasil);
      alert(`Berhasil memproduksi ${jumlah} kode dan mendaftarkannya ke Firebase!`);
    } catch (error) {
      alert("Gagal: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
      <h2>Pabrik Kode Kartu NFC</h2>
      <p style={{ color: '#666' }}>Generate kode acak, otomatis masuk ke Firebase, dan siap di-paste ke Excel.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Jumlah Kode (Maks 500 sekali klik):</label>
        <input 
          type="number" 
          value={jumlah} 
          onChange={(e) => setJumlah(e.target.value)} 
          max="500" 
          style={{ padding: '10px', width: '100px', marginRight: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={generateKode} 
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Memproses ke Firebase...' : 'Buat Kode Sekarang'}
        </button>
      </div>

      <textarea 
        value={hasil} 
        readOnly 
        rows={15} 
        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'monospace', whiteSpace: 'pre' }} 
        placeholder="Hasil generate akan muncul di sini. Tinggal Blok Semua -> Copy -> Paste ke kolom Google Sheets."
      ></textarea>
    </div>
  );
}
