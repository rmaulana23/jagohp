import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import { ReviewResult } from './SmartReview';
import { BattleResult } from './PhoneBattle';
import VersusIcon from './icons/VersusIcon';
import CrownIcon from './icons/CrownIcon';
import PreviewCard from './PreviewCard';
import InsightPublic from './InsightPublic';

interface HeroProps {
  setPage: (page: string) => void;
  openChat: () => void;
  navigateToFullReview: (result: ReviewResult) => void;
  navigateToFullBattle: (result: BattleResult) => void;
  latestReviewResult: ReviewResult | null;
  setLatestReviewResult: (result: ReviewResult | null) => void;
}

const Hero: React.FC<HeroProps> = ({ setPage, openChat, navigateToFullReview, navigateToFullBattle, latestReviewResult, setLatestReviewResult }) => {
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [comparePhoneA, setComparePhoneA] = useState('');
  const [comparePhoneB, setComparePhoneB] = useState('');
  const [battleModeLoading, setBattleModeLoading] = useState<'compare' | 'battle' | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);
  const [battleData, setBattleData] = useState<BattleResult | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

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
    const prompt = `**Core Role: Comprehensive Data Synthesizer**
Your secondary task is to act as an AI Gadget Reviewer for JAGO-HP. Based on structured data, generate a comprehensive review in **Bahasa Indonesia** for the gadget: '${reviewQuery}'.
**Context & Knowledge Cut-off:** Your knowledge is updated as of **5 Oktober 2025**. Devices like Samsung S25 series and iPhone 17 series are considered released.
**Universal Brand Knowledge:** You are an expert on all major phone brands.

**Execution Steps & Formatting Rules (VERY IMPORTANT):**
1.  **Identify Gadget:** Find the official product based on the query.
2.  **Extract Data:** Use reliable sources (GSMArena, nanoreview.net, etc.).
3.  **Handle Missing Data:** Use \`null\` or "N/A".
4.  **Populate JSON:** Fill all fields according to the schema with the following formatting constraints:
    -   \`ratings\`: Each category **MUST** be rated on a scale of 1 to 10.
    -   \`quickReview.summary\`: MUST be a single, concise sentence (maximum 1-2 short sentences).
    -   \`specs.ram\`: MUST be in the format "[Size] [Type]". Example: "8GB LPDDR5", "12GB LPDDR5X".
    -   \`specs.camera\`: MUST be a short summary of main lenses. Example: "Utama: 200MP + 50MP", "50MP Wide + 12MP Ultrawide".
    -   \`specs.battery\`: MUST be just the capacity. Example: "5000 mAh".
5.  **Failure Conditions:** If unreleased (post-5 Oct 2025), state it's based on rumors. If not found, the \`phoneName\` must contain an error message.

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
    const cacheKey = phoneNames.map(name => name.trim().toLowerCase()).sort().join('_vs_');

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
        antutuScore: { type: Type.INTEGER, description: "Skor AnTuTu v10. Jika tidak tersedia, kembalikan null." },
        jaringan: { type: Type.STRING }, wifi: { type: Type.STRING }, display: { type: Type.STRING },
        camera: { type: Type.STRING }, battery: { type: Type.STRING }, charging: { type: Type.STRING },
        koneksi: { type: Type.STRING }, nfc: { type: Type.STRING },
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
        ? { type: Type.OBJECT, properties: battleSchemaProperties, required: ['battleSummary', 'phones'] }
        : { type: Type.OBJECT, properties: baseSchemaProperties, required: ['phones'] };
    
    const prompt = mode === 'battle'
        ? `**Core Role: AI Battle Analyst for JAGO-HP**\nPerform a detailed comparison in **Bahasa Indonesia** between: ${phoneList}.\n**Data Sources:** GSMArena, nanoreview.net, etc.\n**Knowledge Cut-off:** **5 Oktober 2025**. Devices like Samsung S25 series are released.\n**Execution:** Identify gadgets, extract data, analyze holistically to find a winner, and write a brief summary.\n**Output:** Strictly follow the JSON schema.`
        : `**Core Role: Data Extractor for JAGO-HP**\nExtract key specifications in **Bahasa Indonesia** for: ${phoneList}.\n**Data Sources:** GSMArena, nanoreview.net, etc.\n**Knowledge Cut-off:** **5 Oktober 2025**. Devices like Samsung S25 series are released.\n**Rule:** DO NOT provide a summary or winner. Only return 'phones' data.\n**Output:** Strictly follow the JSON schema.`;
    
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

  return (
    <section className="pb-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT: CONTENT & INTERACTION */}
        <div className="md:col-span-7 space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight font-orbitron text-[color:var(--accent1)]">JAGO-HP</h1>
              <p className="mt-2 text-sm text-slate-600">Your AI Expert, Asisten Cerdas Berbasis AI Untuk Membantu Memilih Smartphone Terbaik</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={openChat} className="px-5 py-3 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity shadow-md">AI Assistant</button>
                <button onClick={() => setPage('review')} className="px-5 py-3 rounded-lg border border-[color:var(--accent1)] text-[color:var(--accent1)] font-semibold hover:bg-[color:var(--accent1)]/10 transition-colors">Smart Review</button>
                <button onClick={() => setPage('battle')} className="px-5 py-3 rounded-lg border border-[color:var(--accent1)] text-[color:var(--accent1)] font-semibold hover:bg-[color:var(--accent1)]/10 transition-colors">Compare</button>
                <button onClick={() => setPage('finder')} className="px-5 py-3 rounded-lg border border-[color:var(--accent1)] text-[color:var(--accent1)] font-semibold hover:bg-[color:var(--accent1)]/10 transition-colors">Phone Match</button>
              </div>
            </div>

            {/* QUICK SEARCH */}
            <div>
              <label className="font-semibold text-slate-800 text-lg">Quick Review</label>
              <div className="mt-2 flex gap-3 items-center">
                <input value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReviewSearch()} className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" placeholder="Contoh: Samsung S25 Ultra..." />
                <button onClick={handleReviewSearch} disabled={reviewLoading} className="px-4 py-3 rounded-xl bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">{reviewLoading ? '...' : 'Review'}</button>
              </div>
              <div className="mt-2 text-sm small-muted">Ketik model atau tipe HP</div>
            </div>
             {reviewLoading && <div className="text-center p-4 small-muted animate-pulse">AI sedang menganalisis...</div>}
             {reviewError && <div className="text-center p-4 text-red-500">{reviewError}</div>}
             
            {/* Quick Compare */}
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
             {battleModeLoading && <div className="text-center p-4 small-muted animate-pulse">AI sedang membandingkan...</div>}
             {battleError && <div className="text-center p-4 text-red-500">{battleError}</div>}
             {battleData && <BattleSnippet result={battleData} onSeeFull={() => navigateToFullBattle(battleData)} />}
        </div>

        {/* RIGHT: LEADERBOARDS & PREVIEW */}
        <div className="md:col-span-5 space-y-5">
            {latestReviewResult && <PreviewCard result={latestReviewResult} onSeeFull={() => navigateToFullReview(latestReviewResult)} />}
            <LeaderboardCard title="Top 3 Smartphone (Indonesia)" data={[{name: 'Samsung', share: '29.8%'}, {name: 'Xiaomi', share: '21.5%'}, {name: 'Oppo', share: '14.5%'}]} />
            <InsightPublic />
        </div>
      </div>
    </section>
  );
};

// --- Snippet Components ---

const BattleSnippet: FC<{ result: BattleResult, onSeeFull: () => void }> = ({ result, onSeeFull }) => (
    <div className="glass p-4 mt-4 animate-fade-in space-y-4">
        {result.battleSummary && (
             <p className="text-sm text-slate-600 leading-relaxed border-b border-slate-200 pb-3 mb-3">
                {result.battleSummary}
            </p>
        )}
        <div className="grid grid-cols-1 gap-4">
            {result.phones.map((phone, index) => {
                const isWinner = phone.name === result.winnerName;
                const purchaseUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(phone.name)}`;
                return (
                    <div key={index} className={`relative bg-slate-50 p-3 rounded-lg ${isWinner ? 'border border-[color:var(--accent1)]' : 'border border-slate-200'}`}>
                        {isWinner && <div className="absolute -top-3 right-2 bg-[color:var(--accent1)] text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><CrownIcon className="w-3 h-3"/>Pemenang</div>}
                        <h4 className="font-semibold text-slate-800 text-base truncate">{phone.name}</h4>
                        <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
                            <SpecItem label="Layar" value={phone.specs.display} />
                            <SpecItem label="NFC" value={phone.specs.nfc} />
                            <SpecItem label="Harga" value={phone.specs.hargaIndonesia} />
                        </dl>
                        <a 
                          href={purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center w-full mt-3 px-3 py-1.5 rounded-md text-xs bg-green-500/10 text-green-600 border border-green-500/30 font-semibold hover:bg-green-500/20 transition-colors"
                        >
                            Beli Sekarang
                        </a>
                    </div>
                );
            })}
        </div>
        <button onClick={onSeeFull} className="w-full mt-2 px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors">Lihat Perbandingan Lengkap</button>
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


export default Hero;