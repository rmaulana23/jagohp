
import React, { useState, useEffect, useRef, FC } from 'react';
import { motion, Reorder } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import AlignLeftIcon from './icons/AlignLeftIcon';
import AlignCenterIcon from './icons/AlignCenterIcon';
import AlignRightIcon from './icons/AlignRightIcon';
import AlignJustifyIcon from './icons/AlignJustifyIcon';
import EyeIcon from './icons/EyeIcon';
import TextColorIcon from './icons/TextColorIcon';
import ListOrderedIcon from './icons/ListOrderedIcon';
import ListUnorderedIcon from './icons/ListUnorderedIcon';
import ImageIcon from './icons/ImageIcon';
import FontSizeIcon from './icons/FontSizeIcon';

// Define types
interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image_url: string;
  published_at: string;
  created_at?: string;
  status: 'published' | 'draft' | 'trashed';
  sort_order?: number;
  blog_post_categories?: { blog_categories: { id: number, name: string } }[];
}

interface Comment {
    id: number;
    content: string;
    author_name: string;
    created_at: string;
    blog_posts: {
        id: number;
        title: string;
        slug: string;
    } | null;
    parent_comment: {
        author_name: string;
    } | null;
}

interface Category {
    id: number;
    name: string;
}

// Icon for Drag Handle
const DragHandleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-slate-400">
        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
);

const PaginationControls: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2 mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-300">&larr; Sebelumnya</button>
            <span className="text-sm text-slate-500">Halaman {currentPage} dari {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-300">Berikutnya &rarr;</button>
        </div>
    );
};

const AdminDashboard: React.FC<{ setPage: (page: string) => void; onAdminLogout: () => void; }> = ({ setPage, onAdminLogout }) => {
    const [view, setView] = useState<'overview' | 'editor'>('overview');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        setErrorPosts(null);
        if (!supabase) {
            setErrorPosts("Koneksi Supabase tidak tersedia.");
            setLoadingPosts(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*, blog_post_categories(blog_categories(id, name))')
                .in('status', ['published', 'draft'])
                .order('sort_order', { ascending: true });
            
            if (error) throw error;
            setPosts(data as any || []);
        } catch (err: any) {
            setErrorPosts('Gagal memuat daftar postingan.');
            console.error(err);
        } finally {
            setLoadingPosts(false);
        }
    };
    
    useEffect(() => {
        if (view === 'overview') {
            fetchPosts();
        }
    }, [view]);

    const handleReorderPosts = async (newOrder: BlogPost[]) => {
        setPosts(newOrder); // Optimistic UI update
        
        if (!supabase) return;
        
        try {
            // Update each post with its new sort_order
            const updates = newOrder.map((post, index) => ({
                id: post.id,
                sort_order: index
            }));

            for (const update of updates) {
                 await supabase
                    .from('blog_posts')
                    .update({ sort_order: update.sort_order })
                    .eq('id', update.id);
            }
        } catch (err) {
            console.error("Gagal menyimpan urutan baru:", err);
        }
    };

    const handleNewPost = () => {
        setEditingPost(null);
        setView('editor');
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setView('editor');
    };

    return (
        <section id="admin-dashboard" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-7xl">
                {view === 'overview' ? (
                    <Overview
                        posts={posts}
                        loading={loadingPosts}
                        error={errorPosts}
                        onNewPost={handleNewPost}
                        onEditPost={handleEditPost}
                        onAdminLogout={onAdminLogout}
                        setPage={setPage}
                        refreshPosts={fetchPosts}
                        onReorder={handleReorderPosts}
                    />
                ) : (
                    <PostEditor
                        post={editingPost}
                        onBack={() => setView('overview')}
                        onSuccess={() => setView('overview')}
                    />
                )}
            </div>
        </section>
    );
};

// --- Admin Comment Form Component ---
interface AdminCommentFormProps {
    comment: Comment; // The comment being replied to
    onSuccess: () => void;
    onCancel: () => void;
}

