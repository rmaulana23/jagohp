import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface BlogPostData {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  published_at: string;
  image_url: string;
  content: string;
}

interface BlogPostProps {
    post: BlogPostData | null;
    slug?: string;
    setPage: (page: string) => void;
    setSelectedPost: (post: BlogPostData | null) => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ post, slug, setPage, setSelectedPost }) => {
    const [internalPost, setInternalPost] = useState<BlogPostData | null>(post);
    const [loading, setLoading] = useState(!post && !!slug);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        return () => {
            setSelectedPost(null);
        }
    }, [setSelectedPost]);

    useEffect(() => {
        if (!post && slug) {
            const fetchPost = async () => {
                if (!supabase) {
                    setError("Koneksi database tidak tersedia.");
                    setLoading(false);
                    return;
                }
                setLoading(true);
                setError(null);
                try {
                    const { data, error: dbError } = await supabase
                        .from('blog_posts')
                        .select('*')
                        .eq('slug', slug)
                        .single();

                    if (dbError) throw dbError;

                    if (data) {
                        setInternalPost(data);
                        setSelectedPost(data);
                    } else {
                        setError('Postingan tidak ditemukan.');
                    }
                } catch (err: any) {
                    setError('Gagal memuat postingan.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        } else if (post) {
            setInternalPost(post);
            setLoading(false);
            setError(null);
        }
    }, [post, slug, setSelectedPost]);

    if (loading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-8">
                <p className="text-slate-500 animate-pulse">Memuat postingan...</p>
            </div>
        );
    }
    
    const postToRender = internalPost;

    if (!postToRender || error) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-2xl font-bold text-slate-800">{error || 'Postingan Tidak Ditemukan'}</h2>
                <p className="text-slate-500 mt-2">Sepertinya ada yang salah. Silakan kembali ke halaman blog.</p>
                <button 
                    onClick={() => setPage('blog')}
                    className="mt-6 px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
                >
                    Kembali ke Blog
                </button>
            </div>
        );
    }

    return (
        <section className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-3xl animate-fade-in">
                <article className="glass p-6 md:p-10">
                    <div className="mb-6">
                        <button 
                            onClick={() => setPage('blog')}
                            className="text-sm font-semibold text-[color:var(--accent1)] hover:underline mb-4"
                        >
                            &larr; Kembali ke Blog
                        </button>
                        <p className="text-sm font-bold text-[color:var(--accent1)]">{postToRender.category}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                            {postToRender.title}
                        </h1>
                        <div className="mt-4 text-xs text-slate-400 flex items-center gap-4">
                            <span>Oleh <strong>{postToRender.author}</strong></span>
                            <span>{new Date(postToRender.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                    
                    <img src={postToRender.image_url} alt={postToRender.title} className="w-full h-64 md:h-80 object-cover rounded-lg my-6" />

                    <div 
                        className="prose max-w-none text-slate-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: postToRender.content }}
                    >
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                         <button 
                            onClick={() => setPage('blog')}
                            className="text-sm font-semibold text-[color:var(--accent1)] hover:underline"
                        >
                            &larr; Kembali ke Semua Artikel
                        </button>
                    </div>
                </article>
            </div>
             <style>{`
                .prose p, .prose div { margin-bottom: 1em; }
                .prose h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
                .prose h3 { font-size: 1.25em; font-weight: bold; margin-top: 1.25em; margin-bottom: 0.5em; }
                .prose ul { list-style-position: inside; list-style-type: disc; margin-left: 1em; margin-bottom: 1em; }
                .prose ol { list-style-position: inside; list-style-type: decimal; margin-left: 1em; margin-bottom: 1em; }
                .prose a { color: #4f46e5; text-decoration: underline; }
                .prose strong, .prose b { font-weight: bold; }
                .prose em, .prose i { font-style: italic; }
                .prose u { text-decoration: underline; }
            `}</style>
        </section>
    );
};

export default BlogPost;
