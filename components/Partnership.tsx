import React from 'react';

const Partnership: React.FC = () => {
  const whyUsPoints = [
    { emoji: '🎯', text: 'Audiens Tertarget', description: 'Fokus pada pengguna yang aktif mencari dan membandingkan smartphone.' },
    { emoji: '📈', text: 'Potensi Pasar Besar', description: 'Indonesia memiliki lebih dari 100 juta pengguna smartphone aktif.' },
    { emoji: '🤖', text: 'Teknologi Unik', description: 'Platform berbasis AI yang membedakan kami dari media teknologi biasa.' },
    { emoji: '📰', text: 'Konten Relevan', description: 'Tren HP terbaru, perbandingan, dan insight berbasis data.' },
  ];

  return (
    <section id="partnership" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-4xl animate-fade-in space-y-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-orbitron">
            Partnership & Sponsorship
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto mt-3">
            Mari berkolaborasi untuk menjangkau audiens yang tepat di industri smartphone yang terus berkembang.
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Mengapa Bekerja Sama dengan Kami?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {whyUsPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-black/20 rounded-lg">
                <span className="text-2xl mt-1">{point.emoji}</span>
                <div>
                    <h3 className="font-semibold text-white">{point.text}</h3>
                    <p className="text-sm text-slate-400">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Opsi Kerja Sama
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div className="bg-black/20 p-6 rounded-lg border border-white/10 space-y-2">
              <h3 className="text-lg font-bold text-[color:var(--accent1)]">Ads Banner</h3>
              <p className="text-slate-400 text-sm">Slot banner eksklusif yang terbatas untuk visibilitas maksimal (bukan situs yang penuh iklan).</p>
              <p className="text-sm"><strong className="text-white">Lokasi:</strong> Header (Desktop & Mobile)</p>
              <p className="text-sm"><strong className="text-white">Format:</strong> JPG, PNG, atau GIF</p>
            </div>
            
            <div className="bg-black/20 p-6 rounded-lg border border-white/10 space-y-2">
              <h3 className="text-lg font-bold text-[color:var(--accent1)]">Investor Partnership</h3>
              <p className="text-slate-400 text-sm">Dukungan dana dan strategi untuk akselerasi pengembangan fitur dan jangkauan platform AI kami.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-slate-400 mb-4">Tertarik untuk berdiskusi lebih lanjut?</p>
          <a
            href="mailto:timjagohp@gmail.com"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[color:var(--accent1)] text-slate-900 font-semibold
                       hover:opacity-90 transition-opacity duration-200"
          >
            Hubungi Kami via Email
          </a>
        </div>
      </div>
    </section>
  );
};

export default Partnership;