import React, { FC } from 'react';
import { ReviewResult } from './SmartReview';

interface PreviewCardProps {
    result: ReviewResult;
    onSeeFull: () => void;
}

const PreviewCard: FC<PreviewCardProps> = ({ result, onSeeFull }) => {
    const { phoneName, ratings, quickReview, specs, performance } = result;

    const calculateOverallScore = () => {
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
        <div className="glass p-4 animate-fade-in flex flex-col">
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-base font-semibold text-slate-800 leading-tight">{phoneName}</div>
                        <div className="text-xs small-muted mt-0.5">{`Rilis: ${specs.rilis || 'N/A'} • ${brand}`}</div> 
                    </div>
                    <div className="text-sm font-semibold text-[color:var(--accent1)] flex-shrink-0 ml-2">Score {overallScore}</div>
                </div>

                <div className="mt-3 text-sm">
                    <div className="font-medium text-slate-800">Quick Review</div>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">{quickReview.summary}</p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs border-t border-slate-200 pt-3">
                    <SpecItem label="CPU" value={shortenSpec(specs.processor)} />
                    <SpecItem label="RAM" value={specs.ram} />
                    <SpecItem label="Kamera" value={specs.camera} />
                    <SpecItem label="Baterai" value={specs.battery} />
                    <SpecItem label="AnTuTu v10" value={performance.antutuScore?.toLocaleString('id-ID')} />
                </dl>
            </div>
             <button
                onClick={onSeeFull}
                className="w-full mt-4 px-3 py-1.5 rounded-md text-xs bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
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
            <dt className="text-slate-500 font-medium">{label}</dt>
            <dd className="text-slate-700 font-medium text-right truncate">{value}</dd>
        </>
    )
};

export default PreviewCard;