import React, { useState, FC, useMemo } from 'react';
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
    antutuScore?: number | null;
    jaringan?: string;
    wifi?: string;
    display?: string;
    camera?: string;
    battery?: string;
    charging?: string;
    koneksi?: string;
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

const PhoneBattle: React.FC<{ initialResult?: BattleResult | null }> = ({ initialResult = null }) => {
    const [phoneNames, setPhoneNames] = useState<string[]>(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BattleResult | null>(initialResult);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const phoneSpecProperties = {
        rilis: { type: Type.STRING, description: "Bulan dan tahun rilis. Contoh: 'September 2024'" },
        os: { type: Type.STRING },
        processor: { type: Type.STRING },
        antutuScore: { type: Type.INTEGER, description: "Skor benchmark AnTuTu v10 sebagai angka integer. Jika tidak tersedia/relevan (misal untuk feature phone), kembalikan null." },
        jaringan: { type: Type.STRING },
        wifi: { type: Type.STRING, description: "Standar Wi-Fi yang didukung. Contoh: 'Wi-Fi 6e, 7'" },
        display: { type: Type.STRING },
        camera: { type: Type.STRING },
        battery: { type: Type.STRING },
        charging: { type: Type.STRING },
        koneksi: { type: Type.STRING },
        nfc: { type: Type.STRING },
        hargaIndonesia: { type: Type.STRING, description: "Perkiraan harga pasar di Indonesia dalam Rupiah. Contoh: 'Rp 4.599.000'" }
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            battleSummary: { type: Type.STRING, description: "SATU paragraf SANGAT RINGKAS (maksimal 2-3 kalimat) sebagai ringkasan perbandingan umum untuk SEMUA perangkat yang diadu, dalam Bahasa Indonesia. Jika input bukan gadget, field ini HARUS berisi pesan error." },
            targetAudience: { type: Type.STRING, description: "SATU paragraf SANGAT RINGKAS (maksimal 2-3 kalimat) sebagai analisis 'Cocok untuk siapa' untuk SEMUA perangkat, dalam Bahasa Indonesia." },
            phones: {
                type: Type.ARRAY,
                description: "Sebuah array berisi data untuk setiap perangkat yang dibandingkan, dalam urutan yang sama seperti di prompt.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nama resmi perangkat" },
                        specs: {
                            type: Type.OBJECT,
                            properties: phoneSpecProperties
                        }
                    },
                    required: ["name", "specs"]
                }
            },
            winnerName: {
                type: Type.STRING,
                description: "Nama resmi dari perangkat pemenang berdasarkan analisis holistik. Jika seri, isi dengan 'Seri'. Jika tidak ada pemenang yang jelas, biarkan kosong."
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
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        const phoneList = phoneNames.map(name => `"${name}"`).join(' vs ');

        const prompt = `**Core Role: AI Data Synthesizer & Battle Analyst for JAGO-HP**
        Your primary task is to perform a detailed comparison analysis in **Bahasa Indonesia** between these devices: ${phoneList}.

        **Context & Knowledge Cut-off (Mandatory):**
        - **Knowledge Date:** Your knowledge is fully updated as of **5 Oktober 2025**.
        - **Device Status:** You **MUST** treat devices like the Samsung S25 series (S25, S25 Ultra, S25 FE), iPhone 17 series, etc., as **officially released** products. All data for them is final and available.

        **Data Sources (Mandatory):**
        - You **MUST** source and synthesize data from a wide range of reliable sources, prioritizing: **GSMArena, nanoreview.net, AnTuTu, Geekbench, and DXOMark.**

        **Universal Brand & Device Knowledge:**
        You are an expert on all devices (smartphones, tablets, feature phones) from all major brands (Samsung, Apple, Xiaomi, Google, etc.). You **MUST** retrieve full, official data for any existing device from these brands.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadgets:** Identify the official name and type for each device in ${phoneList}.
        2.  **Extract & Synthesize Data:** Extract all relevant specs for every device, synthesizing information from your full range of specified sources to get the most accurate, final data.
        3.  **Handle Unannounced Devices (Post-Oct 2025):** If a user requests a device rumored for release **AFTER 5 Oktober 2025**, state that its specs are based on rumors and use \`null\` for unavailable data.
        4.  **Holistic Analysis & Winner Determination:**
            -   Compare the synthesized final specs. **DO NOT** rely on a single metric.
            -   Consider overall value: performance, display, camera, battery, price.
            -   Declare **one winner** in the \`winnerName\` field based on this holistic view. Use 'Seri' for a tie.
        5.  **Generate Summaries:** Write the \`battleSummary\` and \`targetAudience\` based on your comparative analysis.
        6.  **Failure Condition:** If an input is not a gadget, the \`battleSummary\` MUST contain an error message.

        **Final Output:**
        - Ensure the JSON strictly follows the schema.
        - The 'phones' array must be in the same order as the input list.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema }
            });
            const resultText = response.text.trim();
            const parsedResult: BattleResult = JSON.parse(resultText);
            
            if (parsedResult.battleSummary?.toLowerCase().startsWith('error:')) {
                setError(parsedResult.battleSummary);
                setResult(null);
            } else {
                setResult(parsedResult);
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
            setError('Terjadi kesalahan saat menganalisis perangkat. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="battle" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-6xl">
                
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
                                        aria-label="Tambah HP Lain"
                                    >
                                        <PlusCircleIcon className="w-7 h-7 text-slate-400 group-hover:text-[color:var(--accent2)] transition-colors"/>
                                        <span className="font-semibold text-sm">Tambah Pembanding</span>
                                    </button>
                                )}
                            </div>
                            <div className="text-center mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-busy={loading}
                                    className="w-full max-w-xs px-8 py-3 rounded-lg bg-[color:var(--accent1)] text-white font-semibold
                                               hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    {loading ? 'Membandingkan...' : 'Adu Spesifikasi'}
                                </button>
                                {loading && (
                                    <p className="text-sm text-slate-500 mt-3 animate-pulse">
                                        Kami coba analisis, mohon jangan pindah menu..
                                    </p>
                                )}
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
                                Hasil Perbandingan
                            </h2>
                            <BattleResultDisplay result={result} />
                            <p className="text-xs text-slate-400 text-center mt-6">
                                Sumber data: GSMArena, nanoreview.net, Phone Arena, AnTuTu, GeekBench dan DXOMark
                            </p>
                        </>
                    )}
                </div>

            </div>
        </section>
    );
};

const PhoneInputCard: FC<{phoneName: string; setPhoneName: (name: string) => void; placeholder: string; onRemove?: () => void}> = 
({ phoneName, setPhoneName, placeholder, onRemove }) => {
    return (
        <div className="relative w-full max-w-xs">
            <input
                type="text"
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-100 border border-slate-300 rounded-lg text-center py-2.5 ${onRemove ? 'pl-4 pr-10' : 'px-4'} text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--accent1)] focus:border-[color:var(--accent1)] transition-all duration-200`}
            />
            {onRemove && (
                 <button type="button" onClick={onRemove} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-red-500 transition-colors" aria-label="Hapus Penantang">
                    <XCircleIcon className="w-5 h-5"/>
                </button>
            )}
        </div>
    );
}

