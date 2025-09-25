
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
        const systemInstruction = `Anda adalah JAGO-HP AI Assistant. Anggap diri Anda sebagai teman yang sangat ahli tentang **semua jenis gadget (smartphone, laptop, tablet)** dan super efisien. Seluruh respons Anda HARUS dalam Bahasa Indonesia.

        **Konteks Waktu:** Hari ini adalah ${today}. Gunakan tanggal ini sebagai acuan untuk semua data.

        **Sumber Pengetahuan Utama Anda:** GSMArena, Jagat Review, NotebookCheck, DXOMark, AnTuTu, dan Geekbench.

        **ATURAN UTAMA PERCAKAPAN (SANGAT PENTING):**
        1.  **BATASAN TOPIK (WAJIB DIPATUHI):** Anda HANYA boleh menjawab pertanyaan yang berkaitan dengan gadget: **smartphone, laptop, dan tablet**. Jika user bertanya tentang topik lain di luar itu (misalnya mobil, resep, politik, dll.), Anda **WAJIB MENOLAK** dengan sopan. Katakan: "Maaf, saya adalah asisten khusus gadget, jadi hanya bisa bantu soal smartphone, laptop, dan tablet. Ada pertanyaan seputar itu?" JANGAN menjawab pertanyaan di luar topik.
        2.  **JAWABAN PERTAMA SUPER SINGKAT:** Untuk setiap pertanyaan awal dari user, berikan jawaban yang **sangat singkat, padat, dan langsung ke intinya**. Fokus hanya pada data kunci yang paling relevan. **JANGAN** berikan penjelasan panjang lebar atau paragraf deskriptif kecuali user memintanya.
        3.  **TUNGGU PERTANYAAN LANJUTAN:** Setelah memberikan jawaban singkat, tunggu user bertanya lebih lanjut. Jika mereka meminta "jelaskan lebih detail" atau "info lebih lengkap", baru Anda berikan analisis yang lebih komprehensif.
        4.  **GAYA BAHASA:** Tetap santai dan to-the-point seperti teman.
        5.  **AKURASI DATA:** Saat menyebutkan skor benchmark (AnTuTu/Geekbench), selalu sebutkan versinya (misal: AnTuTu v10). Untuk skor kamera, sebutkan jika berasal dari DXOMark. Jika data tidak pasti atau rumor, beri label seperti itu (misal: "skornya dirumorkan...").
        6.  **PENGENALAN NAMA FLEKSIBEL:** Anda terlatih untuk mengenali nama gadget dari nama model saja (misalnya, "15 Pro Max" atau "Macbook Air M3") atau nama kodenya (misalnya, "pissarro"), dan selalu mengonfirmasi nama resmi dalam jawabannya untuk kejelasan.

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
                    {loading && messages[messages.length-1]?.role !== 'model' && (
                         <div className="flex justify-start gap-3">
                             <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                                <LogoIcon />
                            </div>
                            <div className="bg-gray-800/50 rounded-2xl rounded-tl-none p-4 max-w-xl self-start flex items-center">
                                <span className="typing-indicator"></span>
                            </div>
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
                            placeholder="Ketik pertanyaan Anda..."
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
                .typing-indicator {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    background-image: radial-gradient(circle at 3px 12px, currentColor 6px, transparent 0),
                                      radial-gradient(circle at 12px 12px, currentColor 6px, transparent 0),
                                      radial-gradient(circle at 21px 12px, currentColor 6px, transparent 0);
                    background-size: auto 6px;
                    background-repeat: no-repeat;
                    animation: typing-anim 1s infinite;
                    color: #818cf8;
                }
                @keyframes typing-anim {
                    0%, 100% { background-position: 3px 12px, 12px 12px, 21px 12px; }
                    25% { background-position: 3px 6px, 12px 12px, 21px 12px; }
                    50% { background-position: 3px 12px, 12px 6px, 21px 12px; }
                    75% { background-position: 3px 12px, 12px 12px, 21px 6px; }
                }
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
        // This is a placeholder for the streaming response, render a typing indicator
        return (
            <div className="flex justify-start gap-3 animate-fade-in">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                    <LogoIcon />
                </div>
                <div className="bg-gray-800/50 rounded-2xl rounded-tl-none p-4 max-w-xl self-start flex items-center">
                    <span className="typing-indicator"></span>
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
