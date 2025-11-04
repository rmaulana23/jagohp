

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
                console.warn("Supabase quick review cache check failed:", cacheError);
            }
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                phoneName: { type: Type.STRING },
                ratings: { type: Type.OBJECT, properties: { gaming: { type: Type.NUMBER }, kamera: { type: Type.NUMBER }, baterai: { type: Type.NUMBER }, layarDesain: { type: Type.NUMBER }, performa: { type: Type.NUMBER }, storageRam: { type: Type.NUMBER }}},
                quickReview: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                specs: { type: Type.OBJECT, properties: { rilis: { type: Type.STRING }, brand: { type: Type.STRING }, processor: { type: Type.STRING }, ram: { type: Type.STRING }, camera: { type: Type.STRING }, battery: { type: Type.STRING }, display: { type: Type.STRING }, charging: { type: Type.STRING }, jaringan: { type: Type.STRING }, koneksi: { type: Type.STRING }, nfc: { type: Type.STRING }, os: { type: Type.STRING }}},
                targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                accessoryAvailability: { type: Type.STRING },
                marketPrice: { type: Type.OBJECT, properties: { indonesia: { type: Type.STRING }, global: { type: Type.STRING } } },
                performance: { type: Type.OBJECT, properties: { antutuScore: { type: Type.INTEGER }, geekbenchScore: { type: Type.STRING }, competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, antutuScore: { type: Type.INTEGER } } } }, gamingReview: { type: Type.STRING }, gamingRatings: { type: Type.ARRAY, description: "An array of gaming performance ratings for specific games.", items: { type: Type.OBJECT, properties: { game: { type: Type.STRING, description: "Name of the game, one of [PUBG Battlegrounds, COD Warzone, Mobile Legends, Genshin Impact, Real Racing 3]" }, score: { type: Type.NUMBER, description: "Rating score from 1 to 10 for the game." } } } } }},
                cameraAssessment: { type: Type.OBJECT, properties: { dxomarkScore: { type: Type.INTEGER }, photoSummary: { type: Type.STRING }, photoPros: { type: Type.ARRAY, items: { type: Type.STRING } }, photoCons: { type: Type.ARRAY, items: { type: Type.STRING } }, videoSummary: { type: Type.STRING }}}
            },
        };
        const prompt = `**Context: Cache Check**
- My system has already checked its database for an existing review for '${reviewQuery}'.
- A new review is required because no valid cached entry was found.
---
**Core Role: Comprehensive Data Synthesizer for JAGO-HP**
Your task is to act as an AI Gadget Reviewer and generate a comprehensive review in **Bahasa Indonesia** for the gadget: '${reviewQuery}'.

**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
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

**Execution Steps & Formatting Rules (VERY IMPORTANT):**
1.  **Identify Gadget:** Find the official product based on the user's query ('${reviewQuery}').
2.  **Extract & Synthesize Data:** Use the specified sources to gather the most accurate, final data.
3.  **Handle Missing Data:** Use \`null\` for numeric fields or "N/A" for strings if data is genuinely unavailable after checking all sources.
4.  **Populate JSON:** Fill all fields according to the schema with the following formatting constraints:
    -   \`ratings\`: Each category **MUST** be rated on a scale of 1 to 10 based on final product performance.
    -   \`gamingRatings\`: Provide a 1-10 score for each of these specific games: 'PUBG Battlegrounds', 'COD Warzone', 'Mobile Legends', 'Genshin Impact', 'Real Racing 3'. The score should reflect performance (FPS, stability, graphics settings). If performance data for a specific game is genuinely not available, omit it from the array.
    -   \`quickReview.summary\`: MUST be a single, concise sentence (maximum 1-2 short sentences).
    -   \`specs.ram\`: Format: "[Size] [Type]". Example: "8GB LPDDR5", "12GB LPDDR5X".
    -   \`specs.camera\`: A short summary of main lenses. Example: "Utama: 200MP + 50MP", "50MP Wide + 12MP Ultrawide".
    -   \`specs.battery\`: Just the capacity. Example: "5000 mAh".
5.  **Failure Conditions:** The only failure is if a device is truly fictional and unmentioned anywhere. Otherwise, you must provide data.

**Final Output:** Strictly adhere to the JSON schema and all formatting rules.`;
        
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const parsedResult: ReviewResult = JSON.parse(response.text.trim());
            if (parsedResult.phoneName.toLowerCase().startsWith('maaf:')) {
                setReviewError(parsedResult.phoneName);
            } else {
                setQuickReviewResult(parsedResult);
            }
        } catch (e) {
            console.error(e);
            setReviewError('An AI error occurred. Please try again.');
        } finally {
            setReviewLoading(false);
        }
    };

    return (
        <div className="glass p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">Quick Smart Review</h3>
            <div className="flex gap-3 items-center">
                <input 
                    value={reviewQuery} 
                    onChange={(e) => setReviewQuery(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleReviewSearch()} 
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)] transition-all" 
                    placeholder="Cari HP lain..." 
                />
                <button 
                    onClick={handleReviewSearch} 
                    disabled={reviewLoading} 
                    className="px-4 py-2.5 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {reviewLoading ? '...' : 'Cari'}
                </button>
            </div>
            {reviewLoading && <div className="text-center p-4 small-muted animate-pulse">Mereview, mohon tunggu..</div>}
            {reviewError && <div className="text-center p-4 text-red-500">{reviewError}</div>}
            {quickReviewResult ? (
                <div className="mt-4">
                    <PreviewCard result={quickReviewResult} onSeeFull={() => navigateToFullReview(quickReviewResult)} />
                </div>
            ) : (
                <div className="text-center text-sm text-slate-400 py-4">
                    Belum ada review. Cari HP untuk melihat hasilnya di sini.
                </div>
            )}
        </div>
    );
};

export default QuickReviewWidget;