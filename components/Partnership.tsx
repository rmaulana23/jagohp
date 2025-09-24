import React from 'react';

const Partnership: React.FC = () => {

  const whyUsPoints = [
    { emoji: '🎯', text: 'Targeted Audience → Fokus pada pengguna yang sedang mencari smartphone.' },
    { emoji: '📈', text: 'Potensi Pasar Besar → Indonesia punya lebih dari 100 juta pengguna smartphone aktif.' },
    { emoji: '🤖', text: 'Teknologi Unik → Review berbasis AI yang membedakan kami dari media teknologi biasa.' },
    { emoji: '📰', text: 'Konten Relevan → Tren HP terbaru, perbandingan, dan insight publik.' },
  ];

  return (
    <section id="partnership" className="flex-grow flex flex-col items-center justify-center pt-28 pb-12 px-4 sm:px-8 md:px-16 w-full">
      <div className="container mx-auto max-w-4xl animate-fade-in space-y-12">
        <div className="text-center">
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
            Peluang Kerja Sama
          </h1>
        </div>

        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
          <h2 className="font-orbitron text-3xl font-bold mb-8 text-center text-cyan-300">
            Kenapa Bekerja Sama dengan Kami?
          </h2>
          <div className="space-y-5 max-w-3xl mx-auto text-gray-200 text-lg">
            {whyUsPoints.map((point, index) => (
              <p key={index}><span className="mr-3">{point.emoji}</span>{point.text}</p>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
          <h2 className="font-orbitron text-3xl font-bold mb-8 text-center text-cyan-300">
            Opsi Kerja Sama
          </h2>
          <p className="text-center text-gray-400 -mt-6 mb-8">Kami membuka peluang kerja sama dalam bentuk:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-300">
            <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-700 space-y-3">
              <h3 className="font-orbitron text-xl font-bold text-green-400">Ads Banner</h3>
              <p className="text-gray-400">– Maksimal 2 slot banner eksklusif (tidak penuh iklan seperti website lain).</p>
              <p className="text-sm"><strong className="text-gray-200">Lokasi:</strong> Header (970x90) 2 page</p>
              <p className="text-sm"><strong className="text-gray-200">Format:</strong> gambar (JPG/PNG) atau animasi (GIF).</p>
            </div>
            
            <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-700">
              <h3 className="font-orbitron text-xl font-bold text-green-400">Investor Partnership</h3>
              <p className="text-gray-400">– Dukungan dana & strategi untuk pengembangan platform AI.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partnership;