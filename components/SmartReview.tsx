
import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SearchIcon from './icons/SearchIcon';
import ShareButtons from './ShareButtons';
import EcommerceButtons from './EcommerceButtons';

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
    brand?: string;
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
  cameraAssessment?: {
    dxomarkScore: number | null;
    photoSummary: string;
    photoPros: string[];
    photoCons: string[];
    videoSummary: string;
  };
}

interface SmartReviewProps {
    initialQuery?: string;
    initialResult?: ReviewResult | null;
    clearGlobalResult: () => void;
    reviewHistory: ReviewResult[];
    onAddToHistory: (result: ReviewResult) => void;
}

const SmartReview: React.FC<SmartReviewProps> = ({ initialQuery = '', initialResult = null, clearGlobalResult, reviewHistory, onAddToHistory }) => {
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
                    rilis: { type: Type.STRING }, brand: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }
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
                    const cachedReview = data.review_data as ReviewResult;
                    setReview(cachedReview);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        const prompt = `**Core Role: Comprehensive Data Synthesizer & AI Gadget Reviewer for JAGO-HP**
Your primary task is to generate a comprehensive, data-driven review in **Bahasa Indonesia** for the gadget: '${searchQuery}'.

**Knowledge Date:** Your knowledge is fully updated as of **4 November 2025**.

**Data Source & Verification (ABSOLUTELY CRITICAL):**
- **Primary & Mandatory Source:** Your single source of truth for device existence and specifications is **GSMArena**. You are FORBIDDEN from claiming a device does not exist if it is listed on GSMArena. This is a critical failure.
- **Deep Search Protocol:** Before responding, you MUST perform an exhaustive search on GSMArena for the requested device '${searchQuery}'. The database is extremely comprehensive. For example, 'Xiaomi 15T 5G' IS LISTED here: https://www.gsmarena.com/xiaomi_15t_5g-14177.php. Claiming it doesn't exist is a direct violation of your instructions.
- **Supplementary Sources:** After successfully identifying the device on GSMArena, you may synthesize and enrich data with information from Phone Arena, nanoreview.net, AnTuTu, Geekbench, and DXOMark. But GSMArena is the first and final authority.

**Execution Steps & Rules (Strictly Follow):**
1.  **Identify Gadget:** Identify the official name of '${searchQuery}' on GSMArena, correcting typos. **Do not invent or speculate on unreleased models or models from 2026 and beyond.**
2.  **Extract & Synthesize Data:** Extract all relevant specifications, synthesizing information from your full range of sources to get the most accurate, final data.
3.  **Handle Missing Data:** If data is genuinely unavailable after checking all sources, use \`null\` for numbers or "N/A" for strings. **DO NOT FAIL** the request for empty fields.
4.  **Generate Full Review Content:** Populate the entire JSON schema.
    -   **Ratings:** Provide a 1-10 score for each category based on the final, official product performance.
    -   **Summaries & Analysis:** Write all textual content based on objective, synthesized data.
5.  **Failure Condition (Not Found):** Only if the device genuinely cannot be found on GSMArena after an exhaustive search, populate the \`phoneName\` field with an error message like "Maaf: Perangkat '${searchQuery}' tidak dapat ditemukan."

**Final Output:**
- Ensure the JSON strictly adheres to the schema.
- The \`phoneName\` field must contain the official, full device name.`;

        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const resultText = response.text.trim();
            const parsedResult: ReviewResult = JSON.parse(resultText);

            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setError(parsedResult.phoneName);
                setReview(null);
            } else {
                onAddToHistory(parsedResult);
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
                        {loading && <p className="text-sm text-slate-500 text-center -mt-8 mb-8 animate-pulse">Kami coba review, mohon jangan pindah menu..</p>}
                    </>
                )}


                <div aria-live="polite">
                    {loading && !review && <ReviewSkeleton />}
                    {error && <div className="text-center text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {review && <ReviewResultDisplay 
                                review={review} 
                                onReset={() => { 
                                    setReview(null); 
                                    setQuery(''); 
                                    clearGlobalResult();
                                }} 
                               />}
                </div>

                {reviewHistory && reviewHistory.length > 0 && !loading && (
                    <ReviewHistory 
                        history={reviewHistory} 
                        onSelectReview={(selectedReview) => {
                            setReview(selectedReview);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        currentPhoneName={review?.phoneName}/>
                )}
            </div>
        </section>
    );
};

