
import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import SearchIcon from './icons/SearchIcon';
import StarIcon from './icons/StarIcon';
import ShareButtons from './ShareButtons';

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
    antutuScore: number | null;
    geekbenchScore: string;
    competitors: {
      name: string;
      antutuScore: number | null;
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
            phoneName: { type: Type.STRING, description: "Nama resmi dari perangkat yang diulas. Jika input bukan perangkat yang valid atau tidak ditemukan, field ini HARUS berisi pesan kegagalan." },
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
                    antutuScore: { type: Type.INTEGER, description: "Skor benchmark AnTuTu v10 sebagai angka integer. Jika tidak tersedia/relevan, kembalikan null.", nullable: true },
                    geekbenchScore: { type: Type.STRING, description: "Skor Geekbench 6. Contoh: 'Single: 2100, Multi: 5500'." },
                    competitors: {
                        type: Type.ARRAY,
                        description: "Daftar 2-3 pesaing terdekat dengan skor AnTuTu mereka.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                antutuScore: { type: Type.INTEGER, nullable: true },
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
            summary: { type: Type.STRING, description: "Ringkasan singkat satu paragraf tentang perangkat dalam Bahasa Indonesia." },
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
    fullSchema.properties.targetAudience = { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar tipe pengguna ideal untuk perangkat ini (misalnya, Gamer, Fotografer) dalam Bahasa Indonesia." };
    fullSchema.properties.accessoryAvailability = { type: Type.STRING, description: "Sebuah paragraf yang merangkum ketersediaan aksesori seperti casing, pelindung layar, dll., dalam Bahasa Indonesia." };
    fullSchema.properties.marketPrice = {
        type: Type.OBJECT,
        properties: {
            indonesia: { type: Type.STRING, description: "Perkiraan harga pasaran terbaru di Indonesia (IDR) per tanggal permintaan. Jika tidak rilis resmi di Indonesia, harus diisi dengan teks 'Tidak resmi rilis di Indonesia'." },
            global: { type: Type.STRING, description: "Perkiraan harga pasaran global terbaru dalam USD per tanggal permintaan. Contoh: '$999 - $1099'" },
        },
    };

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery) {
            setError('Please enter a smartphone name.');
            return;
        }
        setLoading(true);
        setError(null);
        setReview(null);

        const cacheKey = searchQuery.trim().toLowerCase();

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

        const prompt = `**Core Role: GSMArena Data Extractor**
        You are an AI trained to understand and extract structured data from GSMArena. Your primary task is to:
        - Identify and parse all available phone data (smartphones, tablet, pad & feature phones).
        - Recognize tables, categories, and specifications (e.g., Launch, Network, Body, Display, Platform, Memory, Camera, etc.).
        - Handle variations and missing specs gracefully.
        - Extract metadata like Brand, Model, Release date, and Device type (smartphone, tablet/pad or feature phone).

        **Your Secondary Task: AI Gadget Reviewer for JAGO-HP**
        Based on the structured data you extract, generate a comprehensive review in **Bahasa Indonesia** for the **gadget**: '${searchQuery}'.

        **Context & Knowledge Cut-off:**
        - **Mandatory Update:** Your knowledge is considered fully updated as of today, **${today}**.
        - **Data Requirement:** You **MUST** use the latest available information for all data points, especially market prices (in IDR for Indonesia), software versions, and product availability. Prioritize data relevant to this date.
        - **Output Language:** Bahasa Indonesia.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands, with GSMArena as the primary data source. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.

        **Crucial Rule:** If a device from any of these brands exists on GSMArena, you **MUST** be able to retrieve and display its data, regardless of its release status in Indonesia. This is a non-negotiable part of your function.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadget:** First, identify the official name of '${searchQuery}', correcting any typos. Determine if it's a smartphone, tablet, or feature phone.
        2.  **Extract Data:** Mentally (or actually) perform your core role by extracting all relevant specifications for the identified gadget, primarily from GSMArena. If not found, use secondary sources like Phone Arena or Jagat Review.
        3.  **Handle Missing Data:** For older devices (like feature phones), many modern specs (AnTuTu, DXOMark) will be unavailable. For these, you **MUST** use \`null\` for numbers or "N/A" for strings in the JSON output. **DO NOT FAIL** the request because a field is empty. This is crucial.
        4.  **Generate Review Content:** Using the extracted data, populate the JSON schema.
            -   **Ratings:** Provide a 1-5 score for each category, being realistic for the device type (e.g., a feature phone will have a low gaming score).
            -   **Summaries & Analysis:** Write all textual content (summaries, pros/cons, reviews) based on the objective data you've extracted.
        5.  **Failure Condition:** If, after an exhaustive search on all specified sources, the gadget cannot be found, populate the \`phoneName\` field with a polite "Maaf: ..." message and nothing else.

        **Final Output:**
        - Ensure the final JSON output strictly adheres to the provided schema.
        - The \`phoneName\` field must contain the official, full name of the device.`;


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

            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    return (
        <section id="review" className="flex-grow flex flex-col items-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
            <div className="w-full">
                <div className="max-w-5xl mx-auto text-center">
                     <div className="mb-6">
                        <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                            Ulasan Cepat
                        </h1>
                        <p className="text-base text-gray-400 max-w-5xl mx-auto mt-2 pb-1">
                            Tulis tipe HP yang ingin direview, hanya dalam beberapa detik Kami langsung buat.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto text-center mt-6">
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tuliskan tipe HP, misal: iPhone 17..."
                            className="w-full bg-gray-900/50 border-2 border-indigo-500/50 rounded-full py-3 pl-5 pr-16 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                            aria-label="Smartphone search input"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center
                                       hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Search for smartphone review"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon />}
                        </button>
                    </form>

                    {loading && (
                        <p className="text-sm text-gray-400 text-center -mt-8 mb-8 animate-pulse">
                            Tunggu sebentar ya, jangan pindah menu dulu...
                        </p>
                    )}

                    <div aria-live="polite">
                        {loading && <ReviewSkeleton />}
                        {error && <div className="text-center text-red-400 border border-red-400/50 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                        {review && (
                            <>
                                <ReviewResultDisplay review={review} />
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Sumber data: GSMArena, Phone Arena, AnTuTu, GeekBench dan DXOMark
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- SKELETON UPDATED with RATINGS ---
const ReviewSkeleton: FC = () => (
    <div className="bg-gray-800/20 border border-gray-700 rounded-2xl p-5 md:p-6 text-left space-y-6 animate-pulse">
        <div className="h-7 bg-gray-700/50 rounded-md w-3/4 mx-auto mb-4"></div>
        
        {/* Ratings Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 border-y border-gray-700 py-5">
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
             <div className="h-9 bg-indigo-500/20 rounded-t-md w-24"></div>
            <div className="h-9 bg-gray-700/50 rounded-t-md w-24"></div>
            <div className="h-9 bg-gray-700/50 rounded-t-md w-24"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="space-y-3 pt-3">
            <div className="h-5 bg-gray-700/50 rounded-md w-1/3 mb-2"></div>
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
    
    const shareText = `Cek review AI untuk ${review.phoneName} di JAGO-HP!\n\nRingkasan: ${review.quickReview.summary}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';


    return (
        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-5 md:p-6 text-left backdrop-blur-sm animate-fade-in space-y-6">
            <h2 className="font-orbitron text-2xl font-bold text-center mb-2">{review.phoneName}</h2>

            <RatingsDisplay ratings={review.ratings} />

            {/* Tab Navigation */}
            <div className="border-b border-indigo-500/20 flex space-x-2 sm:space-x-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`font-orbitron font-semibold text-sm px-3 sm:px-4 py-2 transition-all duration-300 rounded-t-lg -mb-px
                            ${activeTab === tab.id 
                                ? 'border-b-2 border-indigo-400 bg-indigo-500/10 text-indigo-300' 
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
            
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
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
        <div className="border-y border-indigo-500/20 py-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
            {ratingCategories.map(({ key, label }) => (
                <div key={key}>
                    <p className="text-sm text-gray-400 font-semibold mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-base text-white">{ratings[key]?.toFixed(1) || 'N/A'}</span>
                        <StarRating rating={ratings[key] || 0} />
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- TAB COMPONENTS ---

const SummaryTab: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-6 animate-fade-in">
        <ReviewSection title="Ulasan Singkat">
            <p className="text-gray-300 mb-5 text-justify text-sm leading-relaxed">{review.quickReview.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                    <h5 className="text-base font-semibold text-fuchsia-400 mb-2">Kelebihan</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {review.quickReview.pros.map((pro, i) => <li key={`pro-${i}`}>{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h5 className="text-base font-semibold text-red-400 mb-2">Kekurangan</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {review.quickReview.cons.map((con, i) => <li key={`con-${i}`}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </ReviewSection>
        <ReviewSection title="Spesifikasi Lengkap">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {Object.entries(review.specs).map(([key, value]) => {
                    const displayValue = value === null || value === undefined ? 'N/A' : String(value);
                    return (
                        <div key={key} className="flex justify-between border-b border-gray-700 py-1.5">
                            <span className="font-semibold capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-right text-gray-200">{displayValue}</span>
                        </div>
                    );
                })}
            </div>
        </ReviewSection>
        <ReviewSection title="Cocok Untuk Siapa">
            <div className="flex flex-wrap gap-2">
                {review.targetAudience.map((user, i) => (
                    <span key={`user-${i}`} className="bg-indigo-500/10 text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">{user}</span>
                ))}
            </div>
        </ReviewSection>
        <ReviewSection title="Ketersediaan Aksesoris">
             <p className="text-gray-300 text-justify text-sm leading-relaxed">{review.accessoryAvailability}</p>
        </ReviewSection>
        <ReviewSection title="Perkiraan Harga Pasaran">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                 <div className="flex justify-between border-b border-gray-700 py-1.5">
                    <span className="font-semibold capitalize text-gray-400">Indonesia</span>
                    <span className="text-right text-gray-200 font-bold">{review.marketPrice.indonesia}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 py-1.5">
                    <span className="font-semibold capitalize text-gray-400">Global</span>
                    <span className="text-right text-gray-200 font-bold">{review.marketPrice.global}</span>
                </div>
            </div>
        </ReviewSection>
    </div>
);

const PerformanceTab: FC<{ performance: ReviewResult['performance'], phoneName: string }> = ({ performance, phoneName }) => {
    const allPhonesWithScores = [
        ...(performance.antutuScore ? [{ name: phoneName, antutuScore: performance.antutuScore }] : []),
        ...performance.competitors.filter(c => c.antutuScore) as { name: string; antutuScore: number }[]
    ];
    
    const maxScore = allPhonesWithScores.length > 0 ? Math.max(...allPhonesWithScores.map(p => p.antutuScore)) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <ReviewSection title="Skor Benchmark">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="text-center bg-gray-900/40 p-3 rounded-lg flex-1">
                        <p className="text-sm text-gray-400">AnTuTu v10</p>
                        <p className="font-orbitron text-3xl font-bold text-fuchsia-400">
                            {performance.antutuScore ? performance.antutuScore.toLocaleString('id-ID') : 'N/A'}
                        </p>
                    </div>
                     <div className="text-center bg-gray-900/40 p-3 rounded-lg flex-1">
                        <p className="text-sm text-gray-400">Geekbench 6</p>
                        <p className="font-orbitron text-xl font-bold text-indigo-400">{performance.geekbenchScore || 'N/A'}</p>
                    </div>
                </div>
            </ReviewSection>
             {maxScore > 0 && (
                 <ReviewSection title="Perbandingan AnTuTu vs Pesaing">
                     <div className="space-y-3">
                        {allPhonesWithScores.sort((a, b) => b.antutuScore - a.antutuScore).map(phone => {
                            const widthPercentage = (phone.antutuScore / maxScore) * 100;
                            const isMainPhone = phone.name === phoneName;
                            return (
                                <div key={phone.name} className="flex items-center gap-3">
                                    <div className="w-1/3 text-sm text-gray-300 truncate">{phone.name}</div>
                                    <div className="w-2/3 bg-gray-700/50 rounded-full h-5">
                                        <div 
                                            className={`h-5 rounded-full flex items-center justify-end pr-2 ${isMainPhone ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500' : 'bg-gray-500'}`}
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
             )}
            <ReviewSection title="Ulasan Performa Gaming">
                <p className="text-gray-300 leading-relaxed text-justify text-sm">{performance.gamingReview || 'N/A'}</p>
            </ReviewSection>
        </div>
    )
};


const CameraTab: FC<{ assessment: ReviewResult['cameraAssessment'] }> = ({ assessment }) => (
    <div className="space-y-6 animate-fade-in">
        {assessment.dxomarkScore && (
             <ReviewSection title="Skor Kamera (DXOMark)">
                <div className="flex items-center justify-center gap-4 bg-gray-900/40 p-3 rounded-lg max-w-xs mx-auto">
                    <span className="font-orbitron text-3xl font-bold text-gray-300">Skor</span>
                    <p className="font-orbitron text-4xl font-bold text-yellow-400">{assessment.dxomarkScore}</p>
                </div>
             </ReviewSection>
        )}
        <ReviewSection title="Penilaian Kualitas Foto">
            <p className="text-gray-300 mb-5 text-justify text-sm leading-relaxed">{assessment.photoSummary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                 <div>
                    <h5 className="text-base font-semibold text-fuchsia-400 mb-2">Kelebihan Foto</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {assessment.photoPros.map((pro, i) => <li key={`photo-pro-${i}`}>{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h5 className="text-base font-semibold text-red-400 mb-2">Kekurangan Foto</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-justify">
                        {assessment.photoCons.map((con, i) => <li key={`photo-con-${i}`}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </ReviewSection>
        <ReviewSection title="Penilaian Kualitas Video">
             <p className="text-gray-300 text-justify text-sm leading-relaxed">{assessment.videoSummary}</p>
        </ReviewSection>
    </div>
);

const ReviewSection: FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-indigo-500/20 pt-5 first-of-type:border-t-0 first-of-type:pt-0">
        <h3 className="font-orbitron text-lg font-bold text-indigo-400 mb-3">{title}</h3>
        {children}
    </div>
);

export default SmartReview;