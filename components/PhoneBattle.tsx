import React, { useState, FC, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import VersusIcon from './icons/VersusIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import UsersIcon from './icons/UsersIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import BannerAd from './BannerAd';


// --- INTERFACES (UPDATED FOR ARRAY) ---
interface SpecDetails {
    os?: string;
    processor?: string;
    jaringan?: string;
    wifi?: string;
    display?: string;
    camera?: string;
    battery?: string;
    charging?: string;
    koneksi?: string;
    nfc?: string;
    [key: string]: string | undefined;
}

interface PhoneData {
    name: string;
    specs: SpecDetails;
}

interface BattleResult {
    battleSummary: string;
    targetAudience: string;
    phones: PhoneData[];
}

const PhoneBattle: React.FC = () => {
    const [phoneNames, setPhoneNames] = useState<string[]>(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BattleResult | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const phoneSpecProperties = {
        os: { type: Type.STRING },
        processor: { type: Type.STRING },
        jaringan: { type: Type.STRING },
        wifi: { type: Type.STRING, description: "Standar Wi-Fi yang didukung. Contoh: 'Wi-Fi 6e, 7'" },
        display: { type: Type.STRING },
        camera: { type: Type.STRING },
        battery: { type: Type.STRING },
        charging: { type: Type.STRING },
        koneksi: { type: Type.STRING },
        nfc: { type: Type.STRING },
    };

    // --- SCHEMA UPDATED FOR ARRAY OF PHONES ---
    const schema = {
        type: Type.OBJECT,
        properties: {
            battleSummary: { type: Type.STRING, description: "SATU paragraf SANGAT RINGKAS (maksimal 2-3 kalimat) sebagai ringkasan perbandingan umum untuk SEMUA ponsel yang diadu, dalam Bahasa Indonesia. Jika input bukan smartphone, field ini HARUS berisi pesan error." },
            targetAudience: { type: Type.STRING, description: "SATU paragraf SANGAT RINGKAS (maksimal 2-3 kalimat) sebagai analisis 'Cocok untuk siapa' untuk SEMUA ponsel, dalam Bahasa Indonesia." },
            phones: {
                type: Type.ARRAY,
                description: "Sebuah array berisi data untuk setiap ponsel yang dibandingkan, dalam urutan yang sama seperti di prompt.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nama resmi ponsel" },
                        specs: {
                            type: Type.OBJECT,
                            properties: phoneSpecProperties
                        }
                    },
                    required: ["name", "specs"]
                }
            }
        },
        required: ['battleSummary', 'targetAudience', 'phones']
    };
    
    const handlePhoneNameChange = (index: number, value: string) => {
        const newNames = [...phoneNames];
        newNames[index] = value;
        setPhoneNames(newNames);
    };

    const handleAddPhone = () => {
        if (phoneNames.length < 3) {
            setPhoneNames([...phoneNames, '']);
        }
    };

    const handleRemovePhone = (index: number) => {
        setPhoneNames(phoneNames.filter((_, i) => i !== index));
    };

    const handleBattle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneNames.some(name => !name.trim())) {
            setError('Silakan masukkan nama untuk semua ponsel yang akan diadu.');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        
        // Create a canonical, order-independent key for caching
        const cacheKey = phoneNames.map(name => name.trim().toLowerCase()).sort().join('_vs_');

        // 1. Check cache first
        if (supabase) {
            try {
                const { data } = await supabase
                    .from('phone_battles')
                    .select('battle_data')
                    .eq('cache_key', cacheKey)
                    .single();
                
                if (data && data.battle_data) {
                    setResult(data.battle_data as BattleResult);
                    setLoading(false);
                    return; // Cache hit, skip AI call
                }
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        // 2. If no cache, call AI
        const today = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        const phoneList = phoneNames.map(name => `"${name}"`).join(' vs ');

        const prompt = `**Konteks Waktu: ${today}**
        
        Lakukan analisis perbandingan mendetail antara ${phoneNames.length} perangkat ini: ${phoneList}. **Gunakan tanggal hari ini sebagai titik acuan untuk semua data.** Seluruh respons harus dalam Bahasa Indonesia.
        
        **Aturan Validasi Perangkat (SANGAT PENTING):**
        1.  **Analisis Input:** Periksa setiap nama dalam daftar (${phoneList}).
        2.  **Jika BUKAN Smartphone:** Jika salah satu atau semua input adalah laptop, tablet, atau perangkat lain (BUKAN smartphone), **hentikan proses perbandingan**. Sebagai gantinya, kembalikan JSON di mana field \`battleSummary\` berisi pesan error yang jelas, contoh: "Error: Battle Mode hanya untuk membandingkan smartphone. '[nama perangkat]' terdeteksi sebagai non-smartphone." Biarkan field \`targetAudience\` kosong dan array \`phones\` kosong.
        3.  **Jika SEMUA Smartphone:** Lanjutkan ke aturan berikutnya.

        **Aturan Pengenalan Nama Ponsel (SANGAT PENTING):**
        - **Identifikasi Cerdas:** Untuk setiap nama dalam daftar (${phoneList}), identifikasi nama smartphone yang resmi dan lengkap. Nama yang diberikan bisa jadi hanya nama model (contoh: "F6"), nama alias, atau nama kode.
        - **Output Konsisten:** Field \`name\` untuk setiap objek ponsel dalam array \`phones\` **WAJIB** berisi nama resmi yang lengkap.

        **Sumber Data dan Aturan Akurasi (SANGAT PENTING):**
        - **Spesifikasi Umum:** Prioritaskan data dari GSMArena.
        - **Performa:** Untuk perbandingan yang adil, WAJIB gunakan skor dari **AnTuTu v10** dan **Geekbench 6** untuk SEMUA ponsel. Rujuk pada sumber seperti GSMArena, Kimovil, atau NanoReview.
        - **Konsistensi:** Pastikan semua data (terutama skor benchmark) berasal dari sumber dan metodologi yang sama untuk menjaga objektivitas perbandingan.
        - **Data Terbaru:** Selalu gunakan data yang paling relevan per tanggal hari ini.

        **Instruksi Penting:**
        - Kembalikan data dalam array 'phones' dengan urutan yang SAMA PERSIS seperti daftar di prompt.
        
        **Analisis yang Diperlukan:**
        1. Bandingkan semua spesifikasi teknis utama sesuai skema.
        2. Buat **dua paragraf SANGAT RINGKAS dan PADAT (maksimal 2-3 kalimat per paragraf)** untuk kesimpulan:
            - \`battleSummary\`: Ringkasan umum perbandingan.
            - \`targetAudience\`: Analisis "Cocok untuk siapa" untuk masing-masing ponsel.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema }
            });
            const resultText = response.text.trim();
            const parsedResult: BattleResult = JSON.parse(resultText);
            
            if (parsedResult.battleSummary.toLowerCase().startsWith('error:')) {
                setError(parsedResult.battleSummary);
                setResult(null);
            } else {
                setResult(parsedResult);
                 // 3. Save new result to cache
                if (supabase) {
                    try {
                        await supabase.from('phone_battles').insert({
                            cache_key: cacheKey,
                            battle_data: parsedResult
                        });
                    } catch (cacheError) {
                        console.warn("Supabase cache write failed:", cacheError);
                    }
                }
            }

        } catch (e) {
            console.error(e);
            setError('Terjadi kesalahan saat menganalisis ponsel. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="battle" className="flex-grow flex flex-col items-center pt-28 pb-12 px-4 sm:px-8 md:px-16 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10">
                 <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl"></div>
                 <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full filter blur-3xl"></div>
            </div>
            <div className="container mx-auto relative z-10">
                <div className="text-center mb-6">
                    <h2 className="font-orbitron text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
                        Adu Spesifikasi HP
                    </h2>
                    <p className="text-lg text-gray-400 pb-1">Adu spesifikasi tipe HP kesukaan Kalian, biar gak salah pilih.</p>
                </div>
                
                <BannerAd />
                
                <form onSubmit={handleBattle}>
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mt-6">
                        {phoneNames.map((name, index) => (
                            <React.Fragment key={index}>
                                <PhoneInputCard
                                    phoneName={name}
                                    setPhoneName={(value) => handlePhoneNameChange(index, value)}
                                    placeholder="Tuliskan tipe HP"
                                    borderColor={index === 0 ? "border-cyan-500" : index === 1 ? "border-green-500" : "border-purple-500"}
                                    label={`Penantang ${index + 1}`}
                                    onRemove={index === 2 ? () => handleRemovePhone(index) : undefined}
                                />
                                {index < phoneNames.length - 1 && <VersusIcon />}
                            </React.Fragment>
                        ))}
                        {phoneNames.length < 3 && (
                            <button
                                type="button"
                                onClick={handleAddPhone}
                                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-300 group mt-4 lg:mt-0"
                                aria-label="Tambah HP Lain"
                            >
                                <PlusCircleIcon className="w-8 h-8"/>
                                <span className="font-semibold text-sm group-hover:underline">Tambah HP Lain</span>
                            </button>
                        )}
                    </div>
                    <div className="text-center mt-12">
                         <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className="font-orbitron text-xl font-bold w-72 h-16 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                       bg-gradient-to-r from-cyan-500 via-purple-500 to-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="absolute w-full h-full bg-gradient-to-br from-cyan-500 via-purple-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                                {loading ? 'Membandingkan...' : 'Battle Compare'}
                            </span>
                        </button>
                    </div>
                </form>
                
                <div className="mt-16" aria-live="polite">
                    {loading && <BattleSkeleton phoneCount={phoneNames.length} />}
                    {error && <div className="text-center text-red-400 border border-red-400/50 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {result && <BattleResultDisplay result={result} />}
                </div>

            </div>
        </section>
    );
};

const PhoneInputCard: FC<{phoneName: string; setPhoneName: (name: string) => void; placeholder: string; borderColor: string; label: string; onRemove?: () => void}> = 
({ phoneName, setPhoneName, placeholder, borderColor, label, onRemove }) => {
    const ringColor = borderColor.replace('border-', 'focus:ring-');
    return (
        <div className="relative w-full max-w-xs">
            <label htmlFor={label} className="sr-only">{label}</label>
            <input
                id={label}
                type="text"
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-gray-900/50 border-2 ${borderColor} rounded-full text-center py-3 ${onRemove ? 'pl-6 pr-12' : 'px-6'} text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f1f] ${ringColor} transition-all duration-300`}
            />
            {onRemove && (
                 <button type="button" onClick={onRemove} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-red-400 transition-colors" aria-label="Hapus Penantang 3">
                    <XCircleIcon className="w-6 h-6"/>
                </button>
            )}
        </div>
    );
}

