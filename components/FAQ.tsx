
import React from 'react';

const FAQ: React.FC = () => {
  const faqItems = [
    {
      q: 'Apa itu JAGO-HP?',
      a: 'JAGO-HP adalah platform review smartphone berbasis AI pertama di Indonesia. Kami membantu pengguna menemukan HP terbaik sesuai kebutuhan (gaming, kamera, baterai, dan lainnya) dengan rating otomatis dari AI.'
    },
    {
      q: 'Bagaimana cara kerja AI Review di sini?',
      a: 'AI kami menganalisis data spesifikasi HP, benchmark, serta insight publik. Hasilnya berupa rating per kategori (misalnya Gaming 4/5, Kamera 4.5/5) dan ringkasan singkat yang mudah dipahami.'
    },
    {
      q: 'Apakah review ini bisa dipercaya?',
      a: 'Ya ✅, review AI menggunakan data nyata dan analisis objektif. Bedanya dengan review manusia, AI lebih konsisten dan cepat menampilkan hasil.'
    },
    {
      q: 'Apakah data harga HP selalu terbaru?',
      a: 'Kami berusaha memperbarui harga HP secara rutin. Namun, harga bisa berbeda tergantung toko dan promo yang berlaku.'
    },
    {
      q: 'Apa itu Insight Public?',
      a: 'Insight Public adalah fitur yang menampilkan opini pengguna & tren HP di Indonesia, seperti HP paling dicari, polling publik, dan perbandingan rating AI dengan opini user.'
    },
    {
      q: 'Apakah JAGO-HP menerima iklan atau kerja sama?',
      a: 'Ya, kami membuka peluang kerja sama & investor, termasuk ads banner terbatas (maksimal 2 slot). Info lengkap ada di halaman Partnership.'
    },
    {
      q: 'Bagaimana cara memilih HP yang cocok lewat website ini?',
      a: 'Cukup pilih HP yang ingin kamu lihat, lalu periksa AI Review per kategori (Gaming, Kamera, Baterai, dll). Kamu juga bisa membandingkan dengan insight publik sebelum membeli.'
    },
    {
      q: 'Apakah hanya ada review HP?',
      a: 'Untuk saat ini fokus kami adalah smartphone. Namun, ke depan kami berencana menambah review laptop & gadget lain berbasis AI.'
    },
    {
      q: 'Bagaimana cara menghubungi tim JAGO-HP?',
      a: '📧 Email: support@jago-hp.id'
    }
  ];

  return (
    <section id="faq" className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 md:px-12 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in">
        <div className="bg-gray-800/30 border border-indigo-500/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
          <div className="text-center mb-10">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              FAQ – Pertanyaan Umum
            </h1>
          </div>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-indigo-500/20 pb-5 last:border-b-0 last:pb-0">
                <h3 className="font-orbitron text-lg font-bold text-indigo-300 mb-2">
                  {item.q}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;