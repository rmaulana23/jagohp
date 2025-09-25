
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import ScaleIcon from './icons/ScaleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UsersIcon from './icons/UsersIcon';

const pillars = [
  {
    icon: <SparklesIcon className="w-6 h-6 text-fuchsia-400" />,
    title: 'Analisis AI',
    description: 'Dapatkan ulasan smartphone ringkas dalam hitungan detik. AI kami memproses ribuan data untukmu.',
  },
  {
    icon: <ScaleIcon className="w-6 h-6 text-fuchsia-400" />,
    title: 'Data Terpercaya',
    description: 'AI mengacu pada data benchmark terstandarisasi (AnTuTu, Geekbench) untuk hasil yang adil.',
  },
  {
    icon: <ChartBarIcon className="w-6 h-6 text-fuchsia-400" />,
    title: 'Pangsa Pasar',
    description: 'Pahami dinamika pasar dengan data pangsa pasar global.',
  },
  {
    icon: <UsersIcon className="w-6 h-6 text-fuchsia-400" />,
    title: 'Jembatan Komunitas & Teknologi',
    description: 'Wadah bagi para tech enthusiast untuk berbagi opini dan mendapatkan rekomendasi terbaik.',
  }
];

const About: React.FC = () => {
  return (
    <section id="about" className="flex-grow flex flex-col items-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in space-y-8">
        <div className="text-center">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
            Tentang JAGO-HP
          </h1>
          <p className="text-base text-gray-300 leading-normal max-w-3xl mx-auto">
            JAGO-HP adalah platform review smartphone berbasis AI. Kami merangkum ribuan ulasan jadi satu ulasan singkat, jelas, dan akurat biar Kalian lebih mudah menemukan HP terbaik.
          </p>
        </div>

        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="space-y-5">
            {pillars.map((pillar, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4"
              >
                <div className="bg-indigo-900/40 p-2 rounded-full mt-1 flex-shrink-0">
                  {pillar.icon}
                </div>
                <div>
                  <h2 className="font-orbitron text-base font-bold text-indigo-300">
                    {pillar.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-snug">
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