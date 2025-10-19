import React from 'react';

const pillars = [
  {
    title: 'Analisis AI Cerdas',
    description: 'Dapatkan ulasan dan perbandingan smartphone ringkas dalam hitungan detik. AI kami memproses ribuan data untuk Anda.',
  },
  {
    title: 'Data Objektif & Terpercaya',
    description: 'Analisis kami mengacu pada data benchmark terstandarisasi (AnTuTu, Geekbench, DXOMark) untuk hasil yang adil dan akurat.',
  },
  {
    title: 'Wawasan Pangsa Pasar',
    description: 'Pahami dinamika pasar dengan data pangsa pasar smartphone teratas di Indonesia dan dunia.',
  },
  {
    title: 'Fokus pada Pengguna',
    description: 'Menjadi wadah bagi para pencari gadget untuk mendapatkan rekomendasi terbaik yang sesuai dengan kebutuhan dan anggaran mereka.',
  }
];

const About: React.FC = () => {
  return (
    <section id="about" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
            Tentang JAGO-HP
          </h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-3xl mx-auto mt-3">
            JAGO-HP adalah platform review smartphone berbasis AI di Indonesia.
          </p>
        </div>

        <div className="glass p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, index) => (
              <div key={index}>
                <h2 className="text-lg font-semibold text-slate-800">
                  {pillar.title}
                </h2>
                <p className="text-slate-500 text-sm leading-normal mt-1">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
