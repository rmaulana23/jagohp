import React from 'react';

const About: React.FC = () => {
  const missionPoints = [
    "Membuat proses memilih smartphone jadi lebih cepat & pintar.",
    "Menyediakan perbandingan objektif antar brand & model.",
    "Memberikan insight tren terbaru dunia smartphone.",
    "Menjadi jembatan antara teknologi, brand, dan pengguna di Indonesia."
  ];

  return (
    <section id="about" className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 md:px-12">
      <div className="container mx-auto max-w-4xl animate-fade-in">
        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm text-center">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
            Tentang JAGO-HP
          </h1>
          <p className="text-base text-gray-300 leading-relaxed max-w-3xl mx-auto">
            JAGO-HP adalah platform review smartphone berbasis AI yang dirancang untuk membantu kamu menemukan HP terbaik sesuai kebutuhan. Kami percaya bahwa memilih smartphone tidak perlu ribet cukup sekali klik, kamu bisa dapat review singkat, jelas, dan akurat.
          </p>
        </div>

        <div className="mt-10 bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
           <h2 className="font-orbitron text-2xl font-bold mb-8 text-center text-cyan-300">
            🎯 Misi Kami
          </h2>
          <ul className="space-y-4 max-w-2xl mx-auto">
            {missionPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                </div>
                <span className="text-gray-200 text-base">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About;