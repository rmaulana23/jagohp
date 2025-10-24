import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import { ReviewResult } from './SmartReview';
import { BattleResult } from './PhoneBattle';
import VersusIcon from './icons/VersusIcon';
import CrownIcon from './icons/CrownIcon';
import PreviewCard from './PreviewCard';
import InsightPublic from './InsightPublic';
import EcommerceButtons from './EcommerceButtons';
import SparklesIcon from './icons/SparklesIcon';
import SignalIcon from './icons/SignalIcon';
import BatteryIcon from './icons/BatteryIcon';
import InstagramIcon from './icons/InstagramIcon';

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
  category: string;
  excerpt: string;
  author: string;
  published_at: string;
  image_url: string;
}


interface HeroProps {
  setPage: (page: string) => void;
  openChat: () => void;
  navigateToFullReview: (result: ReviewResult) => void;
  navigateToFullBattle: (result: BattleResult) => void;
  latestReviewResult: ReviewResult | null;
  setLatestReviewResult: (result: ReviewResult | null) => void;
  navigateToReviewWithQuery: (phoneName: string) => void;
  navigateToBlogPost: (post: BlogPost) => void;
}

const Hero: React.FC<HeroProps> = ({ setPage, openChat, navigateToFullReview, navigateToFullBattle, latestReviewResult, setLatestReviewResult, navigateToReviewWithQuery, navigateToBlogPost }) => {
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

  const [latestPost, setLatestPost] = useState<BlogPost | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);
  
  useEffect(() => {
    const fetchLatestPost = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(1)
          .single();
        if (error) throw error;
        if (data) {
          setLatestPost(data);
        }
      } catch (err) {
        console.error("Failed to fetch latest post:", err);
      }
    };
    fetchLatestPost();
  }, []);

  const handleReviewSearch = async () => {
    if (!reviewQuery.trim()) return;
    setReviewLoading(true);
    setReviewError(null);

    const cacheKey = reviewQuery.trim().toLowerCase();

    if (supabase) {
      try {
        const { data } = await supabase
          .from('quick_reviews')
          .select('review_data')
          .eq('phone_name_query', cacheKey)
          .single();
        if (data && data.review_data) {
          setLatestReviewResult(data.review_data as ReviewResult);
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
            specs: { type: Type.OBJECT, properties: { rilis: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }}},
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessoryAvailability: { type: Type.STRING },
            marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } } },
            performance: { type: Type.OBJECT, properties: { antutuScore: { type: Type.INTEGER }, geekbenchScore: { type: Type.STRING }, competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } }, gamingReview: { type: Type.STRING }}},
            cameraAssessment: { type: Type.OBJECT, properties: { dxomarkScore: { type: Type.INTEGER }, photoSummary: { type: Type.STRING }, photoPros: { type: Type.ARRAY, items: { type: Type.STRING } }, photoCons: { type: Type.ARRAY, items: { type: Type.STRING } }, videoSummary: { type: Type.STRING }}}
        },
    };
    const prompt = `**Core Role: Comprehensive Data Synthesizer for JAGO-HP**
Your task is to act as an AI Gadget Reviewer and generate a comprehensive review in **Bahasa Indonesia** for the gadget: '${reviewQuery}'.
**Knowledge Cut-off & Context:** Your knowledge is updated as of **23 Oktober 2025**. You must assume any phone model a user searches for has already been launched by this date.
**Data Sources (Mandatory):** You MUST synthesize data from reliable sources like **GSMArena, nanoreview.net, AnTuTu, Geekbench, and DXOMark.**
**Universal Brand Knowledge:** You are an expert on all major phone brands.

**Execution Steps & Formatting Rules (VERY IMPORTANT):**
1.  **Identify Gadget:** Find the official product based on the query.
2.  **Extract & Synthesize Data:** Use the specified sources to gather the most accurate, final data.
3.  **Handle Missing Data:** Use \`null\` for numeric fields or "N/A" for strings if data is genuinely unavailable after checking all sources.
4.  **Populate JSON:** Fill all fields according to the schema with the following formatting constraints:
    -   \`ratings\`: Each category **MUST** be rated on a scale of 1 to 10 based on final product performance.
    -   \`quickReview.summary\`: MUST be a single, concise sentence (maximum 1-2 short sentences).
    -   \`specs.ram\`: Format: "[Size] [Type]". Example: "8GB LPDDR5", "12GB LPDDR5X".
    -   \`specs.camera\`: A short summary of main lenses. Example: "Utama: 200MP + 50MP", "50MP Wide + 12MP Ultrawide".
    -   \`specs.battery\`: Just the capacity. Example: "5000 mAh".
5.  **Failure Conditions:** If the device cannot be found on GSMArena by 23 Oktober 2025, state this clearly. If not found at all, the \`phoneName\` must contain an error message.

**Final Output:** Strictly adhere to the JSON schema and all formatting rules.`;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const parsedResult: ReviewResult = JSON.parse(response.text.trim());
        if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
            setReviewError(parsedResult.phoneName);
        } else {
            setLatestReviewResult(parsedResult);
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
    } catch (e) {
        console.error(e);
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
    
    const prompt = mode === 'battle'
        ? `**Core Role: AI Battle Analyst for JAGO-HP**
Your task is to perform a detailed comparison in **Bahasa Indonesia** between: ${phoneList}.
**Mandatory Data Sources:** Use the latest data from GSMArena, nanoreview.net, AnTuTu, Geekbench, and DXOMark.
**Knowledge Cut-off:** Your knowledge is updated to **23 Oktober 2025**. You must assume any phone model a user searches for has already been launched by this date.
**Execution:** First, extract and synthesize the final specification data. Second, perform a holistic analysis to determine a clear winner. Third, write a brief, insightful summary of the battle.
**Final Output:** Strictly adhere to the JSON schema, ensuring 'winnerName' and 'battleSummary' are populated.`
        : `**Core Role: Data Extractor for JAGO-HP**
Your task is to extract key specifications in **Bahasa Indonesia** for: ${phoneList}.
**Mandatory Data Sources:** Use the latest data from GSMArena, nanoreview.net, AnTuTu, Geekbench, and DXOMark.
**Knowledge Cut-off:** Your knowledge is updated to **23 Oktober 2025**. You must assume any phone model a user searches for has already been launched by this date.
**Strict Rule:** You MUST NOT provide any summary, analysis, or winner. Your ONLY job is to return the raw specification data for the 'phones' object.
**Final Output:** Strictly adhere to the JSON schema.`;
    
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
            console.warn("Supabase quick compare cache write failed:", cacheError);
          }
        }
    } catch (e) {
        console.error(e);
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

    const cacheKey = `quickmatch_${budget.replace(/\s+/g, '_').toLowerCase()}`;

    if (supabase) {
      try {
        const { data } = await supabase.from('quick_match_cache').select('result_data').eq('cache_key', cacheKey).single();
        if (data && data.result_data) {
          setQuickMatchResult(data.result_data as QuickMatchResult);
          setQuickMatchLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase quick match cache check failed', err);
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

    const prompt = `**Peran Anda:** Ahli Rekomendasi Gadget untuk pasar Indonesia.
    **Tugas:** Berdasarkan budget **${budget}**, berikan **SATU** rekomendasi smartphone **all-rounder** terbaik. All-rounder berarti seimbang antara performa, kamera, dan baterai untuk harganya.
    **Konteks Waktu & Pengetahuan:** Pengetahuan Anda diperbarui hingga **23 Oktober 2025**. Anda harus berasumsi semua perangkat yang relevan sudah dirilis.
    **Output:** Berikan jawaban dalam format JSON sesuai skema. 'reason' harus sangat singkat (1 kalimat).`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema as any }});
        const parsedResult: QuickMatchResult = JSON.parse(response.text.trim());
        setQuickMatchResult(parsedResult);
        if (supabase) {
            try {
                await supabase.from('quick_match_cache').insert({ cache_key: cacheKey, result_data: parsedResult });
            } catch (err) {
                console.warn('Supabase quick match cache write failed', err);
            }
        }
    } catch (e) {
        console.error(e);
        setQuickMatchError("Gagal mendapatkan rekomendasi. Coba lagi.");
    } finally {
        setQuickMatchLoading(false);
    }
  };

  return (
    <section className="pb-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT: CONTENT & INTERACTION */}
        <div className="md:col-span-7 space-y-8">
            <div>
              <div className="h-32">
                <PhoneScreenDisplay setPage={setPage} />
              </div>
              <div className="mt-6 md:hidden">
                <button onClick={openChat} className="w-full px-5 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity shadow-md">Cari apa Kak? Tanya dulu aja sini</button>
              </div>
              <div className="hidden md:block mt-6">
                <button onClick={openChat} className="w-full px-5 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity shadow-md">Cari apa Kak? Tanya dulu aja sini</button>
              </div>
            </div>
            
            {/* QUICK SEARCH & RESULT */}
            <div>
              <label className="font-semibold text-slate-800 text-lg">Quick Smart Review</label>
              <div className="mt-2 flex gap-3 items-center">
                <input value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReviewSearch()} className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" placeholder="Contoh: Samsung S25 Ultra..." />
                <button onClick={handleReviewSearch} disabled={reviewLoading} className="px-4 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">{reviewLoading ? '...' : 'Review'}</button>
              </div>
              <div className="mt-2 text-sm small-muted">Ketik model atau tipe HP</div>
              {reviewLoading && <div className="text-center p-4 small-muted animate-pulse">Kami sedang mereview, mohon tunggu..</div>}
              {reviewError && <div className="text-center p-4 text-red-500">{reviewError}</div>}
              {/* Mobile-only review result */}
              {latestReviewResult && (
                  <div className="md:hidden mt-4">
                      <PreviewCard result={latestReviewResult} onSeeFull={() => navigateToFullReview(latestReviewResult)} />
                  </div>
              )}
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
            <div>
                <QuickPhoneMatch
                    options={["1 Jutaan", "2 Jutaan", "3 Jutaan", "Diatas 4 Juta"]}
                    selectedBudget={quickMatchBudget}
                    onSelectBudget={handleQuickMatch}
                    loading={quickMatchLoading}
                />
                {quickMatchLoading && <div className="text-center p-4 small-muted animate-pulse">Mencari HP terbaik untukmu...</div>}
                {quickMatchError && <div className="text-center p-4 text-red-500">{quickMatchError}</div>}
                {quickMatchResult && <div className="md:hidden mt-4"><QuickMatchResultCard result={quickMatchResult} onSeeFull={() => navigateToReviewWithQuery(quickMatchResult.phoneName)} /></div>}
            </div>
        </div>

        {/* RIGHT: LEADERBOARDS & PREVIEW */}
        <div className="md:col-span-5 space-y-5">
            {latestReviewResult && (
                <div className="hidden md:block">
                    <PreviewCard result={latestReviewResult} onSeeFull={() => navigateToFullReview(latestReviewResult)} />
                </div>
            )}
            {battleData && (
                 <div className="hidden md:block">
                    <BattleSnippet result={battleData} onSeeFull={() => navigateToFullBattle(battleData)} />
                </div>
            )}
            {quickMatchResult && (
                 <div className="hidden md:block">
                    <QuickMatchResultCard result={quickMatchResult} onSeeFull={() => navigateToReviewWithQuery(quickMatchResult.phoneName)} />
                </div>
            )}
            {latestPost && <LatestBlogCard post={latestPost} onNavigateToBlog={() => setPage('blog')} onNavigateToPost={() => navigateToBlogPost(latestPost)} />}
            <LeaderboardCard title="Top 3 Brand HP di Indonesia" data={[{name: 'Samsung', share: '29.8%'}, {name: 'Xiaomi', share: '21.5%'}, {name: 'Oppo', share: '14.5%'}]} />
            <InsightPublic />
        </div>
      </div>
    </section>
  );
};