const BattleSkeleton: FC<{ phoneCount: number }> = ({ phoneCount }) => (
    <div className="space-y-12 animate-pulse">
        <div className={`grid grid-cols-1 lg:grid-cols-${phoneCount === 3 ? 3 : 2} gap-8`}>
            {[...Array(phoneCount)].map((_, i) => (
                <div key={i} className="bg-gray-800/20 border-2 border-gray-700 rounded-2xl p-6 space-y-4">
                    <div className="h-8 bg-gray-700/50 rounded-md w-3/4"></div>
                    {[...Array(10)].map((_, j) => <div key={j} className="h-4 bg-gray-700/50 rounded-md w-full"></div>)}
                </div>
            ))}
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800/20 border border-gray-700 rounded-2xl p-6 space-y-3">
                 <div className="h-6 bg-gray-700/50 rounded-md w-1/3 mb-2"></div>
                 <div className="h-4 bg-gray-700/50 rounded-md w-full"></div>
                 <div className="h-4 bg-gray-700/50 rounded-md w-5/6"></div>
            </div>
             <div className="bg-gray-800/20 border border-gray-700 rounded-2xl p-6 space-y-3">
                 <div className="h-6 bg-gray-700/50 rounded-md w-1/3 mb-2"></div>
                 <div className="h-4 bg-gray-700/50 rounded-md w-full"></div>
                 <div className="h-4 bg-gray-700/50 rounded-md w-5/6"></div>
            </div>
        </div>
    </div>
);