const AdminCommentForm: FC<AdminCommentFormProps> = ({ comment, onSuccess, onCancel }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !comment.blog_posts) return;

        setIsSubmitting(true);
        setError(null);
        if (!supabase) {
            setError("Database tidak tersedia.");
            setIsSubmitting(false);
            return;
        }

        try {
            const { error: insertError } = await supabase.from('comments').insert({
                post_id: comment.blog_posts.id,
                author_name: 'Admin Jago-HP',
                content: content.trim(),
                parent_id: comment.id
            });
            if (insertError) throw insertError;
            onSuccess();
        } catch (err: any) {
            setError('Gagal mengirim balasan.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-slate-200 rounded-md">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`Membalas ${comment.author_name}...`}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={onCancel} className="px-4 py-1.5 rounded-lg bg-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-400">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-1.5 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                    {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs text-right mt-1">{error}</p>}
        </form>
    );
};

// --- Overview Component ---
const Overview: React.FC<{
    posts: BlogPost[], loading: boolean, error: string | null,
    onNewPost: () => void, onEditPost: (post: BlogPost) => void,
    onAdminLogout: () => void, setPage: (page: string) => void,
    refreshPosts: () => void,
    onReorder: (newOrder: BlogPost[]) => void;
}> = ({ posts, loading, error, onNewPost, onEditPost, onAdminLogout, setPage, refreshPosts, onReorder }) => {
    const COMMENTS_PER_PAGE = 20;
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'categories' | 'trash'>('posts');
    
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [errorComments, setErrorComments] = useState<string | null>(null);
    const [hasNewComments, setHasNewComments] = useState(false);
    const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    
    const [trashedPosts, setTrashedPosts] = useState<BlogPost[]>([]);
    const [loadingTrash, setLoadingTrash] = useState(false);
    const [errorTrash, setErrorTrash] = useState<string | null>(null);

    const handleTrashPost = async (postId: number) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('blog_posts').update({ status: 'trashed' }).eq('id', postId);
            if (error) throw error;
            refreshPosts();
        } catch (err) {
            alert('Gagal memindahkan ke sampah.');
        }
    };
    
    const fetchTrashedPosts = async () => {
        if (!supabase) return;
        setLoadingTrash(true);
        setErrorTrash(null);
        try {
            const { data, error } = await supabase.from('blog_posts').select('*').eq('status', 'trashed').order('published_at', { ascending: false });
            if (error) throw error;
            setTrashedPosts(data || []);
        } catch (err: any) {
            setErrorTrash('Gagal memuat postingan sampah.');
        } finally {
            setLoadingTrash(false);
        }
    };
    
    const handleRestorePost = async (postId: number) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('blog_posts').update({ status: 'draft' }).eq('id', postId);
            if (error) throw error;
            fetchTrashedPosts(); // Refresh trash list
        } catch (err) {
            alert('Gagal mengembalikan postingan.');
        }
    };
    
    const handlePermanentDeletePost = async (postId: number) => {
        if (window.confirm('Tindakan ini akan menghapus postingan secara permanen dan tidak dapat dibatalkan. Lanjutkan?')) {
            if (!supabase) return;
            try {
                const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
                if (error) throw error;
                fetchTrashedPosts(); // Refresh trash list
            } catch (err) {
                alert('Gagal menghapus postingan secara permanen.');
            }
        }
    };

    const handleQuickCategoryChange = async (postId: number, newCategoryId: string) => {
        if (!supabase || !newCategoryId) return;
        const categoryId = parseInt(newCategoryId, 10);
        try {
            // Delete existing relations
            const { error: deleteError } = await supabase.from('blog_post_categories').delete().eq('post_id', postId);
            if (deleteError) throw deleteError;

            // Insert new relation
            const { error: insertError } = await supabase.from('blog_post_categories').insert({ post_id: postId, category_id: categoryId });
            if (insertError) throw insertError;
            
            // Refresh post list to show updated category
            refreshPosts();

        } catch (err) {
            console.error("Failed to quick change category", err);
            alert("Gagal mengubah kategori.");
        }
    };
    
    const fetchCategories = async () => {
        if (!supabase) return; setLoadingCategories(true); setErrorCategories(null);
        try {
            const { data, error } = await supabase.from('blog_categories').select('*').order('name', { ascending: true });
            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            setErrorCategories('Gagal memuat kategori.');
        } finally { setLoadingCategories(false); }
    };

    useEffect(() => {
        const checkNewComments = async () => {
            if (!supabase) return;
            const lastViewed = localStorage.getItem('lastCommentViewTimestamp');
            if (!lastViewed) {
                const { count } = await supabase.from('comments').select('id', { count: 'exact', head: true });
                if (count && count > 0) setHasNewComments(true);
                return;
            }
            const { data: latestComment } = await supabase.from('comments').select('created_at').order('created_at', { ascending: false }).limit(1).single();
            if (latestComment && new Date(latestComment.created_at).getTime() > parseInt(lastViewed, 10)) {
                setHasNewComments(true);
            }
        };
        checkNewComments();
        fetchCategories(); // Fetch categories on initial load for the posts tab.
    }, []);

    useEffect(() => {
        if (activeTab === 'comments') fetchComments(1);
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'trash') fetchTrashedPosts();
    }, [activeTab]);

    const fetchComments = async (page = 1) => {
        if (!supabase) return;
        setLoadingComments(true);
        setErrorComments(null);
        try {
            const { count, error: countError } = await supabase.from('comments').select('id', { count: 'exact', head: true });
            if (countError) throw countError;
            setTotalComments(count || 0);

            const from = (page - 1) * COMMENTS_PER_PAGE;
            const to = from + COMMENTS_PER_PAGE - 1;

            const { data, error } = await supabase.from('comments').select(`id, content, author_name, created_at, blog_posts ( id, title, slug ), parent_comment:parent_id(author_name)`).order('created_at', { ascending: false }).range(from, to);
            if (error) throw error;
            setComments(data as any || []);
            setCommentsCurrentPage(page);
        } catch (err: any) {
            setErrorComments('Gagal memuat komentar terbaru.');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('Yakin ingin menghapus komentar ini?') && supabase) {
            try {
                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (error) throw error;
                const newTotalComments = totalComments - 1;
                const newTotalPages = Math.ceil(newTotalComments / COMMENTS_PER_PAGE);
                if (commentsCurrentPage > newTotalPages && newTotalPages > 0) {
                    fetchComments(newTotalPages);
                } else {
                    fetchComments(commentsCurrentPage);
                }
            } catch (err) {
                alert('Gagal menghapus komentar.');
            }
        }
    };
    
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault(); if (!newCategoryName.trim() || !supabase) return;
        try {
            const { error } = await supabase.from('blog_categories').insert({ name: newCategoryName.trim() });
            if (error) throw error;
            setNewCategoryName('');
            fetchCategories();
        } catch (err) { alert('Gagal menambah kategori. Mungkin nama sudah ada.'); }
    };

    const handleUpdateCategory = async (category: Category) => {
        if (!category.name.trim() || !supabase) return;
        try {
            const { error } = await supabase.from('blog_categories').update({ name: category.name.trim() }).eq('id', category.id);
            if (error) throw error;
            setEditingCategory(null);
            fetchCategories();
        } catch (err) { alert('Gagal memperbarui kategori.'); }
    };
    
    const handleDeleteCategory = async (id: number) => {
        if (window.confirm('Yakin ingin menghapus kategori ini? Postingan yang menggunakan kategori ini tidak akan terhapus.') && supabase) {
            try {
                const { error } = await supabase.from('blog_categories').delete().eq('id', id);
                if (error) throw error;
                fetchCategories();
            } catch (err) { alert('Gagal menghapus kategori.'); }
        }
    };

    const handleCommentsTabClick = () => { setActiveTab('comments'); setHasNewComments(false); localStorage.setItem('lastCommentViewTimestamp', String(Date.now())); };
    
    const totalCommentPages = Math.ceil(totalComments / COMMENTS_PER_PAGE);
    
    const getStatusChip = (status: string) => {
        switch (status) {
            case 'published': return <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tight">Published</span>;
            case 'draft': return <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-tight">Draft</span>;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                 <div><h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron text-left">Admin Dashboard</h1><p className="text-base text-slate-500 mt-2 text-left">Manajemen Konten Blog</p></div>
            </div>
            <div className="flex justify-end mb-4 gap-3"><button onClick={onNewPost} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity">Buat Postingan Baru</button></div>
            <div className="border-b border-slate-300 mb-4 flex overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'posts' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>Postingan ({posts.length})</button>
                <button onClick={handleCommentsTabClick} className={`relative px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>Komentar {hasNewComments && <span className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>}</button>
                <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'categories' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>Kategori</button>
                <button onClick={() => setActiveTab('trash')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'trash' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>Sampah</button>
            </div>
            <div className="glass p-4 md:p-8">
                {activeTab === 'posts' && (
                    <>
                        {loading && <p className="text-center py-10 text-slate-500">Memuat postingan...</p>}
                        {error && <p className="text-red-500 text-center py-10">{error}</p>}
                        {!loading && !error && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 mb-2">* Gunakan handle di sebelah kiri untuk geser urutan blog.</p>
                                <Reorder.Group axis="y" values={posts} onReorder={onReorder} className="space-y-3">
                                    {posts.length > 0 ? posts.map((post) => {
                                        const postCategory = post.blog_post_categories?.[0]?.blog_categories;
                                        return (
                                            <Reorder.Item 
                                                key={post.id} 
                                                value={post} 
                                                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
                                                whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                                            >
                                                <div className="flex-shrink-0 flex items-center justify-center w-6">
                                                    <DragHandleIcon />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col md:grid md:grid-cols-11 md:items-center gap-2 md:gap-4">
                                                    {/* Post Info Section */}
                                                    <div className="md:col-span-5 min-w-0">
                                                        <h3 className="font-bold text-slate-800 line-clamp-1 text-sm md:text-base">{post.title}</h3>
                                                        <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{new Date(post.published_at!).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                    </div>
                                                    
                                                    {/* Meta/Actions Section - Dynamic for Mobile */}
                                                    <div className="flex flex-wrap items-center gap-2 md:contents">
                                                        <div className="md:col-span-2 flex items-center md:justify-center">
                                                            {getStatusChip(post.status)}
                                                        </div>
                                                        <div className="md:col-span-2 flex-grow md:flex-grow-0 min-w-[110px]">
                                                            <select 
                                                                value={postCategory?.id || ''}
                                                                onChange={(e) => handleQuickCategoryChange(post.id!, e.target.value)}
                                                                className="w-full px-2 py-1 text-[10px] md:text-xs border border-slate-300 rounded-md bg-white cursor-pointer focus:ring-1 focus:ring-indigo-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Ganti kategori dengan cepat"
                                                            >
                                                                <option value="" disabled>Kategori</option>
                                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2 flex justify-end gap-1.5 md:gap-2 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                                                            <button onClick={() => onEditPost(post)} className="px-2.5 py-1 text-[10px] md:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors uppercase">Edit</button>
                                                            <button onClick={() => handleTrashPost(post.id!)} className="px-2.5 py-1 text-[10px] md:text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors uppercase">Trash</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        )
                                    }) : <p className="text-slate-500 text-center py-10">Belum ada postingan.</p>}
                                </Reorder.Group>
                            </div>
                        )}
                    </>
                )}
                {activeTab === 'comments' && (<>{loadingComments && <p className="text-center py-10 text-slate-500">Memuat komentar...</p>}{errorComments && <p className="text-red-500 text-center py-10">{errorComments}</p>}{!loadingComments && !errorComments && (<div className="space-y-4">{comments.length > 0 ? comments.map(comment => (<div key={comment.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl"><div className="flex justify-between items-start gap-3"><div><p className="text-sm text-slate-700 italic font-medium">"{comment.content}"</p><p className="text-[10px] md:text-xs text-slate-500 mt-2"><strong>{comment.author_name}</strong> &bull; {new Date(comment.created_at).toLocaleString('id-ID')}</p><p className="text-[10px] text-slate-400 mt-1">Di postingan: <a href={`#blog/${comment.blog_posts?.slug}`} onClick={(e) => { e.preventDefault(); setPage(`blog/${comment.blog_posts?.slug}`)}} className="text-indigo-600 hover:underline">{comment.blog_posts?.title}</a></p>{comment.parent_comment && <div className="mt-2 pl-3 text-[10px] text-slate-500 border-l-2 border-slate-300">Membalas <strong>{comment.parent_comment.author_name}</strong></div>}</div><div className="flex flex-col md:flex-row gap-1.5 flex-shrink-0">{comment.blog_posts && (<button onClick={() => setReplyingToComment(comment.id === replyingToComment?.id ? null : comment)} className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 uppercase">{replyingToComment?.id === comment.id ? 'Batal' : 'Balas'}</button>)}<button onClick={() => handleDeleteComment(comment.id)} className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 uppercase">Hapus</button></div></div>{replyingToComment?.id === comment.id && <AdminCommentForm comment={replyingToComment} onSuccess={() => { setReplyingToComment(null); fetchComments(commentsCurrentPage); }} onCancel={() => setReplyingToComment(null)} />}</div>)) : <p className="text-slate-500 text-center py-10">Belum ada komentar terbaru saat ini.</p>}{<PaginationControls currentPage={commentsCurrentPage} totalPages={totalCommentPages} onPageChange={fetchComments} />}</div>)}</>)}
                {activeTab === 'categories' && (<div><form onSubmit={handleAddCategory} className="flex gap-2 mb-6 pb-6 border-b border-slate-100"><input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nama kategori baru" className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" /><button type="submit" className="px-5 py-2 rounded-lg bg-green-600 text-white font-bold text-xs md:text-sm hover:bg-green-700 transition-colors">TAMBAH</button></form>{loadingCategories && <p className="text-center py-5 text-slate-500">Memuat kategori...</p>}{errorCategories && <p className="text-red-500 text-center py-5">{errorCategories}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{categories.map(cat => (<div key={cat.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl gap-2">{editingCategory?.id === cat.id ? (<input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-md sm:text-sm focus:ring-1 focus:ring-indigo-500"/>) : (<span className="font-bold text-slate-700 text-sm md:text-base">{cat.name}</span>)}<div className="flex gap-2 justify-end">{editingCategory?.id === cat.id ? (<><button onClick={() => handleUpdateCategory(editingCategory)} className="px-3 py-1 text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-lg hover:bg-green-100 uppercase">Simpan</button><button onClick={() => setEditingCategory(null)} className="px-3 py-1 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-200 uppercase">Batal</button></>) : (<><button onClick={() => setEditingCategory(cat)} className="px-3 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 uppercase">Edit</button><button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 uppercase">Hapus</button></>)}</div></div>))}</div></div>)}
                {activeTab === 'trash' && (<>{loadingTrash && <p className="text-center py-10 text-slate-500">Memuat sampah...</p>}{errorTrash && <p className="text-red-500 text-center py-10">{errorTrash}</p>}{!loadingTrash && !errorTrash && (<div className="space-y-3">{trashedPosts.length > 0 ? trashedPosts.map((post) => (<div key={post.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="flex-grow min-w-0"><h3 className="font-bold text-slate-800 truncate text-sm md:text-base">{post.title}</h3></div><div className="flex gap-2 justify-end"><button onClick={() => handleRestorePost(post.id!)} className="px-3 py-1 text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-lg hover:bg-green-100 uppercase">Restore</button><button onClick={() => handlePermanentDeletePost(post.id!)} className="px-3 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 uppercase">Hapus Permanen</button></div></div>)) : <p className="text-slate-500 text-center py-10">Tempat sampah kosong.</p>}</div>)}</>)}
            </div>
        </div>
    );
}

// --- Post Editor Component ---
const PostEditor: React.FC<{ post: BlogPost | null, onBack: () => void, onSuccess: () => void }> = ({ post, onBack, onSuccess }) => {
    const isEditing = post !== null;
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    const getInitialFormState = (p: BlogPost | null): BlogPost => {
        const today = new Date().toISOString().split('T')[0];
        if (p) { return { ...p, published_at: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : today, status: p.status || 'draft' }; }
        return { title: '', slug: '', excerpt: '', content: '', author: 'Tim JAGO-HP', image_url: '', published_at: today, status: 'draft' };
    };

    const [formData, setFormData] = useState<BlogPost>(() => getInitialFormState(post));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.from('blog_categories').select('id, name').order('name', { ascending: true });
                if (error) throw error;
                if (data) setCategories(data);
            } catch (err) { console.error("Failed to fetch categories for editor", err); }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isEditing && post?.id && supabase) {
            const fetchPostCategories = async () => {
                const { data } = await supabase.from('blog_post_categories').select('category_id').eq('post_id', post.id);
                if (data) setSelectedCategoryIds(data.map(item => item.category_id));
            };
            fetchPostCategories();
        } else { setSelectedCategoryIds([]); }
    }, [post, isEditing]);

    useEffect(() => {
        const initialState = getInitialFormState(post);
        setFormData(initialState);
        if (contentRef.current && contentRef.current.innerHTML !== (initialState.content || '')) {
            contentRef.current.innerHTML = initialState.content || '';
        }
    }, [post]);

    const handleCategoryChange = (categoryId: number) => { setSelectedCategoryIds(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'title') {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, title: value, slug: slug }));
        } else { setFormData(prev => ({ ...prev, [name]: value })); }
    };
    
    const handleContentChange = () => {
        if (contentRef.current) {
            setFormData(prev => ({ ...prev, content: contentRef.current!.innerHTML }));
        }
    };
    
    const applyCommand = (command: string, value: string | null = null) => { 
        if (contentRef.current) {
            contentRef.current.focus();
            document.execCommand(command, false, value); 
            handleContentChange();
        } 
    };
    const applyFormatBlock = (tag: string) => applyCommand('formatBlock', `<${tag}>`);
    const applyFontSize = (size: string) => {
        if (size && contentRef.current) {
            contentRef.current.focus();
            document.execCommand("fontSize", false, "7");
            const fontElements = contentRef.current.getElementsByTagName("font");
            if (fontElements) {
                for (let i = 0; i < fontElements.length; i++) {
                    if (fontElements[i].size === "7") {
                        fontElements[i].removeAttribute("size");
                        fontElements[i].style.fontSize = size + "px";
                    }
                }
            }
            handleContentChange();
        }
    };
    const handleImageToolbarClick = () => fileInputRef.current?.click();
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !supabase) return;
        const file = e.target.files[0];
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${sanitizedFileName}`;
    
        if (contentRef.current) {
            contentRef.current.focus();
        }
    
        try {
            const { error } = await supabase.storage
                .from('blog-images')
                .upload(fileName, file, {
                    contentType: file.type,
                    upsert: false
                });
            if (error) throw error;
            
            const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(fileName);
            
            if (publicUrlData) {
                const img = `<img src="${publicUrlData.publicUrl}" alt="${sanitizedFileName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1.5em auto; display: block;" />`;
                document.execCommand('insertHTML', false, img);
                handleContentChange();
            }
        } catch (err: any) {
            console.error("Image upload error:", err);
            let detailedError = `Gagal mengunggah gambar: ${err.message || 'Terjadi kesalahan tidak diketahui.'}`;
            if (err.message) {
                if (err.message.includes('Bucket not found')) {
                    detailedError += "\n\n[DEBUG] Pastikan Anda telah membuat bucket bernama 'blog-images' (semua huruf kecil) di Supabase Storage dan bucket tersebut bersifat publik.";
                }
                if (err.message.includes('security policy')) {
                    detailedError += "\n\n[DEBUG] Ini adalah masalah izin di Supabase (Row Level Security). Pastikan kebijakan untuk unggahan di bucket 'blog-images' sudah diatur dengan benar. Silakan cek kembali panduan SQL yang diberikan.";
                }
            }
            alert(detailedError);
        }
    };
    
    const handleSubmit = async (publishStatus: 'draft' | 'published') => {
        setLoading(true); setError(null); setSuccess(null);
        if (!supabase) { setError("Koneksi Supabase tidak tersedia."); setLoading(false); return; }
        if (selectedCategoryIds.length === 0) { setError("Pilih setidaknya satu kategori."); setLoading(false); return; }
        const dataToSave = { ...formData, status: publishStatus };
        const { id, created_at, blog_post_categories, ...finalData } = dataToSave;
        
        let postId = post?.id;
        try {
            if (isEditing && postId) {
                const { error: postError } = await supabase.from('blog_posts').update(finalData).eq('id', postId);
                if (postError) throw postError;
            } else {
                const { data: newPostData, error: postError } = await supabase.from('blog_posts').insert([finalData]).select('id').single();
                if (postError) throw postError;
                if (!newPostData) throw new Error("Gagal membuat postingan baru.");
                postId = newPostData.id;
            }
            if (!postId) throw new Error("Gagal mendapatkan ID postingan.");
            const { error: deleteError } = await supabase.from('blog_post_categories').delete().eq('post_id', postId);
            if (deleteError) throw deleteError;
            if (selectedCategoryIds.length > 0) {
                const relations = selectedCategoryIds.map(catId => ({ post_id: postId, category_id: catId }));
                const { error: insertError } = await supabase.from('blog_post_categories').insert(relations);
                if (insertError) throw insertError;
            }
            setSuccess(publishStatus === 'published' ? 'Postingan berhasil dipublikasikan!' : 'Postingan berhasil disimpan sebagai draf!');
            setTimeout(() => onSuccess(), 1500);
        } catch (err: any) {
            const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(`Gagal menyimpan: ${errorMessage}`);
        } finally { setLoading(false); }
    };

    const toolbarButtons = [{ cmd: 'bold', icon: BoldIcon, title: 'Bold' }, { cmd: 'italic', icon: ItalicIcon, title: 'Italic' }, { cmd: 'underline', icon: UnderlineIcon, title: 'Underline' }, { cmd: 'insertUnorderedList', icon: ListUnorderedIcon, title: 'Bulleted List' }, { cmd: 'insertOrderedList', icon: ListOrderedIcon, title: 'Numbered List' }, { cmd: 'justifyLeft', icon: AlignLeftIcon, title: 'Align Left' }, { cmd: 'justifyCenter', icon: AlignCenterIcon, title: 'Align Center' }, { cmd: 'justifyRight', icon: AlignRightIcon, title: 'Align Right' }, { cmd: 'justifyFull', icon: AlignJustifyIcon, title: 'Align Justify' }];
    const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 48, 64];

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-slate-900 font-orbitron text-left">{isEditing ? 'Edit Postingan' : 'Buat Postingan Baru'}</h1><button type="button" onClick={onBack} className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors">Kembali</button></div>
            <div className="lg:hidden flex border-b border-slate-300 mb-4"><button type="button" onClick={() => setShowPreview(false)} className={`flex-1 py-2 text-sm font-semibold transition-colors ${!showPreview ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>Editor</button><button type="button" onClick={() => setShowPreview(true)} className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${showPreview ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}><EyeIcon className="w-5 h-5" /> Preview</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`${showPreview ? 'hidden' : 'block'} lg:block`}>
                    <form onSubmit={(e) => e.preventDefault()} className="glass p-6 md:p-8 space-y-4">
                        <div><label htmlFor="title" className="block text-sm font-medium text-slate-700">Judul Blog</label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug URL (otomatis)</label><input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" readOnly /></div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Kategori</label>
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">{categories.map(cat => (<label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => handleCategoryChange(cat.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>{cat.name}</label>))}</div>
                        </div>
                        <div><label htmlFor="published_at" className="block text-sm font-medium text-slate-700">Tanggal Publikasi</label><input type="date" name="published_at" id="published_at" value={formData.published_at || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="image_url" className="block text-sm font-medium text-slate-700">URL Gambar Utama</label><input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="excerpt" className="block text-sm font-medium text-slate-700">Ringkasan (Excerpt)</label><textarea name="excerpt" id="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required></textarea></div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-slate-700">Isi Konten Lengkap</label>
                            <div className="mt-1 border border-slate-300 rounded-md">
                                <div className="sticky top-[72px] md:top-28 z-10 flex items-center flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-300 rounded-t-md backdrop-blur-sm bg-opacity-80">
                                    <div className="relative flex items-center" title="Format Teks"><select onChange={(e) => applyFormatBlock(e.target.value)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded bg-transparent appearance-none text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"><option value="p">Paragraf</option><option value="h2">Judul 2</option><option value="h3">Judul 3</option></select></div>
                                    <div className="relative flex items-center" title="Ukuran Font"><FontSizeIcon className="w-5 h-5 absolute left-2 pointer-events-none text-slate-600"/><select onChange={(e) => applyFontSize(e.target.value)} className="p-1.5 pl-8 text-slate-600 hover:bg-slate-200 rounded bg-transparent appearance-none text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"><option value="">Ukuran</option>{fontSizes.map(size => (<option key={size} value={String(size)}>{size}px</option>))}</select></div>
                                    {toolbarButtons.map(btn => { const Icon = btn.icon; return (<button key={btn.cmd} type="button" onClick={() => applyCommand(btn.cmd)} title={btn.title} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><Icon className="w-5 h-5" /></button>)})}
                                    <label className="relative p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer" title="Ubah Warna Teks"><TextColorIcon className="w-5 h-5"/><input type="color" onInput={(e) => applyCommand('foreColor', (e.target as HTMLInputElement).value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/></label>
                                    <button type="button" onClick={handleImageToolbarClick} title="Sisipkan Gambar" className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><ImageIcon className="w-5 h-5" /></button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </div>
                                <div ref={contentRef} id="content" onInput={handleContentChange} onBlur={handleContentChange} contentEditable={true} suppressContentEditableWarning={true} className="p-3 min-h-[250px] bg-white rounded-b-md focus:outline-none prose max-w-none"></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 gap-3">
                             <button type="button" onClick={() => handleSubmit('draft')} disabled={loading} className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50">Simpan Draf</button>
                            <button type="button" onClick={() => handleSubmit('published')} disabled={loading} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">{loading ? 'Menyimpan...' : (isEditing ? 'Perbarui & Publikasikan' : 'Publikasikan')}</button>
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        {success && <p className="text-sm text-green-600 text-center">{success}</p>}
                    </form>
                </div>
                <div className={`${!showPreview ? 'hidden' : 'block'} lg:block`}><div className="lg:sticky lg:top-[100px]"><div className="glass h-[calc(100vh-10rem)] overflow-y-auto"><PostPreview post={{...formData, categories: categories.filter(c => selectedCategoryIds.includes(c.id))}} /></div></div></div>
            </div>
        </div>
    );
};

// --- Preview Component ---
const PostPreview: React.FC<{ post: Omit<BlogPost, 'blog_post_categories'> & { categories: Category[] } }> = ({ post }) => (
    <>
        <div className="p-6 md:p-8">
            <article>
                <div className="flex flex-wrap gap-2">{post.categories.map(cat => (<span key={cat.id} className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">{cat.name}</span>))}</div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">{post.title || "Judul Blog Anda"}</h1>
                <div className="mt-4 text-xs text-slate-400 flex items-center gap-4"><span>Oleh <strong>{post.author}</strong></span><span>{new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-auto max-h-80 object-cover rounded-lg my-6" />}
                <div className="prose max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content || "<p>Konten blog akan muncul di sini...</p>" }}></div>
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
            .prose img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1.5em auto; }
        `}</style>
    </>
);

export default AdminDashboard;
