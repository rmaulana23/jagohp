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
    
    const handleCommentDelete = async (id: number) => {
        if (!supabase || (!isAdminAuthenticated && !myCommentIds.includes(id))) return;
        if (!window.confirm("Yakin ingin menghapus komentar ini?")) return;
        try {
            const { error } = await supabase.from('comments').delete().eq('id', id);
            if (error) throw error;
            fetchAndNestComments(); // Re-fetch all
        } catch(err: any) {
            alert(`Gagal menghapus: ${err.message}`);
        }
    };

    return (
        <section className="mt-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{totalComments} Komentar</h2>
            <CommentForm postId={post.id} onSuccess={fetchAndNestComments} submitLabel="Kirim Komentar" isAdminAuthenticated={isAdminAuthenticated}/>
            
            <div className="mt-8 space-y-6">
                {loading && <p>Memuat komentar...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        onDelete={handleCommentDelete}
                        onSuccess={fetchAndNestComments}
                        myCommentIds={myCommentIds}
                        isAdminAuthenticated={isAdminAuthenticated}
                    />
                ))}
            </div>
        </section>
    );
};


// --- MAIN BLOG POST COMPONENT ---
const BlogPost: React.FC<BlogPostProps> = ({ post, slug, setPage, setSelectedPost, isAdminAuthenticated, latestReviewResult, setLatestReviewResult, navigateToFullReview }) => {
    const [postData, setPostData] = useState<BlogPostData | null>(post);
    const [loading, setLoading] = useState(!post);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug || !supabase) {
                setError("Data tidak valid untuk memuat postingan.");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Fetch post by slug
                const { data: postArray, error: dbError } = await supabase
                    .from('blog_posts')
                    .select('*, blog_categories(name)')
                    .eq('slug', slug)
                    .single();

                if (dbError) throw dbError;
                
                if (postArray) {
                    const fetchedPost = postArray as any;
                    setPostData(fetchedPost);
                    setSelectedPost(fetchedPost); // Update global state
                    
                    // Increment view count
                    const { error: viewError } = await supabase.rpc('increment_view_count', {
                        post_slug: slug
                    });
                    if(viewError) console.warn("Failed to increment view count", viewError);

                } else {
                    throw new Error('Postingan tidak ditemukan.');
                }
            } catch (err: any) {
                console.error('Error fetching blog post:', err);
                setError(err.message || 'Gagal memuat postingan.');
            } finally {
                setLoading(false);
            }
        };

        if (!postData && slug) {
            fetchPost();
        } else {
            setLoading(false);
        }
        
        // Cleanup on unmount
        return () => {
            setSelectedPost(null);
        };
    }, [slug, post, setSelectedPost]);

    if (loading) return <div className="text-center p-10">Memuat postingan...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!postData) return <div className="text-center p-10">Postingan tidak ditemukan.</div>;

    return (
        <section id="blog-post" className="pb-12 px-4 sm:px-6 w-full animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => setPage('blog')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6">&larr; Kembali ke Daftar Blog</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 max-w-6xl mx-auto gap-8">
                <div className="lg:col-span-8">
                    <div className="glass p-6 md:p-8">
                        <article>
                            <div className="flex flex-wrap gap-2">
                                {postData.blog_categories.map(cat => <span key={cat.name} className="text-sm font-bold text-[color:var(--accent1)]">{cat.name}</span>)}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">{postData.title}</h1>
                            <div className="mt-4 text-xs text-slate-400 flex items-center gap-4">
                                <span>Oleh <strong>{postData.author}</strong></span>
                                <span>{new Date(postData.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <img src={postData.image_url} alt={postData.title} className="w-full h-auto max-h-96 object-cover rounded-lg my-6 shadow-md" />
                            <div className="prose max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: postData.content }}></div>
                            
                            <BlogShareButtons title={postData.title} slug={postData.slug} />
                        </article>
                    </div>
                    <div className="mt-8">
                         <CommentsSection post={postData} isAdminAuthenticated={isAdminAuthenticated}/>
                    </div>
                </div>
                <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                    <QuickReviewWidget 
                        latestReviewResult={latestReviewResult}
                        setLatestReviewResult={setLatestReviewResult}
                        navigateToFullReview={navigateToFullReview}
                    />
                </aside>
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
                .prose img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1.5em auto; }
            `}</style>
        </section>
    );
};

export default BlogPost;