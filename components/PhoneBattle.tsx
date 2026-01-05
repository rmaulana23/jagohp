
import React, { useState, FC, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import VersusIcon from './icons/VersusIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import UsersIcon from './icons/UsersIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import CrownIcon from './icons/CrownIcon';
import EcommerceButtons from './EcommerceButtons';

interface SpecDetails {
    rilis?: string;
    os?: string;
    processor?: string;
    ram?: string;
    antutuScore?: number | null;
    jaringan?: string;
    display?: string;
    camera?: string;
    battery?: string;
    charging?: string;
    nfc?: string;
    hargaIndonesia?: string;
    [key: string]: string | number | null | undefined;
}

interface PhoneData {
    name: string;
    specs: SpecDetails;
}

export interface BattleResult {
    battleSummary?: string;
    targetAudience?: string;
    phones: PhoneData[];
    winnerName?: string;
}

interface PhoneBattleProps {
    initialResult?: BattleResult | null;
    initialPhoneA?: string;
    clearInitialPhoneA?: () => void;
}

// Utility to format brand names correctly
const formatBrandName = (name: string): string => {
    if (!name) return name;
    return name.replace(/iqoo/gi, 'iQOO');
};

const PhoneBattle: React.FC<PhoneBattleProps> = ({ initialResult = null, initialPhoneA = '', clearInitialPhoneA }) => {
    const [phoneNames, setPhoneNames] = useState<string[]>(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BattleResult | null>(initialResult);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        if (initialPhoneA) {
            setPhoneNames([initialPhoneA, '']);
            if (clearInitialPhoneA) clearInitialPhoneA();
        }
    }, [initialPhoneA]);

    const phoneSpecProperties = {
        rilis: { type: Type.STRING, description: "Wajib menyertakan nama bulan dan tahun. Contoh: 'September 2024' atau 'Desember 2025 (Estimasi)'." },
        os: { type: Type.STRING },
        processor: { type: Type.STRING },
        ram: { type: Type.STRING, description: "Ukuran dan tipe RAM. Contoh: '8GB LPDDR5X'" },
        antutuScore: { type: Type.INTEGER, description: "Skor benchmark AnTuTu v10 sebagai angka integer." },
        jaringan: { type: Type.STRING },
        display: { type: Type.STRING },
        camera: { type: Type.STRING },
        battery: { type: Type.STRING },
        charging: { type: Type.STRING },
        nfc: { type: Type.STRING },
        hargaIndonesia: { type: Type.STRING, description: "Perkiraan harga pasar di Indonesia dlm Rupiah awal 2026. Contoh: 'Rp 14.599.000'" }
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            battleSummary: { type: Type.STRING, description: "Ringkasan perbandingan mendalam." },
            targetAudience: { type: Type.STRING, description: "Analisis target pasar yang spesifik." },
            phones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        specs: { type: Type.OBJECT, properties: phoneSpecProperties }
                    },
                    required: ["name", "specs"]
                }
            },
            winnerName: { type: Type.STRING, description: "Wajib diisi dengan Nama HP yang sedikit lebih unggul secara keseluruhan dari list 'phones' yang Anda buat, atau tulis 'Seri' jika benar-benar seimbang." }
        },
        required: ['battleSummary', 'targetAudience', 'phones', 'winnerName']
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
            setError('Silakan masukkan nama untuk semua perangkat yang akan diadu.');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        
        const cacheKey = phoneNames.map(name => name.trim().toLowerCase()).sort().join('_vs_');

        if (supabase) {
            try {
                const { data } = await supabase.from('phone_battles').select('battle_data').eq('cache_key', cacheKey).single();
                if (data && data.battle_data) {
                    setResult(data.battle_data as BattleResult);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) { console.warn("Cache check failed:", cacheError); }
        }

        const phoneList = phoneNames.map(name => `"${name}"`).join(' vs ');
        const prompt = `**Peran:** Ahli Teknologi tingkat dunia dengan pengetahuan terbaru hingga awal Januari 2026.
**Tugas:** Lakukan analisis perbandingan mendalam dalam Bahasa Indonesia antara: ${phoneList}. 
**Ketentuan Pemenang:** Evaluasi semua aspek (Performa, Kamera, Baterai, Harga). Tentukan satu yang sedikit lebih unggul dan tulis namanya di 'winnerName' secara persis seperti di field 'name'. Jika seimbang, tulis 'Seri'.
**Sumber:** GSMArena, PhoneArena, dan data benchmark terbaru 2026. 
**Penting:** Data rilis WAJIB menyertakan nama bulan. Brand 'iQOO' selalu ditulis 'iQOO'.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema as any }
            });
            const parsedResult: BattleResult = JSON.parse(response.text.trim());
            setResult(parsedResult);
            if (supabase) {
                await supabase.from('phone_battles').insert({ cache_key: cacheKey, battle_data: parsedResult });
            }
        } catch (e) {
            setError('Terjadi kesalahan saat menganalisis. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="battle" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-6xl">
                
                {/* Banner Image Updated */}
                <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                    <img 
                        src="https://imgur.com/DDAhgsz.jpg" 
                        alt="JAGO-HP Compare Banner" 
                        className="w-full h-auto object-cover max-h-[350px] block"
                    />
                </div>

                { !result && (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 font-orbitron">
                                Compare
                            </h2>
                            <p className="text-base text-slate-500">Bandingkan spesifikasi HP secara berdampingan, biar tidak salah pilih.</p>
                        </div>
                        <form onSubmit={handleBattle} className="glass p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
                                {phoneNames.map((name, index) => (
                                    <React.Fragment key={index}>
                                        <PhoneInputCard
                                            phoneName={name}
                                            setPhoneName={(value) => handlePhoneNameChange(index, value)}
                                            placeholder={`Masukkan Tipe HP ${index + 1}`}
                                            onRemove={phoneNames.length > 2 ? () => handleRemovePhone(index) : undefined}
                                        />
                                        {index < phoneNames.length - 1 && <VersusIcon />}
                                    </React.Fragment>
                                ))}
                                {phoneNames.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleAddPhone}
                                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors duration-200 group mt-4 lg:mt-0"
                                    >
                                        <PlusCircleIcon className="w-7 h-7 text-slate-400 group-hover:text-[color:var(--accent2)]"/>
                                        <span className="font-semibold text-sm">Tambah Pembanding</span>
                                    </button>
                                )}
                            </div>
                            <div className="text-center mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full max-w-xs px-8 py-3 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                                >
                                    {loading ? 'Membandingkan...' : 'Adu Spesifikasi'}
                                </button>
                                {loading && <p className="text-sm text-slate-500 mt-3 animate-pulse">Pakar AI sedang menimbang-nimbang pilihan terbaik...</p>}
                            </div>
                        </form>
                    </>
                )}
                
                <div className="mt-12" aria-live="polite">
                    {loading && !result && <BattleSkeleton phoneCount={phoneNames.length} />}
                    {error && <div className="text-center text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {result && (
                        <>
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900 font-orbitron text-center">
                                Hasil Analisis
                            </h2>
                            <BattleResultDisplay result={result} onReset={() => { setResult(null); setPhoneNames(['', '']); }} />
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

const PhoneInputCard: FC<{phoneName: string; setPhoneName: (name: string) => void; placeholder: string; onRemove?: () => void}> = 
({ phoneName, setPhoneName, placeholder, onRemove }) => (
    <div className="relative w-full max-w-xs">
        <input
            type="text"
            value={phoneName}
            onChange={(e) => setPhoneName(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-slate-100 border border-slate-300 rounded-lg text-center py-2.5 ${onRemove ? 'pl-4 pr-10' : 'px-4'} text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all`}
        />
        {onRemove && (
            <button type="button" onClick={onRemove} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-red-500 transition-colors">
                <XCircleIcon className="w-5 h-5"/>
            </button>
        )}
    </div>
);

