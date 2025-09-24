import React, { FC, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface PollData {
    name: string;
    votes: number;
    emoji: string;
}

const pollOptions: Omit<PollData, 'votes'>[] = [
    { name: 'Apple (iOS/macOS)', emoji: '🍏' },
    { name: 'Samsung (One UI)', emoji: '📱' },
    { name: 'Google (Pixel)', emoji: '📲' },
    { name: 'Xiaomi/Poco (HyperOS)', emoji: '🥡' },
    { name: 'Huawei/Honor (HarmonyOS)', emoji: '🌍' },
    { name: 'Oppo (ColorOS/OnePlus)', emoji: '🌈' },
    { name: 'Vivo (OriginOS/Funtouch)', emoji: '💙' },
    { name: 'Android Lainnya', emoji: '🤖' },
];

const COLORS = ['#22d3ee', '#34d399', '#a78bfa', '#f87171', '#fbbf24', '#60a5fa', '#f472b6', '#818cf8'];

const mostSearched = [
    { name: 'Infinix GT 20 Pro', trend: 'up' },
    { name: 'Samsung Galaxy S24 Ultra', trend: 'stable' },
    { name: 'Poco F6', trend: 'up' },
    { name: 'iPhone 15 Pro Max', trend: 'down' },
    { name: 'Redmi Note 13 Pro', trend: 'stable' },
];

const mostCompared = [
    { phone1: 'Poco F6', phone2: 'Infinix GT 20 Pro' },
    { phone1: 'Samsung A55', phone2: 'Vivo V30' },
    { phone1: 'Realme 12 Pro+', phone2: 'Redmi Note 13 Pro+' },
];

const InsightPublic: React.FC = () => {
    const [pollData, setPollData] = useState<PollData[]>([]);
    const [loadingPoll, setLoadingPoll] = useState(true);
    const [errorPoll, setErrorPoll] = useState<string | null>(null);
    const [votedFor, setVotedFor] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    const fetchPollData = useCallback(async () => {
        if (!supabase) {
            setErrorPoll("Koneksi database tidak terkonfigurasi.");
            setLoadingPoll(false);
            return;
        }
        setLoadingPoll(true);
        try {
            const { data, error } = await supabase
                .from('ecosystem_poll_votes')
                .select('*');

            if (error) throw error;
            if (data) {
                const formattedData = data.map(d => ({
                    name: d.brand_name,
                    votes: d.vote_count,
                    emoji: d.emoji,
                }));
                setPollData(formattedData);
            }
        } catch (err: any) {
            setErrorPoll("Gagal memuat data polling. Coba segarkan halaman.");
            console.error(err);
        } finally {
            setLoadingPoll(false);
        }
    }, []);

    useEffect(() => {
        fetchPollData();
        const storedVote = localStorage.getItem('ecosystemPollVote');
        if (storedVote) {
            setVotedFor(storedVote);
        }
    }, [fetchPollData]);

    const handleVote = async (brandName: string) => {
        if (isVoting || votedFor === brandName || !supabase) return;

        setIsVoting(true);
        setErrorPoll(null);
        const previousVote = votedFor;

        const optimisticData = pollData.map(item => {
            if (item.name === brandName) return { ...item, votes: item.votes + 1 };
            if (item.name === previousVote) return { ...item, votes: Math.max(0, item.votes - 1) };
            return item;
        });
        setPollData(optimisticData);
        setVotedFor(brandName);
        localStorage.setItem('ecosystemPollVote', brandName);
        
        const { error } = await supabase.rpc('handle_vote', {
            brand_voted_for: brandName,
            previous_vote: previousVote
        });

        if (error) {
            console.error("Error voting:", error);
            setErrorPoll("Gagal menyimpan suara. Silakan coba lagi.");
            await fetchPollData();
        }
        setIsVoting(false);
    };

    const handleUnvote = async () => {
        if (isVoting || !votedFor || !supabase) return;

        setIsVoting(true);
        setErrorPoll(null);
        const unvotedBrand = votedFor;

        const optimisticData = pollData.map(item => {
            if (item.name === unvotedBrand) return { ...item, votes: Math.max(0, item.votes - 1) };
            return item;
        });
        setPollData(optimisticData);
        setVotedFor(null);
        localStorage.removeItem('ecosystemPollVote');

        const { error } = await supabase.rpc('handle_unvote', {
            brand_unvoted: unvotedBrand
        });

        if (error) {
            console.error("Error unvoting:", error);
            setErrorPoll("Gagal membatalkan suara. Silakan coba lagi.");
            await fetchPollData();
        }
        setIsVoting(false);
    };

    const hasVoted = !!votedFor;
    const totalVotes = pollData.reduce((sum, item) => sum + item.votes, 0);

    const chartData = pollData.map(item => ({
        ...item,
        percentage: totalVotes > 0 ? parseFloat(((item.votes / totalVotes) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.votes - a.votes);

    return (
        <section id="insight" className="flex-grow flex flex-col items-center pt-24 pb-6 px-4 sm:px-6 md:px-12 w-full">
            <div className="container mx-auto max-w-7xl animate-fade-in">
                <div className="text-center mb-6">
                    <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
                        Polling Netizen
                    </h1>
                    <p className="text-base text-gray-400 mt-4 pb-1">
                        Polling, Survei, dan Data Terkini Seputar Dunia Smartphone.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:flex-[2]">
                        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-5 md:p-6 backdrop-blur-sm h-full flex flex-col">
                            <h2 className="font-orbitron text-xl font-bold mb-2 text-cyan-300">Polling: HP dengan Ekosistem OS/UI Terbaik</h2>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 min-h-[36px]">
                                <p className="text-gray-400 text-sm text-center sm:text-left mb-2 sm:mb-0 flex-grow">
                                    {hasVoted 
                                        ? <>
                                            <span className="font-bold text-green-400">Terima kasih!</span> Anda memilih <span className="font-semibold text-white">{votedFor}</span>.
                                        </>
                                        : 'Pilih ekosistem favoritmu! Klik tombol untuk vote.'}
                                </p>
                                {hasVoted && (
                                    <button 
                                        onClick={handleUnvote}
                                        disabled={isVoting}
                                        className="px-3 py-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors flex-shrink-0 disabled:opacity-50"
                                    >
                                        Batalkan Suara
                                    </button>
                                )}
                            </div>
                            {errorPoll && <p className="text-red-400 text-center text-sm mb-4">{errorPoll}</p>}
                            <div className="w-full flex-grow min-h-[250px]">
                                {loadingPoll ? <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                                        >
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                type="category" 
                                                dataKey="name"
                                                stroke="#9ca3af" 
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                width={150}
                                                tick={(props) => <CustomYAxisTick {...props} onVote={handleVote} votedFor={votedFor} isVoting={isVoting} />}
                                                interval={0}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-gray-900/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
                                                                <p className="font-bold text-white">{`${data.name}`}</p>
                                                                <p className="text-cyan-400">{`Pilihan Publik: ${data.percentage}%`}</p>
                                                                <p className="text-gray-400 text-xs">{`(${data.votes.toLocaleString('id-ID')} suara)`}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="percentage" barSize={22} radius={[0, 8, 8, 0]}>
                                                <LabelList 
                                                    dataKey="percentage" 
                                                    position="right" 
                                                    offset={8}
                                                    fill="#ffffff" 
                                                    fontSize={12}
                                                    fontWeight="bold"
                                                    formatter={(value: number) => `${value}%`}
                                                />
                                                {chartData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={
                                                            hasVoted
                                                                ? (entry.name === votedFor ? '#34d399' : '#4b5563')
                                                                : COLORS[index % COLORS.length]
                                                        }
                                                        className="transition-opacity duration-300"
                                                        style={{ opacity: hasVoted && entry.name !== votedFor ? 0.6 : 1 }}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:flex-[1] flex flex-col gap-6">
                        <DataCard title="🔥 Top 5 HP Paling Dicari" subtitle="Sebulan Terakhir">
                            <ol className="space-y-3">
                                {mostSearched.map((phone, index) => (
                                    <li key={index} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">
                                            <span className="font-bold text-gray-500 mr-3">{index + 1}.</span>{phone.name}
                                        </span>
                                        {phone.trend === 'up' && <span className="text-green-400 text-lg">📈</span>}
                                        {phone.trend === 'down' && <span className="text-red-400 text-lg">📉</span>}
                                        {phone.trend === 'stable' && <span className="text-gray-400 text-lg">➖</span>}
                                    </li>
                                ))}
                            </ol>
                        </DataCard>
                        
                        <DataCard title="⚔️ Top 3 Duel HP Paling Panas" subtitle="Paling Sering Dibandingkan">
                             <ul className="space-y-4">
                                {mostCompared.map((pair, index) => (
                                    <li key={index} className="flex items-center justify-center text-center text-sm font-semibold">
                                        <span className="text-cyan-400">{pair.phone1}</span>
                                        <span className="font-orbitron text-gray-500 mx-3 text-lg">VS</span>
                                        <span className="text-green-400">{pair.phone2}</span>
                                    </li>
                                ))}
                             </ul>
                        </DataCard>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CustomYAxisTick: FC<any> = ({ x, y, payload, onVote, votedFor, isVoting }) => {
    const brandName = payload.value;
    const emoji = pollOptions.find(opt => opt.name === brandName)?.emoji || '📱';
    const hasVotedForThis = votedFor === brandName;

    return (
        <g transform={`translate(${x - 10},${y})`}>
            <foreignObject x={-150} y={-11} width={150} height={22}>
                <div className="flex items-center justify-end gap-2 pr-2 h-full w-full">
                    <span className="text-xs text-right text-gray-300 truncate flex-grow" title={brandName}>
                        {brandName}
                    </span>
                     {!votedFor && (
                         <button 
                            onClick={() => onVote(brandName)}
                            disabled={isVoting}
                            className="text-xs font-bold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50"
                        >
                            Vote
                        </button>
                    )}
                    {votedFor && hasVotedForThis && (
                        <span className="text-green-400 text-lg" role="img" aria-label="voted">✓</span>
                    )}
                </div>
            </foreignObject>
        </g>
    );
};

const DataCard: FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-gray-800/30 border border-green-400/30 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
        <h3 className="font-orbitron text-lg font-bold text-green-300">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{subtitle}</p>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

export default InsightPublic;