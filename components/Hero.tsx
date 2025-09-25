
import React from 'react';

// New "AI Core" visual component
const AICore: React.FC = () => (
  <div className="hidden lg:block absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[550px] max-h-[550px] pointer-events-none -z-10">
    <div className="relative w-full h-full animate-spin-slow">
      {/* Glowing Orb */}
      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl"></div>
      {/* Inner Rings */}
      <div className="absolute inset-8 border border-indigo-500/20 rounded-full opacity-50"></div>
      <div className="absolute inset-16 border border-indigo-500/10 rounded-full opacity-50"></div>
      {/* Outer Orbiting Lines */}
      <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin-medium"></div>
      <div className="absolute inset-4 border-r-2 border-fuchsia-500 rounded-full animate-spin-reverse-fast"></div>
    </div>
  </div>
);

const Hero: React.FC<{ setPage: (page: string) => void; }> = ({ setPage }) => {
  return (
    // Section now grows to fill the available space and centers content vertically.
    <section className="relative flex-grow flex flex-col items-center justify-center px-4 overflow-hidden">
      
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-indigo-500/10 via-transparent to-transparent opacity-40"></div>
      </div>

      {/* New AI Core Visual - Hidden on mobile */}
      <AICore />

      {/* Hero Content */}
      <div className="relative z-10 text-center animate-fade-in w-full max-w-5xl">

        {/* Mobile-only Leaderboard Button - Moved to top */}
        <div className="mb-6 lg:hidden">
            <button
                onClick={() => setPage('leaderboard')}
                className="bg-fuchsia-500/10 border border-fuchsia-400 text-fuchsia-400 px-6 py-2 rounded-full text-sm font-bold 
                           hover:bg-fuchsia-400 hover:text-[#0a0f1f] hover:shadow-lg hover:shadow-fuchsia-400/40 
                           transition-all duration-300 ease-in-out"
            >
              Top Leaderboard
            </button>
        </div>

        <h1 className="font-orbitron text-3xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-300 drop-shadow-lg">
          Your AI Expert
          <br />
          <span className="bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
          Cara Cerdas Pilih Smartphone
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-gray-300 font-light leading-relaxed">
          JAGO-HP Solusi Biar Gak Salah Beli HP, Coba Sekarang GRATIS!
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8">
          {/* CTA 1: Smart Review */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setPage('review')}
              className="font-orbitron text-base font-bold w-64 h-14 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                         bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                  Smart Review AI
              </span>
            </button>
            <p className="text-xs text-gray-400 mt-2">Ulasan HP Cerdas, Singkat, dan Akurat.</p>
          </div>
          
          {/* CTA 2: Finder */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setPage('finder')}
              className="font-orbitron text-base font-bold w-64 h-14 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                         bg-gradient-to-r from-purple-500 to-fuchsia-500"
            >
               <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                  Finder Phone AI
              </span>
            </button>
            <p className="text-xs text-gray-400 mt-2">Bantu Rekomendasikan HP Impianmu.</p>
          </div>
        </div>
      </div>
      
      {/* Social Proof Text */}
      <div className="absolute bottom-16 left-1/6 -translate-x-1/2 z-10 animate-fade-in-delayed">
        <p className="text-sm text-gray-400">👉 Sudah dipakai 200+ pencari HP bulan ini</p>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-medium {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes spin-reverse-fast {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-medium { animation: spin-medium 25s linear infinite; }
        .animate-spin-reverse-fast { animation: spin-reverse-fast 15s linear infinite; }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fadeIn 1s ease-out 0.5s forwards;
        }
      `}</style>
    </section>
  );
};

export default Hero;