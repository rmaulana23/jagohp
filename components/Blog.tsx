import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import EyeIcon from './icons/EyeIcon';

// Define the type for a blog post
interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  published_at: string;
  image_url: string;
  content: string;
  view_count: number;
}

interface BlogProps {
    setPage: (page: string) => void;
    navigateToBlogPost: (post: BlogPost) => void;
}

const Blog: React.FC<BlogProps> = ({ setPage, navigateToBlogPost }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!supabase) {
        setError("Koneksi database tidak tersedia.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('published_at', { ascending: false });

        if (dbError) {
          throw dbError;
        }
        
        setPosts(data || []);
      } catch (err: any) {
        console.error('Error fetching blog posts:', err);
        setError('Gagal memuat postingan blog. Coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

        {loading && <div className="text-center text-slate-500">Memuat artikel...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}

        {!loading && !error && (
            <div className="space-y-8">
            {posts.map((post) => (
                <div key={post.id} className="glass flex flex-col md:flex-row overflow-hidden group transition-shadow duration-300 hover:shadow-xl">
                <div className="relative md:w-2/5">
                    <img src={post.image_url} alt={post.title} className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 bg-[color:var(--accent1)] text-white text-xs font-semibold px-2 py-1 rounded-md">{post.category}</div>
                </div>
                <div className="p-6 flex flex-col flex-grow md:w-3/5">
                    <h2 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-[color:var(--accent1)] transition-colors">
                    {post.title}
                    </h2>
                     <div className="mt-2 text-xs text-slate-400 flex items-center flex-wrap gap-x-4 gap-y-1">
                        <span>Oleh {post.author}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                         <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <EyeIcon className="w-4 h-4"/>
                            <span>{post.view_count ? post.view_count.toLocaleString('id-ID') : '0'} x dilihat</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-3 flex-grow">
                    {post.excerpt}
                    </p>
                    <div className="mt-4 pt-4">
                        <button 
                            onClick={() => navigateToBlogPost(post)}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm bg-[color:var(--accent2)]/10 border border-[color:var(--accent2)]/50 text-[color:var(--accent2)] font-semibold hover:bg-[color:var(--accent2)]/20 transition-colors"
                        >
                            Baca Selengkapnya
                        </button>
                    </div>
                </div>
                </div>
            ))}
            {posts.length === 0 && (
                 <div className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-10 h-64">
                    <h3 className="font-semibold text-slate-600">Belum Ada Postingan</h3>
                    <p className="text-sm text-slate-400 mt-1">Sepertinya belum ada artikel yang dipublikasikan. Cek lagi nanti!</p>
                </div>
            )}
            </div>
        )}
      </div>
    </section>
  );
};

export default Blog;