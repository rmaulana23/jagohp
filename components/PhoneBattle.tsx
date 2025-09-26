import React, { useState, FC, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import VersusIcon from './icons/VersusIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import UsersIcon from './icons/UsersIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import CrownIcon from './icons/CrownIcon';


// --- INTERFACES (UPDATED FOR ARRAY) ---
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
    [key: string]: string | number | null | undefined;
}

interface PhoneData {
    name: string;
    specs: SpecDetails;
}

interface BattleResult {
    battleSummary: string;
    targetAudience: string;
    phones: PhoneData[];
    winnerName?: string;
}

const PhoneBattle: React.FC = () => {
    const [phoneNames, setPhoneNames] = useState<string[]>(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BattleResult | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const phoneSpecProperties = {
        rilis: { type: Type.STRING, description: "Bulan dan tahun rilis. Contoh: 'September 2024'" },
        os: { type: Type.STRING },
        processor: { type: Type.STRING },
        antutuScore: { type: Type.INTEGER, description: "Skor benchmark AnTuTu v10 sebagai angka integer. Jika tidak tersedia/relevan (misal untuk feature phone), kembalikan null.", nullable: true },
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

        const prompt = `**Core Role: GSMArena Data Extractor**
        You are an AI trained to understand and extract structured data from GSMArena. Your primary task for this request is to:
        - Identify and parse data for multiple devices: smartphones, tablet, pad & feature phones.
        - Recognize and compare specifications across devices.
        - Handle variations and missing specs gracefully (e.g., a feature phone won't have an AnTuTu score).
        - Extract metadata like Brand, Model, Release date, and Device type.

        **Your Secondary Task: AI Battle Analyst for JAGO-HP**
        Based on the structured data you extract for each gadget, perform a detailed comparison analysis in **Bahasa Indonesia** between these devices: ${phoneList}.

        **Context & Knowledge Cut-off:**
        - **Mandatory Update:** Your knowledge is considered fully updated as of today, **${today}**.
        - **Data Requirement:** You **MUST** use the latest available specifications and market data for all devices being compared.
        - **Output Language:** Bahasa Indonesia.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands, with GSMArena as the primary data source. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.

        **Crucial Rule:** If a device from any of these brands exists on GSMArena, you **MUST** be able to retrieve and display its data, regardless of its release status in Indonesia. This is a non-negotiable part of your function.

        **Execution Steps & Rules (Strictly Follow):**
        1.  **Identify Gadgets:** For each name in ${phoneList}, identify the official name and device type (smartphone, tablet, feature phone).
        2.  **Extract Data for All:** Perform your core data extraction role for **every single gadget** in the list, prioritizing GSMArena. Include the release month and year in the 'rilis' field.
        3.  **Handle Cross-Category Battles:** If the devices are from different categories (e.g., smartphone vs. tablet), state this clearly in the \`battleSummary\`. The comparison should still proceed.
        4.  **Handle Missing Data:** When comparing, if a spec is missing for one device (e.g., AnTuTu score for a feature phone), you **MUST** use \`null\` in the JSON output for that field. The comparison should focus on the available specs. **DO NOT FAIL** the request.
        5.  **Holistic Analysis & Winner Determination:**
            -   Compare the extracted specs. **DO NOT** rely solely on one metric like AnTuTu.
            -   Consider the overall value: performance, display, camera, battery, price, and features.
            -   Based on this holistic view, declare **one winner** in the \`winnerName\` field. If it's a clear tie, you may use 'Seri'.
        6.  **Generate Summaries:** Write the \`battleSummary\` and \`targetAudience\` based on your comparative analysis.
        7.  **Failure Condition:** If any of the inputs are clearly not gadgets (e.g., "mobil"), the \`battleSummary\` field MUST contain the error message.

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
            setError('Terjadi kesalahan saat menganalisis perangkat. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="battle" className="flex-grow flex flex-col items-center pt-24 pb-10 px-4 sm:px-6 md:px-12 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10">
                 <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
                 <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-500/20 rounded-full filter blur-3xl"></div>
            </div>
            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="text-center mb-6">
                    <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                        Adu Spesifikasi
                    </h2>
                    <p className="text-base text-gray-400 pb-1">Adu spesifikasi tipe HP kesukaan Kalian, biar gak salah pilih.</p>
                </div>
                
                <form onSubmit={handleBattle}>
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mt-6">
                        {phoneNames.map((name, index) => (
                            <React.Fragment key={index}>
                                <PhoneInputCard
                                    phoneName={name}
                                    setPhoneName={(value) => handlePhoneNameChange(index, value)}
                                    placeholder="Tuliskan tipe HP"
                                    borderColor={index === 0 ? "border-indigo-500" : index === 1 ? "border-fuchsia-500" : "border-purple-500"}
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
                                className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors duration-300 group mt-4 lg:mt-0"
                                aria-label="Tambah HP Lain"
                            >
                                <PlusCircleIcon className="w-8 h-8"/>
                                <span className="font-semibold text-sm group-hover:underline">Tambah HP Lain</span>
                            </button>
                        )}
                    </div>
                    <div className="text-center mt-10">
                         <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className="font-orbitron text-lg font-bold w-64 h-14 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                                       bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="absolute w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                                {loading ? 'Membandingkan...' : 'Battle Compare'}
                            </span>
                        </button>
                        {loading && (
                            <p className="text-sm text-gray-400 mt-3 animate-pulse">
                                Tunggu sebentar ya, jangan pindah menu dulu...
                            </p>
                        )}
                    </div>
                </form>
                
                <div className="mt-12" aria-live="polite">
                    {loading && <BattleSkeleton phoneCount={phoneNames.length} />}
                    {error && <div className="text-center text-red-400 border border-red-400/50 bg-red-500/10 rounded-lg p-4 max-w-2xl mx-auto">{error}</div>}
                    {result && (
                        <>
                            <BattleResultDisplay result={result} />
                            <p className="text-xs text-gray-500 text-center mt-6">
                                Sumber data: GSMArena, Phone Arena, AnTuTu, GeekBench dan DXOMark
                            </p>
                        </>
                    )}
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
                className={`w-full bg-gray-900/50 border-2 ${borderColor} rounded-full text-center py-2.5 ${onRemove ? 'pl-6 pr-12' : 'px-6'} text-white placeholder-gray-500
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
        {/* Summaries skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/20 border-2 border-gray-700 rounded-2xl p-5 space-y-3">
                <div className="h-6 bg-gray-700/50 rounded w-1/3"></div>
                <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
            </div>
            <div className="bg-gray-800/20 border-2 border-gray-700 rounded-2xl p-5 space-y-3">
                <div className="h-6 bg-gray-700/50 rounded w-1/3"></div>
                <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
            </div>
        </div>
        {/* Phone cards skeleton */}
        <div className={`grid grid-cols-1 ${phoneCount === 2 ? 'lg:grid-cols-2' : `lg:grid-cols-${phoneCount}`} gap-6`}>
            {[...Array(phoneCount)].map((_, i) => (
                <div key={i} className="bg-gray-800/20 border-2 border-gray-700 rounded-2xl p-5 space-y-3">
                    <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
                    <div className="space-y-2 pt-2 mt-2 border-t border-gray-700/50">
                        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SpecItem: FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
    value ? (
        <div className="flex justify-between items-start gap-4">
            <dt className="font-semibold text-gray-400 flex-shrink-0">{label}</dt>
            <dd className="text-gray-200 text-right break-words">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</dd>
        </div>
    ) : null
);

const BuyButton: FC<{ link: string }> = ({ link }) => (
    <div className="text-center mt-4">
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-orbitron text-sm font-bold w-full h-10 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                       bg-gradient-to-r from-green-400 to-teal-500"
        >
            <span className="relative w-full h-full px-4 py-2 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                Beli Langsung
            </span>
        </a>
    </div>
);

const BattleResultDisplay: FC<{ result: BattleResult }> = ({ result }) => {
    return (
        <div className="animate-fade-in space-y-8">
            {/* Phone Cards */}
            <div className={`grid grid-cols-1 ${result.phones.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
                {result.phones.map((phone, index) => {
                    const isWinner = phone.name === result.winnerName;
                    const phoneBrand = phone.name.toLowerCase();
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
                        <div key={index} className={`relative bg-gray-800/30 border-2 rounded-2xl p-5 flex flex-col ${isWinner ? 'border-amber-400 shadow-lg shadow-amber-400/10' : 'border-gray-700'}`}>
                            {isWinner && (
                                <div className="absolute -top-4 right-4 bg-amber-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CrownIcon className="w-4 h-4" />
                                    <span>Pemenang</span>
                                </div>
                            )}
                            <h3 className="font-orbitron text-lg font-bold text-white mb-2">{phone.name}</h3>
                            <p className="text-sm text-indigo-300 mb-4">{phone.specs.rilis || 'Info rilis tidak tersedia'}</p>
                            
                            <dl className="space-y-2 text-sm flex-grow border-t border-gray-700 pt-4 mt-auto">
                                <SpecItem label="Processor" value={phone.specs.processor} />
                                <SpecItem label="AnTuTu v10" value={phone.specs.antutuScore} />
                                <SpecItem label="Layar" value={phone.specs.display} />
                                <SpecItem label="Kamera" value={phone.specs.camera} />
                                <SpecItem label="Baterai" value={phone.specs.battery} />
                                <SpecItem label="Charging" value={phone.specs.charging} />
                                <SpecItem label="NFC" value={phone.specs.nfc} />
                            </dl>

                            {/* Buy Buttons */}
                            {isSamsung && <BuyButton link="https://s.shopee.co.id/6AbvXZfbSV" />}
                            {isApple && <BuyButton link="https://s.shopee.co.id/9fBniOs3ak" />}
                            {isXiaomi && <BuyButton link="https://s.shopee.co.id/AUkuiQBtYg" />}
                            {isOppo && <BuyButton link="https://s.shopee.co.id/BKiPhDZHl" />}
                            {isVivo && <BuyButton link="https://s.shopee.co.id/1BDFc1esr2" />}
                            {isPoco && <BuyButton link="https://s.shopee.co.id/qaPDaBvho" />}
                            {isInfinix && <BuyButton link="https://s.shopee.co.id/qaPDpESoL" />}
                            {isItel && <BuyButton link="https://s.shopee.co.id/803ZlEyaDj" />}
                            {isHuawei && <BuyButton link="https://s.shopee.co.id/2B5mokEaKQ" />}
                            {isHonor && <BuyButton link="https://s.shopee.co.id/4AqrChdhXf" />}
                            {isTecno && <BuyButton link="https://s.shopee.co.id/gGz2ZEcaj" />}
                            {isRealme && <BuyButton link="https://s.shopee.co.id/3qE0oVUbZt" />}
                        </div>
                    );
                })}
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/20 border-2 border-indigo-500/30 rounded-2xl p-5">
                    <h3 className="font-orbitron text-lg font-bold text-indigo-300 mb-2 flex items-center gap-2">
                        <LightbulbIcon className="w-6 h-6" /> Ringkasan Adu
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.battleSummary}</p>
                </div>
                <div className="bg-gray-800/20 border-2 border-fuchsia-500/30 rounded-2xl p-5">
                    <h3 className="font-orbitron text-lg font-bold text-fuchsia-300 mb-2 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6" /> Cocok Untuk Siapa
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.targetAudience}</p>
                </div>
            </div>
        </div>
    );
};

export default PhoneBattle;