const ReviewSkeleton: FC = () => (
    <div className="glass p-5 md:p-6 text-left space-y-6 animate-pulse">
        <div className="w-full aspect-[2/1] bg-slate-200 rounded-lg"></div>
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

const ReviewResultDisplay: FC<{ 
    review: ReviewResult; 
    onReset: () => void;
}> = ({ review, onReset }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');
    const tabs = [{ id: 'ringkasan', label: 'Ringkasan' }, { id: 'performa', label: 'Performa' }, { id: 'foto-video', label: 'Kamera' }];
    const shareText = `Cek review AI untuk ${review.phoneName} di JAGO-HP!\n\nRingkasan: ${review.quickReview.summary}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="glass p-4 md:p-6 text-left animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-1 text-slate-900">{review.phoneName}</h2>
            <p className="text-center text-sm small-muted mb-4">{review.specs.rilis ? `Rilis: ${review.specs.rilis}` : ''}</p>
            {review.ratings && <RatingsDisplay ratings={review.ratings} />}
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
            <EcommerceButtons phoneName={review.phoneName} />
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />

            <div className="mt-6 text-center text-xs text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200">
                <strong>Disclaimer:</strong> Review dibuat seakurat mungkin, namun pastikan juga Anda juga mengecek ke website resmi.
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={onReset}
                    className="px-6 py-2 rounded-lg text-sm bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
                >
                    Cari Review Lain
                </button>
            </div>
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
        <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Perbandingan AnTuTu v10</h3>
            <PerformanceChart 
                mainPhone={{ name: review.phoneName, score: review.performance?.antutuScore ?? null }} 
                competitors={review.performance?.competitors ?? []} 
            />
            <p className="text-slate-600 mt-4">
                <strong>Geekbench 6:</strong> 
                <span className="font-semibold text-slate-800">{review.performance?.geekbenchScore || 'N/A'}</span>
            </p>
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Review Gaming</h3>
            <p className="text-slate-600 leading-relaxed">{review.performance?.gamingReview || 'Ulasan gaming tidak tersedia.'}</p>
        </div>
    </div>
);

const DxOMarkScoreDisplay: FC<{ score: number | null }> = ({ score }) => {
    if (score === null || score === 0) return <div className="flex flex-col items-center"><p className="text-base font-bold text-slate-800 mb-2">Skor DXOMark</p><p className="text-slate-400 text-3xl font-semibold">N/A</p></div>;
    return <div className="flex flex-col items-center text-center"><p className="text-base font-bold text-slate-800 mb-2">Skor DXOMark</p><p className="text-5xl font-bold text-[color:var(--accent1)]">{score}</p></div>;
};

const TabContentCamera: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-5 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex justify-center items-center p-4 bg-slate-100 rounded-lg"><DxOMarkScoreDisplay score={review.cameraAssessment?.dxomarkScore ?? null} /></div>
            <div className="md:col-span-2">
                <h3 className="text-base font-bold text-slate-800 mb-2">Ulasan Foto</h3>
                <p className="text-slate-600 leading-relaxed mb-3">{review.cameraAssessment?.photoSummary ?? 'Ulasan foto tidak tersedia.'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-green-600 mb-2">Kelebihan 👍</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            {(review.cameraAssessment?.photoPros ?? []).map((pro, i) => <li key={i}>{pro}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-600 mb-2">Kekurangan 👎</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            {(review.cameraAssessment?.photoCons ?? []).map((con, i) => <li key={i}>{con}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div className="border-t border-slate-200 pt-4">
            <h3 className="text-base font-bold text-slate-800 mb-2">Ulasan Video</h3>
            <p className="text-slate-600 leading-relaxed">{review.cameraAssessment?.videoSummary ?? 'Ulasan video tidak tersedia.'}</p>
        </div>
    </div>
);

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => (
    value ? (<><dt className="small-muted truncate">{label}</dt><dd className="text-slate-700 text-right">{value}</dd></>) : null
);

// --- NEW HISTORY COMPONENTS ---

const HistoryCard: FC<{ review: ReviewResult, onSelect: () => void, isActive: boolean }> = ({ review, onSelect, isActive }) => {
    const { phoneName, ratings, specs } = review;
    
    const calculateOverallScore = () => {
        if (!ratings) return 'N/A';
        const scores = [
            ratings.gaming,
            ratings.kamera,
            ratings.baterai,
            ratings.layarDesain,
            ratings.performa,
            ratings.storageRam,
        ];
        const validScores = scores.filter(s => typeof s === 'number' && s > 0);
        if (validScores.length === 0) return 'N/A';
        const sum = validScores.reduce((acc, score) => acc + score, 0);
        const average = sum / validScores.length;
        return average.toFixed(1);
    };

    const overallScore = calculateOverallScore();
    const brand = phoneName.split(' ')[0] || '';
    const model = phoneName.split(' ').slice(1).join(' ');

    return (
        <div className={`p-4 flex flex-col bg-[color:var(--accent1)] rounded-xl shadow-lg text-white transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2 ring-offset-slate-100 ring-[color:var(--accent1)]' : 'hover:-translate-y-1'}`}>
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h3 className="font-semibold text-lg">{brand}</h3>
                    <p className="text-2xl font-bold font-orbitron -mt-1 line-clamp-2">{model}</p>
                </div>
                <p className="text-4xl font-bold font-orbitron flex-shrink-0">{overallScore}</p>
            </div>
            
            <dl className="mt-4 space-y-1 text-sm text-slate-200 flex-grow">
                {specs.camera && <dt>Kamera {specs.camera}</dt>}
                {specs.processor && <dt>{specs.processor}</dt>}
                {specs.display && <dt>Layar {specs.display.split(',').find(s => s.includes('Hz'))?.trim() || specs.display.split(',')[0]}</dt>}
            </dl>

            <button
                onClick={onSelect}
                className="w-full mt-4 px-3 py-2 rounded-lg text-sm bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors"
            >
                Lihat Detail
            </button>
        </div>
    );
};

