import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SparklesIcon from './icons/SparklesIcon';
import ShareButtons from './ShareButtons';

// --- INTERFACES ---
interface Recommendation {
  phoneName: string;
  reason: string;
  keyFeatures: string[];
  estimatedPrice: string;
  rilis?: string;
}

const activityOptions = [
  "Sosial Media & Browsing",
  "Gaming Berat",
  "Fotografi & Videografi",
  "Produktivitas (Email, Doc.)",
  "Streaming Film & Video",
  "Baterai Besar",
  "Layar 120 Hz",
  "Koneksi NFC"
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
  const [result, setResult] = useState<Recommendation | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  const schema: any = {
    type: Type.OBJECT,
    properties: {
        phoneName: { type: Type.STRING, description: "Nama resmi smartphone. Jika tidak ada yang cocok, isi dengan 'Tidak ada rekomendasi yang cocok'." },
        reason: { type: Type.STRING, description: "Satu paragraf singkat dan sangat personal alasan mengapa ponsel ini direkomendasikan (atau mengapa tidak ada rekomendasi) berdasarkan input pengguna." },
        keyFeatures: { type: Type.ARRAY, description: "3-4 fitur unggulan utama. Jika tidak ada rekomendasi, kembalikan array kosong.", items: { type: Type.STRING } },
        estimatedPrice: { type: Type.STRING, description: "Perkiraan harga pasaran di Indonesia dalam IDR. Jika tidak ada rekomendasi, isi string kosong." },
        rilis: { type: Type.STRING, description: "Bulan dan tahun rilis. Contoh: 'September 2024'. Jika tidak ada rekomendasi, isi string kosong." },
    },
    required: ["phoneName", "reason", "keyFeatures", "estimatedPrice", "rilis"]
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
    setResult(null);
    
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
                setResult(data.result_data as Recommendation);
                setLoading(false);
                return; // Cache hit, skip AI call
            }
        } catch (cacheError) {
            console.warn("Supabase cache check failed:", cacheError);
        }
    }


    const cameraPriorityText = ["Tidak penting", "Kurang penting", "Cukup penting", "Penting", "Sangat penting"][cameraPriority - 1];
    const nfcRequired = activities.includes("Koneksi NFC");
    const mainActivities = activities.filter(act => act !== "Koneksi NFC").join(', ') || "Tidak ada preferensi spesifik";

    const prompt = `**Peran Anda:** Anda adalah seorang Ahli Rekomendasi Gadget yang sangat cerdas dan berpengalaman, dengan fokus utama pada pasar smartphone di Indonesia. Tugas Anda adalah memberikan **SATU rekomendasi smartphone TUNGGAL** yang paling TEPAT dan PRESISI, bukan hanya yang paling mahal atau populer, berdasarkan kuesioner pengguna.

    **Konteks Waktu:** Hari ini adalah 2 Oktober 2025. Semua data harga dan ketersediaan harus relevan dengan tanggal ini. Ini berarti semua model yang rilis hingga September 2025 (termasuk iPhone 17 series, Xiaomi 17 series) adalah produk yang tersedia di pasaran.

    **Sumber Data Utama:** Prioritaskan sumber data yang relevan untuk Indonesia (misal: situs e-commerce lokal, review dari Jagat Review, Gadgetin) serta data teknis dari GSMArena.

    ---

    **Kuesioner Pengguna (Input):**
    - **Aktivitas Utama & Kebutuhan Fitur:** ${mainActivities}
    - **Prioritas Kualitas Kamera:** ${cameraPriorityText} (skala ${cameraPriority}/5)
    - **Budget Maksimal:** ${budget}
    - **Preferensi Lainnya:** ${otherPrefs || "Tidak ada"}
    ${nfcRequired ? '- **Fitur Wajib:** NFC\n' : ''}
    ---

    **PROSES ANALISIS DAN ATURAN WAJIB (SANGAT PENTING):**

    **LANGKAH 1: SINTESIS PROFIL PENGGUNA (Langkah Wajib Pertama)**
    -   Sebelum mencari HP, Anda **WAJIB** membuat profil singkat pengguna di dalam "pikiran" Anda. Sintesiskan semua input menjadi sebuah persona.
    -   **Contoh Profil Mental:** "Pengguna ini adalah seorang *visual enthusiast* dengan budget menengah yang memprioritaskan pengalaman scrolling mulus (dari pilihan 'Layar 120 Hz'), namun tidak terlalu peduli dengan kamera (dari skala prioritas kamera yang rendah)." ATAU "Pengguna ini adalah seorang *power user* yang butuh baterai super awet untuk produktivitas, budget terbatas."

    **LANGKAH 2: ATURAN FILTER & LOGIKA PRIORITAS (Berdasarkan Profil)**

    1.  **Aturan Filter Merek (Prioritas Tertinggi):**
        -   Analisis Preferensi: Periksa input 'Preferensi Lainnya'. Jika pengguna menyebutkan nama merek (contoh: "Suka merk Samsung", "harus Oppo", "selain iPhone"), Anda **WAJIB** mematuhi preferensi ini.
        -   Filter Mutlak: Rekomendasi **HARUS** berasal dari merek yang diminta. Jika tidak ada HP dari merek tersebut yang cocok dengan kriteria lain, jelaskan di 'reason' dan jangan merekomendasikan merek lain.

    2.  **Analisis Logika Prioritas (Inti Kecerdasan Anda):**
        -   **Jika "Layar 120 Hz" dipilih:** Secara **AGRESIF**, prioritaskan ponsel dengan layar refresh rate **minimal 120Hz** sebagai faktor penentu utama.
        -   **Jika "Baterai Besar" dipilih:** Filter ponsel dengan kapasitas baterai di atas rata-rata (misalnya, 5000mAh ke atas) sebagai syarat mutlak.
        -   **Jika "Gaming Berat" dipilih:** Secara **AGRESIF**, prioritaskan ponsel dengan chipset performa tertinggi di kelas harganya, layar 120Hz ke atas, dan sistem pendingin yang baik.
        -   **Jika "Fotografi & Videografi" dipilih ATAU Prioritas Kamera Sangat Penting (4-5/5):** Fokus pada kualitas sensor kamera utama (ukuran sensor, OIS/EIS) dan reputasi pemrosesan gambar brand.
        -   **Aturan Budget:** Budget adalah **BATASAN KERAS**. Jangan pernah merekomendasikan ponsel di luar budget.

    **LANGKAH 3: PERSONALIASI ALASAN (WAJIB)**
    -   Field 'reason' **TIDAK BOLEH GENERIC**. **Wajib merujuk kembali ke profil pengguna** yang telah Anda sintesis di Langkah 1.
    -   **Contoh Buruk:** "Ponsel ini bagus untuk multitasking."
    -   **Contoh BAIK:** "Melihat profilmu sebagai *visual enthusiast* yang butuh layar 120Hz untuk sosial media, ponsel ini adalah pilihan paling pas di budget-mu karena layarnya yang sangat mulus."

    **LANGKAH 4: ATURAN FITUR WAJIB (NFC)**
    -   ${nfcRequired ? `**PENTING:** Pengguna meminta NFC. Rekomendasi WAJIB memiliki fitur NFC. Ini adalah syarat mutlak.` : 'Tidak ada permintaan fitur wajib spesifik.'}

    **LANGKAH 5: Output**
    -   Berikan **SATU** rekomendasi smartphone tunggal berdasarkan seluruh analisis di atas.
    -   Sertakan bulan dan tahun rilis di field 'rilis'.
    -   Pastikan 'estimatedPrice' akurat untuk pasar Indonesia.
    -   Kembalikan hasil dalam format JSON yang valid sesuai skema.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      const resultText = response.text.trim();
      const parsedResult: Recommendation = JSON.parse(resultText);
      setResult(parsedResult);

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
        <div className="max-w-5xl mx-auto text-center">
            <div className="mb-4">
              <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                Temukan HP Impianmu
              </h1>
              <p className="text-base text-gray-400 mt-2 pb-1">
                Jawab beberapa pertanyaan ini, dan biarkan Kami menemukan HP yang paling pas untukmu.
              </p>
            </div>
        </div>
        
        <div className="max-w-5xl mx-auto w-full">
            {!result && !loading && (
              <form onSubmit={handleSubmit} className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10 gap-y-6">
                      {/* Column 1: Activities - takes more vertical space */}
                      <div className="flex flex-col">
                          <QuestionSection title="1. Apa aktivitas & kebutuhan utamamu?">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      </div>
                      
                      {/* Column 2: Shorter questions */}
                      <div className="space-y-6 flex flex-col">
                          <QuestionSection title="2. Seberapa penting kualitas kamera?">
                              <div className="flex flex-col items-center pt-1">
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
                  </div>

                  <div className="text-center pt-8">
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
                      {loading && (
                        <p className="text-sm text-gray-400 mt-3 animate-pulse">
                            Tunggu sebentar ya, jangan pindah menu dulu...
                        </p>
                      )}
                      {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
                  </div>
              </form>
            )}
            
            <div className="animate-fade-in">
                {loading && <ResultsSkeleton />}
                {result && <ResultsDisplay result={result} />}
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
    <div className="max-w-xl mx-auto">
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-5 space-y-4">
          <div className="h-6 bg-gray-700/50 rounded-md w-3/4"></div>
          <div className="h-5 bg-gray-600/50 rounded-md w-1/3"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-5/6"></div>
          <div className="h-5 bg-gray-600/50 rounded-md w-1/4 mt-2"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
          <div className="h-4 bg-gray-600/50 rounded-md w-full"></div>
        </div>
    </div>
  </div>
);

const ResultsDisplay: FC<{ result: Recommendation }> = ({ result }) => {
    const shareText = `AI JAGO-HP merekomendasikan ${result.phoneName} untukku!\n\nAlasannya: ${result.reason}\n\nCari HP impianmu juga di JAGO-HP.`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const phoneBrand = result.phoneName.toLowerCase();
    const isSamsung = phoneBrand.includes('samsung');
    const isApple = phoneBrand.includes('apple') || phoneBrand.includes('iphone');
    const isXiaomi = phoneBrand.includes('xiaomi') || phoneBrand.includes('redmi');
    const isOppo = phoneBrand.includes('oppo');
    const isVivo = phoneBrand.includes('vivo') || phoneBrand.includes('iqoo');
    const isPoco = phoneBrand.includes('poco');
    const isInfinix = phoneBrand.includes('infinix');
    const isItel = phoneBrand.includes('itel');
    const isHuawei = phoneBrand.includes('huawei');
    const isHonor = phoneBrand.includes('honor');
    const isTecno = phoneBrand.includes('tecno');
    const isRealme = phoneBrand.includes('realme');

    return (
      <div className="mt-8 animate-fade-in">
        <h2 className="font-orbitron text-2xl font-bold text-center mb-6 text-indigo-300">Rekomendasi Terbaik Untukmu</h2>
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-800/30 border-2 border-indigo-500/30 rounded-2xl p-5 flex flex-col shadow-lg shadow-indigo-500/10">
            <h3 className="font-orbitron text-xl font-bold text-white">{result.phoneName}</h3>
            {result.rilis && <p className="text-indigo-300 text-sm mb-1">Rilis: {result.rilis}</p>}
            {result.estimatedPrice && <p className="text-fuchsia-400 font-semibold mb-3">{result.estimatedPrice}</p>}
            <p className="text-gray-300 text-sm mb-4 flex-grow text-justify leading-relaxed">{result.reason}</p>
            {result.keyFeatures && result.keyFeatures.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-indigo-400 mb-2 text-sm">Fitur Unggulan:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {result.keyFeatures.map((feat, j) => <li key={j}>{feat}</li>)}
                </ul>
              </div>
            )}
            
            {isSamsung && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/6AbvXZfbSV"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isApple && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/9fBniOs3ak"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isXiaomi && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/AUkuiQBtYg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isOppo && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/BKiPhDZHl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isVivo && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/1BDFc1esr2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            
            {isPoco && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/qaPDaBvho"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isInfinix && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/qaPDpESoL"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isItel && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/803ZlEyaDj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isHuawei && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/2B5mokEaKQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isHonor && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/4AqrChdhXf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            {isTecno && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/gGz2ZEcaj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}
            
            {isRealme && (
                <div className="text-center my-4">
                    <a
                        href="https://s.shopee.co.id/3qE0oVUbZt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                   bg-gradient-to-r from-green-400 to-teal-500"
                    >
                        <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                            Beli Langsung
                        </span>
                    </a>
                </div>
            )}

            <ShareButtons shareText={shareText} shareUrl={shareUrl} />
          </div>
        </div>
      </div>
    );
};

export default PhoneFinder;