const BattleResultDisplay: FC<{ result: BattleResult }> = ({ result }) => {
    const gridColsClass = result.phones.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
    return (
        <div className="space-y-12 animate-fade-in">
            <div className={`grid grid-cols-1 ${gridColsClass} gap-8`}>
                {result.phones.map((phone, index) => (
                     <ResultCard key={index} phone={phone} />
                ))}
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="bg-gray-800/30 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <LightbulbIcon className="w-6 h-6 text-cyan-400"/>
                        <h4 className="font-orbitron text-xl font-bold">Kesimpulan Hasil</h4>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm">{result.battleSummary}</p>
                </div>
                <div className="bg-gray-800/30 border border-green-400/20 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <UsersIcon className="w-6 h-6 text-green-400"/>
                        <h4 className="font-orbitron text-xl font-bold">Cocok Untuk Siapa</h4>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{result.targetAudience}</p>
                </div>
            </div>
        </div>
    );
};

const ResultCard: FC<{ phone: PhoneData }> = ({ phone }) => {
    const specOrder: { key: keyof SpecDetails; label: string }[] = [
        { key: 'os', label: 'OS' }, { key: 'processor', label: 'Prosesor' }, { key: 'jaringan', label: 'Jaringan' },
        { key: 'wifi', label: 'Wi-Fi' }, { key: 'display', label: 'Display' }, { key: 'camera', label: 'Kamera' },
        { key: 'battery', label: 'Baterai' }, { key: 'charging', label: 'Charging' }, { key: 'koneksi', label: 'Koneksi' },
        { key: 'nfc', label: 'NFC' },
    ];

    return (
        <div className={`bg-gray-800/20 border-2 border-gray-700 rounded-2xl p-6`}>
            <h4 className="font-orbitron text-2xl font-bold mb-6 truncate">{phone.name}</h4>
            <div className="mt-4">
                 <h5 className="text-lg font-semibold text-cyan-400 mb-3 font-orbitron">Spesifikasi Utama</h5>
                 <div className="space-y-1 text-sm">
                    {specOrder.map(({ key, label }, index) => {
                        const value = phone.specs[key];
                        if (!value) return null;
                        return (
                            <div key={key} className={`flex justify-between gap-4 p-2 rounded-md ${index % 2 === 0 ? 'bg-gray-700/20' : ''}`}>
                                <span className="font-semibold text-gray-400">{label}</span>
                                <span className="text-right text-white font-medium">{value}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default PhoneBattle;