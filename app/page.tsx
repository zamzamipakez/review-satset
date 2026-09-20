// @ts-nocheck
'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Prediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function ReviewSatsetHome() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');

  const [loading, setLoading] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>('');

  // Google Places Autocomplete States
  const [query, setQuery] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const dummyDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kode) {
      setLoading(false);
      return;
    }

    async function checkCard() {
      try {
        const { data, error } = await supabase
          .from('kartu_review')
          .select('*')
          .eq('kode', kode)
          .single();

        if (data && data.google_url) {
          setIsRegistered(true);
          setTargetUrl(data.google_url);
        } else {
          setIsRegistered(false);
        }
      } catch (err) {
        console.error('Error fetching card:', err);
        setIsRegistered(false);
      } finally {
        setLoading(false);
      }
    }

    checkCard();
  }, [kode]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (!(window as any).google || !(window as any).google.maps) {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initAutocompleteServices;
        document.head.appendChild(script);
      } else {
        existingScript.onload = initAutocompleteServices;
      }
    } else {
      initAutocompleteServices();
    }

    function initAutocompleteServices() {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
        if (dummyDivRef.current) {
          placesServiceRef.current = new (window as any).google.maps.places.PlacesService(dummyDivRef.current);
        }
      }
    }
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedPlaceId('');

    if (!val || val.length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      { input: val, types: ['establishment'] },
      (results: Prediction[], status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPlace = (prediction: Prediction) => {
    setQuery(prediction.description);
    setBusinessName(prediction.structured_formatting.main_text);
    setSelectedPlaceId(prediction.place_id);
    setPredictions([]);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlaceId || !query) {
      alert('Silakan pilih nama bisnis/toko dari daftar dropdown!');
      return;
    }
    if (!pin || pin.length < 4) {
      alert('PIN minimal harus diisi 4 karakter angka!');
      return;
    }

    setIsSubmitting(true);

    if (!placesServiceRef.current && dummyDivRef.current && (window as any).google) {
      placesServiceRef.current = new (window as any).google.maps.places.PlacesService(dummyDivRef.current);
    }

    if (!placesServiceRef.current) {
      alert('Layanan Google Maps belum siap. Coba muat ulang halaman.');
      setIsSubmitting(false);
      return;
    }

    placesServiceRef.current.getDetails(
      { placeId: selectedPlaceId, fields: ['url', 'name'] },
      async (place: any, status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place && place.url) {
          const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${selectedPlaceId}`;

          const { error } = await supabase
            .from('kartu_review')
            .upsert({
              kode: kode,
              nama_bisnis: businessName || place.name,
              google_url: googleReviewUrl,
              pin: pin
            }, { onConflict: ['kode'] });

          if (error) {
            alert('Gagal menyimpan ke database: ' + error.message);
            setIsSubmitting(false);
          } else {
            alert('Berhasil diaktifkan! Halaman akan diarahkan ke Google Review.');
            window.location.href = googleReviewUrl;
          }
        } else {
          alert('Gagal mengambil data detail Google Maps tempat tersebut.');
          setIsSubmitting(false);
        }
      }
    );
  };

  const handleVerifyEditPin = async (e: FormEvent) => {
    e.preventDefault();
    const { data } = await supabase
      .from('kartu_review')
      .select('pin')
      .eq('kode', kode)
      .single();

    if (data && data.pin === inputPin) {
      setIsEditing(true);
    } else {
      alert('PIN salah! Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Memeriksa status kartu...
      </div>
    );
  }

  if (!kode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm">
          <h1 className="text-xl font-bold text-red-600 mb-2">Kartu Tidak Valid</h1>
          <p className="text-slate-500 text-sm">Parameter kode identitas kartu tidak ditemukan pada URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
      <div ref={dummyDivRef} style={{ display: 'none' }}></div>

      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-slate-100">
        {isRegistered && !isEditing ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              ✨
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Mengarahkan...</h1>
            <p className="text-slate-500 text-sm mb-6">Kamu sedang dibawa langsung ke halaman Google Review.</p>
            
            <a 
              href={targetUrl}
              className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-sm"
            >
              Buka Google Review Sekarang
            </a>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-3">Pemilik bisnis ingin mengganti lokasi toko?</p>
              
              <form onSubmit={handleVerifyEditPin} className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="Masukkan PIN" 
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  Edit
                </button>
              </form>
            </div>

            <script dangerouslySetInnerHTML={{__html: `
              setTimeout(function() {
                window.location.href = "${targetUrl}";
              }, 2000);
            `}} />
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                ID: {kode}
              </span>
              <h1 className="text-xl font-bold text-slate-800 mt-2">
                {isEditing ? 'Ubah Lokasi Bisnis' : 'Aktivasi Kartu Review'}
              </h1>
              <p className="text-slate-500 text-sm">Hubungkan kartu NFC/QR ini ke Google Maps toko kamu.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 relative">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama Bisnis / Toko
                </label>
                <input 
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="Ketik nama cafe atau toko..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />

                {predictions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {predictions.map((pred) => (
                      <li
                        key={pred.place_id}
                        onClick={() => handleSelectPlace(pred)}
                        className="px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none"
                      >
                        <p className="font-medium text-slate-800">{pred.structured_formatting.main_text}</p>
                        <p className="text-xs text-slate-400 truncate">{pred.structured_formatting.secondary_text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Buat PIN Keamanan (Min. 4 Angka)
                </label>
                <input 
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Contoh: 1234"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-sm mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Aktifkan'}
              </button>

              {isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full text-slate-500 text-sm py-2 hover:underline mt-1"
                >
                  Batal
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
