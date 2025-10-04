import React from 'react';

const PrivacyPolicy: React.FC = () => {
  const policySections = [
    { title: '1. Informasi yang Kami Kumpulkan', content: 'Kami dapat mengumpulkan informasi non-pribadi seperti alamat IP, jenis browser, perangkat, halaman yang diakses, serta waktu kunjungan. Kami juga menggunakan cookies & teknologi serupa untuk meningkatkan pengalaman pengguna dan analisis.' },
    { title: '2. Penggunaan Informasi', content: 'Informasi yang kami kumpulkan digunakan untuk meningkatkan kualitas konten dan layanan situs, analisis trafik dan tren pengunjung, serta menyesuaikan iklan dan konten agar lebih relevan.' },
    { title: '3. Cache Data AI', content: 'Untuk meningkatkan kecepatan dan efisiensi, kami menyimpan sementara (cache) hasil dari kueri AI yang sering diakses. Data yang disimpan bersifat anonim dan hanya berisi input kueri (misal: "review iPhone 17") dan output dari AI.' },
    { title: '4. Data Umpan Publik', content: 'Partisipasi dalam umpan publik bersifat anonim. Kami tidak mengaitkan kiriman Anda dengan informasi pribadi apa pun. Kiriman akan dihapus secara berkala.' },
    { title: '5. Iklan & Pihak Ketiga', content: 'Kami mungkin menampilkan banner iklan dari pihak ketiga. Penyedia iklan dapat menggunakan cookies untuk menayangkan iklan sesuai riwayat kunjungan Anda.' },
    { title: '6. Keamanan Data', content: 'Kami menerapkan langkah-langkah wajar untuk melindungi data, namun perlu diketahui bahwa tidak ada metode transmisi melalui internet yang 100% aman.' },
    { title: '7. Tautan Eksternal', content: 'Situs kami mungkin berisi tautan ke situs lain. Kami tidak bertanggung jawab atas praktik privasi atau konten di situs eksternal tersebut.' },
    { title: '8. Persetujuan dan Perubahan', content: 'Dengan menggunakan situs ini, Anda dianggap menyetujui Kebijakan Privasi kami. Kami dapat memperbarui kebijakan ini sewaktu-waktu.' },
  ];

  return (
    <section id="privacy" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-4xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-orbitron">
            Kebijakan Privasi
          </h1>
        </div>
        <div className="glass rounded-2xl p-6 md:p-10 space-y-6">
          <p className="text-slate-400 leading-relaxed text-sm text-center">
            Terakhir diperbarui: 2 Oktober 2025. Privasi Anda penting bagi kami. Dokumen ini menjelaskan bagaimana JAGO-HP mengumpulkan, menggunakan, dan melindungi informasi Anda.
          </p>
          {policySections.map((section) => (
            <div key={section.title} className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
              <h3 className="text-lg font-semibold text-white mb-2">
                {section.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;