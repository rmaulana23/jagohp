
import React from 'react';

const Saran: React.FC = () => {
  return (
    <section id="saran" className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in">
        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Kritik & Saran
            </h1>
            <p className="text-base text-gray-300 leading-normal max-w-2xl mx-auto mt-4">
              Kami sangat menghargai masukan Anda untuk membuat JAGO-HP lebih baik lagi. Silakan kirimkan kritik, saran, atau ide-ide keren Anda langsung ke email kami.
            </p>
          </div>
          <div className="text-center">
            <a
              href="mailto:timjagohp@gmail.com?subject=Saran%20untuk%20JAGO-HP"
              className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                         bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"
            >
              <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
                Kirim Saran via Email
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Saran;
