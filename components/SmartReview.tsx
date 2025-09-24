import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import SearchIcon from './icons/SearchIcon';
import StarIcon from './icons/StarIcon';
import BannerAd from './BannerAd';

// --- NEW RATINGS INTERFACE ---
interface Ratings {
  gaming: number;
  kamera: number;
  baterai: number;
  layarDesain: number;
  performa: number;
  storageRam: number;
}

// --- EXPANDED REVIEW RESULT INTERFACE ---
interface ReviewResult {
  phoneName: string;
  ratings: Ratings;
  quickReview: {
    summary: string;
    pros: string[];
    cons: string[];
  };
  specs: {
    processor: string;
    ram: string;
    camera: string;
    battery: string;
    display: string;
    charging: string;
    jaringan: string;
    koneksi: string;
    nfc: string;
    os: string;
  };
  targetAudience: string[];
  accessoryAvailability: string;
  marketPrice: {
    indonesia: string;
    global: string;
  };
  performance: {
    antutuScore: number;
    geekbenchScore: string;
    competitors: {
      name: string;
      antutuScore: number;
    }[];
    gamingReview: string;
  };
  cameraAssessment: {
    dxomarkScore: number | null;
    photoSummary: string;
    photoPros: string[];
    photoCons: string[];
    videoSummary: string;
  };
}

