import React, { useState, useMemo, useRef, useEffect, FC } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import SendIcon from './icons/SendIcon';
import LogoIcon from './icons/LogoIcon';
import XMarkIcon from './icons/XMarkIcon';


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
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const systemInstruction = `**Fondasi Pengetahuan Anda: Ahli Data GSMArena**
        Anda adalah AI yang dilatih secara fundamental untuk memahami dan mengekstrak data terstruktur dari GSMArena. Pengetahuan inti Anda mencakup:
        -   Identifikasi dan parsing semua data ponsel (smartphones, tablet, pad & feature phones).
        -   Pengenalan tabel, kategori, dan spesifikasi (Launch, Network, Body, Display, Platform, dll).
        -   Penanganan variasi dan spesifikasi yang hilang.
        -   Ekstraksi metadata seperti Merek, Model, Tanggal Rilis, dan Jenis Perangkat.

        **Peran Anda Saat Ini: JAGO-HP AI Assistant**
        Berdasarkan fondasi pengetahuan tersebut, Anda sekarang berperan sebagai teman yang sangat ahli tentang gadget. Seluruh respons Anda HARUS dalam Bahasa Indonesia.

        **Konteks Waktu & Pengetahuan:**
        - **Mandat Pengetahuan Terkini:** Pengetahuan Anda dianggap telah diperbarui hingga hari ini, **${today}**.
        - **Kewajiban Data Terbaru:** Anda **WAJIB** memberikan jawaban berdasarkan informasi terbaru yang tersedia per tanggal ini, terutama terkait harga, software, dan ketersediaan produk.

        **Universal Brand & Device Knowledge (Core Mandate):**
        Your knowledge base is built upon a comprehensive understanding of every device (smartphones, tablets, pads, feature phones) from the following extensive list of brands, with GSMArena as the primary data source. You are an expert on all of these:
        Acer, alcatel, Allview, Amazon, Amoi, Apple, Archos, Asus, AT&T, Benefon, BenQ, BenQ-Siemens, Bird, BlackBerry, Blackview, BLU, Bosch, BQ, Casio, Cat, Celkon, Chea, Coolpad, Cubot, Dell, Doogee, Emporia, Energizer, Ericsson, Eten, Fairphone, Fujitsu Siemens, Garmin-Asus, Gigabyte, Gionee, Google, Haier, HMD, Honor, HP, HTC, Huawei, i-mate, i-mobile, Icemobile, Infinix, Innostream, iNQ, Intex, itel, Jolla, Karbonn, Kyocera, Lava, LeEco, Lenovo, LG, Maxon, Maxwest, Meizu, Micromax, Microsoft, Mitac, Mitsubishi, Modu, Motorola, MWg, NEC, Neonode, NIU, Nokia, Nothing, Nvidia, O2, OnePlus, Oppo, Orange, Oscal, Oukitel, Palm, Panasonic, Pantech, Parla, Philips, Plum, Posh, Prestigio, QMobile, Qtek, Razer, Realme, Sagem, Samsung, Sendo, Sewon, Sharp, Siemens, Sonim, Sony, Sony Ericsson, Spice, T-Mobile, TCL, Tecno, Tel.Me., Telit, Thuraya, Toshiba, Ulefone, Umidigi, Unnecto, Vertu, verykool, vivo, VK Mobile, Vodafone, Wiko, WND, XCute, Xiaomi, XOLO, Yezz, Yota, YU, ZTE.
        
        **Crucial Rule:** Your ability to answer questions is based on this universal knowledge.

        **ATURAN UTAMA PERCAKAPAN (SANGAT PENTING):**
        1.  **BATASAN TOPIK:** Anda HANYA menjawab pertanyaan yang berkaitan dengan gadget dari brand di atas. Jika user bertanya di luar topik itu, **WAJIB MENOLAK** dengan sopan: "Maaf, saya adalah asisten khusus gadget, jadi hanya bisa bantu soal smartphone, tablet, dan ponsel jadul. Ada pertanyaan seputar itu?"
        2.  **JAWABAN PERTAMA SUPER SINGKAT:** Untuk pertanyaan awal, berikan jawaban yang **sangat singkat dan padat**. Fokus pada data kunci. **JANGAN** bertele-tele.
        3.  **TUNGGU PERTANYAAN LANJUTAN:** Setelah jawaban singkat, tunggu user bertanya lebih lanjut untuk memberikan detail.
        4.  **GAYA BAHASA:** Santai dan to-the-point.
        5.  **AKURASI DATA:** Sebutkan versi benchmark (AnTuTu v10) dan sumber skor kamera (DXOMark) jika ada. Gunakan data dari fondasi pengetahuan Anda (GSMArena).
        6.  **MENANGANI HP MASA DEPAN/RUMOR (e.g., iPhone 17, Xiaomi 17 series):** Jika pengguna bertanya tentang HP yang belum resmi rilis, Anda **WAJIB** menanggapinya dengan cara berikut:
            -   **Langkah 1: Beri Peringatan:** Awali jawaban Anda dengan menyatakan secara jelas bahwa informasi tersebut belum resmi dan masih bersifat rumor/bocoran, serta bisa berubah.
            -   **Langkah 2: Sajikan Data Rumor:** Setelah peringatan, lanjutkan dengan menyajikan spesifikasi yang dirumorkan jika data tersebut tersedia di sumber terpercaya seperti GSMArena.
            -   **Langkah 3: Jaga Nada:** Tetap gunakan gaya bahasa yang santai dan to-the-point.
            -   **Contoh Jawaban Ideal:** "Wah, untuk iPhone 17 Air infonya memang belum resmi dari Apple ya, jadi ini masih sebatas rumor. Tapi menurut bocoran dari GSMArena, spesifikasinya kira-kira bakal seperti ini: [sebutkan beberapa spesifikasi kunci yang dirumorkan]. Ingat ya, ini masih bisa berubah nanti pas rilis resminya."

        **Contoh Skenario Sempurna:**
        - **User:** "Rekomendasi hp gaming 2 jutaan dong."
        - **Jawaban Anda (Respons Pertama):**
            "Siap! Ini beberapa jagoannya:
            - **Infinix Note 40:** AnTuTu v10 ~430.000, lancar buat MLBB & Free Fire.
            - **Tecno Pova 5:** AnTuTu v10 ~410.000, cocok buat Roblox & CODM."
        - **User:** "jelasin lebih detail tentang infinix note 40"
        - **Jawaban Anda (Respons Lanjutan):**
            "Oke, Infinix Note 40 itu pake chipset Helio G99 Ultimate, jadi performanya oke banget di kelasnya. Layarnya AMOLED 120Hz, jadi main game auto mulus. Baterainya 5000mAh dengan fast charging 45W. **Cocok untuk:** Gamer budget ketat."

        **Patuhi aturan ini dengan ketat.**`;

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
        });

        // Initial greeting from AI
        setMessages([{ role: 'model', text: 'Halo Kak, mau cari HP kaya gimana? Tanya aja dulu, nanti dicariin yang paling pas.' }]);
        setShowQuickQuestions(true);

    }, [ai]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      if (isOpen) {
        scrollToBottom();
      }
    }, [messages, loading, isOpen]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || loading) return;

        setShowQuickQuestions(false);
        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);
        
        const cacheKey = messageText.trim().toLowerCase();

        // 1. Check cache first
        if (supabase) {
            try {
                const { data } = await supabase
                    .from('ai_chat_cache')
                    .select('response')
                    .eq('prompt', cacheKey)
                    .single();
                
                if (data && data.response) {
                    setMessages(prev => [...prev, { role: 'model', text: data.response }]);
                    setLoading(false);
                    return; // Cache hit, skip AI call
                }
            } catch (cacheError) {
                console.warn("Supabase cache check failed:", cacheError);
            }
        }

        // 2. If no cache, call AI
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

            // 3. Save new result to cache
            if (supabase && currentModelResponse) {
                try {
                    await supabase.from('ai_chat_cache').insert({
                        prompt: cacheKey,
                        response: currentModelResponse
                    });
                } catch (cacheError) {
                    console.warn("Supabase cache write failed:", cacheError);
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = "Aduh, maaf, lagi ada gangguan nih. Coba tanya lagi nanti ya.";
            setError(errorMessage);
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
    
    if (!isOpen) return null;
    
    const positionClasses = 'bottom-24 right-6';

    const transitionClasses = isOpen
        ? 'opacity-100 scale-100'
        : 'opacity-0 scale-95 pointer-events-none';

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <section 
                className={`fixed ${positionClasses} z-50 w-[calc(100%-4rem)] max-w-md h-[70vh] max-h-[550px] flex flex-col bg-[#0f172a]/80 backdrop-blur-xl border-2 border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/20
                           transition-all duration-300 ease-out ${transitionClasses}`}
                aria-modal="true"
                role="dialog"
            >
                 <div className="flex items-center justify-between p-4 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2">
                        <LogoIcon />
                        <h2 className="font-orbitron text-base font-bold text-white">AI JagoBuddy</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Tutup obrolan">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                 </div>
                
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))}
                    {showQuickQuestions && !loading && (
                        <div className="flex flex-col items-start gap-2 animate-fade-in pl-14">
                            {quickQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(q)}
                                    className="text-left text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input Form */}
                <div className="p-4 border-t border-indigo-500/20">
                     <form onSubmit={handleFormSubmit} className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleFormSubmit(e);
                                }
                            }}
                            placeholder="Tulis disini mau tanya apa..."
                            className="w-full bg-gray-900/50 border-2 border-indigo-500/50 rounded-xl py-2.5 pl-4 pr-14 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition-all duration-300"
                            rows={1}
                            style={{ minHeight: '48px' }}
                            aria-label="Chat input"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center
                                       hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </form>
                    {error && !loading && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                </div>
             <style>{`
                .prose { color: #d1d5db; }
                .prose strong { color: #a5b4fc; }
                .prose ul > li::before { background-color: #818cf8; }
             `}</style>
        </section>
        </>
    );
};

const ChatMessage: FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasContent = message.text && message.text.trim() !== '';

    if (!hasContent && !isUser) {
        // This is a placeholder for the streaming response, render a "typing..." indicator
        return (
            <div className="flex justify-start gap-3 animate-fade-in">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                    <LogoIcon />
                </div>
                <div className="bg-gray-800/50 rounded-2xl rounded-tl-none p-3 max-w-full self-start flex items-center">
                    <p className="text-white text-sm animate-pulse">Sedang mengetik...</p>
                </div>
            </div>
        );
    }
    
    // Naive markdown-to-HTML conversion
    const formatText = (text: string) => {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\n\s*-\s)/g, '<br/>- ')
            .replace(/\n/g, '<br />');
        return { __html: html };
    };

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {!isUser && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                    <LogoIcon />
                </div>
            )}
            <div
                className={`rounded-2xl p-3 max-w-full break-words ${
                    isUser
                        ? 'bg-indigo-500/20 rounded-br-none'
                        : 'bg-gray-800/50 rounded-tl-none prose'
                }`}
            >
                <p className="text-white whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={formatText(message.text)}></p>
            </div>
        </div>
    );
};

export default TanyaAI;