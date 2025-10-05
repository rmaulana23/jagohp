import React from 'react';

const Saran: React.FC = () => {
  return (
    <section id="saran" className="flex-grow flex flex-col items-center justify-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-2xl animate-fade-in">
        <div className="glass p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
              Kritik & Saran
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto mt-4">
              Kami sangat menghargai masukan Anda untuk membuat JAGO-HP lebih baik lagi. Silakan kirimkan kritik, saran, atau ide-ide keren Anda langsung ke email kami.
            </p>
          <div className="mt-8">
            <a
              href="mailto:timjagohp@gmail.com?subject=Saran%20untuk%20JAGO-HP"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-lg bg-gradient-to-r from-[color:var(--accent1)] to-[color:var(--accent2)] text-white font-semibold
                         hover:opacity-90 transition-opacity duration-200 shadow-md"
            >
              Kirim Saran via Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Saran;