const SmartReview: React.FC = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<ReviewResult | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    // --- EXPANDED SCHEMA WITH RATINGS ---
    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING, description: "Nama resmi dari smartphone yang diulas. Jika input bukan smartphone, field ini HARUS berisi pesan error." },
            ratings: {
                type: Type.OBJECT,
                description: "Skor rating dari 1 hingga 5 untuk 6 kategori kunci. Skor bisa desimal.",
                properties: {
                    gaming: { type: Type.NUMBER, description: "Rating performa gaming (1-5), misal: 4.5" },
                    kamera: { type: Type.NUMBER, description: "Rating kualitas kamera (1-5), misal: 4.2" },
                    baterai: { type: Type.NUMBER, description: "Rating daya tahan baterai (1-5), misal: 4.8" },
                    layarDesain: { type: Type.NUMBER, description: "Rating kualitas layar dan desain (1-5), misal: 4.6" },
                    performa: { type: Type.NUMBER, description: "Rating performa umum/chipset (1-5), misal: 4.7" },
                    storageRam: { type: Type.NUMBER, description: "Rating kapasitas storage dan RAM (1-5), misal: 4.0" },
                },
                required: ['gaming', 'kamera', 'baterai', 'layarDesain', 'performa', 'storageRam']
            },
            quickReview: { /* ... existing ... */ },
            specs: { /* ... existing ... */ },
            targetAudience: { /* ... existing ... */ },
            accessoryAvailability: { /* ... existing ... */ },
            marketPrice: { /* ... existing ... */ },
            performance: {
                type: Type.OBJECT,
                description: "Analisis performa mendalam.",
                properties: {
                    antutuScore: { type: Type.INTEGER, description: "Skor benchmark AnTuTu v10 sebagai angka integer." },
                    geekbenchScore: { type: Type.STRING, description: "Skor Geekbench 6. Contoh: 'Single: 2100, Multi: 5500'." },
                    competitors: {
                        type: Type.ARRAY,
                        description: "Daftar 2-3 pesaing terdekat dengan skor AnTuTu mereka.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                antutuScore: { type: Type.INTEGER },
                            }
                        }
                    },
                    gamingReview: { type: Type.STRING, description: "Ulasan singkat performa gaming untuk game berat seperti Genshin Impact, PUBG Mobile, dan Call of Duty: Warzone Mobile, dalam Bahasa Indonesia." }
                }
            },
            cameraAssessment: {
                type: Type.OBJECT,
                description: "Penilaian kualitas foto dan video.",
                properties: {
                    dxomarkScore: { type: Type.INTEGER, description: "Skor kamera utama dari DXOMark. Jika tidak tersedia, kembalikan null.", nullable: true },
                    photoSummary: { type: Type.STRING, description: "Ringkasan kualitas foto dalam Bahasa Indonesia." },
                    photoPros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 kelebihan utama kualitas foto." },
                    photoCons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 kekurangan utama kualitas foto." },
                    videoSummary: { type: Type.STRING, description: "Ringkasan kualitas video dalam Bahasa Indonesia." }
                }
            }
        },
        required: ['phoneName', 'ratings', 'quickReview', 'specs', 'targetAudience', 'accessoryAvailability', 'marketPrice', 'performance', 'cameraAssessment']
    };
    
    const fullSchema = JSON.parse(JSON.stringify(schema));
    fullSchema.properties.quickReview = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Ringkasan singkat satu paragraf tentang ponsel dalam Bahasa Indonesia." },
            pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar 3 kelebihan utama dalam Bahasa Indonesia." },
            cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar 3 kekurangan utama dalam Bahasa Indonesia." },
        },
    };
    fullSchema.properties.specs = {
        type: Type.OBJECT,
        properties: {
            processor: { type: Type.STRING },
            ram: { type: Type.STRING, description: "Contoh: '8GB, 12GB'" },
            camera: { type: Type.STRING, description: "Contoh: 'Utama: 50MP, Ultrawide: 12MP'" },
            battery: { type: Type.STRING, description: "Contoh: '5000mAh'" },
            display: { type: Type.STRING, description: "Contoh: '6.8-inci Dynamic AMOLED 2X, 120Hz'" },
            charging: { type: Type.STRING, description: "Detail pengisian daya. Contoh: '45W wired, 15W wireless'" },
            jaringan: { type: Type.STRING, description: "Teknologi jaringan yang didukung. Contoh: '5G, 4G LTE'" },
            koneksi: { type: Type.STRING, description: "Opsi konektivitas. Contoh: 'Wi-Fi 6e, Bluetooth 5.3'" },
            nfc: { type: Type.STRING, description: "Ketersediaan NFC. Contoh: 'Ya, tersedia' atau 'Tidak ada'" },
            os: { type: Type.STRING, description: "Sistem Operasi saat rilis. Contoh: 'Android 14, One UI 6.1'" },
        },
    };
    fullSchema.properties.targetAudience = { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar tipe pengguna ideal untuk ponsel ini (misalnya, Gamer, Fotografer) dalam Bahasa Indonesia." };
    fullSchema.properties.accessoryAvailability = { type: Type.STRING, description: "Sebuah paragraf yang merangkum ketersediaan aksesori seperti casing, pelindung layar, dll., dalam Bahasa Indonesia." };
    fullSchema.properties.marketPrice = {
        type: Type.OBJECT,
        properties: {
            indonesia: { type: Type.STRING, description: "Perkiraan harga pasaran terbaru di Indonesia (IDR) per tanggal permintaan. Jika tidak rilis resmi di Indonesia, harus diisi dengan teks 'Tidak resmi rilis di Indonesia'." },
            global: { type: Type.STRING, description: "Perkiraan harga pasaran global terbaru dalam USD per tanggal permintaan. Contoh: '$999 - $1099'" },
        },
    };


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) {
            setError('Please enter a smartphone name.');
            return;
        }
        setLoading(true);
        setError(null);
        setReview(null);

        const cacheKey = query.trim().toLowerCase();

        // 1. Check cache first
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('smart_reviews')
                    .select('review_data')
                    .eq('cache_key', cacheKey)
                    .single();

                if (data && data.review_data) {
                    setReview(data.review_data as ReviewResult);
                    setLoading(false);
                    return; // Cache hit, skip AI call
                }
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        // 2. If no cache, call AI
        const today = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const prompt = `**Konteks Waktu: ${today}**

        Generate a comprehensive review in **Bahasa Indonesia** for the device: '${query}'. **Gunakan tanggal hari ini sebagai titik acuan untuk semua data.**
        
        **Aturan Validasi Perangkat (SANGAT PENTING):**
        1.  **Analisis Query:** Periksa query pengguna ('${query}').
        2.  **Jika BUKAN Smartphone:** Jika query merujuk pada laptop, tablet, atau perangkat lain (BUKAN smartphone), **hentikan proses review**. Sebagai gantinya, kembalikan JSON di mana field \`phoneName\` berisi pesan error yang jelas, contoh: "Error: Fitur ini hanya untuk smartphone. '${query}' adalah sebuah laptop/tablet." dan isi field lainnya dengan data placeholder (misal, 0 untuk angka, string kosong untuk teks).
        3.  **Jika Smartphone:** Lanjutkan ke aturan berikutnya.

        **Aturan Pengenalan Nama Ponsel (SANGAT PENTING):**
        - **Identifikasi Cerdas:** Dari query pengguna ('${query}'), identifikasi nama smartphone yang resmi dan lengkap. Query pengguna bisa jadi hanya nama model (contoh: "S24 Ultra"), nama alias, atau nama kode (contoh: "panther" untuk Google Pixel 7).
        - **Output Konsisten:** Field \`phoneName\` dalam respons JSON **WAJIB** berisi nama resmi yang lengkap dan dikenali secara umum (misal: "Samsung Galaxy S24 Ultra").

        **Aturan Akurasi dan Verifikasi Data (SANGAT PENTING):**
        - **Sumber Utama Spesifikasi:** Gunakan GSMArena sebagai referensi utama.
        - **Versi Benchmark:** WAJIB gunakan skor dari **AnTuTu v10** dan **Geekbench 6 (Single/Multi-Core)**. JANGAN gunakan versi lain.
        - **Verifikasi Skor:** Lakukan verifikasi silang (cross-reference) skor benchmark dengan setidaknya dua sumber terpercaya (misal: GSMArena, Kimovil, NanoReview) untuk akurasi maksimal.
        - **Skor DXOMark:** Gunakan skor 'Camera' utama dari situs resmi DXOMark. Jika skor tidak tersedia untuk model ini, WAJIB kembalikan 'null'. JANGAN menebak.

        **Analisis Rating Kuantitatif (Skala 1-5, SANGAT PENTING):**
        - Berdasarkan semua data yang terkumpul, berikan skor numerik (BOLEH desimal, contoh: 4.5) untuk 6 kategori berikut.
            - **gaming, kamera, baterai, layarDesain, performa, storageRam.**

        Sediakan analisis lengkap yang mencakup semua aspek sesuai skema, pastikan semua informasi mutakhir per hari ini.
        
        **Semua konten teks harus dalam Bahasa Indonesia.**`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: fullSchema,
                }
            });
            
            const resultText = response.text.trim();
            const parsedResult: ReviewResult = JSON.parse(resultText);

            if (parsedResult.phoneName.toLowerCase().startsWith('error:')) {
                setError(parsedResult.phoneName);
                setReview(null);
            } else {
                setReview(parsedResult);
                // 3. Save new result to cache
                if (supabase) {
                    try {
                        await supabase.from('smart_reviews').insert({
                            cache_key: cacheKey,
                            review_data: parsedResult
                        });
                    } catch (cacheError) {
                        console.warn("Supabase cache write failed:", cacheError);
                    }
                }
            }

        } catch (e) {
            console.error(e);
            setError('An AI error occurred. The model might not have information on this phone, or there was a network issue. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="review" className="flex-grow flex flex-col items-center pt-28 pb-12 px-4 sm:px-8 md:px-16 w-full">
            <div className="w-full">
                <div className="max-w-4xl mx-auto text-center">
                     <div className="mb-6">
                        <h1 className="font-orbitron text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
                            Ulasan Cepat
                        </h1>
                        <p className="text-lg text-gray-400 max-w-4xl mx-auto mt-2 pb-1">
                            Tulis tipe HP yang ingin direview, hanya dalam beberapa detik Kami langsung buat.
                        </p>
                    </div>
                </div>

                <BannerAd />

                <div className="max-w-4xl mx-auto text-center mt-6">
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-16">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tuliskan tipe HP, misal: iPhone 17..."
                            className="w-full bg-gray-900/50 border-2 border-cyan-400/50 rounded-full py-4 pl-6 pr-20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                            aria-label="Smartphone search input"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-green-500 text-white flex items-center justify-center
                                       hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Search for smartphone review"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon />}
                        </button>
                    </form>

                    <div aria-live="polite">
                        {loading && <ReviewSkeleton />}
                        {error && <div className="text-center text-red-400 border border-red-400/50 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                        {review && <ReviewResultDisplay review={review} />}
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- SKELETON UPDATED with RATINGS ---
const ReviewSkeleton: FC = () => (
    <div className="bg-gray-800/20 border border-gray-700 rounded-2xl p-6 md:p-8 text-left space-y-8 animate-pulse">
        <div className="h-8 bg-gray-700/50 rounded-md w-3/4 mx-auto mb-4"></div>
        
        {/* Ratings Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 border-y border-gray-700 py-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-600/50 rounded w-5/6"></div>
                    <div className="flex items-center gap-2">
                        <div className="h-5 bg-gray-600/50 rounded w-1/4"></div>
                        <div className="flex gap-1">
                          <div className="h-5 w-5 bg-gray-600/50 rounded-full"></div>
                          <div className="h-5 w-5 bg-gray-600/50 rounded-full"></div>
                          <div className="h-5 w-5 bg-gray-600/50 rounded-full"></div>
                          <div className="h-5 w-5 bg-gray-600/50 rounded-full"></div>
                          <div className="h-5 w-5 bg-gray-600/50 rounded-full"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-4 border-b border-gray-700">
             <div className="h-10 bg-cyan-500/20 rounded-t-md w-28"></div>
            <div className="h-10 bg-gray-700/50 rounded-t-md w-28"></div>
            <div className="h-10 bg-gray-700/50 rounded-t-md w-28"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="space-y-3 pt-3">
            <div className="h-6 bg-gray-700/50 rounded-md w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700/50 rounded-md w-full"></div>
            <div className="h-4 bg-gray-700/50 rounded-md w-5/6"></div>
        </div>
    </div>
);


// --- RESULT DISPLAY UPDATED with RATINGS ---
const ReviewResultDisplay: FC<{ review: ReviewResult }> = ({ review }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');

    const tabs = [
        { id: 'ringkasan', label: 'Ringkasan' },
        { id: 'performa', label: 'Performa' },
        { id: 'foto-video', label: 'Foto & Video' },
    ];

    return (
        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 md:p-8 text-left backdrop-blur-sm animate-fade-in space-y-8">
            <h2 className="font-orbitron text-3xl font-bold text-center mb-2">{review.phoneName}</h2>

            <RatingsDisplay ratings={review.ratings} />

            {/* Tab Navigation */}
            <div className="border-b border-cyan-400/20 flex space-x-2 sm:space-x-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`font-orbitron font-semibold text-sm sm:text-base px-3 sm:px-4 py-2 transition-all duration-300 rounded-t-lg -mb-px
                            ${activeTab === tab.id 
                                ? 'border-b-2 border-cyan-400 bg-cyan-500/10 text-cyan-300' 
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'ringkasan' && <SummaryTab review={review} />}
                {activeTab === 'performa' && <PerformanceTab performance={review.performance} phoneName={review.phoneName} />}
                {activeTab === 'foto-video' && <CameraTab assessment={review.cameraAssessment} />}
            </div>
        </div>
    );
};

// --- NEW RATING COMPONENTS ---

const StarRating: FC<{ rating: number; maxRating?: number }> = ({ rating, maxRating = 5 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex items-center" aria-label={`Rating: ${rating.toFixed(1)} dari ${maxRating} bintang`}>
            {[...Array(fullStars)].map((_, i) => <StarIcon key={`full-${i}`} variant="full" />)}
            {halfStar && <StarIcon key="half" variant="half" />}
            {[...Array(emptyStars)].map((_, i) => <StarIcon key={`empty-${i}`} variant="empty" />)}
        </div>
    );
};

const RatingsDisplay: FC<{ ratings: Ratings }> = ({ ratings }) => {
    const ratingCategories: { key: keyof Ratings; label: string }[] = [
        { key: 'gaming', label: 'Gaming' },
        { key: 'kamera', label: 'Kamera' },
        { key: 'baterai', label: 'Baterai' },
        { key: 'layarDesain', label: 'Layar & Desain' },
        { key: 'performa', label: 'Performa' },
        { key: 'storageRam', label: 'Storage & RAM' },
    ];

    return (
        <div className="border-y border-cyan-400/20 py-6 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
            {ratingCategories.map(({ key, label }) => (
                <div key={key}>
                    <p className="text-sm text-gray-400 font-semibold mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-lg text-white">{ratings[key]?.toFixed(1) || 'N/A'}</span>
                        <StarRating rating={ratings[key] || 0} />
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- TAB COMPONENTS ---

const SummaryTab: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8 animate-fade-in">
        <ReviewSection title="Ulasan Singkat">
            <p className="text-gray-300 mb-6 text-justify">{review.quickReview.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="text-lg font-semibold text-green-400 mb-2">Kelebihan</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {review.quickReview.pros.map((pro, i) => <li key={`pro-${i}`}>{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h5 className="text-lg font-semibold text-red-400 mb-2">Kekurangan</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {review.quickReview.cons.map((con, i) => <li key={`con-${i}`}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </ReviewSection>
        <ReviewSection title="Spesifikasi Lengkap">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(review.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-700 py-2">
                        <span className="font-semibold capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-right text-gray-200">{value}</span>
                    </div>
                ))}
            </div>
        </ReviewSection>
        <ReviewSection title="Cocok Untuk Siapa">
            <div className="flex flex-wrap gap-3">
                {review.targetAudience.map((user, i) => (
                    <span key={`user-${i}`} className="bg-cyan-500/10 text-cyan-300 text-sm font-medium px-3 py-1 rounded-full">{user}</span>
                ))}
            </div>
        </ReviewSection>
        <ReviewSection title="Ketersediaan Aksesoris">
             <p className="text-gray-300 text-justify">{review.accessoryAvailability}</p>
        </ReviewSection>
        <ReviewSection title="Perkiraan Harga Pasaran">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                 <div className="flex justify-between border-b border-gray-700 py-2">
                    <span className="font-semibold capitalize text-gray-400">Indonesia</span>
                    <span className="text-right text-gray-200 font-bold">{review.marketPrice.indonesia}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 py-2">
                    <span className="font-semibold capitalize text-gray-400">Global</span>
                    <span className="text-right text-gray-200 font-bold">{review.marketPrice.global}</span>
                </div>
            </div>
        </ReviewSection>
    </div>
);

const PerformanceTab: FC<{ performance: ReviewResult['performance'], phoneName: string }> = ({ performance, phoneName }) => {
    const allPhones = [{ name: phoneName, antutuScore: performance.antutuScore }, ...performance.competitors];
    const maxScore = Math.max(...allPhones.map(p => p.antutuScore));

    return (
        <div className="space-y-8 animate-fade-in">
            <ReviewSection title="Skor Benchmark">
                <div className="flex flex-col sm:flex-row gap-8">
                    <div className="text-center bg-gray-900/40 p-4 rounded-lg flex-1">
                        <p className="text-sm text-gray-400">AnTuTu v10</p>
                        <p className="font-orbitron text-4xl font-bold text-green-400">{performance.antutuScore.toLocaleString('id-ID')}</p>
                    </div>
                     <div className="text-center bg-gray-900/40 p-4 rounded-lg flex-1">
                        <p className="text-sm text-gray-400">Geekbench 6</p>
                        <p className="font-orbitron text-2xl font-bold text-cyan-400">{performance.geekbenchScore}</p>
                    </div>
                </div>
            </ReviewSection>
             <ReviewSection title="Perbandingan AnTuTu vs Pesaing">
                 <div className="space-y-4">
                    {allPhones.sort((a, b) => b.antutuScore - a.antutuScore).map(phone => {
                        const widthPercentage = (phone.antutuScore / maxScore) * 100;
                        const isMainPhone = phone.name === phoneName;
                        return (
                            <div key={phone.name} className="flex items-center gap-4">
                                <div className="w-1/3 text-sm text-gray-300 truncate">{phone.name}</div>
                                <div className="w-2/3 bg-gray-700/50 rounded-full h-6">
                                    <div 
                                        className={`h-6 rounded-full flex items-center justify-end pr-2 ${isMainPhone ? 'bg-gradient-to-r from-cyan-500 to-green-500' : 'bg-gray-500'}`}
                                        style={{ width: `${widthPercentage}%` }}
                                    >
                                       <span className="text-xs font-bold text-white shadow-sm">{phone.antutuScore.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </ReviewSection>
            <ReviewSection title="Ulasan Performa Gaming">
                <p className="text-gray-300 leading-relaxed text-justify">{performance.gamingReview}</p>
            </ReviewSection>
        </div>
    )
};

const CameraTab: FC<{ assessment: ReviewResult['cameraAssessment'] }> = ({ assessment }) => (
    <div className="space-y-8 animate-fade-in">
        {assessment.dxomarkScore && (
             <ReviewSection title="Skor Kamera (DXOMark)">
                <div className="flex items-center justify-center gap-4 bg-gray-900/40 p-4 rounded-lg max-w-xs mx-auto">
                    <span className="font-orbitron text-4xl font-bold text-gray-300">Skor</span>
                    <p className="font-orbitron text-5xl font-bold text-yellow-400">{assessment.dxomarkScore}</p>
                </div>
             </ReviewSection>
        )}
        <ReviewSection title="Penilaian Kualitas Foto">
            <p className="text-gray-300 mb-6 text-justify">{assessment.photoSummary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h5 className="text-lg font-semibold text-green-400 mb-2">Kelebihan Foto</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {assessment.photoPros.map((pro, i) => <li key={`photo-pro-${i}`}>{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h5 className="text-lg font-semibold text-red-400 mb-2">Kekurangan Foto</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {assessment.photoCons.map((con, i) => <li key={`photo-con-${i}`}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </ReviewSection>
        <ReviewSection title="Penilaian Kualitas Video">
             <p className="text-gray-300 text-justify">{assessment.videoSummary}</p>
        </ReviewSection>
    </div>
);

const ReviewSection: FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-cyan-400/20 pt-6 first-of-type:border-t-0 first-of-type:pt-0">
        <h3 className="font-orbitron text-xl font-bold text-cyan-400 mb-4">{title}</h3>
        {children}
    </div>
);

export default SmartReview;