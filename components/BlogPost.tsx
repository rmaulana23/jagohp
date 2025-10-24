import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

interface BlogPostData {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  published_at: string;
  image_url: string;
  content: string;
  view_count: number;
  blog_categories: { name: string }[];
}

interface Comment {
    id: number;
    post_id: number;
    author_name: string;
    content: string;
    created_at: string;
    updated_at: string;
}

interface BlogPostProps {
    post: BlogPostData | null;
    slug?: string;
    setPage: (page: string) => void;
    setSelectedPost: (post: BlogPostData | null) => void;
    isAdminAuthenticated: boolean;
}

const CommentsSection: React.FC<{ post: BlogPostData, isAdminAuthenticated: boolean }> = ({ post, isAdminAuthenticated }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [authorName, setAuthorName] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [lastCommentTime, setLastCommentTime] = useState<number | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const [myCommentIds, setMyCommentIds] = useState<number[]>([]);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('commentAuthorName') || '';
        setAuthorName(storedName);

        const storedIds = JSON.parse(localStorage.getItem('myCommentIds') || '[]') as number[];
        setMyCommentIds(storedIds);
        
        const storedTime = localStorage.getItem('lastCommentTime');
        if (storedTime) {
            const time = parseInt(storedTime, 10);
            const now = Date.now();
            const diff = now - time;
            if (diff < 60000) {
                setLastCommentTime(time);
                setCooldown(Math.ceil((60000 - diff) / 1000));
            }
        }
    }, []);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const fetchComments = async () => {
        if (!supabase) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setComments(data || []);
        } catch (err: any) {
            setError('Gagal memuat komentar.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [post.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authorName.trim() || !content.trim()) {
            alert('Nama dan komentar tidak boleh kosong.');
            return;
        }
        if (cooldown > 0) {
            return;
        }
        setIsSubmitting(true);
        setError(null);

        if (!supabase) {
             setError("Database tidak tersedia.");
             setIsSubmitting(false);
             return;
        }

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{ post_id: post.id, author_name: authorName, content }])
                .select()
                .single();

            if (error) throw error;

            localStorage.setItem('commentAuthorName', authorName);
            const now = Date.now();
            localStorage.setItem('lastCommentTime', String(now));
            setLastCommentTime(now);
            setCooldown(60);

            const newMyIds = [...myCommentIds, data.id];
            localStorage.setItem('myCommentIds', JSON.stringify(newMyIds));
            setMyCommentIds(newMyIds);

            setContent('');
            fetchComments();
        } catch (err: any) {
            setError('Gagal mengirim komentar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (commentId: number) => {
        if (!editingContent.trim() || !supabase) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .update({ content: editingContent, updated_at: new Date().toISOString() })
                .eq('id', commentId);
            if (error) throw error;
            setEditingCommentId(null);
            setEditingContent('');
            fetchComments();
        } catch (err) {
            alert('Gagal memperbarui komentar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!supabase) return;
        if (window.confirm('Yakin ingin menghapus komentar ini?')) {
            try {
                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (error) throw error;

                const newMyIds = myCommentIds.filter(id => id !== commentId);
                localStorage.setItem('myCommentIds', JSON.stringify(newMyIds));
                setMyCommentIds(newMyIds);

                fetchComments();
            } catch (err) {
                alert('Gagal menghapus komentar.');
            }
        }
    };

    return (
        <div className="mt-10 border-t border-slate-200 pt-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Komentar ({comments.length})</h3>

            {/* Comment Form */}
            <div className="glass p-5 mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="author_name" className="block text-sm font-medium text-slate-700">Nama</label>
                        <input type="text" id="author_name" value={authorName} onChange={e => setAuthorName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            maxLength={50} required
                        />
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-slate-700">Komentar Anda</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={4}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            maxLength={1000} required
                        ></textarea>
                    </div>
                    <div className="flex justify-end items-center gap-4">
                         {cooldown > 0 && <span className="text-sm text-slate-500">Anda baru saja berkomentar, tunggu beberapa saat.</span>}
                        <button type="submit" disabled={isSubmitting || cooldown > 0}
                            className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-5">
                {loading && <p>Memuat komentar...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {comments.map(comment => {
                    const isOwnComment = myCommentIds.includes(comment.id);
                    const isEdited = new Date(comment.updated_at) > new Date(comment.created_at);
                    const isEditingThis = editingCommentId === comment.id;

                    return (
                        <div key={comment.id} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">
                                {comment.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{comment.author_name}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(comment.created_at).toLocaleString('id-ID')}
                                            {isEdited && <span className="italic"> (telah diubah)</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {isOwnComment && !isEditingThis && (
                                            <button onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }} className="font-semibold text-blue-600 hover:underline">Edit</button>
                                        )}
                                        {(isOwnComment || isAdminAuthenticated) && !isEditingThis && (
                                            <button onClick={() => handleDelete(comment.id)} className="font-semibold text-red-600 hover:underline">Hapus</button>
                                        )}
                                    </div>
                                </div>

                                {isEditingThis ? (
                                    <div className="mt-2">
                                        <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)} rows={3}
                                            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        ></textarea>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleUpdate(comment.id)} disabled={isSubmitting} className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-md hover:bg-green-200">Simpan</button>
                                            <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">Batal</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-slate-600 text-sm whitespace-pre-wrap">{comment.content}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
                 {!loading && comments.length === 0 && <p className="text-center text-slate-500 py-4">Jadilah yang pertama berkomentar!</p>}
            </div>
        </div>
    );
}

const BlogPost: React.FC<BlogPostProps> = ({ post, slug, setPage, setSelectedPost, isAdminAuthenticated }) => {
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
                    // Fire-and-forget view count increment
                     if (supabase) {
                        supabase.rpc('increment_view_count', { p_slug: slug }).then(({ error: rpcError }) => {
                            if (rpcError) console.error('Failed to increment view count:', rpcError.message);
                        });
                    }

                    const { data, error: dbError } = await supabase
                        .from('blog_posts')
                        .select('*, blog_categories(name)')
                        .eq('slug', slug)
                        .single();

                    if (dbError) throw dbError;

                    if (data) {
                        setInternalPost(data as any);
                        setSelectedPost(data as any);
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
                        <div className="flex flex-wrap gap-2">
                           {postToRender.blog_categories.map(cat => (
                               <span key={cat.name} className="text-sm font-bold text-[color:var(--accent1)]">{cat.name}</span>
                           ))}
                        </div>
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
                </article>
                <CommentsSection post={postToRender} isAdminAuthenticated={isAdminAuthenticated} />
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