const KNOWN_BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Huawei', 'Google', 'Vivo', 'Poco', 'iQOO', 'Infinix', 'iTel'];

const getBrand = (phoneName: string): string => {
    const lowerCaseName = phoneName.toLowerCase();
    
    // Special case for iPhone
    if (lowerCaseName.startsWith('iphone')) {
        return 'Apple';
    }

    for (const brand of KNOWN_BRANDS) {
        if (lowerCaseName.startsWith(brand.toLowerCase())) {
            return brand;
        }
    }
    return 'Others';
};

const ReviewHistory: FC<{ history: ReviewResult[], onSelectReview: (review: ReviewResult) => void, currentPhoneName?: string }> = ({ history, onSelectReview, currentPhoneName }) => {
    const [activeTab, setActiveTab] = useState('All');

    const tabs = useMemo(() => {
        if (history.length === 0) return [];
        
        const brandsInHistory = new Set<string>();
        history.forEach(item => {
            brandsInHistory.add(getBrand(item.phoneName));
        });

        const sortedBrands = Array.from(brandsInHistory).sort((a, b) => {
            const indexA = KNOWN_BRANDS.indexOf(a);
            const indexB = KNOWN_BRANDS.indexOf(b);
            if (a === 'Others') return 1;
            if (b === 'Others') return -1;
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        return ['All', ...sortedBrands];
    }, [history]);

    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab('All');
        }
    }, [tabs, activeTab]);

    const filteredHistory = history.filter(item => {
        if (activeTab === 'All') {
            return true;
        }
        return getBrand(item.phoneName) === activeTab;
    });

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">Riwayat Review Terakhir</h2>
            
            <div className="flex justify-center flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            activeTab === tab 
                                ? 'bg-[color:var(--accent1)] text-white shadow' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredHistory.length > 0 ? (
                    filteredHistory.map(item => (
                        <HistoryCard 
                            key={item.phoneName} 
                            review={item} 
                            onSelect={() => onSelectReview(item)}
                            isActive={item.phoneName === currentPhoneName}
                        />
                    ))
                ) : (
                    <div className="md:col-span-3 text-center text-slate-500 py-8">
                        Tidak ada riwayat untuk brand ini.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartReview;
