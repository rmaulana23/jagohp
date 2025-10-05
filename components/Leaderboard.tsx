import React from 'react';

const Leaderboard: React.FC = () => {
    const indonesiaData2025 = [
        { name: 'Samsung', value: 29.8 }, { name: 'Xiaomi', value: 21.5 }, { name: 'Oppo', value: 14.5 },
        { name: 'Vivo', value: 12.0 }, { name: 'Realme', value: 8.8 }, { name: 'Apple', value: 7.2 }, { name: 'Lainnya', value: 6.2 },
    ];

    const globalData2025 = [
        { name: 'Lainnya', value: 28.2 }, { name: 'Samsung', value: 20.8 }, { name: 'Apple', value: 18.5 },
        { name: 'Xiaomi', value: 14.1 }, { name: 'Oppo', value: 9.9 }, { name: 'Transsion', value: 8.5 },
    ];

    return (
        <section id="leaderboard" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-6xl text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900 font-orbitron">
                    Brand Leaderboard
                </h1>
                <p className="text-base text-slate-500 mb-10">
                    Pangsa pasar brand smartphone teratas di Indonesia dan Dunia.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <LeaderboardCard title="Top Smartphone di Indonesia" data={indonesiaData2025} source="Top Brand Index" />
                    <LeaderboardCard title="Top Smartphone di Dunia" data={globalData2025} source="IDC" />
                </div>
            </div>
        </section>
    );
};

interface CardProps {
  title: string;
  data: { name: string; value: number }[];
  source: string;
}

const LeaderboardCard: React.FC<CardProps> = ({ title, data, source }) => (
    <div className="glass p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>
        <div className="flex-grow space-y-3">
            {data.map((brand, index) => (
                <div key={brand.name} className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${index < 3 ? 'text-[color:var(--accent1)]' : 'text-slate-500'}`}>#{index + 1}</span>
                        <span className="font-semibold text-slate-700">{brand.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{brand.value}%</span>
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">
            Proyeksi 2025 berdasarkan tren. Sumber: {source}
        </p>
    </div>
);

export default Leaderboard;