// --- Snippet Components ---

const LatestBlogCard: FC<{ post: BlogPost; onNavigateToPost: () => void; onNavigateToBlog: () => void }> = ({ post, onNavigateToPost, onNavigateToBlog }) => (
  <div className="glass p-4 animate-fade-in cursor-pointer group" onClick={onNavigateToBlog}>
    <h3 className="inline-block bg-rose-600 text-white text-sm font-semibold px-3 py-1 rounded-md mb-3">Blog Terbaru</h3>
    <div className="relative mb-3">
      <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute top-2 left-2 bg-[color:var(--accent1)] text-white text-xs font-semibold px-2 py-1 rounded-md">{post.category}</div>
    </div>
    <h4 className="font-bold text-slate-800 text-base leading-tight group-hover:text-[color:var(--accent1)] transition-colors">{post.title}</h4>
    <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">{post.excerpt}</p>
    <button 
        onClick={(e) => {
            e.stopPropagation();
            onNavigateToPost();
        }}
        className="w-full mt-3 px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
    >
      Baca Selengkapnya
    </button>
  </div>
);


const BattleSnippet: FC<{ result: BattleResult, onSeeFull: () => void }> = ({ result, onSeeFull }) => (
    <div className="glass p-4 animate-fade-in space-y-4">
        {result.battleSummary && (
             <p className="text-sm text-slate-600 leading-relaxed border-b border-slate-200 pb-3 mb-3">
                {result.battleSummary}
            </p>
        )}
        <div className="grid grid-cols-1 gap-4">
            {result.phones.map((phone, index) => {
                const isWinner = phone.name === result.winnerName;
                return (
                    <div key={index} className={`relative bg-slate-50 p-3 rounded-lg ${isWinner ? 'border border-[color:var(--accent1)]' : 'border border-slate-200'}`}>
                        {isWinner && <div className="absolute -top-3 right-2 bg-[color:var(--accent1)] text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><CrownIcon className="w-3 h-3"/>Pemenang</div>}
                        <h4 className="font-semibold text-slate-800 text-base truncate">{phone.name}</h4>
                        <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
                            <SpecItem label="Prosesor" value={phone.specs?.processor} />
                            <SpecItem label="Memori" value={phone.specs?.ram} />
                            <SpecItem label="Jaringan" value={phone.specs?.jaringan} />
                            <SpecItem label="Layar" value={phone.specs?.display} />
                            <SpecItem label="Kamera" value={phone.specs?.camera} />
                            <SpecItem label="Baterai" value={phone.specs?.battery} />
                            <SpecItem label="Charging" value={phone.specs?.charging} />
                            <SpecItem label="NFC" value={phone.specs?.nfc} />
                            <SpecItem label="AnTuTu" value={phone.specs?.antutuScore} />
                            <SpecItem label="Harga" value={phone.specs?.hargaIndonesia} />
                        </dl>
                        <EcommerceButtons phoneName={phone.name} isCompact={true} />
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

const LeaderboardCard: FC<{title: string, data: {name: string, share: string}[]}> = ({title, data}) => {
    const barColors = [
        'bg-[color:var(--accent1)]', // #1
        'bg-[color:var(--accent1)]', // #2
        'bg-slate-400' // #3
    ];
    return (
        <div className="glass p-4 border-t-4 border-[color:var(--accent2)]">
            <h3 className="font-semibold text-slate-800 mb-4 text-base">{title}</h3>
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={item.name}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-semibold text-slate-700">#{index + 1} {item.name}</span>
                            <span className="small-muted font-medium">{item.share}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${barColors[index] || 'bg-slate-400'}`}
                                style={{ width: item.share, transition: 'width 0.5s ease-in-out' }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
                Sumber: Top Brand Index
            </p>
        </div>
    );
};

const PhoneScreenDisplay: FC<{ setPage: (page: string) => void }> = ({ setPage }) => {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null);
  const blogTitle = 'Panduan Lengkap Memilih HP Gaming Terbaik di 2025';
  const truncatedBlogTitle = blogTitle.split(' ').slice(0, 4).join(' ') + ' ...';

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
        // Hardcoded for Jakarta for reliability, removing geolocation dependency
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
          /* Slower default animation for mobile */
          animation: marquee-seamless 25s linear infinite;
          will-change: transform;
        }
        .marquee-content {
          width: 50%;
          white-space: nowrap;
          flex-shrink: 0;
          /* Add padding to create a gap between repetitions */
          padding-right: 3rem; 
        }
        /* Speed up animation slightly on larger screens */
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
            <SignalIcon className="w-4 h-4" />
            <BatteryIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex items-end justify-between gap-4">
            {/* Left Side: Title & Tagline */}
            <div className="flex-1 overflow-hidden self-end">
                <h1 className="text-3xl font-bold font-orbitron">JAGO-HP</h1>
                 <div className="mt-1 marquee-container">
                    <button onClick={() => setPage('blog')} className="text-left w-full cursor-pointer group">
                        <div className="marquee-wrapper">
                            <div className="marquee-content text-[11px] md:text-xs text-slate-300 group-hover:text-white transition-colors duration-200">
                                <span className="font-semibold bg-rose-600/90 px-1.5 py-0.5 rounded text-[10px] mr-2 tracking-wide align-middle">BARU</span>
                                <span className="md:hidden align-middle">{truncatedBlogTitle}</span>
                                <span className="hidden md:inline align-middle">{blogTitle}</span>
                            </div>
                            <div className="marquee-content text-[11px] md:text-xs text-slate-300 group-hover:text-white transition-colors duration-200" aria-hidden="true">
                                <span className="font-semibold bg-rose-600/90 px-1.5 py-0.5 rounded text-[10px] mr-2 tracking-wide align-middle">BARU</span>
                                <span className="md:hidden align-middle">{truncatedBlogTitle}</span>
                                <span className="hidden md:inline align-middle">{blogTitle}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
            
            {/* Right Side: Instagram Icon */}
            <div className="flex-shrink-0 self-end">
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