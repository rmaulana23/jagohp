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
    rilis?: string;
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
            rilis: { type: Type.STRING, description: "Bulan dan tahun rilis. Contoh: 'September 2024'" },
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
        const prompt = `**Core Role: Comprehensive Data Synthesizer**
        You are an AI trained to understand and extract structured data. Your primary task is to:
        - Identify and parse all available phone data (smartphones, tablets, pads & feature phones).
        - Source data from a wide range of reliable sources: **GSMArena, PhoneArena, Jagat Review, AnTuTu, Geekbench, DXOMark, and other top-tier tech media.**
        - Handle variations and missing specs gracefully.
        - Extract metadata like Brand, Model, Release date, and Device type.

        **Your Secondary Task: AI Gadget Reviewer for JAGO-HP**
        Based on the structured data you extract, generate a comprehensive review in **Bahasa Indonesia** for the **gadget**: '${searchQuery}'.

        **Context & Knowledge Cut-off:**
        - **Mandatory Update:** Your knowledge is considered fully updated as of today, **2 Oktober 2025**.
        - **Data Requirement:** You **MUST** use the latest available information for all data points. This includes devices like the iPhone 16 series, iPhone 17 series, and Xiaomi 17 series, which are now considered **officially released** and have full, final data available across all your sources.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.

        **Crucial Rule:** If a device from any of these brands exists, you **MUST** be able to retrieve and display its full, official data.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadget:** First, identify the official name of '${searchQuery}', correcting any typos. Assume it is a released product with available data.
        2.  **Extract Data:** Perform your core role by extracting all relevant specifications for the identified gadget, synthesizing information from your full range of sources.
        3.  **Handle Missing Data:** For older devices (like feature phones) or where data is genuinely unavailable even after checking all sources, you **MUST** use \`null\` for numbers or "N/A" for strings. **DO NOT FAIL** the request because a field is empty.
        4.  **Generate Full Review Content:** Using the comprehensive data, populate the entire JSON schema.
            -   **Ratings:** Provide a 1-5 score for each category based on the final, official product performance.
            -   **Summaries & Analysis:** Write all textual content based on the objective data you've extracted.
        5.  **Handling Unreleased/Rumored Devices (for releases AFTER Oktober 2025):**
            -   This rule now applies **only** to devices rumored for release **after** your current knowledge date of 2 Oktober 2025.
            -   If a user requests such a device:
                a.  Populate the \`specs\` object with available rumored specifications.
                b.  Set all numeric ratings in \`ratings\` to \`0\`.
                c.  In the \`quickReview.summary\`, state: "Ponsel ini belum resmi dirilis. Ulasan lengkap dan rating belum tersedia. Berikut adalah rangkuman spesifikasi yang dirumorkan per 2 Oktober 2025."
                d.  Fill all other analytical fields with appropriate text indicating data is not yet available. Use \`null\` for scores like \`antutuScore\` and \`dxomarkScore\`.
        6.  **True Failure Condition (Not Found):** Only if the device cannot be found at all, even as a rumor on any of your sources, should you populate the \`phoneName\` field with a message like "Maaf: Perangkat '${searchQuery}' tidak dapat ditemukan."

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


const ReviewResultDisplay: FC<{ review: ReviewResult }> = ({ review }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');

    const tabs = [
        { id: 'ringkasan', label: 'Ringkasan' },
        { id: 'performa', label: 'Performa' },
        { id: 'foto-video', label: 'Foto & Video' },
    ];
    
    const shareText = `Cek review AI untuk ${review.phoneName} di JAGO-HP!\n\nRingkasan: ${review.quickReview.summary}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const phoneBrand = review.phoneName.toLowerCase();
    const isSamsung = phoneBrand.includes('samsung');
    const isApple = phoneBrand.includes('apple') || phoneBrand.includes('iphone');
    const isXiaomi = phoneBrand.includes('xiaomi') || phoneBrand.includes('redmi');
    const isOppo = phoneBrand.includes('oppo');
    const isVivo = phoneBrand.includes('vivo') || phoneBrand.includes('iqoo');
    const isPoco = phoneBrand.includes('poco');
    const isInfinix = phoneBrand.includes('infinix');
    const isItel = phoneBrand.includes('itel');
    const isHuawei = phoneBrand.includes('huawei');
    const isHonor = phoneBrand.includes('honor');
    const isTecno = phoneBrand.includes('tecno');
    const isRealme = phoneBrand.includes('realme');

    return (
        <div className="bg-gray-800/20 border-2 border-indigo-500/30 rounded-2xl p-4 md:p-6 text-left animate-fade-in">
            <h2 className="font-orbitron text-xl md:text-2xl font-bold text-center mb-1 text-white">{review.phoneName}</h2>
            <p className="text-center text-sm text-gray-400 mb-4">{review.specs.rilis ? `Rilis: ${review.specs.rilis}` : ''}</p>
            
            <RatingsDisplay ratings={review.ratings} />

            {/* Tabs */}
            <div className="mt-6 border-b border-indigo-500/20 flex space-x-2 sm:space-x-4 justify-center">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 relative focus:outline-none
                                    ${activeTab === tab.id ? 'text-indigo-300' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400"></span>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pt-5 min-h-[200px]">
                {activeTab === 'ringkasan' && <TabContentRingkasan review={review} />}
                {activeTab === 'performa' && <TabContentPerforma review={review} />}
                {activeTab === 'foto-video' && <TabContentCamera review={review} />}
            </div>

            {/* Buy Now Buttons */}
            {isSamsung && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/6AbvXZfbSV"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isApple && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/9fBniOs3ak"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isXiaomi && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/AUkuiQBtYg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isOppo && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/BKiPhDZHl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isVivo && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/1BDFc1esr2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isPoco && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/qaPDaBvho"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isInfinix && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/qaPDpESoL"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isItel && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/803ZlEyaDj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isHuawei && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/2B5mokEaKQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isHonor && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/4AqrChdhXf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isTecno && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/gGz2ZEcaj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            {isRealme && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/3qE0oVUbZt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
        </div>
    );
};

const RatingsDisplay: FC<{ ratings: Ratings }> = ({ ratings }) => {
    const ratingItems = [
        { label: 'Gaming', score: ratings.gaming },
        { label: 'Kamera', score: ratings.kamera },
        { label: 'Baterai', score: ratings.baterai },
        { label: 'Layar & Desain', score: ratings.layarDesain },
        { label: 'Performa', score: ratings.performa },
        { label: 'Storage & RAM', score: ratings.storageRam },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 border-y border-indigo-500/20 py-5">
            {ratingItems.map(item => (
                <div key={item.label}>
                    <p className="text-sm text-gray-300 font-semibold mb-1">{item.label}</p>
                    <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-lg text-white">{item.score.toFixed(1)}</span>
                        <StarRating score={item.score} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const TabContentRingkasan: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-5 text-sm">
        <div>
            <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-2">Ringkasan Cepat</h3>
            <p className="text-gray-300 leading-relaxed">{review.quickReview.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <h4 className="font-semibold text-green-400 mb-2">Kelebihan 👍</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {review.quickReview.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-red-400 mb-2">Kekurangan 👎</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {review.quickReview.cons.map((con, i) => <li key={i}>{con}</li>)}
                </ul>
            </div>
        </div>
        <div>
            <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-3">Spesifikasi Kunci</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <SpecItem label="Prosesor" value={review.specs.processor} />
                <SpecItem label="RAM" value={review.specs.ram} />
                <SpecItem label="Layar" value={review.specs.display} />
                <SpecItem label="Baterai" value={review.specs.battery} />
                <SpecItem label="Kamera" value={review.specs.camera} />
                <SpecItem label="Charging" value={review.specs.charging} />
                <SpecItem label="Jaringan" value={review.specs.jaringan} />
                <SpecItem label="Koneksi" value={review.specs.koneksi} />
                <SpecItem label="OS" value={review.specs.os} />
                <SpecItem label="NFC" value={review.specs.nfc} />
            </div>
        </div>
    </div>
);

const PerformanceChart: FC<{ mainPhone: { name: string; score: number | null }, competitors: { name: string; antutuScore: number | null }[] }> = ({ mainPhone, competitors }) => {
    const allPhones = [
        { name: mainPhone.name, score: mainPhone.score },
        ...competitors.map(c => ({ name: c.name, score: c.antutuScore }))
    ].filter(p => p.score !== null);

    if (allPhones.length === 0) {
        return <p className="text-gray-400 text-sm">Data skor AnTuTu tidak tersedia.</p>;
    }

    const maxScore = Math.max(...allPhones.map(p => p.score as number));

    return (
        <div className="space-y-3">
            {allPhones.map((phone, index) => {
                const isMain = phone.name === mainPhone.name;
                const barWidth = phone.score ? (phone.score / maxScore) * 100 : 0;
                return (
                    <div key={index} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`font-semibold ${isMain ? 'text-white' : 'text-gray-300'}`}>{phone.name}</span>
                            <span className={`font-bold ${isMain ? 'text-indigo-300' : 'text-gray-400'}`}>{phone.score?.toLocaleString('id-ID') || 'N/A'}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${isMain ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500' : 'bg-gray-500'}`}
                                style={{ width: `${barWidth}%`, transition: 'width 0.5s ease-in-out' }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const TabContentPerforma: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-6 text-sm">
        <div>
            <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-3">Perbandingan AnTuTu v10</h3>
             <PerformanceChart
                mainPhone={{ name: review.phoneName, score: review.performance.antutuScore }}
                competitors={review.performance.competitors}
            />
            <p className="text-gray-400 mt-4">
                <strong>Geekbench 6:</strong> <span className="text-white font-semibold">{review.performance.geekbenchScore || 'N/A'}</span>
            </p>
        </div>
        <div>
            <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-2">Review Gaming</h3>
            <p className="text-gray-300 leading-relaxed">{review.performance.gamingReview}</p>
        </div>
    </div>
);

const DxOMarkScoreDisplay: FC<{ score: number | null }> = ({ score }) => {
    if (score === null || score === 0) {
        return (
             <div className="flex flex-col items-center">
                <p className="font-orbitron text-base font-bold text-indigo-300 mb-2">Skor DXOMark</p>
                <p className="text-gray-400 text-lg font-semibold">N/A</p>
            </div>
        );
    }

    const MAX_SCORE = 160; // A sensible maximum for modern phones
    const percentage = Math.min(score / MAX_SCORE, 1);
    const circumference = 2 * Math.PI * 45; // r = 45
    const strokeDashoffset = circumference * (1 - percentage);

    return (
        <div className="flex flex-col items-center">
            <p className="font-orbitron text-base font-bold text-indigo-300 mb-3">Skor DXOMark</p>
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="#374151" // gray-700
                        strokeWidth="10"
                        fill="none"
                    />
                    {/* Foreground progress */}
                    <defs>
                        <linearGradient id="dxoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c084fc" /> 
                            <stop offset="100%" stopColor="#818cf8" /> 
                        </linearGradient>
                    </defs>
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="url(#dxoGradient)"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset,
                            transition: 'stroke-dashoffset 0.8s ease-out'
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-orbitron text-3xl font-bold text-white">{score}</span>
                </div>
            </div>
        </div>
    );
};


const TabContentCamera: FC<{ review: ReviewResult }> = ({ review }) => (
     <div className="space-y-5 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex justify-center items-center">
                 <DxOMarkScoreDisplay score={review.cameraAssessment.dxomarkScore} />
            </div>
            <div className="md:col-span-2">
                 <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-2">Ulasan Foto</h3>
                 <p className="text-gray-300 leading-relaxed mb-3">{review.cameraAssessment.photoSummary}</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                         <h4 className="font-semibold text-green-400 mb-2">Kelebihan Foto 👍</h4>
                         <ul className="list-disc list-inside space-y-1 text-gray-300">
                             {review.cameraAssessment.photoPros.map((pro, i) => <li key={i}>{pro}</li>)}
                         </ul>
                     </div>
                     <div>
                         <h4 className="font-semibold text-red-400 mb-2">Kekurangan Foto 👎</h4>
                         <ul className="list-disc list-inside space-y-1 text-gray-300">
                             {review.cameraAssessment.photoCons.map((con, i) => <li key={i}>{con}</li>)}
                         </ul>
                     </div>
                 </div>
            </div>
        </div>
         <div className="border-t border-indigo-500/20 pt-4">
            <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-2">Ulasan Video</h3>
            <p className="text-gray-300 leading-relaxed">{review.cameraAssessment.videoSummary}</p>
        </div>
    </div>
);

const StarRating: FC<{ score: number; maxScore?: number }> = ({ score, maxScore = 5 }) => {
    const fullStars = Math.floor(score);
    const halfStar = score % 1 >= 0.4;
    const emptyStars = maxScore - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex">
            {[...Array(fullStars)].map((_, i) => <StarIcon key={`full-${i}`} variant="full" />)}
            {halfStar && <StarIcon key="half" variant="half" />}
            {[...Array(emptyStars)].map((_, i) => <StarIcon key={`empty-${i}`} variant="empty" />)}
        </div>
    );
};

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => (
    value ? (
        <>
            <dt className="font-semibold text-gray-400">{label}</dt>
            <dd className="text-gray-200">{value}</dd>
        </>
    ) : null
);

export default SmartReview;