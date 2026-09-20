'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Autocomplete from 'react-google-autocomplete';

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const searchParams = useSearchParams();
  const kodeCard = searchParams.get('kode');

  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placeId, setPlaceId] = useState('');
  const [pin, setPin] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    async function checkCard() {
      if (kodeCard) {
        // Cek database Supabase
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('card_code', kodeCard)
          .single();

        if (data) {
          // Kartu sudah terdaftar
          setIsRegistered(true);
          // Format link Google Review (membutuhkan Place ID)
          setTargetUrl(`https://search.google.com/local/writereview?placeid=${data.place_id}`);
        } else {
          // Kartu belum terdaftar
          setIsRegistered(false);
        }
      }
      setLoading(false);
    }
    checkCard();
  }, [kodeCard]);

  // Fungsi saat tombol simpan ditekan (Registrasi)
  const handleRegister = async () => {
    if (!placeId || !pin) {
      alert("Harap isi lokasi dan PIN!");
      return;
    }
    const { data, error } = await supabase
      .from('cards')
      .insert([
        { card_code: kodeCard, place_id: placeId, pin: pin }
      ]);

    if (error) {
      alert("Gagal menyimpan data!");
      console.log(error);
    } else {
      alert("Berhasil didaftarkan!");
      window.location.reload(); // Refresh halaman agar masuk ke mode 'Sudah Terdaftar'
    }
  };

  // Tampilan saat loading
  if (loading) return <div className="p-10 text-center">Memuat data...</div>;

  // Jika diakses tanpa ?kode=
  if (!kodeCard) return <div className="p-10 text-center">Kartu tidak valid. Kode tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        {isRegistered ? (
          // === TAMPILAN KARTU SUDAH TERDAFTAR ===
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Mengarahkan ke Google Review...</h1>
            <p className="mb-6 text-gray-600">Jika tidak otomatis berpindah, klik tombol di bawah.</p>
            <a 
              href={targetUrl}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 inline-block w-full"
            >
              Buka Google Review
            </a>
            
            {/* Opsi Edit (Untuk nanti) */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Pemilik bisnis?</p>
              <button className="text-blue-500 text-sm hover:underline">Edit Lokasi</button>
            </div>
            
            {/* Auto Redirect Script */}
            <script dangerouslySetInnerHTML={{__html: `
              setTimeout(function() {
                window.location.href = "${targetUrl}";
              }, 3000);
            `}} />
          </div>

        ) : (
          // === TAMPILAN REGISTRASI (BELUM TERDAFTAR) ===
          <div>
            <h1 className="text-2xl font-bold mb-6 text-center">Aktivasi Kartu Baru</h1>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Cari Nama Bisnis Kamu</label>
              {/* Dropdown Autocomplete Google Maps */}
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={(place) => {
                  if(place.place_id) setPlaceId(place.place_id);
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ketik nama cafe, toko, dll..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">Buat PIN (Untuk Edit Nanti)</label>
              <input 
                type="password" 
                maxLength="6"
                placeholder="Contoh: 123456"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            <button 
              onClick={handleRegister}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              Simpan & Aktifkan
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
