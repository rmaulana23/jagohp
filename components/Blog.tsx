import React from 'react';

const dummyPosts = [
  {
    slug: 'panduan-lengkap-memilih-hp-gaming-terbaik-2025',
    title: 'Panduan Lengkap Memilih HP Gaming Terbaik di 2025',
    category: 'Tips & Trik',
    excerpt: 'Bingung pilih HP gaming? Jangan khawatir! Di artikel ini, kita akan bahas tuntas cara memilih HP gaming terbaik yang sesuai dengan budget dan kebutuhanmu, dari chipset, layar, sampai sistem pendingin.',
    author: 'Tim JAGO-HP',
    date: '15 Oktober 2025',
    imageUrl: 'https://images.unsplash.com/photo-1604203618331-48905a06a6a9?q=80&w=1932&auto=format&fit=crop',
  },
  // Can add more posts here in the future
];

const Blog: React.FC<{ setPage: (page: string) => void }> = ({ setPage }) => {
  return (
    <section id="blog" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
      <div className="container mx-auto max-w-5xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">
            JAGO-HP Blog
          </h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-3xl mx-auto mt-3">
            Wawasan, tips, dan review mendalam seputar dunia smartphone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyPosts.map((post) => (
            <div key={post.slug} className="glass flex flex-col overflow-hidden group">
              <div className="relative">
                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 left-3 bg-[color:var(--accent1)] text-white text-xs font-semibold px-2 py-1 rounded-md">{post.category}</div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-[color:var(--accent1)] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-500 mt-2 flex-grow">
                  {post.excerpt}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                  <span>Oleh {post.author}</span>
                  <span>{post.date}</span>
                </div>
                 <button 
                    onClick={() => alert('Fitur detail artikel akan segera hadir!')}
                    className="mt-4 w-full px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
                >
                    Baca Selengkapnya
                </button>
              </div>
            </div>
          ))}
          {/* A placeholder for coming soon posts */}
           <div className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-5">
                <h3 className="font-semibold text-slate-600">Artikel Baru Segera Hadir</h3>
                <p className="text-sm text-slate-400 mt-1">Kami sedang menyiapkan konten-konten menarik lainnya untuk Anda.</p>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;
