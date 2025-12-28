
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
    isPage?: boolean;
}

const quickQuestions = [
    'HP gaming 1 jutaan yang bagus',
    'HP kamera terbaik harga 2 jutaan',
    'HP daily driver yang oke tahun 2025'
];

const TanyaAI: React.FC<TanyaAIProps> = ({ isOpen, onClose, openAdminLogin, isPage = false }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const systemInstruction = `Anda adalah JagoBot AI (Asisten AI JAGO-HP). Semua respons HARUS dalam Bahasa Indonesia.
Anda hanya menjawab soal gadget. Jika di luar topik, tolak dengan sopan. 
Berikan jawaban awal yang singkat dan padat.`;

        chatRef.current = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
        setMessages([{ role: 'model', text: 'Hai Kak, aku JagoBot AI. Mau cari HP apa? Tulis aja yang mau ditanyain' }]);
        setShowQuickQuestions(true);
    }, [ai]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [messages, loading, isOpen]);

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
                    const iMessages = [...prev];
                    iMessages[iMessages.length - 1] = { role: 'model', text: currentModelResponse };
                    return iMessages;
                });
            }

            if (supabase && currentModelResponse) {
                try {
                    await supabase.from('ai_chat_cache').insert({ prompt: cacheKey, response: currentModelResponse });
                } catch (cacheError) { console.warn("Cache write failed:", cacheError); }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => {
                const newMessages = [...prev];
                if(newMessages[newMessages.length - 1].text === ""){
                    newMessages[newMessages.length - 1] = { role: 'model', text: "Maaf kak, ada gangguan teknis. Coba tanya lagi ya." };
                }
                return newMessages;
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '#admindash') {
            openAdminLogin();
            setInput('');
            return;
        }
        sendMessage(input.trim());
        setInput('');
    };
    
    if (!isOpen && !isPage) return null;

    const containerClasses = isPage 
        ? "fixed inset-0 z-[100] flex flex-col bg-white" 
        : "fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden";

    const modalClasses = isPage
        ? "w-full h-full flex flex-col"
        : "relative w-full max-w-lg h-full max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in";

    return (
        <div className={containerClasses}>
            {/* Modal Backdrop (Desktop only) */}
            {!isPage && (
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]" 
                    onClick={onClose}
                />
            )}

            <div className={modalClasses}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b border-slate-100 bg-white flex-shrink-0 ${isPage ? 'shadow-sm' : ''}`}>
                    <div className="flex items-center gap-2">
                        {isPage && (
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} 
                                className="p-3 -ml-3 text-slate-700 hover:bg-slate-50 rounded-full active:scale-90 transition-all z-10" 
                                aria-label="Kembali"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-2xl">
                                <SparklesIcon className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">JagoBot AI</h2>
                                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> AKTIF
                                </p>
                            </div>
                        </div>
                    </div>
                    {!isPage && (
                        <button 
                            onClick={onClose} 
                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition-all active:scale-90"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 space-y-6 scrollbar-hide">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))}
                    
                    {showQuickQuestions && !loading && (
                        <div className="flex flex-col items-start gap-2 pt-2 pb-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Saran Pertanyaan:</p>
                            {quickQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(q)}
                                    className="text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl hover:border-slate-400 transition-all shadow-sm active:bg-slate-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                
                {/* Footer Input */}
                <div className={`p-4 bg-white border-t border-slate-100 flex-shrink-0 ${isPage ? 'pb-8' : ''}`}>
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
                                placeholder="Tulis sesuatu..."
                                className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-5 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className={`absolute right-1.5 top-1.5 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${loading || !input.trim() ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-md active:scale-90'}`}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <SendIcon className="w-5 h-5"/>
                                )}
                            </button>
                        </div>
                    </form>
                    <p className="text-[9px] text-slate-400 text-center mt-3 font-medium uppercase tracking-widest">
                        AI Gemini • JAGO-HP 2025
                    </p>
                </div>
            </div>
        </div>
    );
};

const ChatMessage: FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasContent = message.text && message.text.trim() !== '';

    if (!hasContent && !isUser) {
        return (
            <div className="flex justify-start items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-xl h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-4 h-4 text-slate-400"/>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                        <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
        );
    }
    
    const formatText = (text: string) => {
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;') 
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\n\s*-\s)/g, '<br/>• ')
            .replace(/\n/g, '<br />');
        return { __html: html };
    };

    return (
        <div className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="bg-slate-900 p-2 rounded-xl h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1">
                     <SparklesIcon className="w-4 h-4 text-white"/>
                </div>
            )}
            <div
                className={`rounded-2xl p-3 max-w-[88%] text-sm leading-relaxed shadow-sm ${
                    isUser
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}
            >
                <div className="prose prose-sm prose-slate" dangerouslySetInnerHTML={formatText(message.text)}></div>
            </div>
        </div>
    );
};

export default TanyaAI;
