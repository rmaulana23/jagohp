
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import ScaleIcon from './icons/ScaleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UsersIcon from './icons/UsersIcon';

const pillars = [
  {
    icon: <SparklesIcon className="w-8 h-8 text-fuchsia-400" />,
    title: 'Analisis AI Cepat & Cerdas',
    description: 'Dapatkan rating dan ulasan smartphone dalam hitungan detik. Teknologi AI kami memproses ribuan data untuk memberikanmu kesimpulan yang ringkas dan to-the-point.',
  },
  {
    icon: <ScaleIcon className="w-8 h-8 text-fuchsia-400" />,
    title: 'Data Objektif & Terpercaya',
    description: 'Tidak ada lagi review bias. AI kami mengacu pada data benchmark terstandarisasi (AnTuTu, Geekbench) dan spesifikasi teknis dari sumber terpercaya untuk hasil yang adil.',
  },
  {
    icon: <ChartBarIcon className="w-8 h-8 text-fuchsia-400" />,
    title: 'Insight Tren & Pangsa Pasar',
    description: 'Pahami dinamika pasar dengan data pangsa pasar global & Indonesia, serta polling publik. Selalu jadi yang pertama tahu brand mana yang sedang naik daun.',
  },
  {
    icon: <UsersIcon className="w-8 h-8 text-fuchsia-400" />,
    title: 'Jembatan Komunitas & Teknologi',
    description: 'Kami bukan hanya platform review. Kami adalah wadah bagi para tech enthusiast untuk berbagi opini dan mendapatkan rekomendasi terbaik, menjembatani pengguna dengan teknologi.',
  }
];

const About: React.FC = () => {
  return (
    <section id="about" className="flex-grow flex flex-col items-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in space-y-12">
        <div className="text-center">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
            Tentang JAGO-HP
          </h1>
          <p className="text-base text-gray-300 leading-relaxed max-w-3xl mx-auto">
            JAGO-HP adalah platform review smartphone berbasis AI yang dirancang untuk membantu kamu menemukan HP terbaik sesuai kebutuhan. Kami percaya bahwa memilih smartphone tidak perlu ribet cukup sekali klik, kamu bisa dapat review singkat, jelas, dan akurat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => (
            <div 
              key={index} 
              className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm 
                         transform transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-900/40 p-3 rounded-full">
                  {pillar.icon}
                </div>
                <h2 className="font-orbitron text-lg font-bold text-indigo-300">
                  {pillar.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;