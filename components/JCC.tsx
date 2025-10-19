import React from 'react';

const JCC: React.FC = () => {
  return (
    <section id="jcc" className="flex-grow flex flex-col items-center justify-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-2xl animate-fade-in">
        <div className="glass p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
              JAGO-HP Content Creator (JCC)
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto mt-4">
              Fitur ini akan segera hadir! Kami sedang mempersiapkan platform bagi para kreator konten untuk berkolaborasi dan berkembang bersama JAGO-HP.
            </p>
            <div className="mt-8 text-2xl animate-pulse">
                🚀
            </div>
        </div>
      </div>
    </section>
  );
};

export default JCC;
