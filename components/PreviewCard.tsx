
import React, { FC } from 'react';
import { ReviewResult } from './SmartReview';

interface PreviewCardProps {
    result: ReviewResult;
    onSeeFull: () => void;
}

const PreviewCard: FC<PreviewCardProps> = ({ result, onSeeFull }) => {
    const { phoneName, ratings, quickReview, specs, performance, marketPrice } = result;

    const calculateOverallScore = () => {
        if (!ratings) {
            return 'N/A';
        }
        const scores = [ratings.gaming, ratings.kamera, ratings.baterai, ratings.layarDesain, ratings.performa, ratings.storageRam];
        const validScores = scores.filter(s => typeof s === 'number' && s > 0);
        if (validScores.length === 0) return 'N/A';
        const sum = validScores.reduce((acc, score) => acc + score, 0);
        const average = sum / validScores.length;
        return average.toFixed(1);
    };

    // Function to shorten spec text for better display
    const shortenSpec = (spec: string | undefined | null): string | undefined | null => {
        if (!spec) return spec;
        
        // For processor: remove common manufacturer names to save space.
        const shortSpec = spec
            .replace(/Qualcomm\s*SM\w{4}(-\w{2,3})?\s*/i, '') // "Qualcomm SM8650-AB" -> ""
            .replace(/Qualcomm\s*/i, '') // "Qualcomm Snapdragon..." -> "Snapdragon..."
            .replace(/MediaTek\s*/i, '')
            .replace(/Samsung\s*Exynos\s*/i, 'Exynos ')
            .replace(/Apple\s*/i, '')
            .replace(/Unisoc\s*/i, '');
            
        return shortSpec.trim();
    };

    const overallScore = calculateOverallScore();
    const brand = phoneName.split(' ')[0] || 'Unknown';
    // Force display of whatever string is returned, assuming AI follows the "No TBA" rule
    const priceDisplay = marketPrice?.indonesia || 'Rp -'; 
    
    return (
        <div className="p-4 animate-fade-in flex flex-col bg-[color:var(--accent1)] rounded-2xl shadow-lg border border-white/10">
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-base font-semibold text-white leading-tight">{phoneName}</div>
                        <div className="text-xs text-slate-200 mt-0.5">{`Rilis: ${specs?.rilis || 'N/A'} • ${brand}`}</div> 
                    </div>
                    <div className="text-sm font-semibold text-white flex-shrink-0 ml-2 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                        Score <span className="text-yellow-400">{overallScore}</span>
                    </div>
                </div>

                {/* Price Display Badge - Always Visible & Prominent */}
                <div className="mt-3 mb-2">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md">
                        <span className="text-[10px] uppercase tracking-wider text-slate-300 mr-2">Harga Pasar:</span>
                        <span className="text-sm font-bold text-yellow-300 tracking-wide">
                            {priceDisplay}
                        </span>
                    </div>
                </div>

                <div className="mt-2 text-sm">
                    <div className="font-medium text-white text-xs uppercase tracking-wider opacity-80 mb-1">Quick Review</div>
                    <p className="text-slate-200 text-sm leading-relaxed line-clamp-3">{quickReview?.summary}</p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2 text-xs border-t border-white/10 pt-3">
                    <SpecItem label="CPU" value={shortenSpec(specs?.processor)} />
                    <SpecItem label="RAM" value={specs?.ram} />
                    <SpecItem label="Kamera" value={specs?.camera} />
                    <SpecItem label="Baterai" value={specs?.battery} />
                    <SpecItem label="AnTuTu" value={performance?.antutuScore?.toLocaleString('id-ID')} />
                </dl>
            </div>
             <button
                onClick={onSeeFull}
                className="w-full mt-5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[color:var(--accent1)] hover:bg-slate-100 transition-colors shadow-md flex items-center justify-center gap-2"
            >
                Lihat Review Lengkap &rarr;
            </button>
        </div>
    );
};

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col">
            <dt className="text-slate-400 font-medium text-[10px] uppercase">{label}</dt>
            <dd className="text-white font-medium truncate">{value}</dd>
        </div>
    )
};

export default PreviewCard;
