import React, { useState, FC, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import VersusIcon from './icons/VersusIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import CrownIcon from './icons/CrownIcon';
import EcommerceButtons from './EcommerceButtons';
import SparklesIcon from './icons/SparklesIcon';

interface SpecDetails {
    rilis?: string;
    os?: string;
    processor?: string;
    ram?: string;
    storage?: string;
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
    imageUrl?: string;
}

export interface BattleResult {
    battleSummary?: string;
    phones: PhoneData[];
    winnerName?: string;
}

interface PhoneBattleProps {
    initialResult?: BattleResult | null;
    initialPhoneA?: string;
    clearInitialPhoneA?: () => void;
    clearGlobalBattleResult?: () => void;
}

const formatBrandName = (name: string): string => {
    if (!name) return name;
    return name.replace(/iqoo/gi, 'iQOO');
};

const PhoneBattle: React.FC<PhoneBattleProps> = ({ initialResult = null, initialPhoneA = '', clearInitialPhoneA, clearGlobalBattleResult }) => {
    const [phoneNames, setPhoneNames] = useState<string[]>(['', '']);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Menimbang pilihan...');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BattleResult | null>(initialResult);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        if (loading) {
            const messages = [
                "Melakukan kueri ke GSMArena & PhoneArena...",
                "Membandingkan rincian teknis global...",
                "Menganalisis benchmark terbaru 2025/2026...",
                "Memverifikasi varian model secara akurat...",
                "Menimbang efisiensi daya & performa...",
                "Menyusun ringkasan duel pakar global..."
            ];
            let i = 0;
            const interval = setInterval(() => {
                i = (i + 1) % messages.length;
                setLoadingMessage(messages[i]);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [loading]);

    const enrichWithImages = async (battleData: BattleResult): Promise<BattleResult> => {
        if (!supabase) return battleData;
        const enrichedPhones = await Promise.all(battleData.phones.map(async (phone) => {
            try {
                const { data } = await supabase.from('smart_reviews').select('review_data').eq('cache_key', phone.name.toLowerCase().trim()).single();
                if (data && data.review_data && data.review_data.imageUrl) {
                    return { ...phone, imageUrl: data.review_data.imageUrl };
                }
            } catch (e) {}
            return phone;
        }));
        return { ...battleData, phones: enrichedPhones };
    };

    useEffect(() => {
        if (initialPhoneA) {
            setPhoneNames([initialPhoneA, '']);
            if (clearInitialPhoneA) clearInitialPhoneA();
        }
    }, [initialPhoneA]);

    useEffect(() => {
        if (initialResult && initialResult.phones.every(p => !p.imageUrl)) {
            enrichWithImages(initialResult).then(setResult);
        } else {
            setResult(initialResult);
        }
    }, [initialResult]);

    const phoneSpecProperties = {
        rilis: { type: Type.STRING, description: "Bulan & Tahun (Januari 2026 atau 2025)." },
        os: { type: Type.STRING },
        processor: { type: Type.STRING },
        ram: { type: Type.STRING },
        storage: { type: Type.STRING },
        antutuScore: { type: Type.INTEGER, description: "Skor AnTuTu v10 terbaru." },
        jaringan: { type: Type.STRING },
        display: { type: Type.STRING },
        camera: { type: Type.STRING },
        battery: { type: Type.STRING },
        charging: { type: Type.STRING },
        nfc: { type: Type.STRING },
        hargaIndonesia: { type: Type.STRING, description: "Harga pasar di Indonesia (2025/2026)." }
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            battleSummary: { type: Type.STRING, description: "Ringkasan perbandingan pakar global." },
            phones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Official Full Name (Contoh: Xiaomi 17 Pro Max 5G)" },
                        specs: { type: Type.OBJECT, properties: phoneSpecProperties }
                    },
                    required: ["name", "specs"]
                }
            },
            winnerName: { type: Type.STRING, description: "Nama HP yang lebih unggul secara teknis." }
        },
        required: ['battleSummary', 'phones', 'winnerName']
    };
    
    const handleBattle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneNames.some(name => !name.trim())) {
            setError('Silakan masukkan nama perangkat pembanding.');
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
                    const enriched = await enrichWithImages(data.battle_data as BattleResult);
                    setResult(enriched);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) {}
        }

        const phoneList = phoneNames.map(name => `"${name}"`).join(' vs ');
        const prompt = `**PERAN:** Pakar Gadget Global Terkemuka JAGO-HP. 
**TUGAS:** Bandingkan secara presisi: ${phoneList}. 
**SUMBER DATA:** Anda WAJIB menggunakan pencarian internet (Google Search) untuk mengambil rincian teknis terbaru dari GSMArena & PhoneArena.
**KETELITIAN MODEL:** Pastikan membedakan varian secara akurat (Xiaomi 17 Pro Max 5G vs Xiaomi 17 Ultra).
**DATA TAHUN:** Fokus pada model 2025. Gunakan rumor kredibel jika membandingkan model awal 2026.
**OUTPUT:** Gunakan nama resmi lengkap di field 'name'.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json", 
                    responseSchema: schema as any,
                    tools: [{ googleSearch: {} }] as any
                }
            });
            const parsedResult: BattleResult = JSON.parse(response.text.trim());
            const enrichedResult = await enrichWithImages(parsedResult);
            setResult(enrichedResult);
            if (supabase) {
                try {
                    await supabase.from('phone_battles').insert({ cache_key: cacheKey, battle_data: parsedResult });
                } catch (supabaseErr) {
                    console.warn("Supabase cache error", supabaseErr);
                }
            }
        } catch (e) {
            setError('Gagal menganalisis. Database global tidak merespon, pastikan koneksi stabil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="battle" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-6xl">
                {/* Header: Judul dan Subjudul yang selalu muncul */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 font-orbitron">Compare</h2>
                    <p className="text-base text-slate-500">Bandingkan spesifikasi HP secara berdampingan biar tidak salah pilih.</p>
                </div>

                {!result && !loading && (
                    <form onSubmit={handleBattle} className="glass p-6 md:p-8 animate-fade-in">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
                            {phoneNames.map((name, index) => (
                                <React.Fragment key={index}>
                                    <div className="relative w-full max-w-xs">
                                        <input type="text" value={name} onChange={(e) => {const n = [...phoneNames]; n[index]=e.target.value; setPhoneNames(n);}} placeholder={`Tulis nama/tipe hpnya...`} className="w-full bg-slate-100 border border-slate-300 rounded-lg text-center py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)]" />
                                        {phoneNames.length > 2 && <button type="button" onClick={() => setPhoneNames(phoneNames.filter((_, i) => i !== index))} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-red-500"><XCircleIcon className="w-5 h-5"/></button>}
                                    </div>
                                    {index < phoneNames.length - 1 && <VersusIcon />}
                                </React.Fragment>
                            ))}
                            {phoneNames.length < 3 && <button type="button" onClick={() => setPhoneNames([...phoneNames, ''])} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 group mt-4 lg:mt-0"><PlusCircleIcon className="w-7 h-7 text-slate-400 group-hover:text-[color:var(--accent2)]"/><span className="font-semibold text-sm">Tambah</span></button>}
                        </div>
                        <div className="text-center mt-8"><button type="submit" disabled={loading} className="w-full max-w-xs px-8 py-3 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 shadow-md"> Adu Spesifikasi</button></div>
                    </form>
                )}
                
                <div className="mt-12" aria-live="polite">
                    {loading && (
                        <div className="mb-20 text-center animate-fade-in">
                            <div className="inline-block relative">
                                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                                <SparklesIcon className="w-6 h-6 text-yellow-400 absolute top-0 right-0 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 animate-pulse">{loadingMessage}</h3>
                        </div>
                    )}
                    {error && <div className="text-center text-red-500 border bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {result && (
                        <div className="animate-fade-in space-y-8">
                            <div className={`grid grid-cols-1 ${result.phones.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 items-stretch`}>
                                {result.phones.map((phone, index) => {
                                    const isWinner = result.winnerName && phone.name.toLowerCase() === result.winnerName.toLowerCase();
                                    
                                    // Definisi urutan kunci spesifikasi yang diinginkan
                                    const specOrder = [
                                        'os', 
                                        'jaringan', 
                                        'display', 
                                        'camera', 
                                        'ram', 
                                        'charging', 
                                        'storage',  
                                        'battery',  
                                        'processor', 
                                        'koneksi',
                                        'nfc', 
                                        'antutuScore', // AnTuTu dipindah ke sini (setelah NFC)
                                        'hargaIndonesia'
                                    ];

                                    return (
                                        <div key={index} className={`relative glass p-5 flex flex-col transition-all duration-300 ${isWinner ? 'border-2 border-yellow-400 shadow-xl ring-4 ring-yellow-400/10' : ''}`}>
                                            {isWinner && <div className="absolute -top-4 right-4 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-xs font-black flex items-center gap-2 shadow-lg animate-bounce z-10"><CrownIcon className="w-4 h-4" /><span>PEMENANG</span></div>}
                                            <div className="w-full aspect-square mb-4 rounded-xl bg-slate-50 border flex items-center justify-center p-4 overflow-hidden group">{phone.imageUrl ? <img src={phone.imageUrl} alt={phone.name} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" /> : <div className="text-center text-slate-300 flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg><span className="text-[10px] font-bold uppercase">No Image</span></div>}</div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{formatBrandName(phone.name)}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rilis: {phone.specs?.rilis || 'N/A'}</p>
                                            <dl className="space-y-1 text-sm flex-grow">
                                                {specOrder.map((key) => {
                                                    const val = phone.specs[key];
                                                    if (!val || key === 'rilis') return null;
                                                    
                                                    // Nama label kustom
                                                    let label = key.replace(/([A-Z])/g, ' $1');
                                                    if (key === 'antutuScore') label = 'AnTuTu v10';
                                                    if (key === 'hargaIndonesia') label = 'Harga Indonesia';

                                                    return (
                                                        <div key={key} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
                                                            <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0 mt-0.5">{label}</dt>
                                                            <dd className="text-slate-800 text-right font-bold">
                                                                {typeof val === 'number' ? val.toLocaleString('id-ID') : val}
                                                            </dd>
                                                        </div>
                                                    );
                                                })}
                                            </dl>
                                            <div className="mt-6"><EcommerceButtons phoneName={phone.name} isCompact={true} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="glass p-6 border-l-4 border-indigo-500"><h3 className="text-lg font-bold flex items-center gap-3 text-slate-900"><LightbulbIcon className="w-6 h-6 text-indigo-500" /> Ringkasan Analisis</h3><p className="text-sm text-slate-600 mt-3 leading-relaxed font-medium">{result.battleSummary}</p></div>
                            <div className="text-center pt-4"><button onClick={() => setResult(null)} className="px-10 py-3 rounded-full bg-slate-900 text-white font-black uppercase text-[10px] hover:bg-indigo-600 shadow-lg active:scale-95">Bandingkan HP Lain</button></div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PhoneBattle;
