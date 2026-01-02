
import React, { useState, useMemo, FC, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import { ReviewResult } from './SmartReview';
import { BattleResult } from './PhoneBattle';
import VersusIcon from './icons/VersusIcon';
import CrownIcon from './icons/CrownIcon';
import PreviewCard from './PreviewCard';
import EcommerceButtons from './EcommerceButtons';
import SparklesIcon from './icons/SparklesIcon';
import BatteryIcon from './icons/BatteryIcon';
import InstagramIcon from './icons/InstagramIcon';
import HeartIcon from './icons/HeartIcon';
import EyeIcon from './icons/EyeIcon';
import ChatBubbleLeftEllipsisIcon from './icons/ChatBubbleLeftEllipsisIcon';
import ShareIcon from './icons/ShareIcon';
import ChartBarIcon from './icons/ChartBarIcon';

interface QuickMatchResult {
  phoneName: string;
  reason: string;
  specs: {
    processor: string;
    ram: string;
    camera: string;
    battery: string;
  };
  estimatedPrice: string;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  published_at: string;
  image_url: string;
  status: 'published' | 'draft' | 'trashed';
  blog_categories: { name: string }[];
  view_count: number;
  comments: { count: number }[];
  sort_order?: number;
}


interface HeroProps {
  setPage: (page: string) => void;
  openChat: () => void;
  navigateToFullReview: (result: ReviewResult) => void;
  navigateToFullBattle: (result: BattleResult) => void;
  navigateToReviewWithQuery: (phoneName: string) => void;
  navigateToBlogPost: (post: BlogPost) => void;
  persistentQuickReviewResult: ReviewResult | null;
  onSetPersistentQuickReviewResult: (result: ReviewResult | null) => void;
  onOpenDonationModal: () => void;
}

// --- Share Popup Component ---
const CardSharePopup: FC<{ post: BlogPost; onClose: () => void }> = ({ post, onClose }) => {
    const [copyStatus, setCopyStatus] = useState('');
    const popupRef = useRef<HTMLDivElement>(null);
    
    const postUrl = `${window.location.origin}/#blog/${post.slug}`;
    const shareTextWhatsapp = `*${post.title}*\n\nBaca selengkapnya di JAGO-HP:\n${postUrl}`;
    const shareTextSocial = `Postingan keren dari JAGO-HP: "${post.title}"\n\n#jagohp #rekomendasihp #gadget #reviewhp\n\nBaca selengkapnya di ${postUrl}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(`${label} disalin!`);
            setTimeout(() => {
                setCopyStatus('');
                onClose();
            }, 1500);
        });
    };

    return (
        <div ref={popupRef} className="absolute bottom-full mb-3 right-0 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 p-2 z-[60] animate-fade-in-up">
            {copyStatus ? (
                <div className="py-8 text-center text-sm font-bold text-green-600 animate-pulse">
                    {copyStatus}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Bagikan Ke:</p>
                    <a 
                        href={`https://wa.me/?text=${encodeURIComponent(shareTextWhatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 text-slate-700 transition-colors"
                    >
                        <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center text-white">
                           <span className="text-[10px] font-bold">WA</span>
                        </div>
                        <span className="text-xs font-semibold">WhatsApp</span>
                    </a>
                    <button 
                        onClick={() => copyToClipboard(shareTextSocial, 'Teks IG')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-slate-700 transition-colors text-left"
                    >
                        <div className="w-6 h-6 bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 rounded-md flex items-center justify-center text-white">
                           <span className="text-[10px] font-bold">IG</span>
                        </div>
                        <span className="text-xs font-semibold">Instagram</span>
                    </button>
                    <button 
                        onClick={() => copyToClipboard(shareTextSocial, 'Teks TikTok')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors text-left"
                    >
                        <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white">
                           <span className="text-[10px] font-bold">TT</span>
                        </div>
                        <span className="text-xs font-semibold">TikTok</span>
                    </button>
                    <button 
                        onClick={() => copyToClipboard(postUrl, 'Tautan')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 transition-colors text-left border-t border-slate-100 mt-1"
                    >
                        <div className="w-6 h-6 bg-slate-400 rounded-md flex items-center justify-center text-white">
                           <span className="text-[10px]">🔗</span>
                        </div>
                        <span className="text-xs font-semibold">Salin Tautan</span>
                    </button>
                </div>
            )}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

const HorizontalBlogCard: FC<{ post: BlogPost; navigateToBlogPost: (post: BlogPost) => void; }> = ({ post, navigateToBlogPost }) => {
    const [showShare, setShowShare] = useState(false);

    return (
        <div className="glass flex flex-col md:flex-row group transition-shadow duration-300 hover:shadow-xl animate-fade-in relative">
            <div className="md:w-2/5 xl:w-1/3 flex-shrink-0">
                <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-48 md:h-full object-cover rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl group-hover:scale-105 transition-transform duration-300" 
                />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {post.blog_categories && post.blog_categories.length > 0 ? (
                            post.blog_categories.map(cat => (
                                <div key={cat.name} className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                                    {cat.name}
                                </div>
                            ))
                        ) : (
                            <div className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                                Umum
                            </div>
                        )}
                    </div>
                    <h4 className="font-bold text-xl text-slate-800 leading-tight group-hover:text-[color:var(--accent1)] transition-colors">{post.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3">{post.excerpt}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                        <button
                            type="button"
                            onClick={() => navigateToBlogPost(post)}
                            className="inline-block px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md"
                        >
                            Baca Selengkapnya
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowShare(!showShare)}
                            className={`p-2 rounded-lg transition-all duration-200 ${showShare ? 'bg-[color:var(--accent1)] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                            title="Bagikan postingan"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        {showShare && <CardSharePopup post={post} onClose={() => setShowShare(false)} />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1" title="Dilihat">
                            <EyeIcon className="w-4 h-4" />
                            <span>{post.view_count?.toLocaleString('id-ID') || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Komentar">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                            <span>{post.comments?.[0]?.count ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BlogCard: FC<{ post: BlogPost; navigateToBlogPost: (post: BlogPost) => void; }> = ({ post, navigateToBlogPost }) => {
    const [showShare, setShowShare] = useState(false);

    return (
        <div className="w-full text-left glass animate-fade-in group transition-shadow duration-300 hover:shadow-xl flex flex-col relative">
            <div className="flex-grow">
                <div className="relative">
                    <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {post.blog_categories && post.blog_categories.length > 0 ? (
                            post.blog_categories.map(cat => (
                                <div key={cat.name} className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                                    {cat.name}
                                </div>
                            ))
                        ) : (
                            <div className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                                Umum
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    <h4 className="font-bold text-slate-800 leading-tight group-hover:text-[color:var(--accent1)] transition-colors">{post.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{post.excerpt}</p>
                </div>
            </div>
            <div className="p-4 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2 relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigateToBlogPost(post); }}
                        className="inline-block px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md"
                    >
                        Baca Selengkapnya
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowShare(!showShare); }}
                        className={`p-2 rounded-lg transition-all duration-200 ${showShare ? 'bg-[color:var(--accent1)] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        title="Bagikan postingan"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    {showShare && <CardSharePopup post={post} onClose={() => setShowShare(false)} />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1" title="Dilihat">
                        <EyeIcon className="w-4 h-4" />
                        <span>{post.view_count?.toLocaleString('id-ID') || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Komentar">
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        <span>{post.comments?.[0]?.count ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Hero: React.FC<HeroProps> = ({ setPage, openChat, navigateToFullReview, navigateToFullBattle, navigateToReviewWithQuery, navigateToBlogPost, persistentQuickReviewResult, onSetPersistentQuickReviewResult, onOpenDonationModal }) => {
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  
  const [comparePhoneA, setComparePhoneA] = useState('');
  const [comparePhoneB, setComparePhoneB] = useState('');
  const [battleModeLoading, setBattleModeLoading] = useState<'compare' | 'battle' | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);
  const [battleData, setBattleData] = useState<BattleResult | null>(null);

  const [quickMatchBudget, setQuickMatchBudget] = useState<string | null>(null);
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [quickMatchError, setQuickMatchError] = useState<string | null>(null);
  const [quickMatchResult, setQuickMatchResult] = useState<QuickMatchResult | null>(null);

  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);
  
  useEffect(() => {
    const fetchRecentPosts = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, blog_post_categories(blog_categories(name)), comments(count)')
          .eq('status', 'published') // Only fetch published posts
          .order('sort_order', { ascending: true }) // Manual sort first
          .order('published_at', { ascending: false }) // Then latest
          .limit(5); // Fetch 5 latest posts

        if (error) {
            console.error("Supabase error fetching posts:", error.message || error);
            return;
        }

        if (data) {
          // Transform junction table structure to flattened blog_categories for UI
          const transformed = data.map((p: any) => ({
            ...p,
            blog_categories: p.blog_post_categories?.map((bpc: any) => bpc.blog_categories) || []
          }));
          setRecentPosts(transformed as any);
        }
      } catch (err: any) {
        console.error("Unexpected error fetching recent posts:", err.message || err);
      }
    };
    fetchRecentPosts();
  }, []);

  const handleReviewSearch = async () => {
    if (!reviewQuery.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    onSetPersistentQuickReviewResult(null);

    const cacheKey = reviewQuery.trim().toLowerCase();

    if (supabase) {
      try {
        const { data } = await supabase
          .from('quick_reviews')
          .select('review_data')
          .eq('phone_name_query', cacheKey)
          .single();
        if (data && data.review_data) {
          onSetPersistentQuickReviewResult(data.review_data as ReviewResult);
          setReviewLoading(false);
          return;
        }
      } catch (cacheError) {
        console.warn("Supabase quick review cache check failed:", cacheError);
      }
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING },
            ratings: { type: Type.OBJECT, properties: { gaming: { type: Type.NUMBER }, kamera: { type: Type.NUMBER }, baterai: { type: Type.NUMBER }, layarDesain: { type: Type.NUMBER }, performa: { type: Type.NUMBER }, storageRam: { type: Type.NUMBER }}},
            quickReview: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
            specs: { type: Type.OBJECT, properties: { rilis: { type: Type.STRING }, brand: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }}},
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessoryAvailability: { type: Type.STRING },
            marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING, description: "CRITICAL: HARGA RUPIAH WAJIB ADA. JANGAN KOSONG/TBA. Jika HP belum rilis resmi, WAJIB ESTIMASI konversi kurs + pajak (Format: Rp X.XXX.XXX)." }, global: { type: Type.STRING } }, required: ["indonesia"] },
            performance: { type: Type.OBJECT, properties: { antutuScore: { type: Type.INTEGER }, geekbenchScore: { type: Type.STRING }, competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } }, gamingReview: { type: Type.STRING }, gamingRatings: { type: Type.ARRAY, description: "An array of gaming performance ratings for specific games.", items: { type: Type.OBJECT, properties: { game: { type: Type.STRING, description: "Name of the game, one of [PUBG Battlegrounds, COD Warzone, Mobile Legends, Genshin Impact, Real Racing 3]" }, score: { type: Type.NUMBER, description: "Rating score from 1 to 10 for the game." } } } } }},
            cameraAssessment: { type: Type.OBJECT, properties: { dxomarkScore: { type: Type.INTEGER }, photoSummary: { type: Type.STRING }, photoPros: { type: Type.ARRAY, items: { type: Type.STRING } }, photoCons: { type: Type.ARRAY, items: { type: Type.STRING } }, videoSummary: { type: Type.STRING }}}
        },
    };
    const prompt = `**Context: Cache Check**
- My system has already checked its database for an existing review for '${reviewQuery}'.
- A new review is required because no valid cached entry was found.
---
**Core Role: Comprehensive Data Synthesizer for JAGO-HP**
Your task is to act as an AI Gadget Reviewer and generate a comprehensive review in **Bahasa Indonesia** for the gadget: '${reviewQuery}'.

**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Data Sourcing Mandate:** Your primary objective is to find and synthesize smartphone data from the **entire public internet**. You are not limited to specific sites.
- **CRITICAL RULE: NEVER FAIL A SEARCH.** You are **STRICTLY FORBIDDEN** from claiming a device "is not found" or that "data is unavailable". If official specifications are not public, you **MUST** synthesize a response based on credible rumors, leaks, official announcements, and industry analysis. For unreleased phones (e.g., 'iPhone 17 Pro Max', 'Samsung S25 Ultra'), provide the most likely rumored specifications.
- **Reliable Source Examples:** Use reputable tech sites as your primary information pool. Examples include (but are not limited to):
    - **GSMArena** (For Apple devices, start your search here: https://www.gsmarena.com/apple-phones-48.php)
    - **Phone Arena**
    - **AnandTech**
    - **nanoreview.net**
    - Official brand websites (Samsung.com, Apple.com, etc.)
    - Reputable leakers and tech news outlets.
- **Data Synthesis:** If sources conflict, use your judgment to present the most plausible and widely reported specification.

**Execution Steps & Formatting Rules (VERY IMPORTANT):**
1.  **Identify Gadget:** Find the official product based on the user's query ('${reviewQuery}').
2.  **Extract & Synthesize Data:** Use the specified sources to gather the most accurate, final data.
3.  **Handle Missing Data:** Use \`null\` for numeric fields or "N/A" for strings if data is genuinely unavailable after checking all sources.
4.  **Populate JSON:** Fill all fields according to the schema with the following formatting constraints:
    -   \`ratings\`: Each category **MUST** be rated on a scale of 1 to 10 based on final product performance.
    -   \`gamingRatings\`: Provide a 1-10 score for each of these specific games: 'PUBG Battlegrounds', 'COD Warzone', 'Mobile Legends', 'Genshin Impact', 'Real Racing 3'. The score should reflect performance (FPS, stability, graphics settings). If performance data for a specific game is genuinely not available, omit it from the array.
    -   \`quickReview.summary\`: MUST be a single, concise sentence (maximum 1-2 short sentences).
    -   \`specs.ram\`: Format: "[Size] [Type]". Example: "8GB LPDDR5", "12GB LPDDR5X".
    -   \`specs.camera\`: A short summary of main lenses. Example: "Utama: 200MP + 50MP", "50MP Wide + 12MP Ultrawide".
    -   \`specs.battery\`: Just the capacity. Example: "5000 mAh".
5.  **Failure Conditions:** The only failure is if a device is truly fictional and unmentioned anywhere. Otherwise, you must provide data.

**Final Output:** Strictly adhere to the JSON schema and all formatting rules.`;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const parsedResult: ReviewResult = JSON.parse(response.text.trim());
        if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
            setReviewError(parsedResult.phoneName);
        } else {
            onSetPersistentQuickReviewResult(parsedResult);
            if (supabase) {
              try {
                await supabase.from('quick_reviews').insert({
                  phone_name_query: cacheKey,
                  review_data: parsedResult,
                });
              } catch (cacheError) {
                console.warn("Supabase quick review cache write failed:", cacheError);
              }
            }
        }
    } catch (e: any) {
        console.error(e.message || e);
        setReviewError('An AI error occurred. Please try again.');
    } finally {
        setReviewLoading(false);
    }
  };
  
  const handleCompareAction = async (mode: 'compare' | 'battle') => {
    if (!comparePhoneA.trim() || !comparePhoneB.trim()) return;
    setBattleModeLoading(mode);
    setBattleError(null);
    setBattleData(null);

    const phoneNames = [comparePhoneA, comparePhoneB];
    const phoneList = phoneNames.map(name => `"${name}"`).join(' vs ');
    const cacheKey = [mode, ...phoneNames.map(name => name.trim().toLowerCase()).sort()].join('_vs_');

    if (supabase) {
      try {
        const { data } = await supabase.from('quick_compare').select('compare_data').eq('cache_key', cacheKey).single();
        if (data && data.compare_data) {
          setBattleData(data.compare_data as BattleResult);
          setBattleModeLoading(null);
          return;
        }
      } catch (cacheError) {
        console.warn("Supabase quick compare cache check failed:", cacheError);
      }
    }
    
    const phoneSpecProperties = {
        rilis: { type: Type.STRING }, os: { type: Type.STRING }, processor: { type: Type.STRING },
        ram: { type: Type.STRING, description: "Ukuran dan tipe RAM. Contoh: '8GB LPDDR5'" },
        antutuScore: { type: Type.INTEGER, description: "Skor AnTuTu v10. Jika tidak tersedia, kembalikan null." },
        jaringan: { type: Type.STRING }, display: { type: Type.STRING }, camera: { type: Type.STRING }, 
        battery: { type: Type.STRING }, charging: { type: Type.STRING }, nfc: { type: Type.STRING },
        hargaIndonesia: { type: Type.STRING, description: "Perkiraan harga pasar di Indonesia dalam Rupiah. Contoh: 'Rp 4.599.000'" },
    };

    const baseSchemaProperties = {
        phones: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, specs: { type: Type.OBJECT, properties: phoneSpecProperties }}, required: ["name", "specs"]}},
    };

    const battleSchemaProperties = {
        ...baseSchemaProperties,
        battleSummary: { type: Type.STRING, description: "SATU paragraf SANGAT RINGKAS (maksimal 2-3 kalimat) perbandingan umum, dalam Bahasa Indonesia." },
        winnerName: { type: Type.STRING, description: "Nama resmi pemenang. Jika seri, isi 'Seri'. Jika tidak ada pemenang, biarkan kosong." }
    };

    const schema = mode === 'battle' 
        ? { type: Type.OBJECT, properties: battleSchemaProperties, required: ['battleSummary', 'phones', 'winnerName'] }
        : { type: Type.OBJECT, properties: baseSchemaProperties, required: ['phones'] };
    
    const basePrompt = `**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Data Sourcing Mandate:** Your primary objective is to find and synthesize smartphone data from the **entire public internet**. You are not limited to specific sites.
- **CRITICAL RULE: NEVER FAIL A SEARCH.** You are **STRICTLY FORBIDDEN** from claiming a device "is not found" or that "data is unavailable". If official specifications are not public, you **MUST** synthesize a response based on credible rumors, leaks, official announcements, and industry analysis. For unreleased phones (e.g., 'iPhone 17 Pro Max', 'Samsung S25 Ultra'), provide the most likely rumored specifications.
- **Reliable Source Examples:** Use reputable tech sites as your primary information pool. Examples include (but are not limited to):
    - **GSMArena** (For Apple devices, start your search here: https://www.gsmarena.com/apple-phones-48.php)
    - **Phone Arena**
    - **AnandTech**
    - **nanoreview.net**
    - Official brand websites (Samsung.com, Apple.com, etc.)
    - Reputable leakers and tech news outlets.
- **Data Synthesis:** If sources conflict, use your judgment to present the most plausible and widely reported specification.`;

    const battlePrompt = `**Context: Cache Check**
- My system has checked its database for an existing comparison of: ${phoneList}.
- A new analysis is required as no valid cache was found.
---
**Core Role: AI Battle Analyst for JAGO-HP**
Your task is to perform a detailed comparison in **Bahasa Indonesia** between: ${phoneList}.
${basePrompt}
**Execution:**
1. **Identify & Verify:** Find the official devices from any reliable source.
2. **Synthesize Data:** Extract and synthesize the final specification data.
3. **Analyze & Decide:** Perform a holistic analysis to determine a winner.
4. **Summarize:** Write a brief, insightful summary of the battle.
**Final Output:** Strictly adhere to the JSON schema, ensuring 'winnerName' and 'battleSummary' are populated.`;

    const comparePrompt = `**Context: Cache Check**
- My system has checked its database for an existing comparison of: ${phoneList}.
- A new analysis is required as no valid cache was found.
---
**Core Role: Data Extractor for JAGO-HP**
Your task is to extract key specifications in **Bahasa Indonesia** for: ${phoneList}.
${basePrompt}
**Execution:**
1. **Identify & Verify:** Find the official devices from any reliable source.
2. **Extract Data:** Your ONLY job is to return the raw specification data for the 'phones' object. You MUST NOT provide any summary, analysis, or winner.
**Final Output:** Strictly adhere to the JSON schema.`;

    const prompt = mode === 'battle' ? battlePrompt : comparePrompt;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema as any }});
        const parsedResult: BattleResult = JSON.parse(response.text.trim());
        setBattleData(parsedResult);
        if (supabase) {
          try {
            await supabase.from('quick_compare').insert({
              cache_key: cacheKey,
              compare_data: parsedResult,
            });
          } catch (cacheError) {
            console.warn("Supabase quick compare cache check failed:", cacheError);
          }
        }
    } catch (e: any) {
        console.error(e.message || e);
        setBattleError('An AI error occurred during comparison. Please try again.');
    } finally {
        setBattleModeLoading(null);
    }
  };

  const handleQuickMatch = async (budget: string) => {
    if (quickMatchLoading) return;
    setQuickMatchBudget(budget);
    setQuickMatchLoading(true);
    setQuickMatchError(null);
    setQuickMatchResult(null);

    const cacheKey = `quick_match_${budget.toLowerCase().replace(/\s+/g, '_')}`;
    if (supabase) {
        try {
            const { data } = await supabase
                .from('quick_match_cache')
                .select('result_data')
                .eq('cache_key', cacheKey)
                .single();
            if (data && data.result_data) {
                setQuickMatchResult(data.result_data as QuickMatchResult);
                setQuickMatchLoading(false);
                return;
            }
        } catch (cacheError) {
            console.warn("Supabase quick match cache check failed:", cacheError);
        }
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            phoneName: { type: Type.STRING },
            reason: { type: Type.STRING },
            specs: {
                type: Type.OBJECT,
                properties: {
                    processor: { type: Type.STRING },
                    ram: { type: Type.STRING },
                    camera: { type: Type.STRING },
                    battery: { type: Type.STRING },
                }
            },
            estimatedPrice: { type: Type.STRING },
        },
        required: ["phoneName", "reason", "specs", "estimatedPrice"]
    };

    const prompt = `**Context: Cache Check**
- My system has checked for a cached recommendation for the budget: **${budget}**.
- A new recommendation is needed because no valid entry was found.
---
**Peran Anda:** Ahli Rekomendasi Gadget untuk pasar Indonesia.
**Tugas:** Berdasarkan budget **${budget}**, berikan **SATU** rekomendasi smartphone **all-rounder** terbaik. All-rounder berarti seimbang antara performa, kamera, dan baterai untuk harganya.
    
**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Data Sourcing Mandate:** Your primary objective is to find and synthesize smartphone data from the **entire public internet**. You are not limited to specific sites.
- **CRITICAL RULE: NEVER FAIL A SEARCH.** You are **STRICTLY FORBIDDEN** from claiming a device "is not found" or that "data is unavailable". If official specifications are not public, you **MUST** synthesize a response based on credible rumors, leaks, official announcements, and industry analysis. For unreleased phones (e.g., 'iPhone 17 Pro Max', 'Samsung S25 Ultra'), provide the most likely rumored specifications.
- **Reliable Source Examples:** Use reputable tech sites as your primary information pool. Examples include (but are not limited to):
    - **GSMArena** (For Apple devices, start your search here: https://www.gsmarena.com/apple-phones-48.php)
    - **Phone Arena**
    - **AnandTech**
    - **nanoreview.net**
    - Official brand websites (Samsung.com, Apple.com, etc.)
    - Reputable leakers and tech news outlets.
- **Data Synthesis:** If sources conflict, use your judgment to present the most plausible and widely reported specification.

**Output:** Berikan jawaban dalam format JSON sesuai skema. 'reason' harus sangat singkat (1 kalimat).`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema as any }});
        const parsedResult: QuickMatchResult = JSON.parse(response.text.trim());
        setQuickMatchResult(parsedResult);
        if (supabase) {
            try {
                await supabase.from('quick_match_cache').insert({
                    cache_key: cacheKey,
                    result_data: parsedResult
                });
            } catch (cacheError) {
                console.warn("Supabase quick match cache write failed:", cacheError);
            }
        }
    } catch (e: any) {
        console.error(e.message || e);
        setQuickMatchError("Gagal mendapatkan rekomendasi. Coba lagi.");
    } finally {
        setQuickMatchLoading(false);
    }
  };
  
  const latestPost = recentPosts[0] || null;
  const otherRecentPosts = recentPosts.slice(1);

  return (
    <>
      <section className="pb-10">
        <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* LEFT: CONTENT & INTERACTION */}
                <div className="md:col-span-7 space-y-8 flex flex-col h-full">
                    <div>
                    <div className="h-32">
                        <PhoneScreenDisplay 
                        latestPost={latestPost}
                        navigateToBlogPost={navigateToBlogPost}
                        setPage={setPage}
                        />
                    </div>
                    <div className="mt-6">
                        <button onClick={openChat} className="w-full px-5 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity shadow-md">Cari apa Kak? Tanya dulu aja sini</button>
                    </div>
                    </div>

                    {/* QUICK SMART REVIEW */}
                    <div className="space-y-4 md:space-y-0">
                        <div>
                            <label className="font-semibold text-slate-800 text-lg md:hidden">Quick Smart Review</label>
                            <div className="mt-2 flex gap-3 items-center">
                                <input value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReviewSearch()} className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" placeholder="Contoh: Samsung S25 Ultra..." />
                                <button onClick={handleReviewSearch} disabled={reviewLoading} className="px-4 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">{reviewLoading ? '...' : 'Review'}</button>
                            </div>
                            <div className="mt-2 text-sm small-muted md:hidden">Ketik model atau tipe HP</div>
                            {reviewLoading && <div className="text-center p-4 small-muted animate-pulse">Kami sedang mereview, mohon tunggu..</div>}
                            {reviewError && <div className="text-center p-4 text-red-500">{reviewError}</div>}
                            {persistentQuickReviewResult && (
                                <div className="md:hidden mt-4">
                                    <PreviewCard
                                        result={persistentQuickReviewResult}
                                        onSeeFull={() => navigateToFullReview(persistentQuickReviewResult)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Compare & RESULT */}
                    <div>
                        <div className="glass p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-800 text-lg">Quick Compare</h3>
                                <div className="text-sm small-muted">Bandingkan 2 HP tipe berbeda</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input id="cmpA" className="px-3 py-2.5 rounded-md bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" placeholder="Masukkan Tipe HP 1" value={comparePhoneA} onChange={(e) => setComparePhoneA(e.target.value)} />
                                <input id="cmpB" className="px-3 py-2.5 rounded-md bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" placeholder="Masukkan Tipe HP 2" value={comparePhoneB} onChange={(e) => setComparePhoneB(e.target.value)} />
                            </div>
                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => handleCompareAction('compare')} disabled={!!battleModeLoading} className="w-full px-4 py-2 rounded-lg text-sm border border-slate-400 text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50">
                                    {battleModeLoading === 'compare' ? 'Membandingkan...' : 'Compare'}
                                </button>
                                <button onClick={() => handleCompareAction('battle')} disabled={!!battleModeLoading} className="w-full px-4 py-2 rounded-lg text-sm bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {battleModeLoading === 'battle' ? 'Membandingkan...' : 'Battle Mode'}
                                </button>
                            </div>
                        </div>
                        {battleModeLoading && <div className="text-center p-4 small-muted animate-pulse">Kami sedang membandingkan, mohon tunggu..</div>}
                        {battleError && <div className="text-center p-4 text-red-500">{battleError}</div>}
                        {battleData && <div className="md:hidden mt-4"><BattleSnippet result={battleData} onSeeFull={() => navigateToFullBattle(battleData)} /></div>}
                    </div>

                    {/* Quick Phone Match & RESULT */}
                    <div className="mt-auto">
                        <QuickPhoneMatch
                            options={["1 Jutaan", "2 Jutaan", "3 Jutaan", "Diatas 4 Juta"]}
                            selectedBudget={quickMatchBudget}
                            onSelectBudget={handleQuickMatch}
                            loading={quickMatchLoading}
                        />
                        {quickMatchLoading && <div className="text-center p-4 small-muted animate-pulse">Mencari HP terbaik untukmu...</div>}
                        {quickMatchError && <div className="text-center p-4 text-red-500">{quickMatchError}</div>}
                        {quickMatchResult && (
                            <div className="mt-4 md:self-start md:w-full">
                                <QuickMatchResultCard result={quickMatchResult} onSeeFull={() => navigateToReviewWithQuery(quickMatchResult.phoneName)} />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: LEADERBOARDS & PREVIEW */}
                <div className="md:col-span-5 space-y-5 hidden md:flex flex-col h-full">
                    {persistentQuickReviewResult && (
                        <div>
                            <PreviewCard
                                result={persistentQuickReviewResult}
                                onSeeFull={() => navigateToFullReview(persistentQuickReviewResult)}
                            />
                        </div>
                    )}
                    
                    {latestPost && (
                       <div className="mt-auto h-full flex flex-col">
                          <BlogCard post={latestPost} navigateToBlogPost={navigateToBlogPost} />
                       </div>
                    )}
                </div>
            </div>
            
            {/* Desktop-only Full-Width Results Section */}
            {battleData && (
                <div className="hidden md:block mt-8">
                    <BattleSnippet result={battleData} onSeeFull={() => navigateToFullBattle(battleData)} />
                </div>
            )}
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="pb-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Mobile: Show all 5 recent posts */}
                <div className="space-y-6 md:hidden">
                    {recentPosts.map(post => (
                        <HorizontalBlogCard key={post.id} post={post} navigateToBlogPost={navigateToBlogPost} />
                    ))}
                </div>

                {/* Desktop: Show posts 2-5 (latest is in the sidebar) */}
                <div className="space-y-6 hidden md:block">
                    {otherRecentPosts.map(post => (
                        <HorizontalBlogCard key={post.id} post={post} navigateToBlogPost={navigateToBlogPost} />
                    ))}
                </div>

                <div className="text-center mt-8">
                    <button 
                        onClick={() => setPage('blog')}
                        className="px-6 py-2.5 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
                    >
                        Lihat Semua Blog
                    </button>
                </div>
            </div>
        </section>
      )}

      {/* Mobile Sticky Buttons: Top Brand & Donation */}
      <div className="md:hidden px-4 mt-8">
        <div className="grid grid-cols-2 gap-3">
            <button
                onClick={() => setPage('leaderboard')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
                <ChartBarIcon className="w-4 h-4" />
                <span>Top Brand</span>
            </button>
            <button
                onClick={onOpenDonationModal}
                className="px-4 py-2.5 rounded-xl bg-yellow-400/10 border border-yellow-500 text-yellow-600 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <HeartIcon className="w-4 h-4" />
                <span>Donasi</span>
            </button>
        </div>
      </div>

      {/* Mobile Quick Links Footer */}
      <div className="md:hidden px-6 mt-6 pb-4">
        <div className="border-t border-slate-200 pt-5 flex justify-center items-center gap-x-6 gap-y-2 flex-wrap">
          <a href="#faq" onClick={(e) => {e.preventDefault(); setPage('faq')}} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">FAQ</a>
          <a href="#partnership" onClick={(e) => {e.preventDefault(); setPage('partnership')}} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Partnership</a>
          <a href="#privacy" onClick={(e) => {e.preventDefault(); setPage('privacy')}} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Privacy Policy</a>
        </div>
      </div>
    </>
  );
};

