
import React from 'react';

// New "AI Core" visual component
const AICore: React.FC = () => (
  <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[550px] max-h-[550px] pointer-events-none -z-10">
    <div className="relative w-full h-full animate-spin-slow">
      {/* Glowing Orb */}
      <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-3xl"></div>
      {/* Inner Rings */}
      <div className="absolute inset-8 border border-cyan-400/20 rounded-full opacity-50"></div>
      <div className="absolute inset-16 border border-cyan-400/10 rounded-full opacity-50"></div>
      {/* Outer Orbiting Lines */}
      <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin-medium"></div>
      <div className="absolute inset-4 border-r-2 border-green-500 rounded-full animate-spin-reverse-fast"></div>
    </div>
  </div>
);

const Hero: React.FC<{ setPage: (page: string) => void; openChat: () => void; }> = ({ setPage, openChat }) => {
  return (
    // Section now grows to fill the available space and centers content vertically.
    <section className="relative flex-grow flex flex-col items-center justify-center px-4 overflow-hidden">
      
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-teal-500/10 via-transparent to-transparent opacity-40"></div>
      </div>

      {/* New AI Core Visual */}
      <AICore />

      {/* Hero Content */}
      <div className="relative z-10 text-center animate-fade-in">
        <h1 className="font-orbitron text-4xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-300 drop-shadow-lg">
          Your AI Expert
          <br />
          <span className="bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
           Untuk Pilih Smartphone
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-gray-300 font-light leading-relaxed">
          JAGO-HP solusi biar Kalian gak bingung atau salah beli HP.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8">
          <div className="flex flex-col items-center text-center">
            <button 
              onClick={openChat}
              className="font-orbitron text-base font-bold w-60 h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden
                           text-white bg-transparent group border-2 border-cyan-500 backdrop-blur-sm">
              <span className="absolute w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100
                               transition-opacity ease-in duration-300"></span>
              <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f]/80 rounded-full
                               group-hover:bg-opacity-0 flex items-center justify-center">
                Tanya dulu Kakak
              </span>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
            </button>
            <p className="text-xs text-gray-400 mt-2 max-w-[250px]">Live Chat AI Sales Assistant</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <button 
              onClick={() => setPage('review')}
              className="font-orbitron text-base font-bold w-60 h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden
                           text-white bg-transparent group border-2 border-green-500 backdrop-blur-sm">
              <span className="absolute w-full h-full bg-gradient-to-br from-green-500 to-teal-600 opacity-0 group-hover:opacity-100
                               transition-opacity ease-in duration-300"></span>
              <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f]/80 rounded-full
                               group-hover:bg-opacity-0 flex items-center justify-center">
                Smart Review
              </span>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-500 to-teal-600 blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
            </button>
            <p className="text-xs text-gray-400 mt-2 max-w-[250px]">Ulasan Cepat dengan AI</p>
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
