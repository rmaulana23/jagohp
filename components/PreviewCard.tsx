
import React, { FC } from 'react';
import { ReviewResult } from './SmartReview';

interface PreviewCardProps {
    result: ReviewResult;
    onSeeFull: () => void;
}

const PreviewCard: FC<PreviewCardProps> = ({ result, onSeeFull }) => {
    const { phoneName, ratings, quickReview, specs, performance, marketPrice, imageUrl } = result;

    const calculateOverallScore = (): string => {
        if (!ratings) {
            return 'N/A';
        }
        const scores = [ratings.gaming, ratings.kamera, ratings.baterai, ratings.layarDesain, ratings.performa, ratings.storageRam];
        const validScores = scores.filter(s => typeof s === 'number' && s > 0);
        if (validScores.length === 0) return 'N/A';
        const sum: number = validScores.reduce((acc: number, score: number) => acc + score, 0);
        const average = sum / validScores.length;
        return average.toFixed(1);
    };

    const formatBrandName = (name: string): string => {
        return name.replace(/iqoo/gi, 'iQOO');
    };

    const shortenSpec = (spec: string | undefined | null): string | undefined | null => {
        if (!spec) return spec;
        const shortSpec = spec
            .replace(/Qualcomm\s*SM\w{4}(-\w{2,3})?\s*/i, '')
            .replace(/Qualcomm\s*/i, '')
            .replace(/MediaTek\s*/i, '')
            .replace(/Samsung\s*Exynos\s*/i, 'Exynos ')
            .replace(/Apple\s*/i, '')
            .replace(/Unisoc\s*/i, '');
        return formatBrandName(shortSpec.trim());
    };

    const overallScore = calculateOverallScore();
    const priceDisplay = marketPrice?.indonesia || 'Rp -'; 
    const displayName = formatBrandName(phoneName);
    
    return (
        <div className="p-4 animate-fade-in flex flex-col bg-[color:var(--accent1)] rounded-3xl shadow-2xl border border-white/10 overflow-hidden group">
            <div className="flex gap-4 mb-4 items-start">
                {imageUrl ? (
                    <div className="w-18 h-24 bg-slate-900/40 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-inner border border-white/5">
                        <img 
                            src={imageUrl} 
                            alt={displayName} 
                            className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500 scale-110" 
                        />
                    </div>
                ) : (
                    <div className="w-18 h-18 bg-slate-900/40 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">No Image</span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="text-base font-bold text-white leading-tight truncate group-hover:text-yellow-400 transition-colors">{displayName}</div>
                            <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{`Rilis: ${specs?.rilis || 'N/A'}`}</div> 
                        </div>
                        <div className="text-[10px] font-black text-yellow-400 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-md flex-shrink-0 border border-white/5">
                            {overallScore}
                        </div>
                    </div>
                    
                    <div className="mt-3">
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10">
                            <span className="text-[11px] font-black text-yellow-300 tracking-tight">
                                {priceDisplay}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-[10px] border-t border-white/10 pt-4">
                    <SpecItem label="Chipset" value={shortenSpec(specs?.processor)} />
                    <SpecItem label="AnTuTu v10" value={performance?.antutuScore?.toLocaleString('id-ID')} />
                    <SpecItem label="Memori" value={formatBrandName(specs?.ram || '')} />
                    <SpecItem label="Baterai" value={specs?.battery} />
                    <SpecItem label="Layar" value={specs?.display} />
                    <SpecItem label="Kamera" value={specs?.camera} />
                </dl>
            </div>

            <button
                onClick={onSeeFull}
                className="w-full mt-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white text-[#141426] hover:bg-yellow-400 transition-colors shadow-lg active:scale-95"
            >
                Review Lengkap &rarr;
            </button>
        </div>
    );
};

const SpecItem: FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col min-w-0">
            <dt className="text-slate-500 font-black text-[8px] uppercase tracking-widest mb-0.5">{label}</dt>
            <dd className="text-slate-200 font-bold truncate leading-tight">{value}</dd>
        </div>
    )
};

export default PreviewCard;