// --- Snippet Components ---

const BattleSnippet: FC<{ result: BattleResult, onSeeFull: () => void }> = ({ result, onSeeFull }) => (
    <div className="glass p-4 animate-fade-in space-y-4">
        {result.battleSummary && (
             <p className="text-sm text-slate-600 leading-relaxed border-b border-slate-200 pb-3 mb-3">
                {result.battleSummary}
            </p>
        )}
        <div className="grid grid-cols-2 gap-2">
            {result.phones.map((phone, index) => {
                const isWinner = phone.name === result.winnerName;
                return (
                    <div key={index} className={`relative bg-slate-50 p-3 rounded-lg ${isWinner ? 'border border-[color:var(--accent1)]' : 'border border-slate-200'}`}>
                        {isWinner && <div className="absolute -top-3 right-2 bg-[color:var(--accent1)] text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><CrownIcon className="w-3 h-3"/>Pemenang</div>}
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{phone.name}</h4>
                        <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
                            <SpecItem label="CPU" value={phone.specs?.processor} />
                            <SpecItem label="Memori" value={phone.specs?.ram} />
                            <SpecItem label="Kamera" value={phone.specs?.camera} />
                            <SpecItem label="Baterai" value={phone.specs?.battery} />
                            <SpecItem label="Charging" value={phone.specs?.charging} />
                            <SpecItem label="NFC" value={phone.specs?.nfc} />
                            <SpecItem label="Harga" value={phone.specs?.hargaIndonesia} />
                        </dl>
                    </div>
                );
            })}
        </div>
        <button onClick={onSeeFull} className="w-full mt-2 px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors">Lihat Perbandingan Lengkap</button>
    </div>
);

const QuickPhoneMatch: FC<{
    options: string[];
    selectedBudget: string | null;
    onSelectBudget: (budget: string) => void;
    loading: boolean;
}> = ({ options, selectedBudget, onSelectBudget, loading }) => (
    <div className="glass p-6">
        <h3 className="font-semibold text-slate-800 text-lg mb-1">Quick Phone Match</h3>
        <p className="text-sm small-muted mb-4">Temukan HP All-Rounder terbaik sesuai budgetmu.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onSelectBudget(opt)}
                    disabled={loading}
                    className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-2 disabled:opacity-50
                        ${selectedBudget === opt
                            ? 'bg-[color:var(--accent1)]/10 border-[color:var(--accent1)] text-[color:var(--accent1)]'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const QuickMatchResultCard: FC<{ result: QuickMatchResult; onSeeFull: () => void }> = ({ result, onSeeFull }) => (
    <div className="glass p-4 animate-fade-in space-y-3">
        <h4 className="font-bold text-slate-800 text-lg">{result.phoneName}</h4>
        <p className="text-sm text-slate-500 font-semibold">{result.estimatedPrice}</p>
        <div className="my-2 p-3 bg-slate-100 border-l-4 border-[color:var(--accent1)] rounded-r-md">
            <p className="text-slate-600 text-sm leading-relaxed">{result.reason}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <SpecItem label="CPU" value={result.specs.processor} />
            <SpecItem label="RAM" value={result.specs.ram} />
            <SpecItem label="Kamera" value={result.specs.camera} />
            <SpecItem label="Baterai" value={result.specs.battery} />
        </dl>
        <EcommerceButtons phoneName={result.phoneName} isCompact={true} />
        <button
            onClick={onSeeFull}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
        >
            Lihat Review Lengkap
        </button>
    </div>
);

const SpecItem: FC<{ label: string; value: any }> = ({ label, value }) => value ? (<div className="flex justify-between gap-2"><dt className="font-normal text-slate-500 truncate">{label}</dt><dd className="font-medium text-slate-700 text-right truncate">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</dd></div>) : null;

const PhoneScreenDisplay: FC<{ latestPost: BlogPost | null; navigateToBlogPost: (post: BlogPost) => void; setPage: (page: string) => void; }> = ({ latestPost, navigateToBlogPost, setPage }) => {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️'; // Clear sky
    if ([1, 2].includes(code)) return '🌤️'; // Mainly clear, partly cloudy
    if (code === 3) return '☁️'; // Overcast
    if ([45, 48].includes(code)) return '🌫️'; // Fog
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️'; // Drizzle and Rain
    if ([56, 57, 66, 67].includes(code)) return '🥶'; // Freezing Drizzle & Rain
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️'; // Snow
    if ([95, 96, 99].includes(code)) return '⛈️'; // Thunderstorm
    return '🛰️'; // Default
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.21&longitude=106.85&current_weather=true');
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Weather API request failed with status ${response.status}: ${errorBody}`);
        }
        const data = await response.json();
        if (data && data.current_weather) {
          const { temperature, weathercode } = data.current_weather;
          setWeather({
            temp: `${Math.round(temperature)}°C`,
            icon: getWeatherIcon(weathercode),
          });
        } else {
            throw new Error('Invalid weather data format');
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error instanceof Error ? error.message : String(error));
      }
    };
    
    fetchWeather();

    const updateClock = () => {
      setTime(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
    };

    updateClock();
    const timerId = setInterval(updateClock, 30000);

    return () => clearInterval(timerId);
  }, []);

  const blogTitle = latestPost ? latestPost.title : 'Selamat Datang di JAGO-HP';
  const truncatedTitle = latestPost ? latestPost.title.split(' ').slice(0, 4).join(' ') + (latestPost.title.split(' ').length > 4 ? '...' : '') : 'Selamat Datang di JAGO-HP';
  const isClickable = !!latestPost;

  return (
    <>
      <style>{`
        @keyframes marquee-seamless {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container {
          width: 100%;
          overflow: hidden;
        }
        .marquee-wrapper {
          display: flex;
          width: 200%;
          animation: marquee-seamless 15s linear infinite;
          will-change: transform;
        }
        .marquee-content {
          width: 50%;
          white-space: nowrap;
          flex-shrink: 0;
          padding-right: 3rem; 
        }
        @media (min-width: 768px) {
            .marquee-wrapper {
                animation-duration: 20s;
            }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .phone-screen-effect {
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .phone-screen-effect::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.08) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            animation: shimmer 4s infinite linear;
        }
      `}</style>
      <div className="w-full h-full text-left p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-black text-white shadow-lg flex flex-col justify-between phone-screen-effect">
        {/* Status Bar */}
        <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
           <div className="flex items-center gap-2">
            <span>{time || '...'}</span>
            {weather && (
                <div className="flex items-center gap-1">
                    <span>{weather.icon}</span>
                    <span className="text-[11px]">{weather.temp}</span>
                </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">JAGO-Satelit</span>
            <span className="font-semibold text-[10px] tracking-wider">5G</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex items-end justify-between gap-4">
            {/* Left Side: Title & Tagline */}
            <div className="flex-1 overflow-hidden self-end">
                <h1 className="text-3xl font-bold font-orbitron">JAGO-HP</h1>
                 
                 {/* Unified Running Text for All Screens */}
                 <div className="mt-1 marquee-container">
                    <button 
                      onClick={() => isClickable && navigateToBlogPost(latestPost!)} 
                      className={`text-left w-full ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                      disabled={!isClickable}
                    >
                        <div className="marquee-wrapper">
                            <div className="marquee-content text-[11px] md:text-xs text-slate-300 group-hover:text-white transition-colors duration-200">
                                {latestPost && <span className="font-semibold bg-rose-600/90 px-1.5 py-0.5 rounded text-[10px] mr-2 tracking-wide align-middle">BARU</span>}
                                <span className="align-middle md:hidden">{truncatedTitle}</span>
                                <span className="align-middle hidden md:inline">{blogTitle}</span>
                            </div>
                            <div className="marquee-content text-[11px] md:text-xs text-slate-300 group-hover:text-white transition-colors duration-200" aria-hidden="true">
                                {latestPost && <span className="font-semibold bg-rose-600/90 px-1.5 py-0.5 rounded text-[10px] mr-2 tracking-wide align-middle">BARU</span>}
                                <span className="align-middle md:hidden">{truncatedTitle}</span>
                                <span className="align-middle hidden md:inline">{blogTitle}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
            
            {/* Right Side: Action Icons */}
            <div className="flex-shrink-0 self-end flex items-end gap-2">
                <button 
                    onClick={() => setPage('blog')}
                    className="px-3 py-1.5 rounded-lg text-[10px] bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/25 transition-colors"
                    title="Lihat semua blog"
                >
                    Blog
                </button>
                <a 
                    href="https://www.instagram.com/jagohp" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group"
                    title="@jagohp on Instagram"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 via-red-500 to-purple-600 p-0.5 group-hover:scale-105 transition-transform">
                        <div className="bg-slate-800 w-full h-full rounded-[6px] flex items-center justify-center">
                            <InstagramIcon className="w-5 h-5 text-white"/>
                        </div>
                    </div>
                </a>
            </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
