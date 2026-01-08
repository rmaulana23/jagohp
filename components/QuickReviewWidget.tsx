
import React, { useState, useMemo, FC } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../utils/supabaseClient';
import { ReviewResult } from './SmartReview';
import PreviewCard from './PreviewCard';

interface QuickReviewWidgetProps {
    navigateToFullReview: (result: ReviewResult) => void;
}

const QuickReviewWidget: FC<QuickReviewWidgetProps> = ({
    navigateToFullReview,
}) => {
    const [reviewQuery, setReviewQuery] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [quickReviewResult, setQuickReviewResult] = useState<ReviewResult | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const handleReviewSearch = async () => {
        if (!reviewQuery.trim()) return;
        setReviewLoading(true);
        setReviewError(null);

        const cacheKey = reviewQuery.trim().toLowerCase();

        if (supabase) {
            try {
                const { data } = await supabase
                    .from('quick_reviews')
                    .select('review_data')
                    .eq('phone_name_query', cacheKey)
                    .single();
                if (data && data.review_data) {
                    setQuickReviewResult(data.review_data as ReviewResult);
                    setReviewLoading(false);
                    return;
                }
            } catch (cacheError) {
                console.warn("Supabase quick review cache check missed.");
            }
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                phoneName: { type: Type.STRING, description: "Nama resmi HP selengkap mungkin" },
                ratings: { type: Type.OBJECT, properties: { gaming: { type: Type.NUMBER }, kamera: { type: Type.NUMBER }, baterai: { type: Type.NUMBER }, layarDesain: { type: Type.NUMBER }, performa: { type: Type.NUMBER }, storageRam: { type: Type.NUMBER }}},
                quickReview: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                specs: { type: Type.OBJECT, properties: { rilis: { type: Type.STRING, description: "Wajib menyertakan nama bulan dan tahun. Contoh: 'Januari 2026'." }, brand: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }}},
                targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                accessoryAvailability: { type: Type.STRING },
                marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } } },
                performance: { type: Type.OBJECT, properties: { antutuScore: { type: Type.INTEGER }, geekbenchScore: { type: Type.STRING }, competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } }, gamingReview: { type: Type.STRING }, gamingRatings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { game: { type: Type.STRING }, score: { type: Type.NUMBER } } } } }},
                cameraAssessment: { type: Type.OBJECT, properties: { dxomarkScore: { type: Type.INTEGER }, photoSummary: { type: Type.STRING }, photoPros: { type: Type.ARRAY, items: { type: Type.STRING } }, photoCons: { type: Type.ARRAY, items: { type: Type.STRING } }, videoSummary: { type: Type.STRING }}}
            },
        };
        
        try {
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: `**Pakar Teknologi:** Quick Review HP dari kueri user: "${reviewQuery}". Identifikasi HP apa yang dimaksud (Contoh: "iPhone 16" -> "Apple iPhone 16"). **KHUSUS iPHONE 17 AIR:** WAJIB gunakan nama resmi 'iPhone Air'. Gunakan data 2026. rilis wajib ada bulan.`, 
                config: { 
                    responseMimeType: "application/json", 
                    responseSchema: schema 
                } 
            });
            const parsedResult: ReviewResult = JSON.parse(response.text.trim());
            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setReviewError(parsedResult.phoneName);
            } else {
                // Periksa apakah nama resmi dari AI sudah ada di DB utama
                const officialKey = parsedResult.phoneName.toLowerCase().trim();
                if (supabase) {
                    const { data: existing } = await supabase.from('smart_reviews').select('review_data').eq('cache_key', officialKey).single();
                    if (existing) {
                        setQuickReviewResult(existing.review_data as ReviewResult);
                        setReviewLoading(false);
                        return;
                    }
                }
                setQuickReviewResult(parsedResult);
            }
        } catch (e) {
            console.error(e);
            setReviewError('Terjadi kesalahan AI.');
        } finally {
            setReviewLoading(false);
        }
    };

    return (
        <div className="glass p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">Quick Review Pakar 2026</h3>
            <div className="flex gap-3 items-center">
                <input 
                    value={reviewQuery} 
                    onChange={(e) => setReviewQuery(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleReviewSearch()} 
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" 
                    placeholder="Tipe HP 2026..." 
                />
                <button 
                    onClick={handleReviewSearch} 
                    disabled={reviewLoading} 
                    className="px-4 py-2.5 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {reviewLoading ? '...' : 'Pakar'}
                </button>
            </div>
            {quickReviewResult ? (
                <div className="mt-4">
                    <PreviewCard result={quickReviewResult} onSeeFull={() => navigateToFullReview(quickReviewResult)} />
                </div>
            ) : (
                <div className="text-center text-sm text-slate-400 py-4 italic">
                    Tanya pakar kami tentang model HP apa pun.
                </div>
            )}
        </div>
    );
};

export default QuickReviewWidget;
