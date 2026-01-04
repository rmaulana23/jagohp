
import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SparklesIcon from './icons/SparklesIcon';
import ShareButtons from './ShareButtons';
import EcommerceButtons from './EcommerceButtons';

interface Recommendation {
  phoneName: string;
  reason: string;
  keyFeatures: string[];
  estimatedPrice: string;
  rilis?: string;
}

const activityOptions = [
  "Sosial Media & Browsing", "Gaming Berat", "Fotografi & Videografi", "Produktivitas (Email, Doc.)",
  "Streaming Film & Video", "Baterai Tahan Lama", "Layar Super Mulus (120Hz+)", "Butuh NFC",
  "RAM Min. 8GB atau Lebih", "Storage Min. 128GB atau Lebih"
];

const budgetOptions = [
  "1 Jutaan", "2 Jutaan", "3 Jutaan", "4 Juta - 5 Juta", 
  "5 Juta - 7 Juta", "7 Juta - 10 Juta", "Di Atas 10 Juta"
];

const countOptions = [1, 2, 3];

// Utility to format brand names correctly
const formatBrandName = (name: string): string => {
    if (!name) return name;
    return name.replace(/iqoo/gi, 'iQOO');
};

const PhoneFinder: React.FC = () => {
  const [activities, setActivities] = useState<string[]>([]);
  const [cameraPriority, setCameraPriority] = useState(3);
  const [budget, setBudget] = useState(budgetOptions[2]); // Default: 3 Jutaan
  const [recommendationCount, setRecommendationCount] = useState(1);
  const [otherPrefs, setOtherPrefs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  const schema: any = {
    type: Type.OBJECT,
    properties: {
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phoneName: { type: Type.STRING }, 
                    reason: { type: Type.STRING },
                    keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedPrice: { type: Type.STRING }, 
                    rilis: { type: Type.STRING, description: "Wajib menyertakan nama bulan dan tahun. Contoh: 'Januari 2025' atau 'Awal 2026 (Estimasi)'." },
                },
                required: ["phoneName", "reason", "keyFeatures", "estimatedPrice", "rilis"]
            }
        }
    },
    required: ["recommendations"]
  };

  const handleActivityChange = (activity: string) => {
    setActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      setError("Pilih setidaknya satu aktivitas utama.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    
    const cacheKey = [...activities.sort(), `cam:${cameraPriority}`, `budget:${budget}`, `count:${recommendationCount}`, `prefs:${otherPrefs.trim().toLowerCase()}`].join('|');

    if (supabase) {
        try {
            const { data } = await supabase.from('phone_finder_cache').select('result_data').eq('cache_key', cacheKey).single();
            if (data && data.result_data) {
                // Compatibility check for old single object cache
                const cachedData = data.result_data;
                if (Array.isArray(cachedData)) {
                    setResults(cachedData);
                } else if (cachedData.recommendations) {
                    setResults(cachedData.recommendations);
                } else {
                    setResults([cachedData as Recommendation]);
                }
                setLoading(false);
                return;
            }
        } catch (cacheError) { console.warn("Cache check failed:", cacheError); }
    }

    const cameraPriorityText = ["Tidak penting", "Kurang penting", "Cukup penting", "Penting", "Sangat penting"][cameraPriority - 1];
    const nfcRequired = activities.includes("Butuh NFC");
    const ramRequired = activities.includes("RAM Min. 8GB atau Lebih");
    const storageRequired = activities.includes("Storage Min. 128GB atau Lebih");
    const mainActivities = activities.filter(act => !["Butuh NFC", "RAM Min. 8GB atau Lebih", "Storage Min. 128GB atau Lebih"].includes(act)).join(', ') || "Tidak ada preferensi spesifik";

    const prompt = `**Peran:** Ahli Rekomendasi Gadget Dunia dengan pengetahuan hingga awal 2026.
**Tugas:** Berikan **TEPAT ${recommendationCount} rekomendasi smartphone** terbaik awal 2026 berdasarkan kuesioner. 
**Ketentuan:**
1. Patuhi budget ketat (IDR pasar Indonesia 2026).
2. Data 'rilis' WAJIB mencantumkan nama bulan. 
3. Brand 'iQOO' ditulis 'iQOO'.
4. Sumber: Seluruh internet publik (GSMArena, PhoneArena, dll). 
5. Berikan alasan 'reason' yang personal untuk pengguna.`;

    try {
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      const parsed = JSON.parse(response.text.trim());
      const finalResults = parsed.recommendations || [];
      setResults(finalResults);
      
      if (supabase && finalResults.length > 0) {
          try { await supabase.from('phone_finder_cache').insert({ cache_key: cacheKey, result_data: { recommendations: finalResults } }); } 
          catch (cacheError) { console.warn("Cache write failed:", cacheError); }
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan saat mencari rekomendasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="finder" className="flex-grow flex flex-col items-center pb-8 px-4 sm:px-6 w-full">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">Phone Match</h1>
            <p className="text-sm md:text-base text-slate-500 mt-1 max-w-2xl mx-auto">Jawab beberapa pertanyaan, biarkan AI pakar kami menemukan HP terbaikmu di 2026.</p>
        </div>
        {!results && !loading && (
          <form onSubmit={handleSubmit} className="glass p-5 mt-2 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10 gap-y-6">
                  {/* Left Column: Q1 & Q2 */}
                  <div className="space-y-6">
                      <QuestionSection title="1. Apa aktivitas & kebutuhan utamamu?">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {activityOptions.map(activity => <Checkbox key={activity} label={activity} checked={activities.includes(activity)} onChange={() => handleActivityChange(activity)} />)}
                          </div>
                      </QuestionSection>

                      <QuestionSection title="2. Seberapa penting kualitas kamera?">
                          <div className="pt-1">
                              <input type="range" min="1" max="5" value={cameraPriority} onChange={e => setCameraPriority(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-lg accent-[color:var(--accent1)]"/>
                              <div className="flex justify-between mt-2 px-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Basic</span>
                                <span className="text-center text-[color:var(--accent1)] font-bold text-sm">{["Tidak Penting", "Kurang Penting", "Cukup Penting", "Penting", "Sangat Penting"][cameraPriority - 1]}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Pro</span>
                              </div>
                          </div>
                      </QuestionSection>
                  </div>

                  {/* Right Column: Q3, Q4, Q5 & Submit */}
                  <div className="space-y-6">
                      <QuestionSection title="3. Berapa budget maksimalmu?">
                          <select value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all">
                              {budgetOptions.map(opt => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
                          </select>
                      </QuestionSection>

                      <QuestionSection title="4. Tampilkan berapa HP rekomendasi?">
                          <div className="flex gap-2">
                              {countOptions.map(num => (
                                  <button
                                      key={num}
                                      type="button"
                                      onClick={() => setRecommendationCount(num)}
                                      className={`flex-1 py-2.5 rounded-lg font-bold border-2 transition-all ${recommendationCount === num ? 'bg-[color:var(--accent1)] text-white border-[color:var(--accent1)]' : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-400'}`}
                                  >
                                      {num} HP
                                  </button>
                              ))}
                          </div>
                      </QuestionSection>

                      <QuestionSection title="5. Ada preferensi lain? (Opsional)">
                          <input type="text" value={otherPrefs} onChange={e => setOtherPrefs(e.target.value)} placeholder="Misal: Harus ada charger di box..." className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all"/>
                      </QuestionSection>

                      <div className="pt-4">
                          <button type="submit" disabled={loading} className="w-full px-8 py-3.5 rounded-xl bg-[color:var(--accent1)] text-white font-bold flex items-center justify-center gap-3 hover:opacity-95 transition-all duration-200 disabled:opacity-50 shadow-lg active:scale-[0.98]">
                              {loading ? 'Menganalisis...' : 'Cari Rekomendasi'}{!loading && <SparklesIcon className="w-5 h-5" />}
                          </button>
                          {loading && <p className="text-sm text-slate-500 mt-2 text-center animate-pulse font-medium">Sabar ya, AI pakar lagi pilihkan HP terbaik awal 2026 untukmu...</p>}
                          {error && <p className="text-red-500 mt-2 text-sm text-center font-semibold">{error}</p>}
                      </div>
                  </div>
              </div>
          </form>
        )}
        <div className="animate-fade-in">
            {loading && <ResultsSkeleton count={recommendationCount} />}
            {results && <ResultsDisplay results={results} onReset={() => setResults(null)} />}
        </div>
      </div>
    </section>
  );
};

const QuestionSection: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div><h3 className="text-base font-bold text-slate-800 mb-3">{title}</h3>{children}</div>
);

const Checkbox: FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 border-2 ${checked ? 'bg-[color:var(--accent1)]/10 border-[color:var(--accent1)]/50' : 'bg-slate-100 border-slate-200 hover:border-slate-300'}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <div className={`w-5 h-5 rounded-md border-2 ${checked ? 'bg-[color:var(--accent1)] border-[color:var(--accent1)]' : 'border-slate-400'} flex items-center justify-center mr-3 flex-shrink-0`}>
      {checked && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    <span className="text-sm text-slate-700 font-semibold">{label}</span>
  </label>
);

const ResultsSkeleton: FC<{ count: number }> = ({ count }) => (
  <div className="mt-8 animate-pulse">
    <div className="h-7 bg-slate-200 rounded-md w-1/2 mx-auto mb-6"></div>
    <div className={`grid grid-cols-1 ${count === 2 ? 'md:grid-cols-2' : count === 3 ? 'lg:grid-cols-3' : 'max-w-xl mx-auto'} gap-6`}>
        {[...Array(count)].map((_, i) => (
            <div key={i} className="glass p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded-md w-full mt-4"></div>
                <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
                <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
            </div>
        ))}
    </div>
  </div>
);

const ResultsDisplay: FC<{ results: Recommendation[]; onReset: () => void }> = ({ results, onReset }) => {
    const isMulti = results.length > 1;

    return (
      <div className="mt-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
            {isMulti ? `Ini ${results.length} Rekomendasi Terbaik Untukmu` : 'Rekomendasi Terbaik Untukmu'}
        </h2>
        <div className={`grid grid-cols-1 ${results.length === 2 ? 'md:grid-cols-2' : results.length === 3 ? 'lg:grid-cols-3' : 'max-w-xl mx-auto'} gap-6`}>
          {results.map((result, index) => {
              const shareText = `Pakar AI JAGO-HP merekomendasikan ${formatBrandName(result.phoneName)} untukku!\n\nAlasannya: ${result.reason}\n\nCari HP impianmu juga di JAGO-HP.`;
              const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
              
              return (
                <div key={index} className="glass p-6 flex flex-col h-full">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{formatBrandName(result.phoneName)}</h3>
                            {isMulti && <span className="bg-[color:var(--accent1)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Opsi {index + 1}</span>}
                        </div>
                        {result.rilis && <p className="text-[color:var(--accent1)] text-xs mb-1 font-medium">Rilis: {result.rilis}</p>}
                        {result.estimatedPrice && <p className="text-slate-600 font-bold mb-3">{result.estimatedPrice}</p>}
                        
                        <div className="my-4 p-4 bg-slate-100 border-l-4 border-[color:var(--accent1)] rounded-r-lg">
                            <p className="text-slate-600 text-sm leading-relaxed italic">"{result.reason}"</p>
                        </div>
                        
                        {result.keyFeatures && result.keyFeatures.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-semibold text-slate-800 mb-2 text-sm">Fitur Unggulan:</h4>
                            <ul className="space-y-1.5">
                                {result.keyFeatures.map((feat, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="text-[color:var(--accent1)] mt-1">•</span>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        )}
                    </div>
                    
                    <div className="mt-auto">
                        <EcommerceButtons phoneName={result.phoneName} isCompact={true} />
                        <div className="mt-4">
                            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
                        </div>
                    </div>
                </div>
              );
          })}
        </div>
        <div className="mt-10 text-center">
            <button 
                onClick={onReset} 
                className="px-8 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors shadow-sm"
            >
                Cari Rekomendasi Lain
            </button>
        </div>
      </div>
    );
};

export default PhoneFinder;
