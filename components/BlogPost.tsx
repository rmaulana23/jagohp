import React, { useState, useEffect, FC } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ReviewResult } from './SmartReview';
import QuickReviewWidget from './QuickReviewWidget';
import BlogShareButtons from './BlogShareButtons';

// --- TYPE DEFINITIONS ---
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
    parent_id: number | null;
    replies?: Comment[];
}

interface BlogPostProps {
    post: BlogPostData | null;
    slug?: string;
    setPage: (page: string) => void;
    setSelectedPost: (post: BlogPostData | null) => void;
    isAdminAuthenticated: boolean;
    latestReviewResult: ReviewResult | null;
    setLatestReviewResult: (result: ReviewResult | null) => void;
    navigateToFullReview: (result: ReviewResult) => void;
}

// --- COMMENT FORM COMPONENT ---
interface CommentFormProps {
    postId: number;
    parentId?: number | null;
    onSuccess: () => void;
    onCancel?: () => void;
    initialContent?: string;
    submitLabel: string;
    isAdminAuthenticated: boolean;
}

const CommentForm: FC<CommentFormProps> = ({ postId, parentId = null, onSuccess, onCancel, initialContent = '', submitLabel, isAdminAuthenticated }) => {
    const [authorName, setAuthorName] = useState('');
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (isAdminAuthenticated) {
            setAuthorName('Admin Jago-HP');
        } else {
            const storedName = localStorage.getItem('commentAuthorName') || '';
            if (!initialContent) setAuthorName(storedName);
        }

        const storedTime = localStorage.getItem('lastCommentTime');
        if (storedTime && !initialContent) {
            const time = parseInt(storedTime, 10);
            const diff = Date.now() - time;
            if (diff < 60000) {
                setCooldown(Math.ceil((60000 - diff) / 1000));
            }
        }
    }, [initialContent, isAdminAuthenticated]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const authorForSubmit = isAdminAuthenticated ? 'Admin Jago-HP' : authorName.trim();
        
        if (!authorForSubmit || !content.trim()) {
            alert('Nama dan komentar tidak boleh kosong.');
            return;
        }
        if (cooldown > 0 && !initialContent) return;

        setIsSubmitting(true);
        setError(null);
        if (!supabase) { setError("Database tidak tersedia."); setIsSubmitting(false); return; }
        
        try {
            if (initialContent) { // Editing existing comment
                const { error } = await supabase.from('comments').update({ content, updated_at: new Date().toISOString() }).eq('id', parentId as number);
                if (error) throw error;
            } else { // Submitting new comment
                const { data, error } = await supabase.from('comments').insert([{ post_id: postId, author_name: authorForSubmit, content, parent_id: parentId }]).select('id').single();
                if (error) throw error;

                if (!isAdminAuthenticated) {
                    localStorage.setItem('commentAuthorName', authorForSubmit);
                    const myIds = JSON.parse(localStorage.getItem('myCommentIds') || '[]');
                    myIds.push(data.id);
                    localStorage.setItem('myCommentIds', JSON.stringify(myIds));
                }
                const now = Date.now();
                localStorage.setItem('lastCommentTime', String(now));
                setCooldown(60);
            }
            setContent('');
            onSuccess();
        } catch (err: any) {
            setError(`Gagal: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={!initialContent ? "glass p-5" : ""}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!initialContent && !isAdminAuthenticated && (
                    <div>
                        <label htmlFor={`author_name_${parentId || 'new'}`} className="block text-sm font-medium text-slate-700">Nama</label>
                        <input type="text" id={`author_name_${parentId || 'new'}`} value={authorName} onChange={e => setAuthorName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" maxLength={50} required />
                    </div>
                )}
                <div>
                    {!initialContent && <label htmlFor={`content_${parentId || 'new'}`} className="block text-sm font-medium text-slate-700">{isAdminAuthenticated ? 'Komentar Anda (sebagai Admin Jago-HP)' : 'Komentar Anda'}</label>}
                    <textarea id={`content_${parentId || 'new'}`} value={content} onChange={e => setContent(e.target.value)} rows={initialContent ? 2 : 4} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" maxLength={1000} required autoFocus={!!initialContent}></textarea>
                </div>
                <div className="flex justify-end items-center gap-4">
                    {cooldown > 0 && !initialContent && <span className="text-sm text-slate-500">Tunggu {cooldown}d.</span>}
                    {onCancel && <button type="button" onClick={onCancel} className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300">Batal</button>}
                    <button type="submit" disabled={isSubmitting || (cooldown > 0 && !initialContent)} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">{isSubmitting ? '...' : submitLabel}</button>
                </div>
                {error && <p className="text-red-500 text-sm text-right">{error}</p>}
            </form>
        </div>
    );
};

// --- COMMENT ITEM COMPONENT (RECURSIVE) ---
interface CommentItemProps {
    comment: Comment;
    postId: number;
    onDelete: (id: number) => void;
    onSuccess: () => void;
    myCommentIds: number[];
    isAdminAuthenticated: boolean;
}

const CommentItem: FC<CommentItemProps> = ({ comment, postId, onDelete, onSuccess, myCommentIds, isAdminAuthenticated }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isOwnComment = myCommentIds.includes(comment.id);
    const isEdited = new Date(comment.updated_at) > new Date(comment.created_at);
    const canReply = !isOwnComment || isAdminAuthenticated;

    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">{comment.author_name.charAt(0).toUpperCase()}</div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`font-semibold ${comment.author_name === 'Admin Jago-HP' ? 'text-indigo-600' : 'text-slate-800'}`}>{comment.author_name}</p>
                        <p className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString('id-ID')}{isEdited && <span className="italic"> (diubah)</span>}</p>
                    </div>
                </div>
                
                {isEditing ? (
                    <div className="mt-2">
                        <CommentForm
                            postId={postId}
                            parentId={comment.id}
                            initialContent={comment.content}
                            onSuccess={() => { setIsEditing(false); onSuccess(); }}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Perbarui"
                            isAdminAuthenticated={isAdminAuthenticated}
                        />
                    </div>
                ) : (
                    <p className="mt-2 text-slate-600 text-sm whitespace-pre-wrap">{comment.content}</p>
                )}

                {!isEditing && (
                    <div className="flex items-center gap-3 text-xs mt-2">
                        {canReply && <button onClick={() => setIsReplying(!isReplying)} className="font-semibold text-slate-500 hover:text-slate-800">{isReplying ? 'Batal' : 'Balas'}</button>}
                        {isOwnComment && <button onClick={() => setIsEditing(true)} className="font-semibold text-blue-600 hover:underline">Edit</button>}
                        {(isOwnComment || isAdminAuthenticated) && <button onClick={() => onDelete(comment.id)} className="font-semibold text-red-600 hover:underline">Hapus</button>}
                    </div>
                )}
                
                {isReplying && (
                    <div className="mt-4">
                        <CommentForm
                            postId={postId}
                            parentId={comment.id}
                            onSuccess={() => { setIsReplying(false); onSuccess(); }}
                            onCancel={() => setIsReplying(false)}
                            submitLabel="Kirim Balasan"
                            isAdminAuthenticated={isAdminAuthenticated}
                        />
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-5 pl-6 border-l-2 border-slate-200 space-y-5">
                        {comment.replies.map(reply => (
                             <CommentItem
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                onDelete={onDelete}
                                onSuccess={onSuccess}
                                myCommentIds={myCommentIds}
                                isAdminAuthenticated={isAdminAuthenticated}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MAIN COMMENTS SECTION ---
const CommentsSection: React.FC<{ post: BlogPostData, isAdminAuthenticated: boolean }> = ({ post, isAdminAuthenticated }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [totalComments, setTotalComments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [myCommentIds, setMyCommentIds] = useState<number[]>([]);

    useEffect(() => {
        const storedIds = JSON.parse(localStorage.getItem('myCommentIds') || '[]') as number[];
        setMyCommentIds(storedIds);
    }, []);

    const fetchAndNestComments = async () => {
        if (!supabase) return;
        setLoading(true);
        setError(null);
        try {
            const { count, error: countError } = await supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id);
            if(countError) throw countError;
            setTotalComments(count || 0);

            const { data, error } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
            if (error) throw error;

            const commentMap: { [key: number]: Comment } = {};
            data.forEach(comment => {
                comment.replies = [];
                commentMap[comment.id] = comment;
            });

            const nestedComments: Comment[] = [];
            data.forEach(comment => {
                if (comment.parent_id && commentMap[comment.parent_id]) {
                    commentMap[comment.parent_id].replies?.push(comment);
                } else {
                    nestedComments.push(comment);
                }
            });
            setComments(nestedComments.reverse());
        } catch (err: any) {
            setError('Gagal memuat komentar.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAndNestComments();
    }, [post.id]);
    
    const handleCommentSuccess = () => {
        const storedIds = JSON.parse(localStorage.getItem('myCommentIds') || '[]') as number[];
        setMyCommentIds(storedIds);
        fetchAndNestComments();
    };

    const handleDelete = async (commentId: number) => {
        if (!supabase) return;
        if (window.confirm('Yakin ingin menghapus komentar ini? Ini tidak bisa dibatalkan.')) {
            try {
                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (error) throw error;
                const newMyIds = myCommentIds.filter(id => id !== commentId);
                localStorage.setItem('myCommentIds', JSON.stringify(newMyIds));
                setMyCommentIds(newMyIds);
                fetchAndNestComments();
            } catch (err) {
                alert('Gagal menghapus komentar.');
            }
        }
    };

    return (
        <div className="mt-10 border-t border-slate-200 pt-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Komentar ({totalComments})</h3>
            <div className="mb-8">
                <CommentForm
                    postId={post.id}
                    onSuccess={handleCommentSuccess}
                    submitLabel="Kirim Komentar"
                    isAdminAuthenticated={isAdminAuthenticated}
                />
            </div>
            <div className="space-y-5">
                {loading && <p>Memuat komentar...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        onDelete={handleDelete}
                        onSuccess={handleCommentSuccess}
                        myCommentIds={myCommentIds}
                        isAdminAuthenticated={isAdminAuthenticated}
                    />
                ))}
                {!loading && comments.length === 0 && <p className="text-center text-slate-500 py-4">Jadilah yang pertama berkomentar!</p>}
            </div>
        </div>
    );
};

// --- RELATED POSTS COMPONENT ---
interface RelatedPostsProps {
    currentPostId: number;
    setPage: (page: string) => void;
    setSelectedPost: (post: BlogPostData | null) => void;
    layout?: 'default' | 'sidebar';
}

const RelatedPosts: FC<RelatedPostsProps> = ({ currentPostId, setPage, setSelectedPost, layout = 'default' }) => {
    const [related, setRelated] = useState<BlogPostData[]>([]);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('*, blog_categories(name)')
                    .neq('id', currentPostId)
                    .order('published_at', { ascending: false })
                    .limit(3);
                if (error) throw error;
                setRelated((data as any) || []);
            } catch (err) {
                console.error("Failed to fetch related posts:", err);
            }
        };
        fetchRelated();
    }, [currentPostId]);

    if (related.length === 0) return null;

    const handleNavigation = (post: BlogPostData) => {
        setSelectedPost(post);
        setPage(`blog/${post.slug}`);
    };

    if (layout === 'sidebar') {
        return (
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Baca Juga</h3>
                <div className="space-y-4">
                    {related.map(post => (
                        <div key={post.id} className="glass overflow-hidden group transition-shadow duration-300 hover:shadow-sm flex items-center cursor-pointer" onClick={() => handleNavigation(post)}>
                            <img src={post.image_url} alt={post.title} className="w-20 h-20 object-cover flex-shrink-0" />
                            <div className="p-3">
                                <h4 className="font-semibold text-sm text-slate-800 leading-tight group-hover:text-[color:var(--accent1)] transition-colors line-clamp-3">{post.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Baca juga artikel lainnya</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map(post => (
                    <div key={post.id} className="glass overflow-hidden group transition-shadow duration-300 hover:shadow-xl flex flex-col cursor-pointer" onClick={() => handleNavigation(post)}>
                        <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="p-4 flex flex-col flex-grow">
                             <div className="flex flex-wrap gap-1 mb-2">
                                {post.blog_categories.slice(0, 2).map(cat => (
                                    <span key={cat.name} className="text-[10px] font-semibold text-[color:var(--accent1)] bg-[color:var(--accent1)]/10 px-2 py-0.5 rounded-full">{cat.name}</span>
                                ))}
                            </div>
                            <h4 className="font-bold text-slate-800 leading-tight flex-grow group-hover:text-[color:var(--accent1)] transition-colors">{post.title}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN BLOG POST COMPONENT ---
const BlogPost: React.FC<BlogPostProps> = ({ 
    post, 
    slug, 
    setPage, 
    setSelectedPost, 
    isAdminAuthenticated,
    latestReviewResult,
    setLatestReviewResult,
    navigateToFullReview 
}) => {
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
                <p className="text-slate-500 mt-2">Sepertinya ada yang salah. Silakan kembali ke halaman Artikel.</p>
                <button onClick={() => setPage('blog')} className="mt-6 px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors">Kembali ke Artikel</button>
            </div>
        );
    }

    return (
        <section className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-6xl animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Article and Comments */}
                    <div className="lg:col-span-8">
                        <article className="glass p-6 md:p-10">
                            <div className="mb-6">
                                <button onClick={() => setPage('blog')} className="text-sm font-semibold text-[color:var(--accent1)] hover:underline mb-4">&larr; Kembali ke Artikel</button>
                                <div className="flex flex-wrap gap-2">
                                {postToRender.blog_categories.map(cat => (<span key={cat.name} className="text-sm font-bold text-[color:var(--accent1)]">{cat.name}</span>))}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">{postToRender.title}</h1>
                                <div className="mt-4 text-xs text-slate-400 flex items-center gap-4"><span>Oleh <strong>{postToRender.author}</strong></span><span>{new Date(postToRender.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                            </div>
                            <img src={postToRender.image_url} alt={postToRender.title} className="w-full h-auto max-h-80 object-cover rounded-lg my-6" />
                            <div className="prose max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: postToRender.content }}></div>
                            <BlogShareButtons title={postToRender.title} slug={postToRender.slug} />
                        </article>

                        <div className="mt-8">
                             <div className="lg:hidden">
                                <RelatedPosts
                                    currentPostId={postToRender.id}
                                    setPage={setPage}
                                    setSelectedPost={setSelectedPost}
                                    layout="default"
                                />
                            </div>
                            <CommentsSection post={postToRender} isAdminAuthenticated={isAdminAuthenticated} />
                        </div>
                    </div>

                    {/* Right Column: Quick Review Widget & Related Posts */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-28 space-y-6">
                           <QuickReviewWidget 
                                latestReviewResult={latestReviewResult}
                                setLatestReviewResult={setLatestReviewResult}
                                navigateToFullReview={navigateToFullReview}
                           />
                           <div className="hidden lg:block">
                               <RelatedPosts
                                    currentPostId={postToRender.id}
                                    setPage={setPage}
                                    setSelectedPost={setSelectedPost}
                                    layout="sidebar"
                                />
                           </div>
                        </div>
                    </div>
                </div>
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
                .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5em auto; display: block; }
            `}</style>
        </section>
    );
};

export default BlogPost;