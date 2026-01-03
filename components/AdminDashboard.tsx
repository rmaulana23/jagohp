
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
import SearchIcon from './icons/SearchIcon';

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

interface SmartReviewRow {
    cache_key: string;
    review_data: any;
    created_at: string;
}

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
        setPosts(newOrder);
        if (!supabase) return;
        try {
            for (let i = 0; i < newOrder.length; i++) {
                 await supabase
                    .from('blog_posts')
                    .update({ sort_order: i })
                    .eq('id', newOrder[i].id);
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

// --- HP Media Manager Tab Component ---
const HPMediaManager: FC = () => {
    const [reviews, setReviews] = useState<SmartReviewRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchReviews = async (search = '') => {
        if (!supabase) return;
        setLoading(true);
        try {
            let query = supabase.from('smart_reviews').select('*').order('created_at', { ascending: false }).limit(20);
            if (search) {
                query = query.ilike('cache_key', `%${search.toLowerCase()}%`);
            }
            const { data, error } = await query;
            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            console.error("Error fetching reviews", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleSaveImage = async (cacheKey: string, imageUrl: string) => {
        if (!supabase) return;
        setSavingId(cacheKey);
        try {
            const reviewToUpdate = reviews.find(r => r.cache_key === cacheKey);
            if (!reviewToUpdate) return;

            const updatedData = {
                ...reviewToUpdate.review_data,
                imageUrl: imageUrl.trim()
            };

            const { error } = await supabase
                .from('smart_reviews')
                .update({ review_data: updatedData })
                .eq('cache_key', cacheKey);
            
            if (error) throw error;
            
            // Sync to quick_reviews table too as fallback
            await supabase
                .from('quick_reviews')
                .update({ review_data: updatedData })
                .eq('phone_name_query', cacheKey);

            alert('Gambar berhasil disimpan!');
            fetchReviews(searchTerm);
        } catch (err) {
            alert('Gagal menyimpan gambar.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama HP..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <button onClick={() => fetchReviews(searchTerm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm">CARI</button>
            </div>

            {loading ? <p className="text-center py-10">Memuat data...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map(review => (
                        <div key={review.cache_key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4">
                            <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                {review.review_data.imageUrl ? (
                                    <img src={review.review_data.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 truncate mb-2 uppercase text-xs">{review.review_data.phoneName}</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="url" 
                                        defaultValue={review.review_data.imageUrl || ''}
                                        placeholder="Paste URL Gambar..."
                                        id={`img-${review.cache_key}`}
                                        className="flex-1 px-2 py-1 text-xs border rounded bg-white"
                                    />
                                    <button 
                                        onClick={() => {
                                            const input = document.getElementById(`img-${review.cache_key}`) as HTMLInputElement;
                                            handleSaveImage(review.cache_key, input.value);
                                        }}
                                        disabled={savingId === review.cache_key}
                                        className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded uppercase disabled:opacity-50"
                                    >
                                        {savingId === review.cache_key ? '...' : 'SAVE'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
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
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'categories' | 'trash' | 'media'>('posts');
    const [hasNewComments, setHasNewComments] = useState(false);

    // Categories State
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    
    // Comments State
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [errorComments, setErrorComments] = useState<string | null>(null);
    const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
    
    // Trash State
    const [trashedPosts, setTrashedPosts] = useState<BlogPost[]>([]);
    const [loadingTrash, setLoadingTrash] = useState(false);
    const [errorTrash, setErrorTrash] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'comments') fetchComments(1);
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'trash') fetchTrashedPosts();
    }, [activeTab]);

    const fetchCategories = async () => {
        if (!supabase) return; setLoadingCategories(true); setErrorCategories(null);
        try {
            const { data, error } = await supabase.from('blog_categories').select('*').order('name', { ascending: true });
            if (error) throw error;
            setCategories(data || []);
        } catch (err) { setErrorCategories('Gagal memuat kategori.'); } finally { setLoadingCategories(false); }
    };

    const fetchComments = async (page = 1) => {
        if (!supabase) return;
        setLoadingComments(true);
        try {
            const from = (page - 1) * COMMENTS_PER_PAGE;
            const to = from + COMMENTS_PER_PAGE - 1;
            const { data, count, error } = await supabase.from('comments').select(`*, blog_posts(id, title, slug), parent_comment:parent_id(author_name)`, { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
            if (error) throw error;
            setComments(data as any || []);
            setTotalComments(count || 0);
            setCommentsCurrentPage(page);
        } catch (err) { setErrorComments('Gagal memuat komentar.'); } finally { setLoadingComments(false); }
    };

    const fetchTrashedPosts = async () => {
        if (!supabase) return;
        setLoadingTrash(true);
        try {
            const { data, error } = await supabase.from('blog_posts').select('*').eq('status', 'trashed').order('published_at', { ascending: false });
            if (error) throw error;
            setTrashedPosts(data || []);
        } catch (err) { setErrorTrash('Gagal memuat trash.'); } finally { setLoadingTrash(false); }
    };

    const handleTrashPost = async (postId: number) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('blog_posts').update({ status: 'trashed' }).eq('id', postId);
            if (error) throw error;
            refreshPosts();
        } catch (err) { alert('Gagal memindahkan ke sampah.'); }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                 <div><h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron">Admin Dashboard</h1></div>
            </div>
            
            <div className="border-b border-slate-300 mb-4 flex overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'posts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Postingan</button>
                <button onClick={() => setActiveTab('media')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'media' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>HP Media</button>
                <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Komentar</button>
                <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'categories' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Kategori</button>
                <button onClick={() => setActiveTab('trash')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'trash' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Sampah</button>
            </div>

            <div className="glass p-4 md:p-8">
                {activeTab === 'posts' && (
                    <div className="space-y-4">
                        <div className="flex justify-end mb-4"><button onClick={onNewPost} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold">NEW POST</button></div>
                        <Reorder.Group axis="y" values={posts} onReorder={onReorder}>
                            {posts.map(post => (
                                <Reorder.Item key={post.id} value={post} className="p-4 bg-white border border-slate-200 rounded-xl mb-3 flex items-center gap-4 shadow-sm">
                                    <DragHandleIcon />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{post.title}</h3>
                                        <p className="text-xs text-slate-400">{post.status}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onEditPost(post)} className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded text-xs">EDIT</button>
                                        <button onClick={() => handleTrashPost(post.id!)} className="px-3 py-1 bg-red-50 text-red-600 font-bold rounded text-xs">TRASH</button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                )}
                {activeTab === 'media' && <HPMediaManager />}
                {activeTab === 'comments' && (
                    <div className="space-y-4">
                        {comments.map(c => (
                            <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-sm font-medium">"{c.content}"</p>
                                <p className="text-[10px] text-slate-400 mt-2">{c.author_name} @ {c.blog_posts?.title}</p>
                            </div>
                        ))}
                        <PaginationControls currentPage={commentsCurrentPage} totalPages={Math.ceil(totalComments/COMMENTS_PER_PAGE)} onPageChange={fetchComments} />
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Post Editor Component ---
const PostEditor: React.FC<{ post: BlogPost | null, onBack: () => void, onSuccess: () => void }> = ({ post, onBack, onSuccess }) => {
    const isEditing = post !== null;
    const [formData, setFormData] = useState<BlogPost>(() => ({
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        content: post?.content || '',
        author: post?.author || 'Tim JAGO-HP',
        image_url: post?.image_url || '',
        published_at: post?.published_at ? new Date(post.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: post?.status || 'draft'
    }));
    const [loading, setLoading] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) contentRef.current.innerHTML = formData.content;
    }, []);

    const handleSave = async (status: 'draft' | 'published') => {
        if (!supabase) return;
        setLoading(true);
        try {
            const data = { ...formData, content: contentRef.current?.innerHTML || '', status };
            if (isEditing) {
                await supabase.from('blog_posts').update(data).eq('id', post.id);
            } else {
                await supabase.from('blog_posts').insert([data]);
            }
            onSuccess();
        } catch (err) { alert('Gagal menyimpan.'); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold font-orbitron">{isEditing ? 'EDIT' : 'NEW'} POST</h2><button onClick={onBack} className="px-4 py-2 bg-slate-200 rounded">Back</button></div>
            <div className="glass p-6 space-y-4">
                <input type="text" placeholder="Judul..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full p-2 border rounded" />
                <input type="url" placeholder="Header Image URL..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full p-2 border rounded" />
                <textarea placeholder="Ringkasan..." value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full p-2 border rounded" rows={2} />
                <div ref={contentRef} contentEditable className="min-h-[300px] p-4 border rounded bg-white prose max-w-none focus:outline-none"></div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => handleSave('draft')} disabled={loading} className="px-6 py-2 bg-slate-100 rounded font-bold">DRAFT</button>
                    <button onClick={() => handleSave('published')} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold">PUBLISH</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
