import React, { FC, useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface PollData {
    name: string;
    votes: number;
    emoji: string;
}

const initialPollData: PollData[] = [
    { name: 'Apple (iOS/macOS)', votes: 352, emoji: '🍏' },
    { name: 'Samsung (One UI)', votes: 258, emoji: '📱' },
    { name: 'Google (Pixel)', votes: 125, emoji: '📲' },
    { name: 'Xiaomi/Poco (HyperOS)', votes: 91, emoji: '🥡' },
    { name: 'Huawei/Honor (HarmonyOS)', votes: 65, emoji: '🌍' },
    { name: 'Oppo (ColorOS/OnePlus)', votes: 43, emoji: '🌈' },
    { name: 'Vivo (OriginOS/Funtouch)', votes: 21, emoji: '💙' },
    { name: 'Android Lainnya', votes: 12, emoji: '🤖' },
];

const COLORS = ['#22d3ee', '#34d399', '#a78bfa', '#f87171', '#fbbf24', '#60a5fa', '#f472b6', '#818cf8', '#fb923c', '#9ca3af'];

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
    const [pollData, setPollData] = useState<PollData[]>(initialPollData);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedFor, setVotedFor] = useState<string | null>(null);

    useEffect(() => {
        const storedVote = localStorage.getItem('ecosystemPollVote');
        if (storedVote) {
            setHasVoted(true);
            setVotedFor(storedVote);
        }
        
        const storedData = localStorage.getItem('ecosystemPollData');
        if (storedData) {
            // Ensure stored data matches current structure
            const parsedData = JSON.parse(storedData);
            const currentNames = initialPollData.map(p => p.name);
            const filteredData = parsedData.filter((p: PollData) => currentNames.includes(p.name));
            if(filteredData.length !== initialPollData.length) {
                 localStorage.setItem('ecosystemPollData', JSON.stringify(initialPollData));
                 setPollData(initialPollData);
            } else {
                setPollData(filteredData);
            }
        } else {
             localStorage.setItem('ecosystemPollData', JSON.stringify(initialPollData));
        }
    }, []);

    const handleVote = (brandName: string) => {
        if (votedFor === brandName) return;

        let newPollData = [...pollData];

        if (votedFor) {
            newPollData = newPollData.map(item =>
                item.name === votedFor ? { ...item, votes: Math.max(0, item.votes - 1) } : item
            );
        }

        newPollData = newPollData.map(item =>
            item.name === brandName ? { ...item, votes: item.votes + 1 } : item
        );

        setPollData(newPollData);
        setHasVoted(true);
        setVotedFor(brandName);
        
        localStorage.setItem('ecosystemPollVote', brandName);
        localStorage.setItem('ecosystemPollData', JSON.stringify(newPollData));
    };

    const handleUnvote = () => {
        if (!votedFor) return;

        const newPollData = pollData.map(item =>
            item.name === votedFor ? { ...item, votes: Math.max(0, item.votes - 1) } : item
        );
        
        setPollData(newPollData);
        setHasVoted(false);
        setVotedFor(null);
        
        localStorage.removeItem('ecosystemPollVote');
        localStorage.setItem('ecosystemPollData', JSON.stringify(newPollData));
    };

    const totalVotes = pollData.reduce((sum, item) => sum + item.votes, 0);

    const chartData = pollData.map(item => ({
        ...item,
        percentage: totalVotes > 0 ? parseFloat(((item.votes / totalVotes) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    return (
        <section id="insight" className="flex-grow flex flex-col items-center pt-28 pb-8 px-4 sm:px-8 md:px-16 w-full">
            <div className="container mx-auto max-w-7xl animate-fade-in">
                <div className="text-center mb-6">
                    <h1 className="font-orbitron text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
                        Polling Netizen
                    </h1>
                    <p className="text-lg text-gray-400 mt-4 pb-1">
                        Polling, Survei, dan Data Terkini Seputar Dunia Smartphone.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Polling Section */}
                    <div className="w-full lg:flex-[2]">
                        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm h-full flex flex-col">
                            <h2 className="font-orbitron text-2xl font-bold mb-2 text-cyan-300">Polling: HP dengan Ekosistem OS/UI Terbaik</h2>
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
                                        className="px-3 py-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors flex-shrink-0"
                                    >
                                        Batalkan Suara
                                    </button>
                                )}
                            </div>
                            <div className="w-full flex-grow min-h-[250px]">
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
                                            tick={(props) => <CustomYAxisTick {...props} onVote={handleVote} votedFor={votedFor} />}
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
                            </div>
                        </div>
                    </div>
                    {/* Right Column: Data Cards */}
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

const CustomYAxisTick: FC<any> = ({ x, y, payload, onVote, votedFor }) => {
    // Guard clause to prevent crash
    if (!payload || !payload.value) {
        return null;
    }
    const brandData = initialPollData.find(d => payload.value.includes(d.name));
    if (!brandData) return null; // Defensive check

    const brandName = brandData.name;
    const isVoted = votedFor === brandName;
    const hasVoted = !!votedFor;

    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-155} y={-11} width="150" height="22">
                <div className="flex items-center justify-end text-right h-full">
                    <span className="text-xs text-gray-200 truncate pr-2">{`${brandData.emoji} ${brandName}`}</span>
                    <button
                        onClick={() => onVote(brandName)}
                        disabled={isVoted}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full w-14 text-center transition-all duration-200
                            ${isVoted 
                                ? 'bg-green-500/80 text-white cursor-not-allowed' 
                                : hasVoted 
                                    ? 'bg-gray-600 hover:bg-cyan-600 text-white' 
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                            }`}
                    >
                        {isVoted ? '✓ Voted' : hasVoted ? 'Ganti' : 'Vote'}
                    </button>
                </div>
            </foreignObject>
        </g>
    );
};

const DataCard: FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="font-orbitron text-xl font-bold mb-1 text-cyan-300">{title}</h3>
        <p className="text-gray-500 text-xs mb-4">{subtitle}</p>
        {children}
    </div>
);

export default InsightPublic;