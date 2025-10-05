import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SearchIcon from './icons/SearchIcon';
import ShareButtons from './ShareButtons';

// --- INTERFACES ---
interface Ratings {
  gaming: number;
  kamera: number;
  baterai: number;
  layarDesain: number;
  performa: number;
  storageRam: number;
}

export interface ReviewResult {
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

const SmartReview: React.FC<{ initialQuery?: string, initialResult?: ReviewResult | null }> = ({ initialQuery = '', initialResult = null }) => {
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<ReviewResult | null>(initialResult);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING },
            ratings: {
                type: Type.OBJECT,
                properties: {
                    gaming: { type: Type.NUMBER },
                    kamera: { type: Type.NUMBER },
                    baterai: { type: Type.NUMBER },
                    layarDesain: { type: Type.NUMBER },
                    performa: { type: Type.NUMBER },
                    storageRam: { type: Type.NUMBER },
                }
            },
            quickReview: {
                type: Type.OBJECT, properties: { summary: { type: Type.STRING }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            specs: {
                type: Type.OBJECT, properties: {
                    rilis: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }
                }
            },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessoryAvailability: { type: Type.STRING },
            marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } } },
            performance: {
                type: Type.OBJECT,
                properties: {
                    antutuScore: { type: Type.INTEGER },
                    geekbenchScore: { type: Type.STRING },
                    competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } },
                    gamingReview: { type: Type.STRING }
                }
            },
            cameraAssessment: {
                type: Type.OBJECT,
                properties: {
                    dxomarkScore: { type: Type.INTEGER },
                    photoSummary: { type: Type.STRING },
                    photoPros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    photoCons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    videoSummary: { type: Type.STRING }
                }
            }
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

        if (supabase) {
            try {
                const { data } = await supabase.from('smart_reviews').select('review_data').eq('cache_key', cacheKey).single();
                if (data && data.review_data) {
                    setReview(data.review_data as ReviewResult);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        const prompt = `**Core Role: Comprehensive Data Synthesizer**
        You are an AI trained to understand and extract structured data. Your primary task is to:
        - Identify and parse all available phone data (smartphones, tablets, pads & feature phones).
        - Source data from a wide range of reliable sources: **GSMArena, nanoreview.net, PhoneArena, Jagat Review, AnTuTu, Geekbench, DXOMark, and other top-tier tech media.**
        - Handle variations and missing specs gracefully.
        - Extract metadata like Brand, Model, Release date, and Device type.

        **Your Secondary Task: AI Gadget Reviewer for JAGO-HP**
        Based on the structured data you extract, generate a comprehensive review in **Bahasa Indonesia** for the **gadget**: '${searchQuery}'.

        **Context & Knowledge Cut-off:**
        - **Mandatory Update:** Your knowledge is considered fully updated as of today, **5 Oktober 2025**.
        - **Data Requirement:** You **MUST** use the latest available information for all data points. This includes devices like the Samsung S25 series, iPhone 17 series, and Xiaomi 17 series, which are now considered **officially released** and have full, final data available across all your sources.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.

        **Crucial Rule:** If a device from any of these brands exists, you **MUST** be able to retrieve and display its full, official data.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadget:** First, identify the official name of '${searchQuery}', correcting any typos. Assume it is a released product with available data.
        2.  **Extract Data:** Perform your core role by extracting all relevant specifications for the identified gadget, synthesizing information from your full range of sources.
        3.  **Handle Missing Data:** For older devices (like feature phones) or where data is genuinely unavailable even after checking all sources, you **MUST** use \`null\` for numbers or "N/A" for strings. **DO NOT FAIL** the request because a field is empty.
        4.  **Generate Full Review Content:** Using the comprehensive data, populate the entire JSON schema.
            -   **Ratings:** Provide a 1-10 score for each category based on the final, official product performance.
            -   **Summaries & Analysis:** Write all textual content based on the objective data you've extracted.
        5.  **Handling Unreleased/Rumored Devices (for releases AFTER 5 Oktober 2025):**
            -   This rule now applies **only** to devices rumored for release **after** your current knowledge date of 5 Oktober 2025.
            -   If a user requests such a device:
                a.  Populate the \`specs\` object with available rumored specifications.
                b.  Set all numeric ratings in \`ratings\` to \`0\`.
                c.  In the \`quickReview.summary\`, state: "Ponsel ini belum resmi dirilis. Ulasan lengkap dan rating belum tersedia. Berikut adalah rangkuman spesifikasi yang dirumorkan per 5 Oktober 2025."
                d.  Fill all other analytical fields with appropriate text indicating data is not yet available. Use \`null\` for scores like \`antutuScore\` and \`dxomarkScore\`.
        6.  **True Failure Condition (Not Found):** Only if the device cannot be found at all, even as a rumor on any of your sources, should you populate the \`phoneName\` field with a message like "Maaf: Perangkat '${searchQuery}' tidak dapat ditemukan."

        **Final Output:**
        - Ensure the final JSON output strictly adheres to the provided schema.
        - The \`phoneName\` field must contain the official, full name of the device.`;

        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const resultText = response.text.trim();
            const parsedResult: ReviewResult = JSON.parse(resultText);

            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setError(parsedResult.phoneName);
                setReview(null);
            } else {
                setReview(parsedResult);
                if (supabase) {
                    try {
                        await supabase.from('smart_reviews').insert({ cache_key: cacheKey, review_data: parsedResult });
                    } catch (cacheError) {
                        console.warn("Supabase cache write failed:", cacheError);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setError('An AI error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if(initialQuery && !initialResult) {
            performSearch(initialQuery);
        }
    }, [initialQuery, initialResult]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    return (
        <section id="review" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="w-full max-w-5xl mx-auto">
                { !review && (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
                                Smart Review
                            </h1>
                            <p className="text-base text-slate-500 max-w-2xl mx-auto mt-2">
                                Tulis tipe HP yang ingin diulas, dan dapatkan analisis lengkap dalam hitungan detik.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-10">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Contoh: Samsung S25 Ultra..."
                                className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-5 pr-14 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all duration-200 shadow-sm"
                                aria-label="Smartphone search input"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[color:var(--accent1)] text-white flex items-center justify-center
                                           hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Search for smartphone review"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon className="w-5 h-5" />}
                            </button>
                        </form>
                        {loading && <p className="text-sm text-slate-500 text-center -mt-8 mb-8 animate-pulse">AI sedang menganalisis...</p>}
                    </>
                )}


                <div aria-live="polite">
                    {loading && !review && <ReviewSkeleton />}
                    {error && <div className="text-center text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {review && <ReviewResultDisplay review={review} />}
                </div>
            </div>
        </section>
    );
};

const ReviewSkeleton: FC = () => (
    <div className="glass p-5 md:p-6 text-left space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded-md w-3/4 mx-auto mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 border-y border-slate-200 py-5">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                </div>
            ))}
        </div>
        <div className="flex space-x-4 border-b border-slate-200"><div className="h-9 bg-slate-100 rounded-t-md w-24"></div><div className="h-9 bg-slate-100 rounded-t-md w-24"></div><div className="h-9 bg-slate-100 rounded-t-md w-24"></div></div>
        <div className="space-y-3 pt-3"><div className="h-5 bg-slate-200 rounded-md w-1/3 mb-2"></div><div className="h-4 bg-slate-200 rounded-md w-full"></div><div className="h-4 bg-slate-200 rounded-md w-5/6"></div></div>
    </div>
);

const ReviewResultDisplay: FC<{ review: ReviewResult }> = ({ review }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');
    const tabs = [{ id: 'ringkasan', label: 'Ringkasan' }, { id: 'performa', label: 'Performa' }, { id: 'foto-video', label: 'Kamera' }];
    const shareText = `Cek review AI untuk ${review.phoneName} di JAGO-HP!\n\nRingkasan: ${review.quickReview.summary}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="glass p-4 md:p-6 text-left animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-1 text-slate-900">{review.phoneName}</h2>
            <p className="text-center text-sm small-muted mb-4">{review.specs.rilis ? `Rilis: ${review.specs.rilis}` : ''}</p>
            <RatingsDisplay ratings={review.ratings} />
            <div className="mt-6 flex space-x-2 sm:space-x-4 justify-center bg-slate-100 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 relative focus:outline-none ${activeTab === tab.id ? 'bg-white text-[color:var(--accent1)] shadow' : 'text-slate-600 hover:bg-white/50'}`}>{tab.label}</button>
                ))}
            </div>
            <div className="pt-5 min-h-[200px]">
                {activeTab === 'ringkasan' && <TabContentRingkasan review={review} />}
                {activeTab === 'performa' && <TabContentPerforma review={review} />}
                {activeTab === 'foto-video' && <TabContentCamera review={review} />}
            </div>
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
        </div>
    );
};

