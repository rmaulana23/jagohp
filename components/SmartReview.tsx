
import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SearchIcon from './icons/SearchIcon';
import ShareButtons from './ShareButtons';
import EcommerceButtons from './EcommerceButtons';
import CrownIcon from './icons/CrownIcon';
import UsersIcon from './icons/UsersIcon';
import ShareIcon from './icons/ShareIcon';

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
  imageUrl?: string; // Menyimpan URL gambar dari admin
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
}

interface SmartReviewProps {
    initialQuery?: string;
    initialResult?: ReviewResult | null;
    clearGlobalResult: () => void;
    onCompare?: (phoneName: string) => void;
}

// Utility to format brand names correctly
const formatBrandName = (name: string): string => {
    if (!name) return name;
    return name.replace(/iqoo/gi, 'iQOO');
};

const SmartReview: React.FC<SmartReviewProps> = ({ initialQuery = '', initialResult = null, clearGlobalResult, onCompare }) => {
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<ReviewResult | null>(initialResult);
    const [showFullReview, setShowFullReview] = useState(initialResult ? true : false);
    const [recentReviews, setRecentReviews] = useState<ReviewResult[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    // Fetch recent reviews from DB
    const fetchRecent = async () => {
        if (!supabase) return;
        setLoadingRecent(true);
        try {
            const { data } = await supabase
                .from('smart_reviews')
                .select('review_data')
                .order('created_at', { ascending: false })
                .limit(100); // Fetch more for pagination
            if (data) {
                setRecentReviews(data.map(d => d.review_data as ReviewResult));
            }
        } catch (err) {
            console.error("Failed to fetch recent reviews", err);
        } finally {
            setLoadingRecent(false);
        }
    };

    useEffect(() => {
        fetchRecent();
    }, []);

    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING, description: "Nama resmi lengkap HP (Contoh: Samsung Galaxy S24 Ultra)" },
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
                    rilis: { type: Type.STRING, description: "Wajib menyertakan nama bulan. Contoh: 'Januari 2025' atau 'Awal 2026 (Estimasi)'." }, brand: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }
                }
            },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar kategori pengguna yang paling cocok menggunakan HP ini." },
            accessoryAvailability: { type: Type.STRING },
            marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } }, required: ["indonesia"] },
            performance: {
                type: Type.OBJECT,
                properties: {
                    antutuScore: { type: Type.INTEGER },
                    geekbenchScore: { type: Type.STRING },
                    competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } },
                    gamingReview: { type: Type.STRING },
                    gamingRatings: {
                        type: Type.ARRAY,
                        description: "An array of gaming performance ratings for specific games.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                game: { type: Type.STRING, description: "Name of the game" },
                                score: { type: Type.NUMBER, description: "Rating score from 1 to 10" }
                            }
                        }
                    }
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
        setShowFullReview(false);

        const cacheKey = searchQuery.trim().toLowerCase();

        // 1. Cek database berdasarkan query user (pencarian cepat)
        if (supabase) {
            try {
                const { data } = await supabase.from('smart_reviews').select('review_data').eq('cache_key', cacheKey).single();
                if (data && data.review_data) {
                    const cachedReview = data.review_data as ReviewResult;
                    setReview(cachedReview);
                    setShowFullReview(true);
                    setLoading(false);
                    updateRecentList(cachedReview);
                    await supabase.from('smart_reviews').update({ created_at: new Date().toISOString() }).eq('cache_key', cacheKey);
                    return;
                }
            } catch (cacheError) {
                console.warn("Supabase initial cache check missed.");
            }
        }

        const prompt = `**Peran:** Anda adalah Ahli Teknologi Senior & Reviewer Gadget tingkat dunia.
**Tugas:** Lakukan ulasan mendalam untuk smartphone yang dimaksud user: '${searchQuery}'. 
**PENTING:** Identifikasi dengan tepat HP apa yang dimaksud user (misal: "S24 Ultra" adalah "Samsung Galaxy S24 Ultra").
**Ketentuan Khusus:**
1. Berikan nama resmi lengkap HP di field 'phoneName'.
2. Berikan ringkasan (summary) yang panjang (minimal 3 paragraf), teknis namun mudah dimengerti.
3. Gunakan data terbaru dari GSMArena atau PhoneArena (hingga awal 2026).
4. Data 'rilis' WAJIB menyertakan nama bulan.
5. Brand 'iQOO' harus selalu ditulis 'iQOO'.
**Bahasa:** Bahasa Indonesia.`;

        try {
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt, 
                config: { 
                    responseMimeType: "application/json", 
                    responseSchema: schema as any 
                } 
            });
            const resultText = response.text.trim();
            const parsedResult: ReviewResult = JSON.parse(resultText);

            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setError(parsedResult.phoneName);
                setReview(null);
            } else {
                // 2. Cek database LAGI berdasarkan Nama Resmi dari AI (untuk mencegah duplikasi)
                const officialCacheKey = parsedResult.phoneName.toLowerCase().trim();
                
                if (supabase) {
                    const { data: existingData } = await supabase
                        .from('smart_reviews')
                        .select('review_data')
                        .eq('cache_key', officialCacheKey)
                        .single();

                    if (existingData) {
                        // Data sudah ada di DB dengan nama resmi ini, gunakan itu saja
                        const existingReview = existingData.review_data as ReviewResult;
                        setReview(existingReview);
                        setShowFullReview(true);
                        updateRecentList(existingReview);
                        await supabase.from('smart_reviews').update({ created_at: new Date().toISOString() }).eq('cache_key', officialCacheKey);
                        setLoading(false);
                        return;
                    }

                    // 3. Jika benar-benar baru, simpan ke database dengan cache_key nama resmi
                    try {
                        await supabase.from('smart_reviews').insert({ 
                            cache_key: officialCacheKey, 
                            review_data: parsedResult 
                        });
                        // Jika user mencari dengan nama tidak lengkap, simpan alias kueri juga (opsional, tapi bagus untuk akselerasi)
                        if (officialCacheKey !== cacheKey) {
                             await supabase.from('smart_reviews').insert({ 
                                cache_key: cacheKey, 
                                review_data: parsedResult 
                            }).catch(() => null); // Abaikan jika kueri user sudah ada
                        }
                    } catch (cacheError) {
                        console.warn("Supabase cache write failed:", cacheError);
                    }
                }
                
                setReview(parsedResult);
                setShowFullReview(true);
                updateRecentList(parsedResult);
            }
        } catch (e) {
            console.error(e);
            setError('Terjadi kesalahan AI. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const updateRecentList = (newReview: ReviewResult) => {
        setRecentReviews(prev => {
            const filtered = prev.filter(r => r.phoneName.toLowerCase() !== newReview.phoneName.toLowerCase());
            return [newReview, ...filtered];
        });
    };
    
    useEffect(() => {
        if(initialQuery && !initialResult) {
            performSearch(initialQuery);
        } else if (initialResult) {
            setReview(initialResult);
            setQuery(initialResult.phoneName);
            setShowFullReview(true);
            updateRecentList(initialResult);
        }
    }, [initialQuery, initialResult]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    const selectFromRecent = (rev: ReviewResult) => {
        setReview(rev);
        setShowFullReview(true);
        setQuery(rev.phoneName);
        updateRecentList(rev);
        if (supabase) {
            supabase.from('smart_reviews')
                .update({ created_at: new Date().toISOString() })
                .eq('cache_key', rev.phoneName.toLowerCase())
                .then();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 6);
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
                                placeholder="Contoh: Samsung S26 Ultra..."
                                className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-5 pr-14 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all duration-200 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[color:var(--accent1)] text-white flex items-center justify-center
                                           hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon className="w-5 h-5" />}
                            </button>
                        </form>
                    </>
                )}


                <div aria-live="polite">
                    {loading && !review && <ReviewSkeleton />}
                    {error && <div className="text-center text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    
                    {review && showFullReview && (
                        <ReviewResultDisplay 
                            review={review} 
                            onReset={() => { 
                                setReview(null); 
                                setQuery(''); 
                                clearGlobalResult();
                                setShowFullReview(false);
                                window.location.hash = 'review';
                            }} 
                        />
                    )}

                    { !review && !loading && recentReviews.length > 0 && (
                        <div className="mt-16 animate-fade-in">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                                <h2 className="text-xl font-bold text-slate-900 font-orbitron">Pencarian Review Pengguna Lainnya</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentReviews.slice(0, visibleCount).map((rev, idx) => (
                                    <RecentReviewCard 
                                        key={idx} 
                                        result={rev} 
                                        onSelect={() => selectFromRecent(rev)}
                                        onCompare={onCompare}
                                    />
                                ))}
                            </div>
                            {recentReviews.length > visibleCount && (
                                <div className="mt-12 text-center">
                                    <button 
                                        onClick={handleLoadMore}
                                        className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                    >
                                        Tampilkan Lebih Banyak
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
};

const ReviewSkeleton: FC = () => (
    <div className="glass p-5 md:p-6 text-left space-y-6 animate-pulse">
        <div className="w-full aspect-[2/1] bg-slate-200 rounded-lg"></div>
        <div className="h-7 bg-slate-200 rounded-md w-3/4 mx-auto mb-4"></div>
    </div>
);

const RecentReviewCard: FC<{ result: ReviewResult; onSelect: () => void; onCompare?: (name: string) => void }> = ({ result, onSelect, onCompare }) => {
    return (
        <div className="bg-[#141426] rounded-2xl p-5 shadow-lg border border-white/5 flex flex-col h-full hover:scale-[1.02] transition-transform duration-300 group">
            <div className="flex gap-4 mb-4">
                {result.imageUrl ? (
                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 p-1 flex items-center justify-center">
                        <img src={result.imageUrl} alt={result.phoneName} className="max-w-full max-h-full object-contain" />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center">
                         <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">No Image</span>
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-yellow-400 transition-colors truncate">{formatBrandName(result.phoneName)}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Rilis: {result.specs?.rilis || 'N/A'}</p>
                </div>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-3">
                <SpecItemSmall label="CPU" value={result.specs?.processor} />
                <SpecItemSmall label="AnTuTu" value={result.performance?.antutuScore?.toLocaleString('id-ID')} />
            </div>
            
            <div className="mb-4 mt-auto">
                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/10 w-full text-center">
                    <span className="text-yellow-400 font-black text-sm">{result.marketPrice?.indonesia || 'Rp -'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={onSelect} className="px-3 py-2.5 rounded-xl bg-white text-[#141426] font-black text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-all">Detail</button>
                <button onClick={() => onCompare ? onCompare(result.phoneName) : (window.location.hash = 'battle')} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-black text-[10px] uppercase tracking-wider hover:bg-white/20 transition-all">Compare</button>
            </div>
        </div>
    );
};

const SpecItemSmall: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{label}</span>
            <span className="text-[11px] text-slate-300 font-bold truncate leading-tight">{value}</span>
        </div>
    );
};

const ReviewResultDisplay: FC<{ review: ReviewResult; onReset: () => void; }> = ({ review, onReset }) => {
    const [activeTab, setActiveTab] = useState('ringkasan');
    const [copyStatus, setCopyStatus] = useState('');
    const priceDisplay = review.marketPrice?.indonesia || 'Rp -';

    const shareUrl = `${window.location.origin}/#review/${encodeURIComponent(review.phoneName.replace(/\s+/g, '-'))}`;
    const shareText = `Baca Smart Review lengkap ${review.phoneName} di JAGO-HP!\n\n${shareUrl}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopyStatus('Tautan disalin!');
            setTimeout(() => setCopyStatus(''), 2000);
        });
    };

    return (
        <div className="glass p-4 md:p-8 text-left animate-fade-in shadow-xl">
            {/* Header Action Row */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onReset} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    &larr; Kembali
                </button>
                <div className="flex items-center gap-2">
                    {copyStatus && <span className="text-[10px] font-bold text-green-600 animate-pulse">{copyStatus}</span>}
                    <button 
                        onClick={handleCopyLink}
                        className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                        title="Salin Tautan Review"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                    </button>
                    <a 
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Bagikan ke WhatsApp"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                        </svg>
                    </a>
                </div>
            </div>

            <div className="flex flex-col items-center mb-8">
                {review.imageUrl && (
                    <img 
                        src={review.imageUrl} 
                        alt={review.phoneName} 
                        className="w-full max-w-sm h-auto object-contain mb-6 drop-shadow-2xl" 
                    />
                )}
                <h2 className="text-2xl md:text-4xl font-bold text-center text-slate-900 font-orbitron">{formatBrandName(review.phoneName)}</h2>
                <p className="text-center text-sm font-semibold text-slate-500 mt-2">{review.specs.rilis ? `Resmi Rilis: ${review.specs.rilis}` : ''}</p>
            </div>
            
            <div className="mb-10 flex justify-center">
                <div className="flex flex-col items-center px-8 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Estimasi Harga Pasar</span>
                    <span className="text-2xl font-black text-yellow-400">{priceDisplay}</span>
                </div>
            </div>

            {review.ratings && <RatingsDisplay ratings={review.ratings} />}
            
            <div className="mt-10 flex bg-slate-100 p-1.5 rounded-2xl">
                {['ringkasan', 'performa', 'foto-video'].map(id => (
                    <button 
                        key={id} 
                        onClick={() => setActiveTab(id)} 
                        className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all uppercase tracking-wider ${activeTab === id ? 'bg-slate-900 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {id.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="pt-8 min-h-[300px]">
                {activeTab === 'ringkasan' && <TabContentRingkasan review={review} />}
                {activeTab === 'performa' && <TabContentPerforma review={review} />}
                {activeTab === 'foto-video' && <TabContentCamera review={review} />}
            </div>
            
            {/* Bagikan Review Section */}
            <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                <h3 className="font-bold text-slate-800 mb-2">Suka dengan Review Ini?</h3>
                <p className="text-sm text-slate-500 mb-6">Bagikan ke teman atau simpan tautannya untuk referensi nanti.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-3 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        Bagikan ke WhatsApp
                    </a>
                    <button 
                        onClick={handleCopyLink}
                        className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Salin Tautan Review
                    </button>
                </div>
            </div>

            <div className="mt-10 space-y-6">
                <EcommerceButtons phoneName={review.phoneName} />
                <div className="text-center">
                    <button onClick={onReset} className="px-8 py-3 rounded-xl text-sm bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-all">Kembali Cari HP Lain</button>
                </div>
            </div>
        </div>
    );
};

// Fix for type errors in RatingsDisplay by casting Object.entries values to number.
const RatingsDisplay: FC<{ ratings: Ratings }> = ({ ratings }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-y border-slate-200 py-8">
        {(Object.entries(ratings) as [string, number][]).map(([key, score]) => (
            <div key={key} className="flex flex-col">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{key.replace(/([A-Z])/g, ' $1')}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-3xl text-slate-900">{score.toFixed(1)}</span>
                    <span className="text-sm text-slate-400 font-bold">/ 10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${score * 10}%` }}></div>
                </div>
            </div>
        ))}
    </div>
);

