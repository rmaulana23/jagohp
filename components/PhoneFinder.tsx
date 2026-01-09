
import React, { useState, useMemo, FC, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SparklesIcon from './icons/SparklesIcon';
import ShareButtons from './ShareButtons';
import EcommerceButtons from './EcommerceButtons';

interface Recommendation {
  phoneName: string;
  reason: string;
  estimatedPrice: string;
  rilis?: string;
  specs: {
    design: string;
    network: string;
    display: string;
    chipset: string;
    camera: string;
    memory: string;
    storage: string;
    battery: string;
    charging: string;
    connection: string;
  };
}

const activityOptions = [
  "Sosial Media & Browsing", "Gaming Berat", "Fotografi & Videografi", "Produktivitas (Email, Doc.)",
  "Streaming Film & Video", "Baterai Tahan Lama", "Layar Super Mulus (120Hz+)", "Butuh NFC",
  "RAM Min. 8GB atau Lebih", "Storage Besar"
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
  const [loadingMessage, setLoadingMessage] = useState('Menganalisis profilmu...');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  // Loading message rotation
  useEffect(() => {
    if (loading) {
      const messages = [
        "Menganalisis kebutuhan utamamu...",
        "Menyeimbangkan budget dengan spesifikasi...",
        "Mengecek database HP rilis terbaru 2026...",
        "Membandingkan skor benchmark & performa...",
        "Memilihkan yang paling 'Value for Money' untukmu..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const schema: any = {
    type: Type.OBJECT,
    properties: {
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phoneName: { type: Type.STRING, description: "Nama resmi HP selengkap mungkin (e.g., Xiaomi 15T 5G)" }, 
                    reason: { type: Type.STRING, description: "Alasan spesifik mengapa HP ini cocok dengan pilihan user" },
                    estimatedPrice: { type: Type.STRING, description: "Harga pasar di Indonesia saat ini" }, 
                    rilis: { type: Type.STRING, description: "Bulan dan tahun rilis (e.g., Januari 2026)" },
                    specs: {
                        type: Type.OBJECT,
                        properties: {
                            design: { type: Type.STRING, description: "Material dan gaya desain" },
                            network: { type: Type.STRING, description: "Dukungan jaringan (e.g., 5G, LTE)" },
                            display: { type: Type.STRING, description: "Panel, ukuran, refresh rate" },
                            chipset: { type: Type.STRING, description: "Model prosesor dan GPU" },
                            camera: { type: Type.STRING, description: "Konfigurasi kamera utama dan depan" },
                            memory: { type: Type.STRING, description: "Kapasitas RAM" },
                            storage: { type: Type.STRING, description: "Kapasitas internal storage" },
                            battery: { type: Type.STRING, description: "Kapasitas mAh" },
                            charging: { type: Type.STRING, description: "Kecepatan charging" },
                            connection: { type: Type.STRING, description: "Bluetooth, Wi-Fi, NFC, Port" }
                        },
                        required: ["design", "network", "display", "chipset", "camera", "memory", "storage", "battery", "charging", "connection"]
                    }
                },
                required: ["phoneName", "reason", "estimatedPrice", "rilis", "specs"]
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
    
    const cacheKey = [...activities.sort(), `cam:${cameraPriority}`, `budget:${budget}`, `count:${recommendationCount}`, `prefs:${otherPrefs.trim().toLowerCase()}`, 'v2_specs'].join('|');

    if (supabase) {
        try {
            const { data } = await supabase.from('phone_finder_cache').select('result_data').eq('cache_key', cacheKey).single();
            if (data && data.result_data) {
                const cachedData = data.result_data;
                setResults(cachedData.recommendations);
                setLoading(false);
                return;
            }
        } catch (cacheError) { console.warn("Cache check failed:", cacheError); }
    }

    const cameraPriorityText = ["Tidak penting", "Kurang penting", "Cukup penting", "Penting", "Sangat penting"][cameraPriority - 1];

    const prompt = `**Peran:** JAGO-HP Matchmaker AI (Pakar Gadget Senior).
**Tugas:** Temukan **TEPAT ${recommendationCount} smartphone** terbaik awal 2026 yang PALING SESUAI dengan profil pengguna:
- **Kebutuhan Utama:** ${activities.join(', ')}
- **Prioritas Kamera:** ${cameraPriorityText}
- **Budget Maksimal:** ${budget}
- **Preferensi Lain:** ${otherPrefs || "Tidak ada"}

**ATURAN MAIN:**
1. **Akurasi:** Berikan rekomendasi yang benar-benar relevan dengan budget dan kebutuhan.
2. **Spesifikasi Lengkap:** Isi semua field spesifikasi (Design, Network, Display, Chipset, Camera, Memory, Storage, Battery, Charging, Connection) dengan data teknis yang akurat untuk tahun 2026.
3. **Bahasa:** Gunakan Bahasa Indonesia yang profesional.`;

    try {
      const response = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: prompt, 
          config: { 
              responseMimeType: "application/json", 
              responseSchema: schema 
          } 
      });
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
            <p className="text-sm md:text-base text-slate-500 mt-1 max-w-2xl mx-auto">Jawab beberapa pertanyaan, biarkan AI kami menemukan HP terbaik untukmu.</p>
        </div>
        {!results && !loading && (
          <form onSubmit={handleSubmit} className="glass p-5 mt-2 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10 gap-y-6">
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
                          {error && <p className="text-red-500 mt-2 text-sm text-center font-semibold">{error}</p>}
                      </div>
                  </div>
              </div>
          </form>
        )}
        <div className="animate-fade-in">
            {loading && (
                <div className="mt-12 text-center">
                    <div className="inline-block relative">
                         <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                         <SparklesIcon className="w-6 h-6 text-yellow-400 absolute top-0 right-0 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 animate-pulse">{loadingMessage}</h3>
                    <p className="text-sm text-slate-400 mt-2">Pakar AI kami sedang memilihkan yang terbaik untukmu...</p>
                </div>
            )}
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

const ResultsDisplay: FC<{ results: Recommendation[]; onReset: () => void }> = ({ results, onReset }) => {
    const isMulti = results.length > 1;

    return (
      <div className="mt-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">
            {isMulti ? `Ini ${results.length} Rekomendasi Terbaik Untukmu` : 'Rekomendasi Terbaik Untukmu'}
        </h2>
        <div className={`grid grid-cols-1 ${results.length === 2 ? 'md:grid-cols-2' : results.length === 3 ? 'lg:grid-cols-3' : 'max-w-3xl mx-auto'} gap-8`}>
          {results.map((result, index) => {
              const shareText = `Pakar AI JAGO-HP merekomendasikan ${formatBrandName(result.phoneName)} untukku!\n\nAlasannya: ${result.reason}\n\nCari HP impianmu juga di JAGO-HP.`;
              const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
              
              return (
                <div key={index} className="glass p-6 flex flex-col h-full hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-indigo-500 bg-white">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{formatBrandName(result.phoneName)}</h3>
                            {isMulti && <span className="bg-[color:var(--accent1)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Opsi {index + 1}</span>}
                        </div>
                        {result.rilis && <p className="text-[color:var(--accent1)] text-xs mb-1 font-bold uppercase tracking-wider">Rilis: {result.rilis}</p>}
                        <p className="text-indigo-600 font-black text-lg mb-3">{result.estimatedPrice}</p>
                        
                        <div className="my-4 p-4 bg-indigo-50/50 border-l-4 border-indigo-500 rounded-r-lg">
                            <p className="text-slate-700 text-sm leading-relaxed italic">"{result.reason}"</p>
                        </div>
                        
                        <div className="mt-6 space-y-4">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Spesifikasi Lengkap</h4>
                            <div className="grid grid-cols-1 gap-y-3">
                                <SpecRow label="Desain" value={result.specs.design} />
                                <SpecRow label="Jaringan" value={result.specs.network} />
                                <SpecRow label="Display" value={result.specs.display} />
                                <SpecRow label="Chipset" value={result.specs.chipset} />
                                <SpecRow label="Kamera" value={result.specs.camera} />
                                <SpecRow label="Memory" value={result.specs.memory} />
                                <SpecRow label="Storage" value={result.specs.storage} />
                                <SpecRow label="Baterai" value={result.specs.battery} />
                                <SpecRow label="Charging" value={result.specs.charging} />
                                <SpecRow label="Koneksi" value={result.specs.connection} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <EcommerceButtons phoneName={result.phoneName} isCompact={true} />
                        <div className="mt-4">
                            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
                        </div>
                    </div>
                </div>
              );
          })}
        </div>
        <div className="mt-12 text-center">
            <button 
                onClick={onReset} 
                className="px-10 py-3.5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-700"
            >
                Cari Rekomendasi Lain
            </button>
        </div>
      </div>
    );
};

const SpecRow: FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1 border-b border-slate-50 pb-2 last:border-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-24 flex-shrink-0">{label}</span>
        <span className="text-[11px] font-bold text-slate-700 text-left sm:text-right">{value}</span>
    </div>
);

export default PhoneFinder;