const BattleSkeleton: FC<{ phoneCount: number }> = ({ phoneCount }) => (
    <div className="space-y-8 animate-pulse">
        <div className={`grid grid-cols-1 ${phoneCount > 1 ? `md:grid-cols-${phoneCount}` : ''} gap-6`}>
            {[...Array(phoneCount)].map((_, i) => (
                <div key={i} className="glass p-5 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="space-y-2 pt-4 mt-2 border-t border-slate-200">
                        {[...Array(6)].map((_, j) => (
                            <div key={j} className="flex justify-between">
                                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-5 space-y-3">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
            <div className="glass p-5 space-y-3">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
        </div>
    </div>
);

const SpecItem: FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
    value ? (
        <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-200/60 last:border-b-0">
            <dt className="small-muted flex-shrink-0">{label}</dt>
            <dd className="text-slate-700 text-right break-words font-medium">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</dd>
        </div>
    ) : null
);

const BattleResultDisplay: FC<{ result: BattleResult }> = ({ result }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className={`grid grid-cols-1 ${result.phones.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 items-stretch`}>
                {result.phones.map((phone, index) => {
                    const isWinner = phone.name === result.winnerName;
                    return (
                        <div key={index} className={`relative glass p-5 flex flex-col transition-all duration-300 ${isWinner ? 'border-2 border-[color:var(--accent1)]' : ''}`}>
                            {isWinner && (
                                <div className="absolute -top-3.5 right-4 bg-[color:var(--accent1)] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                    <CrownIcon className="w-4 h-4" />
                                    <span>Pemenang</span>
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{phone.name}</h3>
                            <p className="text-sm small-muted mb-4">{phone.specs?.rilis || 'Info rilis tidak tersedia'}</p>
                            
                            <dl className="space-y-1 text-sm flex-grow">
                                <SpecItem label="Harga" value={phone.specs?.hargaIndonesia} />
                                <SpecItem label="Processor" value={phone.specs?.processor} />
                                <SpecItem label="AnTuTu v10" value={phone.specs?.antutuScore} />
                                <SpecItem label="Layar" value={phone.specs?.display} />
                                <SpecItem label="Kamera" value={phone.specs?.camera} />
                                <SpecItem label="Baterai" value={phone.specs?.battery} />
                                <SpecItem label="Charging" value={phone.specs?.charging} />
                                <SpecItem label="NFC" value={phone.specs?.nfc} />
                            </dl>
                            <EcommerceButtons phoneName={phone.name} isCompact={true} />
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <LightbulbIcon className="w-6 h-6 text-[color:var(--accent1)]" /> Ringkasan Adu
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{result.battleSummary}</p>
                </div>
                <div className="glass p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-[color:var(--accent1)]" /> Cocok Untuk Siapa
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{result.targetAudience}</p>
                </div>
            </div>
        </div>
    );
};

export default PhoneBattle;