const RatingsDisplay: FC<{ ratings: Ratings }> = ({ ratings }) => {
    const ratingItems = [
        { label: 'Gaming', score: ratings.gaming }, { label: 'Kamera', score: ratings.kamera }, { label: 'Baterai', score: ratings.baterai },
        { label: 'Layar & Desain', score: ratings.layarDesain }, { label: 'Performa', score: ratings.performa }, { label: 'Storage & RAM', score: ratings.storageRam },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 border-y border-slate-200 py-5">
            {ratingItems.map(item => (
                <div key={item.label}>
                    <p className="text-sm text-slate-600 font-medium mb-1">{item.label}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-lg text-slate-800">{item.score.toFixed(1)}</span>
                        <span className="text-sm text-slate-500">/ 10</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TabContentRingkasan: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-6 text-sm">
        <div><h3 className="text-base font-bold text-slate-800 mb-2">Ringkasan Cepat</h3><p className="text-slate-600 leading-relaxed">{review.quickReview.summary}</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><h4 className="font-semibold text-green-600 mb-2">Kelebihan 👍</h4><ul className="list-disc list-inside space-y-1 text-slate-600">{review.quickReview.pros.map((pro, i) => <li key={i}>{pro}</li>)}</ul></div>
            <div><h4 className="font-semibold text-red-600 mb-2">Kekurangan 👎</h4><ul className="list-disc list-inside space-y-1 text-slate-600">{review.quickReview.cons.map((con, i) => <li key={i}>{con}</li>)}</ul></div>
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Spesifikasi Kunci</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                <SpecItem label="Prosesor" value={review.specs.processor} /><SpecItem label="RAM" value={review.specs.ram} />
                <SpecItem label="Layar" value={review.specs.display} /><SpecItem label="Baterai" value={review.specs.battery} />
                <SpecItem label="Kamera" value={review.specs.camera} /><SpecItem label="Charging" value={review.specs.charging} />
                <SpecItem label="Jaringan" value={review.specs.jaringan} /><SpecItem label="Koneksi" value={review.specs.koneksi} />
                <SpecItem label="OS" value={review.specs.os} /><SpecItem label="NFC" value={review.specs.nfc} />
            </div>
        </div>
    </div>
);

const PerformanceChart: FC<{ mainPhone: { name: string; score: number | null }, competitors: { name: string; antutuScore: number | null }[] }> = ({ mainPhone, competitors }) => {
    const allPhones = [{ name: mainPhone.name, score: mainPhone.score }, ...competitors.map(c => ({ name: c.name, score: c.antutuScore }))].filter(p => p.score !== null);
    if (allPhones.length === 0) return <p className="small-muted">Data skor AnTuTu tidak tersedia.</p>;
    const maxScore = Math.max(...allPhones.map(p => p.score as number));
    return (
        <div className="space-y-3">
            {allPhones.map((phone, index) => {
                const isMain = phone.name === mainPhone.name;
                const barWidth = phone.score ? (phone.score / maxScore) * 100 : 0;
                return (
                    <div key={index} className="text-sm">
                        <div className="flex justify-between items-center mb-1"><span className={`font-semibold ${isMain ? 'text-slate-800' : 'text-slate-600'}`}>{phone.name}</span><span className={`font-bold ${isMain ? 'text-[color:var(--accent1)]' : 'text-slate-500'}`}>{phone.score?.toLocaleString('id-ID') || 'N/A'}</span></div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${isMain ? 'bg-[color:var(--accent1)]' : 'bg-slate-400'}`} style={{ width: `${barWidth}%`, transition: 'width 0.5s ease-in-out' }}></div></div>
                    </div>
                );
            })}
        </div>
    );
};

const TabContentPerforma: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-6 text-sm">
        <div><h3 className="text-base font-bold text-slate-800 mb-3">Perbandingan AnTuTu v10</h3><PerformanceChart mainPhone={{ name: review.phoneName, score: review.performance.antutuScore }} competitors={review.performance.competitors} /><p className="text-slate-600 mt-4"><strong>Geekbench 6:</strong> <span className="font-semibold text-slate-800">{review.performance.geekbenchScore || 'N/A'}</span></p></div>
        <div><h3 className="text-base font-bold text-slate-800 mb-2">Review Gaming</h3><p className="text-slate-600 leading-relaxed">{review.performance.gamingReview}</p></div>
    </div>
);

const DxOMarkScoreDisplay: FC<{ score: number | null }> = ({ score }) => {
    if (score === null || score === 0) return <div className="flex flex-col items-center"><p className="text-base font-bold text-slate-800 mb-2">Skor DXOMark</p><p className="text-slate-400 text-3xl font-semibold">N/A</p></div>;
    return <div className="flex flex-col items-center text-center"><p className="text-base font-bold text-slate-800 mb-2">Skor DXOMark</p><p className="text-5xl font-bold text-[color:var(--accent1)]">{score}</p></div>;
};

const TabContentCamera: FC<{ review: ReviewResult }> = ({ review }) => (
     <div className="space-y-5 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex justify-center items-center p-4 bg-slate-100 rounded-lg"><DxOMarkScoreDisplay score={review.cameraAssessment.dxomarkScore} /></div>
            <div className="md:col-span-2"><h3 className="text-base font-bold text-slate-800 mb-2">Ulasan Foto</h3><p className="text-slate-600 leading-relaxed mb-3">{review.cameraAssessment.photoSummary}</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div><h4 className="font-semibold text-green-600 mb-2">Kelebihan 👍</h4><ul className="list-disc list-inside space-y-1 text-slate-600">{review.cameraAssessment.photoPros.map((pro, i) => <li key={i}>{pro}</li>)}</ul></div>
                     <div><h4 className="font-semibold text-red-600 mb-2">Kekurangan 👎</h4><ul className="list-disc list-inside space-y-1 text-slate-600">{review.cameraAssessment.photoCons.map((con, i) => <li key={i}>{con}</li>)}</ul></div>
                 </div>
            </div>
        </div>
         <div className="border-t border-slate-200 pt-4"><h3 className="text-base font-bold text-slate-800 mb-2">Ulasan Video</h3><p className="text-slate-600 leading-relaxed">{review.cameraAssessment.videoSummary}</p></div>
    </div>
);

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => (
    value ? (<><dt className="small-muted truncate">{label}</dt><dd className="text-slate-700 text-right">{value}</dd></>) : null
);

export default SmartReview;