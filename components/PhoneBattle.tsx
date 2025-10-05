import React, { useState, FC, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import VersusIcon from './icons/VersusIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import UsersIcon from './icons/UsersIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import CrownIcon from './icons/CrownIcon';

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

        const prompt = `**Core Role: GSMArena Data Extractor**
        You are an AI trained to understand and extract structured data. Your primary task is to:
        - Identify and parse data for multiple devices: smartphones, tablets, pads & feature phones.
        - Source data from a wide range of reliable sources: GSMArena, nanoreview.net, PhoneArena, Jagat Review, AnTuTu, Geekbench, DXOMark, and other top-tier tech media.
        - Recognize and compare specifications across devices.
        - Handle variations and missing specs gracefully.

        **Your Secondary Task: AI Battle Analyst for JAGO-HP**
        Based on the structured data you extract, perform a detailed comparison analysis in **Bahasa Indonesia** between these devices: ${phoneList}.

        **Context & Knowledge Cut-off:**
        - **Mandatory Update:** Your knowledge is considered fully updated as of today, **5 Oktober 2025**.
        - **Data Requirement:** You **MUST** use the latest available specifications and market data for all devices being compared. This includes devices like the Samsung S25 series, iPhone 17 series, and Xiaomi 17 series, which are now considered **officially released**.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.

        **Crucial Rule:** If a device from any of these brands exists, you **MUST** be able to retrieve and display its full, official data.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadgets:** For each name in ${phoneList}, identify the official name and device type (smartphone, tablet, feature phone). Assume all devices mentioned are released and data is available.
        2.  **Extract Data for All:** Perform your core data extraction role for **every single gadget** in the list, using the full range of specified sources. Include the release month and year in the 'rilis' field.
        3.  **Handle Unannounced/Rumored Devices:** This rule now applies to devices rumored for release **AFTER 5 Oktober 2025**. If a user includes such a device, you **MUST**:
            -   Extract and display any available rumored specifications.
            -   In the \`battleSummary\`, explicitly state that the specs for that device are based on rumors and are subject to change.
            -   For unavailable data (e.g., \`antutuScore\`), use \`null\`.
            -   Frame the comparison involving the unreleased device with caution.
        4.  **Handle Cross-Category Battles:** If the devices are from different categories (e.g., smartphone vs. tablet), state this clearly in the \`battleSummary\`. The comparison should still proceed.
        5.  **Handle Missing Data:** For older devices or where a spec is genuinely unavailable, you **MUST** use \`null\` in the JSON output for that field. **DO NOT FAIL** the request.
        6.  **Holistic Analysis & Winner Determination:**
            -   Compare the extracted specs. **DO NOT** rely solely on one metric like AnTuTu.
            -   Consider the overall value: performance, display, camera, battery, price, and features.
            -   Based on this holistic view, declare **one winner** in the \`winnerName\` field. If it's a clear tie, you may use 'Seri'.
        7.  **Generate Summaries:** Write the \`battleSummary\` and \`targetAudience\` based on your comparative analysis.
        8.  **Failure Condition:** If any of the inputs are clearly not gadgets (e.g., "mobil"), the \`battleSummary\` field MUST contain the error message.

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
                                Phone Battle
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
                                    className="w-full max-w-xs px-8 py-3 rounded-lg bg-gradient-to-r from-[color:var(--accent1)] to-[color:var(--accent2)] text-white font-semibold
                                               hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    {loading ? 'Membandingkan...' : 'Adu Spesifikasi'}
                                </button>
                                {loading && (
                                    <p className="text-sm text-slate-500 mt-3 animate-pulse">
                                        AI sedang menganalisis, mohon tunggu sebentar...
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
                        <div key={index} className={`relative glass p-5 flex flex-col transition-all duration-300 ${isWinner ? 'border border-[color:var(--accent1)]' : ''}`}>
                            {isWinner && (
                                <div className="absolute -top-3.5 right-4 bg-gradient-to-r from-[color:var(--accent1)] to-teal-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                    <CrownIcon className="w-4 h-4" />
                                    <span>Pemenang</span>
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{phone.name}</h3>
                            <p className="text-sm small-muted mb-4">{phone.specs.rilis || 'Info rilis tidak tersedia'}</p>
                            
                            <dl className="space-y-1 text-sm flex-grow">
                                <SpecItem label="Harga" value={phone.specs.hargaIndonesia} />
                                <SpecItem label="Processor" value={phone.specs.processor} />
                                <SpecItem label="AnTuTu v10" value={phone.specs.antutuScore} />
                                <SpecItem label="Layar" value={phone.specs.display} />
                                <SpecItem label="Kamera" value={phone.specs.camera} />
                                <SpecItem label="Baterai" value={phone.specs.battery} />
                                <SpecItem label="Charging" value={phone.specs.charging} />
                                <SpecItem label="NFC" value={phone.specs.nfc} />
                            </dl>
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