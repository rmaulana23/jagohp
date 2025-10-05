import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SparklesIcon from './icons/SparklesIcon';
import ShareButtons from './ShareButtons';

interface Recommendation {
  phoneName: string;
  reason: string;
  keyFeatures: string[];
  estimatedPrice: string;
  rilis?: string;
}

const activityOptions = [
  "Sosial Media & Browsing", "Gaming Berat", "Fotografi & Videografi", "Produktivitas (Email, Doc.)",
  "Streaming Film & Video", "Baterai Tahan Lama", "Layar Super Mulus (120Hz+)", "Butuh NFC"
];

const budgetOptions = [
  "Di Bawah Rp 2 Juta", "Rp 2 Juta - 4 Juta", "Rp 4 Juta - 7 Juta",
  "Rp 7 Juta - 10 Juta", "Di Atas Rp 10 Juta"
];

const PhoneFinder: React.FC = () => {
  const [activities, setActivities] = useState<string[]>([]);
  const [cameraPriority, setCameraPriority] = useState(3);
  const [budget, setBudget] = useState(budgetOptions[1]);
  const [otherPrefs, setOtherPrefs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Recommendation | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  const schema: any = {
    type: Type.OBJECT,
    properties: {
        phoneName: { type: Type.STRING }, reason: { type: Type.STRING },
        keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        estimatedPrice: { type: Type.STRING }, rilis: { type: Type.STRING },
    },
    required: ["phoneName", "reason", "keyFeatures", "estimatedPrice", "rilis"]
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
    setResult(null);
    
    const cacheKey = [...activities.sort(), `cam:${cameraPriority}`, `budget:${budget}`, `prefs:${otherPrefs.trim().toLowerCase()}`].join('|');

    if (supabase) {
        try {
            const { data } = await supabase.from('phone_finder_cache').select('result_data').eq('cache_key', cacheKey).single();
            if (data && data.result_data) {
                setResult(data.result_data as Recommendation);
                setLoading(false);
                return;
            }
        } catch (cacheError) { console.warn("Cache check failed:", cacheError); }
    }

    const cameraPriorityText = ["Tidak penting", "Kurang penting", "Cukup penting", "Penting", "Sangat penting"][cameraPriority - 1];
    const nfcRequired = activities.includes("Butuh NFC");
    const mainActivities = activities.filter(act => act !== "Butuh NFC").join(', ') || "Tidak ada preferensi spesifik";

    const prompt = `**Peran Anda:** Ahli Rekomendasi Gadget untuk pasar Indonesia, memberikan **SATU rekomendasi smartphone TUNGGAL** paling TEPAT berdasarkan kuesioner. Sumber data: GSMArena, nanoreview.net, dll.
    **Konteks Waktu:** 5 Oktober 2025. Data harga dan ketersediaan harus relevan. Samsung S25 series, iPhone 17 & Xiaomi 17 series sudah rilis.
    ---
    **Input Pengguna:**
    - **Aktivitas Utama & Fitur:** ${mainActivities}
    - **Prioritas Kamera:** ${cameraPriorityText} (${cameraPriority}/5)
    - **Budget Maksimal:** ${budget}
    - **Preferensi Lain:** ${otherPrefs || "Tidak ada"}
    ${nfcRequired ? '- **Fitur Wajib:** NFC\n' : ''}
    ---
    **PROSES ANALISIS WAJIB:**
    1.  **Sintesis Profil Pengguna:** Buat profil mental singkat pengguna (Contoh: "gamer budget menengah", "fotografer butuh baterai awet").
    2.  **Filter & Prioritas:**
        -   **Merek (Tertinggi):** Jika disebut di "Preferensi Lain", patuhi merek tersebut.
        -   **Logika Agresif:** Prioritaskan fitur kunci yang dipilih (Layar 120Hz, Gaming, Baterai) sebagai faktor utama.
        -   **Budget:** Batasan keras. Jangan melebihi.
    3.  **Personalisasi Alasan:** Field 'reason' **WAJIB** merujuk kembali ke profil pengguna. (Contoh: "Melihat profilmu sebagai gamer dengan budget menengah, ponsel ini paling pas karena...").
    4.  **Fitur Wajib:** Jika NFC diminta, rekomendasi **WAJIB** punya NFC.
    5.  **Output:** Berikan **SATU** rekomendasi. Isi semua field JSON sesuai skema.`;

    try {
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      const parsedResult: Recommendation = JSON.parse(response.text.trim());
      setResult(parsedResult);
      if (supabase) {
          try { await supabase.from('phone_finder_cache').insert({ cache_key: cacheKey, result_data: parsedResult }); } 
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
    <section id="finder" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">Phone Match</h1>
            <p className="text-base text-slate-500 mt-2 max-w-2xl mx-auto">Jawab beberapa pertanyaan, dan biarkan AI kami menemukan HP yang pas untukmu.</p>
        </div>
        {!result && !loading && (
          <form onSubmit={handleSubmit} className="glass p-6 md:p-8 mt-4 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12 gap-y-8">
                  <QuestionSection title="1. Apa aktivitas & kebutuhan utamamu?">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activityOptions.map(activity => <Checkbox key={activity} label={activity} checked={activities.includes(activity)} onChange={() => handleActivityChange(activity)} />)}
                      </div>
                  </QuestionSection>
                  <div className="space-y-8 flex flex-col">
                      <QuestionSection title="2. Seberapa penting kualitas kamera?">
                          <div className="pt-2">
                              <input type="range" min="1" max="5" value={cameraPriority} onChange={e => setCameraPriority(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-lg accent-[color:var(--accent1)]"/>
                              <span className="mt-2 block text-center text-[color:var(--accent1)] font-semibold text-sm">{["Tidak Penting", "Kurang Penting", "Cukup Penting", "Penting", "Sangat Penting"][cameraPriority - 1]}</span>
                          </div>
                      </QuestionSection>
                      <QuestionSection title="3. Berapa budget maksimalmu?">
                          <select value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all">
                              {budgetOptions.map(opt => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
                          </select>
                      </QuestionSection>
                      <QuestionSection title="4. Ada preferensi lain? (Opsional)">
                          <input type="text" value={otherPrefs} onChange={e => setOtherPrefs(e.target.value)} placeholder="Misal: Suka merk Samsung..." className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all"/>
                      </QuestionSection>
                  </div>
              </div>
              <div className="text-center pt-10 border-t border-slate-200 mt-8">
                  <button type="submit" disabled={loading} className="w-full max-w-sm px-8 py-3 rounded-lg bg-[color:var(--accent1)] text-white font-semibold flex items-center justify-center gap-3 mx-auto hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 shadow-md">
                      {loading ? 'Menganalisis...' : 'Cari Rekomendasi'}{!loading && <SparklesIcon className="w-5 h-5" />}
                  </button>
                  {loading && <p className="text-sm text-slate-500 mt-3 animate-pulse">AI sedang menganalisis...</p>}
                  {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
              </div>
          </form>
        )}
        <div className="animate-fade-in">
            {loading && <ResultsSkeleton />}
            {result && <ResultsDisplay result={result} onReset={() => setResult(null)} />}
        </div>
      </div>
    </section>
  );
};

const QuestionSection: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div><h3 className="text-base font-semibold text-slate-800 mb-3">{title}</h3>{children}</div>
);

const Checkbox: FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${checked ? 'bg-[color:var(--accent1)]/10 border-[color:var(--accent1)]/50' : 'bg-slate-100 border-slate-200 hover:border-slate-300'}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <div className={`w-5 h-5 rounded-md border-2 ${checked ? 'bg-[color:var(--accent1)] border-[color:var(--accent1)]' : 'border-slate-400'} flex items-center justify-center mr-3 flex-shrink-0`}>
      {checked && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    <span className="text-sm text-slate-700 font-medium">{label}</span>
  </label>
);

const ResultsSkeleton: FC = () => (
  <div className="mt-8 animate-pulse">
    <div className="h-7 bg-slate-200 rounded-md w-1/2 mx-auto mb-6"></div>
    <div className="max-w-xl mx-auto"><div className="glass p-6 space-y-4"><div className="h-6 bg-slate-200 rounded-md w-3/4"></div><div className="h-5 bg-slate-200 rounded-md w-1/3"></div><div className="h-4 bg-slate-200 rounded-md w-full mt-4"></div><div className="h-4 bg-slate-200 rounded-md w-5/6"></div><div className="h-5 bg-slate-200 rounded-md w-1/4 mt-4"></div><div className="h-4 bg-slate-200 rounded-md w-full"></div><div className="h-4 bg-slate-200 rounded-md w-full"></div></div></div>
  </div>
);

const ResultsDisplay: FC<{ result: Recommendation; onReset: () => void }> = ({ result, onReset }) => {
    const shareText = `AI JAGO-HP merekomendasikan ${result.phoneName} untukku!\n\nAlasannya: ${result.reason}\n\nCari HP impianmu juga di JAGO-HP.`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
      <div className="mt-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Rekomendasi Terbaik Untukmu</h2>
        <div className="max-w-xl mx-auto">
          <div className="glass p-6 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900">{result.phoneName}</h3>
            {result.rilis && <p className="text-[color:var(--accent1)] text-sm mb-1 font-medium">Rilis: {result.rilis}</p>}
            {result.estimatedPrice && <p className="text-slate-600 font-semibold mb-3">{result.estimatedPrice}</p>}
            <div className="my-4 p-4 bg-slate-100 border-l-4 border-[color:var(--accent1)] rounded-r-lg"><p className="text-slate-600 text-sm leading-relaxed">{result.reason}</p></div>
            {result.keyFeatures && result.keyFeatures.length > 0 && (
              <div className="mb-4"><h4 className="font-semibold text-slate-800 mb-2 text-sm">Fitur Unggulan:</h4><ul className="list-disc list-inside space-y-1 text-sm text-slate-600">{result.keyFeatures.map((feat, j) => <li key={j}>{feat}</li>)}</ul></div>
            )}
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
            <div className="mt-6 text-center"><button onClick={onReset} className="text-sm text-[color:var(--accent1)] font-semibold hover:underline">Cari Rekomendasi Lain</button></div>
          </div>
        </div>
      </div>
    );
};

export default PhoneFinder;