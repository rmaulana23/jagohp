
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
    openAdminLogin: () => void;
}

const quickQuestions = [
    'HP gaming 1 jutaan yang bagus',
    'HP kamera terbaik harga 2 jutaan',
    'HP daily driver yang oke tahun 2025'
];

const TanyaAI: React.FC<TanyaAIProps> = ({ isOpen, onClose, openAdminLogin }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const systemInstruction = `**Fondasi Pengetahuan Anda: Ahli Data Komprehensif**
Anda adalah AI yang dilatih untuk memahami dan mengekstrak data terstruktur dari sumber terpercaya.

**Peran Anda Saat Ini: JAGOBOT (Asisten AI JAGO-HP)**
Berdasarkan fondasi data tersebut, Anda berperan sebagai teman ahli gadget. Semua respons HARUS dalam Bahasa Indonesia.

**ATURAN PENGAMBILAN DATA (SANGAT KRITIS):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Data Sourcing Mandate:** Your primary objective is to find and synthesize smartphone data from the **entire public internet**. You are not limited to specific sites.
- **CRITICAL RULE: NEVER FAIL A SEARCH.** You are **STRICTLY FORBIDDEN** from claiming a device "is not found" or that "data is unavailable". If official specifications are not public, you **MUST** synthesize a response based on credible rumors, leaks, official announcements, and industry analysis. For unreleased phones (e.g., 'iPhone 17 Pro Max', 'Samsung S25 Ultra'), provide the most likely rumored specifications.
- **Reliable Source Examples:** Use reputable tech sites as your primary information pool. Examples include (but are not limited to):
    - **GSMArena** (For Apple devices, start your search here: https://www.gsmarena.com/apple-phones-48.php)
    - **Phone Arena**
    - **AnandTech**
    - **nanoreview.net**
    - Official brand websites (Samsung.com, Apple.com, etc.)
    - Reputable leakers and tech news outlets.
- **Data Synthesis:** If sources conflict, use your judgment to present the most plausible and widely reported specification.

**ATURAN UTAMA PERCAKAPAN (WAJIB DIIKUTI):**
1.  **BATASAN TOPIK:** Anda HANYA menjawab pertanyaan terkait gadget. Jika user bertanya di luar topik, **WAJIB MENOLAK** dengan sopan: "Maaf, saya adalah JAGOBOT, asisten khusus gadget, jadi hanya bisa bantu soal smartphone, tablet, dan sejenisnya. Ada pertanyaan seputar itu?"
2.  **JAWABAN PERTAMA SUPER SINGKAT:** Berikan jawaban yang sangat singkat, padat, dan to-the-point untuk pertanyaan awal.
3.  **GAYA BAHASA:** Santai dan informatif.`;

        chatRef.current = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
        setMessages([{ role: 'model', text: 'Hai Kak, aku JAGOBOT. Mau cari HP apa? Tulis aja yang mau ditanyain' }]);
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
        const trimmedInput = input.trim();
        if (trimmedInput === '#admindash') {
            openAdminLogin();
            setInput('');
            return;
        }
        sendMessage(trimmedInput);
        setInput('');
    };
    
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <section 
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-modal="true"
                role="dialog"
            >
                <div className={`w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col glass shadow-2xl
                           transition-transform duration-300 ease-out ${isOpen ? 'scale-100' : 'scale-95'}`}>
                     <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent1)]/10 rounded-full">
                                <SparklesIcon className="w-5 h-5 text-[color:var(--accent1)]"/>
                            </div>
                            <h2 className="text-base font-semibold text-slate-800">JAGOBOT</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Tutup obrolan">
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
                                        className="text-left text-sm text-[color:var(--accent1)] bg-[color:var(--accent1)]/10 border border-[color:var(--accent1)]/30 px-3 py-1.5 rounded-lg hover:bg-[color:var(--accent1)]/20 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-3 border-t border-slate-200 flex-shrink-0 bg-white rounded-b-2xl">
                         <form onSubmit={handleFormSubmit} className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
                                placeholder="Tulis pertanyaanmu..."
                                className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg py-2.5 pl-4 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] focus:border-[color:var(--accent1)] transition-all duration-200"
                                aria-label="Chat input"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md bg-[color:var(--accent1)] text-white flex items-center justify-center
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
                <div className="bg-slate-200 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-4 h-4 text-slate-500"/>
                </div>
                <div className="bg-slate-200 rounded-xl rounded-bl-none px-3 py-2">
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
                <div className="bg-slate-200 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                     <SparklesIcon className="w-4 h-4 text-slate-500"/>
                </div>
            )}
            <div
                className={`rounded-xl p-3 max-w-[85%] break-words text-sm ${
                    isUser
                        ? 'bg-[color:var(--accent1)] text-white rounded-br-none'
                        : 'bg-slate-200 text-slate-800 rounded-bl-none prose'
                }`}
            >
                <div dangerouslySetInnerHTML={formatText(message.text)}></div>
            </div>
        </div>
    );
};

export default TanyaAI;
