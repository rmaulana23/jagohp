import React from 'react';

const PrivacyPolicy: React.FC = () => {
  const policySections = [
    {
      title: '1. Informasi yang Kami Kumpulkan',
      content: 'Kami dapat mengumpulkan informasi berikut:',
      points: [
        'Informasi non-pribadi: seperti alamat IP, jenis browser, perangkat, halaman yang diakses, serta waktu kunjungan.',
        'Cookies & teknologi serupa: digunakan untuk meningkatkan pengalaman pengguna dan menampilkan iklan yang relevan.',
      ],
    },
    {
      title: '2. Penggunaan Informasi',
      content: 'Informasi yang kami kumpulkan dapat digunakan untuk:',
      points: [
        'Meningkatkan kualitas konten dan layanan situs.',
        'Menyesuaikan iklan dan konten agar lebih relevan.',
        'Mengirimkan email terkait layanan atau tanggapan atas pertanyaan pengguna.',
        'Analisis trafik dan tren pengunjung.',
      ],
    },
    {
      title: '3. Iklan & Pihak Ketiga',
      content: 'Kami menampilkan banner iklan dari pihak ketiga. Penyedia iklan (seperti Google AdSense atau mitra lainnya) dapat menggunakan cookies untuk menayangkan iklan sesuai riwayat kunjungan Anda. Anda dapat menonaktifkan penggunaan cookies pihak ketiga melalui pengaturan browser.',
      points: [],
    },
    {
      title: '4. Keamanan Data',
      content: 'Kami berusaha melindungi data pengguna, namun perlu diketahui bahwa tidak ada metode transmisi melalui internet yang 100% aman.',
      points: [],
    },
    {
      title: '5. Tautan Eksternal',
      content: 'Situs kami mungkin berisi tautan ke situs lain. Kami tidak bertanggung jawab atas praktik privasi atau konten di situs eksternal tersebut.',
      points: [],
    },
    {
      title: '6. Persetujuan',
      content: 'Dengan menggunakan situs ini, Anda dianggap menyetujui Kebijakan Privasi kami.',
      points: [],
    },
    {
      title: '7. Perubahan Kebijakan',
      content: 'Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.',
      points: [],
    },
  ];

  return (
    <section id="privacy" className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-4xl animate-fade-in">
        <div className="bg-gray-800/30 border border-cyan-400/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
          <div className="text-center mb-10">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400">
              Kebijakan Privasi
            </h1>
          </div>
          <div className="space-y-6 text-sm">
            <p className="text-gray-300 leading-relaxed text-center">Selamat datang di JAGO-HP. Privasi pengunjung adalah hal yang sangat penting bagi kami. Dokumen Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi yang diperoleh dari pengguna situs.</p>
            {policySections.map((section, index) => (
              <div key={index} className="border-t border-cyan-400/20 pt-5">
                <h3 className="font-orbitron text-lg font-bold text-cyan-300 mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {section.content}
                </p>
                {section.points.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-gray-300 mt-2 pl-4">
                    {section.points.map((point, pIndex) => (
                      <li key={pIndex}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;