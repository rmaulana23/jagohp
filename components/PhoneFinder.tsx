
import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SparklesIcon from './icons/SparklesIcon';

// --- INTERFACES ---
interface Recommendation {
  phoneName: string;
  reason: string;
  keyFeatures: string[];
  estimatedPrice: string;
}

interface AIResponse {
  recommendations: Recommendation[];
}

const activityOptions = [
  "Sosial Media & Browsing",
  "Gaming Berat",
  "Fotografi & Videografi",
  "Produktivitas (Email, Dokumen)",
  "Streaming Film & Video",
  "Butuh NFC"
];

const budgetOptions = [
  "Kurang dari 2 Juta IDR",
  "2 Juta - 4 Juta IDR",
  "4 Juta - 7 Juta IDR",
  "7 Juta - 10 Juta IDR",
  "Lebih dari 10 Juta IDR"
];

const PhoneFinder: React.FC = () => {
  const [activities, setActivities] = useState<string[]>([]);
  const [cameraPriority, setCameraPriority] = useState(3);
  const [budget, setBudget] = useState(budgetOptions[1]);
  const [otherPrefs, setOtherPrefs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AIResponse | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  const schema: any = {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        description: "Daftar 3 rekomendasi smartphone teratas.",
        items: {
          type: Type.OBJECT,
          properties: {
            phoneName: { type: Type.STRING, description: "Nama resmi smartphone." },
            reason: { type: Type.STRING, description: "Satu paragraf singkat alasan mengapa ponsel ini direkomendasikan berdasarkan input pengguna." },
            keyFeatures: { type: Type.ARRAY, description: "3-4 fitur unggulan utama.", items: { type: Type.STRING } },
            estimatedPrice: { type: Type.STRING, description: "Perkiraan harga pasaran di Indonesia dalam IDR." },
          },
          required: ["phoneName", "reason", "keyFeatures", "estimatedPrice"]
        }
      }
    },
    required: ["recommendations"]
  };

  const handleActivityChange = (activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      setError("Pilih setidaknya satu aktivitas utama atau kebutuhan fitur.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    
    // Create a canonical cache key from the form inputs
    const cacheKey = [
        ...activities.sort(),
        `cam:${cameraPriority}`,
        `budget:${budget}`,
        `prefs:${otherPrefs.trim().toLowerCase()}`
    ].join('|');

    // 1. Check cache first
    if (supabase) {
        try {
            const { data } = await supabase
                .from('phone_finder_cache')
                .select('result_data')
                .eq('cache_key', cacheKey)
                .single();
            
            if (data && data.result_data) {
                setResults(data.result_data as AIResponse);
                setLoading(false);
                return; // Cache hit, skip AI call
            }
        } catch (cacheError) {
            console.warn("Supabase cache check failed:", cacheError);
        }
    }


    const cameraPriorityText = ["Tidak penting", "Kurang penting", "Cukup penting", "Penting", "Sangat penting"][cameraPriority - 1];
    const today = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const nfcRequired = activities.includes("Butuh NFC");
    const mainActivities = activities.filter(act => act !== "Butuh NFC").join(', ') || "Tidak ada preferensi spesifik";

    const prompt = `**Peran Anda:** Anda adalah seorang Ahli Rekomendasi Gadget yang sangat cerdas dan berpengalaman, dengan fokus utama pada pasar smartphone di Indonesia. Tugas Anda adalah memberikan 3 rekomendasi smartphone yang paling TEPAT, bukan hanya yang paling mahal atau populer, berdasarkan kuesioner pengguna.

    **Konteks Waktu:** Hari ini adalah ${today}. Semua data harga dan ketersediaan harus relevan dengan tanggal ini.

    **Sumber Data Utama:** Prioritaskan sumber data yang relevan untuk Indonesia (misal: situs e-commerce lokal, review dari Jagat Review, Gadgetin) serta data teknis dari GSMArena.

    ---

    **Kuesioner Pengguna (Input):**
    - **Aktivitas Utama:** ${mainActivities}
    - **Prioritas Kualitas Kamera:** ${cameraPriorityText} (skala ${cameraPriority}/5)
    - **Budget Maksimal:** ${budget}
    - **Preferensi Lainnya:** ${otherPrefs || "Tidak ada"}
    ${nfcRequired ? '- **Fitur Wajib:** NFC\n' : ''}
    ---

    **PROSES ANALISIS DAN ATURAN WAJIB (SANGAT PENTING):**

    **1. Analisis Logika Prioritas (Inti Kecerdasan Anda):**
      - **Timbang Bobot:** Analisis setiap jawaban pengguna untuk menentukan bobot prioritas.
      - **Jika "Gaming Berat" dipilih:** Secara **AGRESIF**, prioritaskan ponsel dengan:
        1.  **Chipset Performa Tertinggi** di kelas harganya (misal: Snapdragon 8 series, Dimensity 9000 series).
        2.  **Layar** dengan Refresh Rate **120Hz ke atas** dan response time cepat.
        3.  Sistem **pendingin** yang baik.
        4.  **Baterai besar** dengan fast charging.
      - **Jika "Fotografi & Videografi" dipilih ATAU Prioritas Kamera Sangat Penting (4-5/5):**
        1.  Fokus pada kualitas **sensor kamera utama** (ukuran sensor, OIS/EIS).
        2.  Pertimbangkan keberadaan kamera **ultrawide & telephoto** yang mumpuni.
        3.  Periksa **reputasi pemrosesan gambar** dari brand tersebut.
      - **Jika "Sosial Media & Browsing" atau "Streaming":** Prioritaskan **kualitas layar** (AMOLED, kecerahan tinggi) dan **efisiensi baterai**.
      - **Aturan Budget:** Budget adalah **BATASAN KERAS**. Jangan pernah merekomendasikan ponsel di luar budget yang ditetapkan, bahkan jika hanya selisih sedikit.

    **2. Penanganan Konflik & Trade-off (SANGAT PENTING):**
      - **Identifikasi Konflik:** Kenali jika permintaan pengguna sulit dipenuhi. Contoh: "Gaming Berat" dengan "Budget Kurang dari 2 Juta IDR".
      - **Berikan Kompromi Terbaik:** Jika ada konflik, jangan berikan rekomendasi yang tidak masuk akal. Akui tantangan tersebut dalam field 'reason' dan berikan **rekomendasi kompromi terbaik** yang ada.
      - **Jelaskan Trade-off:** Dalam 'reason', jelaskan trade-off yang harus diterima pengguna. Contoh: "Dengan budget ini, untuk gaming berat kita fokus pada chipset paling kencang, namun mungkin harus kompromi di kualitas kamera."

    **3. Personalisasi Alasan (WAJIB):**
      - Field 'reason' **TIDAK BOLEH GENERIC**. Hubungkan setiap alasan secara langsung dengan input pengguna.
      - **Contoh Buruk:** "Ponsel ini bagus untuk multitasking."
      - **Contoh BAIK:** "Karena kamu memprioritaskan fotografi, ponsel ini punya sensor kamera utama terbesar di kelasnya dan sudah dilengkapi OIS, cocok untuk kebutuhanmu."

    **4. Aturan Fitur Wajib (NFC):**
      - ${nfcRequired ? `**PENTING:** Pengguna secara eksplisit meminta NFC. SEMUA (3) rekomendasi WAJIB memiliki fitur NFC. Ini adalah syarat mutlak.` : 'Tidak ada permintaan fitur wajib spesifik.'}

    **5. Output:**
      - Berikan 3 rekomendasi smartphone.
      - Pastikan 'estimatedPrice' akurat untuk pasar Indonesia.
      - Kembalikan hasil dalam format JSON yang valid sesuai skema yang disediakan.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      const resultText = response.text.trim();
      const parsedResult = JSON.parse(resultText);
      setResults(parsedResult);

       // 3. Save new result to cache
        if (supabase) {
            try {
                await supabase.from('phone_finder_cache').insert({
                    cache_key: cacheKey,
                    result_data: parsedResult
                });
            } catch (cacheError) {
                console.warn("Supabase cache write failed:", cacheError);
            }
        }

    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan saat mencari rekomendasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="finder" className="flex-grow flex flex-col items-center pt-24 pb-4 px-4 sm:px-6 md:px-12 w-full">
      <div className="w-full">
        <div className="max-w-4xl mx-auto text-center">
            <div className="mb-4">
              <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                Smart Pick
              </h1>
              <p className="text-base text-gray-400 mt-2 pb-1">
                Jawab beberapa pertanyaan ini, dan biarkan Kami menemukan HP yang paling pas untukmu.
              </p>
            </div>
        </div>
        
        <div className="max-w-4xl mx-auto w-full">
            {!results && !loading && (
              <form onSubmit={handleSubmit} className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                  <div className="space-y-4">
                      <QuestionSection title="1. Apa aktivitas & kebutuhan utamamu?">
                          <div className="grid grid-cols-2 gap-3">
                              {activityOptions.map(activity => (
                                  <Checkbox
                                      key={activity}
                                      label={activity}
                                      checked={activities.includes(activity)}
                                      onChange={() => handleActivityChange(activity)}
                                  />
                              ))}
                          </div>
                      </QuestionSection>
                      <QuestionSection title="2. Seberapa penting kualitas kamera untukmu?">
                          <div className="flex flex-col items-center">
                              <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={cameraPriority}
                                  onChange={e => setCameraPriority(parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-400"
                              />
                              <span className="mt-1 text-indigo-300 font-semibold text-sm">{["Tidak Penting", "Kurang Penting", "Cukup Penting", "Penting", "Sangat Penting"][cameraPriority - 1]}</span>
                          </div>
                      </QuestionSection>
                      <QuestionSection title="3. Berapa budget maksimalmu?">
                          <select
                              value={budget}
                              onChange={e => setBudget(e.target.value)}
                              className="w-full bg-gray-900/50 border-2 border-indigo-500/50 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          >
                              {budgetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                      </QuestionSection>

                      <QuestionSection title="4. Ada preferensi lain? (Opsional)">
                          <input
                              type="text"
                              value={otherPrefs}
                              onChange={e => setOtherPrefs(e.target.value)}
                              placeholder="Misal: Suka merk Samsung..."
                              className="w-full bg-gray-900/50 border-2 border-indigo-500/50 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          />
                      </QuestionSection>
                  </div>

                  <div className="text-center pt-6">
                      <button
                          type="submit"
                          disabled={loading}
                          className="font-orbitron text-lg font-bold w-full max-w-sm h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group bg-gradient-to-r from-indigo-500 to-fuchsia-500 disabled:opacity-50"
                      >
                          <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center gap-3">
                              {loading ? 'Menganalisis...' : 'Cari Rekomendasi'}
                              {!loading && <SparklesIcon className="w-6 h-6" />}
                          </span>
                      </button>
                      {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
                  </div>
              </form>
            )}
            
            <div className="animate-fade-in">
                {loading && <ResultsSkeleton />}
                {results && <ResultsDisplay results={results} />}
            </div>
        </div>
      </div>
    </section>
  );
};

// --- Sub-components ---
const QuestionSection: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="font-orbitron text-base font-bold text-indigo-300 mb-2">{title}</h3>
    {children}
  </div>
);

const Checkbox: FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${checked ? 'bg-indigo-500/20 border-indigo-400' : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <div className={`w-5 h-5 rounded border-2 ${checked ? 'bg-indigo-400 border-indigo-400' : 'border-gray-500'} flex items-center justify-center mr-3 flex-shrink-0`}>
      {checked && <svg className="w-3 h-3 text-gray-900" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg>}
    </div>
    <span className="text-sm">{label}</span>
  </label>
);

const ResultsSkeleton: FC = () => (
  <div className="mt-8 animate-pulse">
    <div className="h-7 bg-gray-700/50 rounded-md w-1/2 mx-auto mb-6"></div>
    <div className="grid md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-5 space-y-4">
          <div className="h-6 bg-gray-700/50 rounded-md w-3/4"></div>
          <div className="h-5 bg-gray-600/50 rounded-md w-1/3"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-5/6"></div>
          <div className="h-5 bg-gray-600/50 rounded-md w-1/4 mt-2"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

const ResultsDisplay: FC<{ results: AIResponse }> = ({ results }) => (
  <div className="mt-8 animate-fade-in">
    <h2 className="font-orbitron text-2xl font-bold text-center mb-6 text-indigo-300">Rekomendasi Terbaik Untukmu</h2>
    <div className="grid md:grid-cols-3 gap-6">
      {results.recommendations.map((rec, i) => (
        <div key={i} className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-5 flex flex-col">
          <h3 className="font-orbitron text-xl font-bold text-white">{rec.phoneName}</h3>
          <p className="text-fuchsia-400 font-semibold mb-3">{rec.estimatedPrice}</p>
          <p className="text-gray-400 text-sm mb-4 flex-grow text-justify">{rec.reason}</p>
          <div>
            <h4 className="font-semibold text-indigo-400 mb-2 text-sm">Fitur Unggulan:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              {rec.keyFeatures.map((feat, j) => <li key={j}>{feat}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PhoneFinder;