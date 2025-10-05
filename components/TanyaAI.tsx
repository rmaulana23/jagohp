import React, { useState, useMemo, useRef, useEffect, FC } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import SendIcon from './icons/SendIcon';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface TanyaAIProps {
    isOpen: boolean;
    onClose: () => void;
}

const quickQuestions = [
    'HP gaming 1 jutaan yang bagus',
    'HP kamera terbaik harga 2 jutaan',
    'HP daily driver yang oke tahun 2025'
];

const TanyaAI: React.FC<TanyaAIProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const systemInstruction = `**Fondasi Pengetahuan Anda: Ahli Data Komprehensif**
        Anda adalah AI yang dilatih secara fundamental untuk memahami dan mengekstrak data terstruktur. Pengetahuan inti Anda mencakup:
        -   Identifikasi dan parsing semua data ponsel (smartphones, tablets, pads & feature phones).
        -   Pengambilan data dari sumber terpercaya: **GSMArena, nanoreview.net, PhoneArena, Jagat Review, AnTuTu, Geekbench, DXOMark.**

        **Peran Anda Saat Ini: Asisten AI JAGO-HP**
        Berdasarkan fondasi pengetahuan tersebut, Anda sekarang berperan sebagai teman yang sangat ahli tentang gadget. Seluruh respons Anda HARUS dalam Bahasa Indonesia.

        **Konteks Waktu & Pengetahuan:**
        - **Mandat Pengetahuan Terkini:** Pengetahuan Anda dianggap telah diperbarui hingga hari ini, **5 Oktober 2025**.
        - **Kewajiban Data Terbaru:** Anda **WAJIB** memberikan jawaban berdasarkan informasi final dan resmi yang tersedia per tanggal ini. Ini berarti perangkat seperti Samsung S25 series, seri iPhone 17, dan Xiaomi 17 sudah **resmi dirilis** dan Anda memiliki data lengkapnya.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.
        
        **ATURAN UTAMA PERCAKAPAN (SANGAT PENTING):**
        1.  **BATASAN TOPIK:** Anda HANYA menjawab pertanyaan yang berkaitan dengan gadget dari brand di atas. Jika user bertanya di luar topik itu, **WAJIB MENOLAK** dengan sopan: "Maaf, saya adalah asisten khusus gadget, jadi hanya bisa bantu soal smartphone, tablet, dan ponsel jadul. Ada pertanyaan seputar itu?"
        2.  **JAWABAN PERTAMA SUPER SINGKAT:** Untuk pertanyaan awal, berikan jawaban yang **sangat singkat dan padat**. Fokus pada data kunci.
        3.  **GAYA BAHASA:** Santai dan to-the-point.
        4.  **MENANGANI HP MASA DEPAN/RUMOR (Rilis SETELAH 5 Oktober 2025):** Aturan ini hanya berlaku untuk perangkat yang dirumorkan rilis **setelah** tanggal pengetahuan Anda. Jika pengguna bertanya tentang perangkat seperti itu, Anda **WAJIB** menanggapinya dengan cara berikut:
            -   **Langkah 1: Beri Peringatan:** Awali jawaban Anda dengan menyatakan secara jelas bahwa informasi tersebut belum resmi dan masih bersifat rumor/bocoran.
            -   **Langkah 2: Sajikan Data Rumor:** Lanjutkan dengan menyajikan spesifikasi yang dirumorkan jika data tersebut tersedia.
        
        **Terkait Pertanyaan Samsung S25, iPhone 17 atau Xiaomi 17:** Karena pengetahuan Anda sudah di 5 Oktober 2025, Anda **HARUS** menjawabnya sebagai produk yang sudah rilis dengan data yang pasti. **JANGAN** menyebutnya rumor lagi.
        `;

        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
        setMessages([{ role: 'model', text: 'Halo! Ada yang bisa dibantu seputar HP?' }]);
        setShowQuickQuestions(true);
    }, [ai]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || loading) return;

        setShowQuickQuestions(false);
        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        
        const cacheKey = messageText.trim().toLowerCase();

        if (supabase) {
            try {
                const { data } = await supabase.from('ai_chat_cache').select('response').eq('prompt', cacheKey).single();
                if (data && data.response) {
                    setMessages(prev => [...prev, { role: 'model', text: data.response }]);
                    setLoading(false);
                    return;
                }
            } catch (cacheError) { console.warn("Cache check failed:", cacheError); }
        }

        let currentModelResponse = "";
        setMessages(prev => [...prev, { role: 'model', text: "" }]);

        try {
            if (!chatRef.current) throw new Error("Chat not initialized");
            const stream = await chatRef.current.sendMessageStream({ message: messageText });

            for await (const chunk of stream) {
                currentModelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: currentModelResponse };
                    return newMessages;
                });
            }

            if (supabase && currentModelResponse) {
                try {
                    await supabase.from('ai_chat_cache').insert({ prompt: cacheKey, response: currentModelResponse });
                } catch (cacheError) { console.warn("Cache write failed:", cacheError); }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = "Aduh, maaf, lagi ada gangguan. Coba lagi nanti ya.";
            setMessages(prev => {
                const newMessages = [...prev];
                if(newMessages[newMessages.length - 1].text === ""){
                    newMessages[newMessages.length - 1] = { role: 'model', text: errorMessage };
                }
                return newMessages;
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    };
    
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <section 
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-modal="true"
                role="dialog"
            >
                <div className={`w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col glass rounded-2xl shadow-2xl shadow-black/30
                           transition-transform duration-300 ease-out ${isOpen ? 'scale-100' : 'scale-95'}`}>
                     <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent1)]/10 rounded-full">
                                <SparklesIcon className="w-5 h-5 text-[color:var(--accent1)]"/>
                            </div>
                            <h2 className="text-base font-semibold text-white">JAGO-HP AI Assistant</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Tutup obrolan">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                     </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} message={msg} />
                        ))}
                        {showQuickQuestions && !loading && (
                            <div className="flex flex-col items-start gap-2 animate-fade-in pl-12">
                                {quickQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="text-left text-sm text-[color:var(--accent2)] bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/30 px-3 py-1.5 rounded-lg hover:bg-[color:var(--accent2)]/20 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-3 border-t border-white/10 flex-shrink-0">
                         <form onSubmit={handleFormSubmit} className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
                                placeholder="Tulis pertanyaanmu..."
                                className="w-full bg-[color:var(--card)] border-2 border-white/10 rounded-lg py-2.5 pl-4 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] focus:border-[color:var(--accent1)] transition-all duration-200"
                                aria-label="Chat input"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md bg-[color:var(--accent1)] text-slate-900 flex items-center justify-center
                                           hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Send message"
                            >
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                 </div>
            </section>
        </>
    );
};

const ChatMessage: FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasContent = message.text && message.text.trim() !== '';

    if (!hasContent && !isUser) {
        return (
            <div className="flex justify-start items-center gap-3 animate-fade-in">
                <div className="bg-slate-700 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-4 h-4 text-slate-400"/>
                </div>
                <div className="bg-[color:var(--card)] rounded-xl rounded-bl-none px-3 py-2">
                    <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
        );
    }
    
    const formatText = (text: string) => {
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;') // Sanitize HTML tags
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\n\s*-\s)/g, '<br/>- ')
            .replace(/\n/g, '<br />');
        return { __html: html };
    };

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {!isUser && (
                <div className="bg-slate-700 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                     <SparklesIcon className="w-4 h-4 text-slate-400"/>
                </div>
            )}
            <div
                className={`rounded-xl p-3 max-w-[85%] break-words text-sm ${
                    isUser
                        ? 'bg-[color:var(--accent1)] text-slate-900 rounded-br-none'
                        : 'bg-[color:var(--card)] text-slate-200 rounded-bl-none prose'
                }`}
            >
                <div dangerouslySetInnerHTML={formatText(message.text)}></div>
            </div>
        </div>
    );
};

export default TanyaAI;