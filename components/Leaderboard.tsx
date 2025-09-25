
import React, { FC } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface BrandData {
    name: string;
    value: number;
    [key: string]: any;
}

const NEW_COLORS = ['#818cf8', '#d946ef', '#c084fc', '#fb7185', '#fbbf24', '#38bdf8', '#a78bfa'];


// --- DATA PROYEKSI 2025 ---

// Data Indonesia (Top Brand Award) - Sorted descending
const indonesiaData2025: BrandData[] = [
    { name: 'Samsung', value: 29.8 },
    { name: 'Xiaomi', value: 21.5 },
    { name: 'Oppo', value: 14.5 },
    { name: 'Vivo', value: 12.0 },
    { name: 'Realme', value: 8.8 },
    { name: 'Apple', value: 7.2 },
    { name: 'Brand Lainnya', value: 6.2 },
];

// Data Global (IDC) - Sorted descending
const globalData2025: BrandData[] = [
    { name: 'Brand Lainnya', value: 28.2 },
    { name: 'Samsung', value: 20.8 },
    { name: 'Apple', value: 18.5 },
    { name: 'Xiaomi', value: 14.1 },
    { name: 'Oppo', value: 9.9 },
    { name: 'Transsion', value: 8.5 }, // Infinix, Tecno
];


const Leaderboard: React.FC = () => {
    return (
        <section id="leaderboard" className="flex-grow flex flex-col items-center pt-24 pb-10 px-4 sm:px-6 md:px-12">
            <div className="container mx-auto max-w-5xl text-center">
                <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                    Papan Peringkat Brand
                </h1>
                <p className="text-base text-gray-400 mb-8 pb-1">
                    Lihat pangsa pasar brand smartphone teratas di Indonesia dan Dunia.
                </p>

                <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8">
                    {/* INDONESIA LEADERBOARD */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                         <h2 className="font-orbitron text-xl font-bold mb-4">Top Smartphone di Indonesia</h2>
                         <div className="flex-grow bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center">
                            <ChartDisplay data={indonesiaData2025} colors={NEW_COLORS} />
                        </div>
                         <p className="text-xs text-gray-500 mt-3 text-center">
                            Data merupakan proyeksi 2025 berdasarkan tren Top Brand Index.
                            <br />
                            Sumber: <a href="https://www.topbrand-award.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">topbrand-award.com</a>
                        </p>
                    </div>

                    {/* GLOBAL LEADERBOARD */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <h2 className="font-orbitron text-xl font-bold mb-4">Top Smartphone di Dunia</h2>
                        <div className="flex-grow bg-gray-800/30 border border-fuchsia-500/30 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center">
                            <ChartDisplay data={globalData2025} colors={[...NEW_COLORS].reverse()} />
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Data merupakan proyeksi 2025 berdasarkan tren pangsa pasar global.
                            <br />
                            Sumber: <a href="https://www.idc.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">IDC (International Data Corporation)</a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ChartDisplay: FC<{ data: BrandData[]; colors: string[] }> = ({ data, colors }) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
                    <p className="font-bold text-white">{`${payload[0].payload.name}`}</p>
                    <p className="text-indigo-400">{`Market Share: ${payload[0].value}%`}</p>
                </div>
            );
        }
        return null;
    };

    const formatLabel = (value: number) => `${value}%`;
    
    // The data is already sorted descending, which recharts renders top-to-bottom correctly.
    const displayData = data;

    return (
        <div className="w-full h-[250px] animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={displayData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis type="number" hide />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#9ca3af" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tick={{ fill: '#d1d5db' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                    <Bar dataKey="value" barSize={25} radius={[0, 8, 8, 0]}>
                        <LabelList 
                            dataKey="value" 
                            position="right" 
                            offset={8}
                            fill="#ffffff" 
                            fontSize={12}
                            fontWeight="bold"
                            formatter={formatLabel}
                        />
                        {displayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Leaderboard;