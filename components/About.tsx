import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import ScaleIcon from './icons/ScaleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UsersIcon from './icons/UsersIcon';

const pillars = [
  {
    icon: <SparklesIcon className="w-6 h-6 text-[color:var(--accent1)]" />,
    title: 'Analisis AI Cerdas',
    description: 'Dapatkan ulasan dan perbandingan smartphone ringkas dalam hitungan detik. AI kami memproses ribuan data untuk Anda.',
  },
  {
    icon: <ScaleIcon className="w-6 h-6 text-[color:var(--accent1)]" />,
    title: 'Data Objektif & Terpercaya',
    description: 'Analisis kami mengacu pada data benchmark terstandarisasi (AnTuTu, Geekbench, DXOMark) untuk hasil yang adil dan akurat.',
  },
  {
    icon: <ChartBarIcon className="w-6 h-6 text-[color:var(--accent1)]" />,
    title: 'Wawasan Pangsa Pasar',
    description: 'Pahami dinamika pasar dengan data pangsa pasar smartphone teratas di Indonesia dan dunia.',
  },
  {
    icon: <UsersIcon className="w-6 h-6 text-[color:var(--accent1)]" />,
    title: 'Fokus pada Pengguna',
    description: 'Menjadi wadah bagi para pencari gadget untuk mendapatkan rekomendasi terbaik yang sesuai dengan kebutuhan dan anggaran mereka.',
  }
];

const About: React.FC = () => {
  return (
    <section id="about" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
            Tentang JAGO-HP
          </h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-3xl mx-auto mt-3">
            JAGO-HP adalah platform review smartphone berbasis AI di Indonesia.
          </p>
        </div>

        <div className="glass p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4"
              >
                <div className="bg-[color:var(--accent1)]/10 p-3 rounded-full flex-shrink-0">
                  {pillar.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {pillar.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-normal mt-1">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;