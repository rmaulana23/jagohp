

import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';

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

const Hero: React.FC<{ setPage: (page: string) => void; onSearch: (query: string) => void; }> = ({ setPage, onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

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
        
        <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto mt-8">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tuliskan tipe HP, misal: iphone 17..."
                className="w-full bg-gray-900/50 border-2 border-indigo-500/50 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 text-base"
                aria-label="Cari review smartphone"
            />
            <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center
                           hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                aria-label="Mulai Smart Review"
            >
                <SearchIcon className="w-4 h-4"/>
            </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Ketik lalu Tekan Enter untuk memulai Smart Review dengan AI-Powered.</p>
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