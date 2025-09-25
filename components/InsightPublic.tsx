
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

const COLORS = ['#818cf8', '#d946ef', '#c084fc', '#fb7185', '#fbbf24', '#38bdf8', '#a78bfa', '#64748b'];

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
        
        try {
            // 1. Decrement the previous vote, if one exists
            if (previousVote) {
                const { data: prevData, error: selectPrevError } = await supabase
                    .from('ecosystem_poll_votes')
                    .select('vote_count')
                    .eq('brand_name', previousVote)
                    .single();
                
                if (selectPrevError) throw selectPrevError;

                if (prevData) {
                    const { error: updatePrevError } = await supabase
                        .from('ecosystem_poll_votes')
                        .update({ vote_count: Math.max(0, prevData.vote_count - 1) })
                        .eq('brand_name', previousVote);
                    if (updatePrevError) throw updatePrevError;
                }
            }

            // 2. Increment the new vote
            const { data: newData, error: selectNewError } = await supabase
                .from('ecosystem_poll_votes')
                .select('vote_count')
                .eq('brand_name', brandName)
                .single();

            if (selectNewError) throw selectNewError;

            if (newData) {
                const { error: updateNewError } = await supabase
                    .from('ecosystem_poll_votes')
                    .update({ vote_count: newData.vote_count + 1 })
                    .eq('brand_name', brandName);
                if (updateNewError) throw updateNewError;
            }
        } catch (error) {
            console.error("Error voting:", error);
            setErrorPoll("Gagal menyimpan suara. Silakan coba lagi.");
            await fetchPollData(); // Revert on error
        } finally {
            setIsVoting(false);
        }
    };

    const hasVoted = !!votedFor;
    const totalVotes = pollData.reduce((sum, item) => sum + item.votes, 0);

    const chartData = pollData.map(item => ({
        ...item,
        percentage: totalVotes > 0 ? parseFloat(((item.votes / totalVotes) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.votes - a.votes);

    return (
        <section id="insight" className="flex-grow flex flex-col items-center pt-24 pb-4 px-4 sm:px-6 md:px-12 w-full">
            <div className="container mx-auto max-w-7xl animate-fade-in">
                <div className="text-center mb-4">
                    <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                        Polling Netizen
                    </h1>
                    <p className="text-base text-gray-400 mt-2 pb-1">
                        Polling, Survei, dan Data Terkini Seputar Dunia Smartphone.
                    </p>
                </div>

                <div className="w-full">
                    <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-5 md:p-6 backdrop-blur-sm flex flex-col">
                        <h2 className="font-orbitron text-xl font-bold mb-1 text-indigo-300">Polling: HP dengan Ekosistem OS/UI Terbaik</h2>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 min-h-[36px]">
                            <p className="text-gray-400 text-sm text-center sm:text-left mb-2 sm:mb-0 flex-grow">
                                {hasVoted 
                                    ? <>
                                        Anda memilih <span className="font-semibold text-white">{votedFor}</span>. 
                                    </>
                                    : 'Pilih ekosistem favoritmu! Klik tombol untuk vote.'}
                            </p>
                        </div>
                        {errorPoll && <p className="text-red-400 text-center text-sm mb-4">{errorPoll}</p>}
                        <div className="w-full h-[340px]">
                            {loadingPoll ? <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div></div> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 40, left: 160, bottom: 5 }}
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
                                                            <p className="text-indigo-400">{`Pilihan Publik: ${data.percentage}%`}</p>
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
                                                            ? (entry.name === votedFor ? '#d946ef' : '#4b5563')
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
            </div>
        </section>
    );
};

const CustomYAxisTick: FC<any> = ({ x, y, payload, onVote, votedFor, isVoting }) => {
    const brandName = payload.value;
    const hasVotedForThis = votedFor === brandName;

    return (
        <g transform={`translate(${x - 10},${y})`}>
            <foreignObject x={-150} y={-11} width={150} height={22}>
                <div className="flex items-center justify-end gap-2 pr-2 h-full w-full">
                    <span className="text-xs text-right text-gray-300 truncate flex-grow" title={brandName}>
                        {brandName}
                    </span>
                     {!hasVotedForThis && (
                         <button 
                            onClick={() => onVote(brandName)}
                            disabled={isVoting}
                            className="text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50"
                        >
                            Vote
                        </button>
                    )}
                    {hasVotedForThis && (
                        <span className="text-green-400 text-lg" role="img" aria-label="voted">✓</span>
                    )}
                </div>
            </foreignObject>
        </g>
    );
};

export default InsightPublic;