const TabContentRingkasan: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[color:var(--accent1)] rounded-full"></span>
                Ringkasan AI Komprehensif
            </h3>
            <p className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap">{review.quickReview.summary}</p>
        </div>

        {review.targetAudience && review.targetAudience.length > 0 && (
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-slate-400" />
                    Cocok Untuk Siapa?
                </h3>
                <div className="flex flex-wrap gap-2">
                    {review.targetAudience.map((audience, idx) => (
                        <span key={idx} className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm font-semibold shadow-sm">
                            {audience}
                        </span>
                    ))}
                </div>
            </div>
        )}
        
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

        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Spesifikasi Kunci</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(review.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                        <span className="text-slate-500 font-medium capitalize">{k}</span>
                        <span className="font-bold text-slate-800 text-right ml-4">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const TabContentPerforma: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass p-6 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AnTuTu v10 Score</p>
                <p className="text-3xl font-black text-slate-900">{review.performance?.antutuScore?.toLocaleString('id-ID') || 'N/A'}</p>
            </div>
            <div className="glass p-6 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Geekbench 6 (Multi)</p>
                <p className="text-3xl font-black text-slate-900">{review.performance?.geekbenchScore || 'N/A'}</p>
            </div>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Analisis Gaming</h3>
            <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                <p className="text-slate-600 leading-relaxed">{review.performance?.gamingReview || 'Data performa gaming tidak tersedia.'}</p>
            </div>
        </div>
    </div>
);

const TabContentCamera: FC<{ review: ReviewResult }> = ({ review }) => (
    <div className="space-y-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Penilaian Kamera</h3>
                {review.cameraAssessment?.dxomarkScore && (
                    <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold">
                        DXOMark: {review.cameraAssessment.dxomarkScore}
                    </div>
                )}
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
