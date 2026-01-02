
import React, { useState } from 'react';

const faqItems = [
    { q: 'Apa itu JAGO-HP?', a: 'JAGO-HP adalah platform review & compare smartphone berbasis AI. Kami membantu pengguna menemukan HP terbaik sesuai kebutuhan dengan rating otomatis dari AI.' },
    { q: 'Bagaimana cara kerja AI Review di sini?', a: 'AI kami menganalisis data spesifikasi HP, benchmark, serta insight publik. Hasilnya berupa rating per kategori dan ringkasan singkat yang mudah dipahami.' },
    { q: 'Apakah review ini bisa dipercaya?', a: 'Ya, review AI menggunakan data nyata dan analisis objektif. AI lebih konsisten dan cepat menampilkan hasil berdasarkan data terstruktur.' },
    { q: 'Apakah data harga HP selalu terbaru?', a: 'Kami berusaha memperbarui harga HP secara rutin. Namun, harga bisa berbeda tergantung toko dan promo yang berlaku.' },
    { q: 'Apakah JAGO-HP menerima iklan atau kerja sama?', a: 'Saat ini kami sedang berfokus pada pengembangan fitur AI untuk pengguna. Namun, Anda tetap dapat menghubungi tim kami untuk diskusi potensi kolaborasi di masa depan melalui email.' },
    { q: 'Bagaimana cara menghubungi tim JAGO-HP?', a: 'Anda dapat menghubungi kami melalui email di: timjagohp@gmail.com' }
];

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-5xl animate-fade-in">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
                        Pertanyaan Umum (FAQ)
                    </h1>
                </div>
                <div className="glass p-6 md:p-8">
                    <div className="space-y-4">
                        {faqItems.map((item, index) => (
                            <div key={index} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex justify-between items-center text-left"
                                >
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {item.q}
                                    </h3>
                                    <span className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                                    <p className="text-slate-500 leading-relaxed text-sm pt-2">
                                        {item.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
