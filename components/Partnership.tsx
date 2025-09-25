
import React from 'react';

const Partnership: React.FC = () => {

  const whyUsPoints = [
    { emoji: '🎯', text: 'Targeted Audience → Fokus pada pengguna yang sedang mencari smartphone.' },
    { emoji: '📈', text: 'Potensi Pasar Besar → Indonesia punya lebih dari 100 juta pengguna smartphone aktif.' },
    { emoji: '🤖', text: 'Teknologi Unik → Review berbasis AI yang membedakan kami dari media teknologi biasa.' },
    { emoji: '📰', text: 'Konten Relevan → Tren HP terbaru, perbandingan, dan insight publik.' },
  ];

  return (
    <section id="partnership" className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in space-y-10">
        <div className="text-center">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
            Partnership or Sponsorship
          </h1>
        </div>

        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <h2 className="font-orbitron text-2xl font-bold mb-8 text-center text-indigo-300">
            Kenapa Bekerja Sama dengan Kami?
          </h2>
          <div className="space-y-5 max-w-3xl mx-auto text-gray-200 text-base">
            {whyUsPoints.map((point, index) => (
              <p key={index}><span className="mr-3">{point.emoji}</span>{point.text}</p>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <h2 className="font-orbitron text-2xl font-bold mb-8 text-center text-indigo-300">
            Opsi Kerja Sama
          </h2>
          <p className="text-center text-gray-400 -mt-6 mb-8">Kami membuka peluang kerja sama dalam bentuk:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-700 space-y-3">
              <h3 className="font-orbitron text-lg font-bold text-fuchsia-400">Ads Banner</h3>
              <p className="text-gray-400 text-sm">Maksimal 4 slot banner eksklusif (tidak penuh iklan seperti website lain).</p>
              <p className="text-sm"><strong className="text-gray-200">Lokasi:</strong> Header (970x90) 4 Page</p>
              <p className="text-sm"><strong className="text-gray-200">Format:</strong> gambar (JPG/PNG) atau animasi (GIF).</p>
            </div>
            
            <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-700 space-y-3">
              <h3 className="font-orbitron text-lg font-bold text-fuchsia-400">Investor Partnership</h3>
              <p className="text-gray-400 text-sm">Dukungan dana & strategi untuk pengembangan platform AI.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <a
            href="mailto:timjagohp@gmail.com"
            className="font-orbitron text-base font-bold w-full max-w-xs h-12 rounded-full relative inline-flex items-center justify-center p-0.5 overflow-hidden group
                       bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"
          >
            <span className="relative w-full h-full px-6 py-3 transition-all ease-in duration-200 bg-[#0a0f1f] rounded-full group-hover:bg-opacity-0 flex items-center justify-center">
              Hubungi Kami via Email
            </span>
          </a>
        </div>

      </div>
    </section>
  );
};

export default Partnership;