const BattleSkeleton: FC<{ phoneCount: number }> = ({ phoneCount }) => (
    <div className="space-y-8 animate-pulse">
        <div className={`grid grid-cols-1 md:grid-cols-${phoneCount} gap-6`}>
            {[...Array(phoneCount)].map((_, i) => (
                <div key={i} className="glass p-5 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="space-y-2 pt-4 mt-2 border-t border-slate-200">
                        {[...Array(6)].map((_, j) => <div key={j} className="h-4 bg-slate-200 rounded w-full"></div>)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const BattleResultDisplay: FC<{ result: BattleResult; onReset: () => void }> = ({ result, onReset }) => (
    <div className="animate-fade-in space-y-8">
        <div className={`grid grid-cols-1 ${result.phones.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 items-stretch`}>
            {result.phones.map((phone, index) => {
                // Check for winner by name (case insensitive for safety)
                const isWinner = result.winnerName && 
                                 result.winnerName !== 'Seri' && 
                                 phone.name.toLowerCase() === result.winnerName.toLowerCase();
                return (
                    <div key={index} className={`relative glass p-5 flex flex-col transition-all duration-300 ${isWinner ? 'border-2 border-yellow-400 shadow-xl ring-4 ring-yellow-400/10' : ''}`}>
                        {isWinner && (
                            <div className="absolute -top-4 right-4 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-xs font-black flex items-center gap-2 shadow-lg animate-bounce">
                                <CrownIcon className="w-4 h-4" />
                                <span>REKOMENDASI</span>
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{formatBrandName(phone.name)}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rilis: {phone.specs?.rilis || 'N/A'}</p>
                        
                        <dl className="space-y-1 text-sm flex-grow">
                            {Object.entries(phone.specs).map(([key, val]) => (
                                val ? (
                                    <div key={key} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
                                        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0 mt-0.5">{key.replace(/([A-Z])/g, ' $1')}</dt>
                                        <dd className="text-slate-800 text-right break-words font-bold">{val}</dd>
                                    </div>
                                ) : null
                            ))}
                        </dl>
                        <div className="mt-6">
                            <EcommerceButtons phoneName={phone.name} isCompact={true} />
                        </div>
                    </div>
                );
            })}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6 border-l-4 border-indigo-500">
                <h3 className="text-lg font-bold flex items-center gap-3 text-slate-900">
                    <LightbulbIcon className="w-6 h-6 text-indigo-500" /> 
                    Ringkasan Adu
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed font-medium">{result.battleSummary}</p>
            </div>
            <div className="glass p-6 border-l-4 border-emerald-500">
                <h3 className="text-lg font-bold flex items-center gap-3 text-slate-900">
                    <UsersIcon className="w-6 h-6 text-emerald-500" /> 
                    Saran Penggunaan
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed font-medium">{result.targetAudience}</p>
            </div>
        </div>
        <div className="text-center pt-4">
            <button onClick={onReset} className="px-10 py-3 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-colors shadow-lg active:scale-95">Bandingkan HP Lain</button>
        </div>
    </div>
);

export default PhoneBattle;
