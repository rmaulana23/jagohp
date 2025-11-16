
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
    
    return (
        <div className="p-4 animate-fade-in flex flex-col bg-[color:var(--accent1)] rounded-2xl shadow-lg">
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-base font-semibold text-white leading-tight">{phoneName}</div>
                        <div className="text-xs text-slate-200 mt-0.5">{`Rilis: ${specs?.rilis || 'N/A'} • ${brand}`}</div> 
                    </div>
                    <div className="text-sm font-semibold text-white flex-shrink-0 ml-2">Score {overallScore}</div>
                </div>

                {/* Price Display */}
                <div className="mt-3 mb-1">
                    <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1 text-sm font-bold text-yellow-300 shadow-sm">
                        {marketPrice?.indonesia ? `🏷️ ${marketPrice.indonesia}` : 'Cek Harga'}
                    </span>
                </div>

                <div className="mt-2 text-sm">
                    <div className="font-medium text-white">Quick Review</div>
                    <p className="text-slate-200 text-sm mt-1 leading-relaxed">{quickReview?.summary}</p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs border-t border-white/30 pt-3">
                    <SpecItem label="CPU" value={shortenSpec(specs?.processor)} />
                    <SpecItem label="RAM" value={specs?.ram} />
                    <SpecItem label="Kamera" value={specs?.camera} />
                    <SpecItem label="Baterai" value={specs?.battery} />
                    <SpecItem label="AnTuTu v10" value={performance?.antutuScore?.toLocaleString('id-ID')} />
                </dl>
            </div>
             <button
                onClick={onSeeFull}
                className="w-full mt-4 px-3 py-1.5 rounded-md text-xs bg-white/10 border border-white/50 text-white font-semibold hover:bg-white/20 transition-colors"
            >
                Lihat Selengkapnya
            </button>
        </div>
    );
};

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <>
            <dt className="text-slate-300 font-medium">{label}</dt>
            <dd className="text-white font-medium text-right truncate">{value}</dd>
        </>
    )
};

export default PreviewCard;
