import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SearchIcon from './icons/SearchIcon';
import ShareButtons from './ShareButtons';
import EcommerceButtons from './EcommerceButtons';
import CrownIcon from './icons/CrownIcon';
import UsersIcon from './icons/UsersIcon';
import ShareIcon from './icons/ShareIcon';
import SparklesIcon from './icons/SparklesIcon';
import LinkIcon from './icons/LinkIcon';

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
  imageUrl?: string;
  ratings: Ratings;
  quickReview: {
    summary: string;
    pros: string[];
    cons: string[];
  };
  specs: {
    rilis?: string;
    storage: string;
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
    gamingRatings?: {
        game: string;
        score: number;
    }[];
  };
  cameraAssessment?: {
    dxomarkScore: number | null;
    photoSummary: string;
    photoPros: string[];
    photoCons: string[];
    videoSummary: string;
  };
  sources?: { title: string; uri: string }[];
}

interface SmartReviewProps {
    initialQuery?: string;
    initialResult?: ReviewResult | null;
    clearGlobalResult: () => void;
    onCompare?: (phoneName: string) => void;
}

const formatBrandName = (name: string): string => {
    if (!name) return name;
    return name.replace(/iqoo/gi, 'iQOO');
};

const SmartReview: React.FC<SmartReviewProps> = ({ initialQuery = '', initialResult = null, clearGlobalResult, onCompare }) => {
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Menganalisis spesifikasi...');
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<ReviewResult | null>(initialResult);
    const [showFullReview, setShowFullReview] = useState(initialResult ? true : false);
    const [recentReviews, setRecentReviews] = useState<ReviewResult[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [explorationSearch, setExplorationSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        if (loading) {
            const messages = [
                "Memverifikasi spesifikasi teknis global...",
                "Membandingkan varian model secara presisi...",
            ];
            let i = 0;
            const interval = setInterval(() => {
                i = (i + 1) % messages.length;
                setLoadingMessage(messages[i]);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [loading]);

    const fetchRecent = async (searchTerm: string = '') => {
        if (!supabase) return;
        setLoadingRecent(true);
        try {
            let dbQuery = supabase
                .from('smart_reviews')
                .select('review_data')
                .order('created_at', { ascending: false });
            
            if (searchTerm.trim()) {
                dbQuery = dbQuery.ilike('cache_key', `%${searchTerm.toLowerCase()}%`);
            } else {
                dbQuery = dbQuery.limit(100);
            }

            const { data } = await dbQuery;
            if (data) {
                const uniqueResults: ReviewResult[] = [];
                const seenNames = new Set<string>();
                data.forEach(d => {
                    const rev = d.review_data as ReviewResult;
                    const normalized = rev.phoneName.toLowerCase();
                    if (!seenNames.has(normalized)) {
                        seenNames.add(normalized);
                        uniqueResults.push(rev);
                    }
                });
                setRecentReviews(uniqueResults);
            }
        } catch (err) {
            console.error("Failed to fetch recent reviews", err);
        } finally {
            setLoadingRecent(false);
        }
    };

    useEffect(() => { fetchRecent(); }, []);

    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING, description: "Official Full Name (Contoh: Xiaomi 17 Pro Max 5G)" },
            ratings: {
                type: Type.OBJECT,
                properties: {
                    gaming: { type: Type.NUMBER }, kamera: { type: Type.NUMBER }, baterai: { type: Type.NUMBER },
                    layarDesain: { type: Type.NUMBER }, performa: { type: Type.NUMBER }, storageRam: { type: Type.NUMBER },
                }
            },
            quickReview: {
                type: Type.OBJECT, properties: { summary: { type: Type.STRING }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } }
            },
            specs: {
                type: Type.OBJECT, properties: {
                    rilis: { type: Type.STRING, description: "Bulan & Tahun (Contoh: Januari 2026)." }, 
                    storage: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, 
                    camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, 
                    charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, 
                    nfc: { type: Type.STRING }, os: { type: Type.STRING }
                }
            },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessoryAvailability: { type: Type.STRING },
            marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } }, required: ["indonesia"] },
            performance: {
                type: Type.OBJECT,
                properties: {
                    antutuScore: { type: Type.INTEGER }, geekbenchScore: { type: Type.STRING },
                    competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } },
                    gamingReview: { type: Type.STRING },
                    gamingRatings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { game: { type: Type.STRING }, score: { type: Type.NUMBER } } } }
                }
            },
            cameraAssessment: {
                type: Type.OBJECT,
                properties: {
                    dxomarkScore: { type: Type.INTEGER }, photoSummary: { type: Type.STRING }, photoPros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    photoCons: { type: Type.ARRAY, items: { type: Type.STRING } }, videoSummary: { type: Type.STRING }
                }
            }
        },
    };
    
    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError(null);
        setReview(null);
        setShowFullReview(false);

        const cacheKey = searchQuery.trim().toLowerCase();

        if (supabase) {
            try {
                const { data } = await supabase.from('smart_reviews').select('review_data').eq('cache_key', cacheKey).single();
                if (data && data.review_data) {
                    setReview(data.review_data as ReviewResult);
                    setShowFullReview(true);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) {}
        }

        const prompt = `**PERAN:** Pakar Teknologi & Analis Gadget Global Senior JAGO-HP. Anda ahli dalam SEMUA tipe smartphone di dunia, dari flagship 2025 hingga bocoran rilis 2026.
**TUGAS:** Lakukan ulasan mendalam untuk smartphone: '${searchQuery}'. 
**SUMBER DATA:** Anda WAJIB menggunakan pencarian internet (Google Search) untuk mengambil data dari GSMArena, PhoneArena, dan NotebookCheck.
**KETELITIAN VARIANT:** Bedakan secara presisi antara varian (Contoh: Xiaomi 17 Pro Max 5G berbeda dengan Xiaomi 17 Ultra). Jangan berhalusinasi.
**DATA 2025/2026:** Fokus pada jajaran HP 2025. Jika HP rilis awal 2026 belum resmi, gunakan data rumor/leaks yang paling kredibel dari internet.
**Bahasa:** Bahasa Indonesia.`;

        try {
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt, 
                config: { 
                    responseMimeType: "application/json", 
                    responseSchema: schema as any,
                    tools: [{ googleSearch: {} }] as any
                } 
            });

            const parsedResult: ReviewResult = JSON.parse(response.text.trim());
            
            // Extract sources from grounding metadata
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const sources: {title: string, uri: string}[] = [];
            if (groundingMetadata?.groundingChunks) {
                groundingMetadata.groundingChunks.forEach((chunk: any) => {
                    if (chunk.web) {
                        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
                    }
                });
            }
            parsedResult.sources = sources.length > 0 ? sources : undefined;

            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setError(parsedResult.phoneName);
            } else {
                const officialCacheKey = parsedResult.phoneName.toLowerCase().trim();
                if (supabase) {
                    try {
                        await supabase.from('smart_reviews').insert({ cache_key: officialCacheKey, review_data: parsedResult });
                        if (officialCacheKey !== cacheKey) {
                            await supabase.from('smart_reviews').insert({ cache_key: cacheKey, review_data: parsedResult });
                        }
                    } catch (supabaseErr) {
                        console.warn("Supabase cache error", supabaseErr);
                    }
                }
                setReview(parsedResult);
                setShowFullReview(true);
            }
        } catch (e) {
            console.error(e);
            setError('Gagal mendapatkan kueri. Pastikan koneksi internet stabil.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if(initialQuery && !initialResult) {
            performSearch(initialQuery);
        } else if (initialResult) {
            setReview(initialResult);
            setShowFullReview(true);
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
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">Smart Review</h1>
                        <p className="text-base text-slate-500 mt-2">Dapatkan analisis lengkap dan cepat dalam hitungan detik.</p>
                    </div>
                )}

                { !review && !loading && (
                    <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-10">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tulis nama/tipe hpnya..."
                            className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-5 pr-28 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] shadow-sm"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 h-10 rounded-lg bg-[color:var(--accent1)] text-white font-bold text-sm">Review</button>
                    </form>
                )}

                <div aria-live="polite">
                    {loading && (
                        <div className="mt-4 mb-20 text-center animate-fade-in">
                            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-slate-800 animate-pulse">{loadingMessage}</h3>
                            <p className="text-sm text-slate-400 mt-2">Mohon tunggu, kami sedang menganalisis...</p>
                        </div>
                    )}

                    {error && <div className="text-center text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    
                    {review && showFullReview && (
                        <ReviewResultDisplay review={review} onReset={() => { setReview(null); setQuery(''); setShowFullReview(false); clearGlobalResult(); }} />
                    )}

                    { !review && !loading && (
                        <div className="mt-16 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-900 font-orbitron uppercase tracking-tight border-b pb-6 mb-8">Pencarian Review Pengguna Lainnya</h2>
                            {loadingRecent ? <p>Memuat database...</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentReviews.slice(0, visibleCount).map((rev, idx) => (
                                        <RecentReviewCard key={idx} result={rev} onSelect={() => {setReview(rev); setShowFullReview(true); window.scrollTo(0,0);}} onCompare={onCompare} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const RecentReviewCard: FC<{ result: ReviewResult; onSelect: () => void; onCompare?: (name: string) => void }> = ({ result, onSelect, onCompare }) => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-all duration-300 group">
        <div className="flex gap-4 mb-4">
            <div className="w-16 h-20 rounded-2xl bg-slate-50 flex items-center justify-center border overflow-hidden p-1 shadow-inner">
                {result.imageUrl ? <img src={result.imageUrl} alt="" className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform" /> : <span className="text-[8px] text-slate-400 font-bold uppercase text-center">No Image</span>}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-[color:var(--accent1)] transition-colors">{formatBrandName(result.phoneName)}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-tight">Rilis: {result.specs?.rilis || 'N/A'}</p>
            </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 mb-5 px-1">
            <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">CPU</p>
                <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">
                    {result.specs?.processor?.replace(/Qualcomm\s*/i, '').replace(/MediaTek\s*/i, '').replace(/Samsung\s*Exynos\s*/i, 'Exynos ') || '-'}
                </p>
            </div>
            <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">RAM</p>
                <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">{result.specs?.ram || '-'}</p>
            </div>
            <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Antutu</p>
                <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">{result.performance?.antutuScore?.toLocaleString('id-ID') || '-'}</p>
            </div>
            <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Koneksi</p>
                <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">{result.specs?.koneksi || '-'}</p>
            </div>
        </div>

        <div className="mb-5 mt-auto">
            <div className="px-3 py-2 bg-slate-900 rounded-2xl w-full text-center shadow-lg border-b-2 border-slate-700 active:translate-y-0.5 transition-all">
                <span className="text-yellow-400 font-black text-sm tracking-tight">{result.marketPrice?.indonesia || 'Rp -'}</span>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={onSelect} className="px-3 py-2.5 rounded-2xl bg-slate-100 text-slate-900 font-black text-[10px] uppercase border border-slate-200 hover:bg-slate-200 transition-colors">Detail</button>
            <button onClick={() => onCompare?.(result.phoneName)} className="px-3 py-2.5 rounded-2xl bg-white border border-slate-900 text-slate-900 font-black text-[10px] uppercase hover:bg-slate-50 transition-colors">Compare</button>
        </div>
    </div>
);

const RatingItem: FC<{ label: string; score: number }> = ({ label, score }) => (
    <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
        <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-black text-slate-900">{score.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-300">/ 10</span>
        </div>
        <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden">
            <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${(score / 10) * 100}%` }}
            />
        </div>
    </div>
);

const ReviewResultDisplay: FC<{ review: ReviewResult; onReset: () => void; }> = ({ review, onReset }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');
    return (
        <div className="glass p-4 md:p-8 text-left animate-fade-in shadow-xl">
            <button onClick={onReset} className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                <span>Kembali</span>
            </button>

            <div className="flex flex-col items-center mb-8">
                {review.imageUrl && <img src={review.imageUrl} alt="" className="w-full max-w-xs h-auto object-contain mb-6 drop-shadow-2xl" />}
                <h2 className="text-2xl md:text-4xl font-bold text-center text-slate-900 font-orbitron">{formatBrandName(review.phoneName)}</h2>
                <div className="mt-4 px-8 py-3 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimasi Harga Jago-HP</span>
                    <span className="text-2xl font-black text-yellow-400">{review.marketPrice?.indonesia || 'Rp -'}</span>
                </div>
            </div>

            {/* Ratings Section - Following the screenshot style */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 mb-10 border-t border-slate-100 pt-10">
                <RatingItem label="Baterai" score={review.ratings?.baterai || 0} />
                <RatingItem label="Gaming" score={review.ratings?.gaming || 0} />
                <RatingItem label="Kamera" score={review.ratings?.kamera || 0} />
                <RatingItem label="Layar Desain" score={review.ratings?.layarDesain || 0} />
                <RatingItem label="Performa" score={review.ratings?.performa || 0} />
                <RatingItem label="Storage RAM" score={review.ratings?.storageRam || 0} />
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                {['ringkasan', 'performa', 'foto-video'].map(id => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all uppercase ${activeTab === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>{id.replace('-', ' ')}</button>
                ))}
            </div>

            <div className="pt-4 min-h-[300px]">
                {activeTab === 'ringkasan' && <TabContentRingkasan review={review} />}
                {activeTab === 'performa' && <TabContentPerforma review={review} />}
                {activeTab === 'foto-video' && <TabContentCamera review={review} />}
            </div>

            <div className="mt-10 space-y-6">
                <EcommerceButtons phoneName={review.phoneName} />
                <div className="text-center"><button onClick={onReset} className="px-10 py-3.5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] hover:bg-indigo-600 transition-colors shadow-xl border-b-4 border-slate-700">Reset Review</button></div>
            </div>
        </div>
    );
};

const SpecRow: FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <div className="flex justify-between border-b border-slate-100 pb-2 text-sm">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-800 text-right ml-4">{value || '-'}</span>
    </div>
);

const TabContentRingkasan: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2"><span className="w-2 h-6 bg-[color:var(--accent1)] rounded-full"></span>Ringkasan AI Komprehensif</h3>
            <p className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap">{review.quickReview.summary}</p>
        </div>

        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Spesifikasi Kunci</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
                <div className="space-y-3">
                    <SpecRow label="OS" value={review.specs.os} />
                    <SpecRow label="Jaringan" value={review.specs.jaringan} />
                    <SpecRow label="Display" value={review.specs.display} />
                    <SpecRow label="Kamera" value={review.specs.camera} />
                    <SpecRow label="Storage" value={review.specs.storage} />
                    <SpecRow label="Ram" value={review.specs.ram} />
                </div>
                <div className="space-y-3 mt-3 sm:mt-0">
                    <SpecRow label="Processor" value={review.specs.processor} />
                    <SpecRow label="Batere" value={review.specs.battery} />
                    <SpecRow label="Charging" value={review.specs.charging} />
                    <SpecRow label="Koneksi" value={review.specs.koneksi} />
                    <SpecRow label="NFC" value={review.specs.nfc} />
                    <SpecRow label="Rilis" value={review.specs.rilis} />
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">✅ Kelebihan</h4>
                <ul className="space-y-2">{review.quickReview.pros.map((p, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span>{p}</li>)}</ul>
            </div>
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                <h4 className="font-bold text-rose-700 mb-3 flex items-center gap-2">❌ Kekurangan</h4>
                <ul className="space-y-2">{review.quickReview.cons.map((c, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-rose-400 mt-1">•</span>{c}</li>)}</ul>
            </div>
        </div>
    </div>
);

const TabContentPerforma: FC<{ review: ReviewResult }> = ({ review }) => {
    const mainPhone = { name: review.phoneName, score: review.performance.antutuScore || 0, isMain: true };
    const rivals = (review.performance.competitors || []).map(c => ({ name: c.name, score: c.antutuScore || 0, isMain: false }));
    const allForComparison = [mainPhone, ...rivals].sort((a, b) => b.score - a.score);
    const maxScore = Math.max(...allForComparison.map(i => i.score));

    return (
        <div className="space-y-10">
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-orange-500 rounded-full"></span>Benchmark AnTuTu v10</h3>
                <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    {allForComparison.map((item, idx) => {
                        const percentage = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
                        return (
                            <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold truncate max-w-[150px] sm:max-w-none ${item.isMain ? 'text-indigo-600' : 'text-slate-50'}`}>{formatBrandName(item.name)}</span>
                                        {item.isMain && <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Target</span>}
                                    </div>
                                    <span className={`text-sm font-black ${item.isMain ? 'text-slate-900' : 'text-slate-500'}`}>{item.score.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${item.isMain ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-slate-400 opacity-60'}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-[10px] text-slate-400 font-medium italic mt-4 text-center">* Data AnTuTu v10 berdasarkan database benchmark publik 2025/2026.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Geekbench 6 (Multi)</p>
                    <p className="text-3xl font-black text-slate-900">{review.performance?.geekbenchScore || 'N/A'}</p>
                </div>
                <div className="glass p-6 flex flex-col justify-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chipset Utama</h4>
                    <p className="text-base font-bold text-indigo-600 leading-tight">{review.specs.processor}</p>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Analisis Gaming</h3>
                <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                    <p className="text-slate-600 leading-relaxed text-sm">{review.performance?.gamingReview || 'Data performa gaming tidak tersedia.'}</p>
                </div>
            </div>
        </div>
    );
};

const TabContentCamera: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Penilaian Kamera</h3>
                {review.cameraAssessment?.dxomarkScore && <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold">DXOMark: {review.cameraAssessment.dxomarkScore}</div>}
             </div>
             <div className="space-y-6">
                <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wide">Kualitas Foto</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{review.cameraAssessment?.photoSummary || 'Review foto tidak tersedia.'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Pro Foto</h5>
                         <ul className="space-y-1">{review.cameraAssessment?.photoPros?.map((p, i) => <li key={i} className="text-xs text-slate-500">• {p}</li>)}</ul>
                    </div>
                    <div className="space-y-2">
                         <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Cons Foto</h5>
                         <ul className="space-y-1">{review.cameraAssessment?.photoCons?.map((c, i) => <li key={i} className="text-xs text-slate-500">• {c}</li>)}</ul>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wide">Kualitas Video</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{review.cameraAssessment?.videoSummary || 'Review video tidak tersedia.'}</p>
                </div>
             </div>
        </div>
    </div>
);

export default SmartReview;
