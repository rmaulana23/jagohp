import React, { useState, useEffect, useRef } from 'react';
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

// Define the type for a blog post
interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  image_url: string;
  published_at: string; // Changed to be required for form state
  created_at?: string;
}

interface Comment {
    id: number;
    content: string;
    author_name: string;
    created_at: string;
    blog_posts: {
        title: string;
        slug: string;
    } | null;
}


const AdminDashboard: React.FC<{ setPage: (page: string) => void; onAdminLogout: () => void; }> = ({ setPage, onAdminLogout }) => {
    const [view, setView] = useState<'overview' | 'editor'>('overview');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);

    useEffect(() => {
        if (view === 'overview') {
            fetchPosts();
        }
    }, [view]);

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
                .select('*')
                .order('published_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (err: any) {
            setErrorPosts('Gagal memuat daftar postingan.');
            console.error(err);
        } finally {
            setLoadingPosts(false);
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

    const handleDeletePost = async (postId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
            if (!supabase) return;
            try {
                const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
                if (error) throw error;
                fetchPosts(); // Refresh list
            } catch (err) {
                alert('Gagal menghapus postingan.');
                console.error(err);
            }
        }
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
                        onDeletePost={handleDeletePost}
                        onAdminLogout={onAdminLogout}
                        setPage={setPage}
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

// --- Overview Component ---
const Overview: React.FC<{
    posts: BlogPost[], loading: boolean, error: string | null,
    onNewPost: () => void, onEditPost: (post: BlogPost) => void,
    onDeletePost: (id: number) => void, onAdminLogout: () => void,
    setPage: (page: string) => void
}> = ({ posts, loading, error, onNewPost, onEditPost, onDeletePost, onAdminLogout, setPage }) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [errorComments, setErrorComments] = useState<string | null>(null);

    const fetchComments = async () => {
        if (!supabase) return;
        setLoadingComments(true);
        setErrorComments(null);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, blog_posts(title, slug)')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            setComments(data || []);
        } catch (err: any) {
            setErrorComments('Gagal memuat komentar.');
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };
    
    useEffect(() => {
        if (activeTab === 'comments') {
            fetchComments();
        }
    }, [activeTab]);

    const handleDeleteComment = async (commentId: number) => {
        if (!supabase) return;
        if (window.confirm('Yakin ingin menghapus komentar ini?')) {
            try {
                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (error) throw error;
                fetchComments(); // Refresh
            } catch (err) {
                alert('Gagal menghapus komentar.');
            }
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-orbitron text-left">
                        Admin Dashboard
                    </h1>
                    <p className="text-base text-slate-500 mt-2 text-left">Manajemen Konten Blog</p>
                </div>
            </div>
            <div className="flex justify-end mb-4">
                <button onClick={onNewPost} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity">
                    Buat Postingan Baru
                </button>
            </div>

            <div className="border-b border-slate-300 mb-4 flex">
                 <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'posts' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>
                    Postingan ({posts.length})
                </button>
                <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'comments' ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>
                    Komentar Terbaru
                </button>
            </div>

            <div className="glass p-6 md:p-8">
                {activeTab === 'posts' && (
                    <>
                        {loading && <p>Memuat postingan...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!loading && !error && (
                            <div className="space-y-3">
                                {posts.length > 0 ? posts.map(post => (
                                    <div key={post.id} className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{post.title}</h3>
                                            <p className="text-xs text-slate-500">
                                                {new Date(post.published_at!).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onEditPost(post)} className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button>
                                            <button onClick={() => onDeletePost(post.id!)} className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200">Hapus</button>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-500 text-center">Belum ada postingan.</p>}
                            </div>
                        )}
                    </>
                )}
                {activeTab === 'comments' && (
                    <>
                        {loadingComments && <p>Memuat komentar...</p>}
                        {errorComments && <p className="text-red-500">{errorComments}</p>}
                        {!loadingComments && !errorComments && (
                            <div className="space-y-4">
                                {comments.length > 0 ? comments.map(comment => (
                                    <div key={comment.id} className="p-3 bg-slate-100 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-slate-600">"{comment.content}"</p>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    <strong>{comment.author_name}</strong> &bull; {new Date(comment.created_at).toLocaleString('id-ID')}
                                                </p>
                                                 <p className="text-xs text-slate-500 mt-1">
                                                    Di artikel: <a href={`#blog/${comment.blog_posts?.slug}`} onClick={(e) => { e.preventDefault(); setPage(`blog/${comment.blog_posts?.slug}`)}} className="text-blue-600 hover:underline">{comment.blog_posts?.title}</a>
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteComment(comment.id)} className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex-shrink-0 ml-2">Hapus</button>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-500 text-center">Belum ada komentar.</p>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// --- Post Editor Component ---
const PostEditor: React.FC<{ post: BlogPost | null, onBack: () => void, onSuccess: () => void }> = ({ post, onBack, onSuccess }) => {
    const isEditing = post !== null;
    const getInitialFormState = (): BlogPost => {
        const today = new Date().toISOString().split('T')[0];
        if (post) {
            return {
                ...post,
                published_at: post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : today,
            };
        }
        return {
            title: '', slug: '', category: 'Tips & Trik', excerpt: '',
            content: '', author: 'Tim JAGO-HP', image_url: '', published_at: today,
        };
    };

    const [formData, setFormData] = useState<BlogPost>(getInitialFormState());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const initialState = getInitialFormState();
        setFormData(initialState);
        if (contentRef.current) {
            contentRef.current.innerHTML = initialState.content || '';
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'title') {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, title: value, slug: slug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleContentChange = () => {
        if (contentRef.current) {
            setFormData(prev => ({ ...prev, content: contentRef.current!.innerHTML }));
        }
    };

    const applyCommand = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
        contentRef.current?.focus();
        handleContentChange();
    };
    
    const applyFormatBlock = (tag: string) => {
        applyCommand('formatBlock', `<${tag}>`);
    }

    const applyFontSize = (size: string) => {
        if (!size) return;
        const uniqueId = `font-size-${Date.now()}`;
        document.execCommand('insertHTML', false, `<span id="${uniqueId}">${window.getSelection()?.toString()}</span>`);
        const newSpan = document.getElementById(uniqueId);
        if (newSpan) {
            newSpan.style.fontSize = `${size}px`;
            newSpan.removeAttribute('id');
        }
        contentRef.current?.focus();
        handleContentChange();
    };

    const handleImageToolbarClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !supabase) return;

        setError(null);
        const filePath = `public/${Date.now()}-${file.name}`;
        
        try {
            const { error: uploadError } = await supabase.storage
                .from('blog_images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('blog_images')
                .getPublicUrl(filePath);
            
            const imageUrl = data.publicUrl;
            
            contentRef.current?.focus();
            const imageHtml = `<img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1em auto;"/>`;
            document.execCommand('insertHTML', false, imageHtml);
            
        } catch (err: any) {
            console.error("Image upload failed:", err);
            setError(`Gagal mengunggah gambar: ${err.message}`);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!supabase) {
            setError("Koneksi Supabase tidak tersedia.");
            setLoading(false);
            return;
        }

        const { id, created_at, ...dataToSave } = formData;

        try {
            if (isEditing && post?.id) {
                const { error: dbError } = await supabase.from('blog_posts').update(dataToSave).eq('id', post.id);
                if (dbError) throw dbError;
                setSuccess('Postingan berhasil diperbarui!');
            } else {
                const { error: dbError } = await supabase.from('blog_posts').insert([dataToSave]);
                if (dbError) throw dbError;
                setSuccess('Postingan berhasil dipublikasikan!');
            }
            setTimeout(() => onSuccess(), 1500);
        } catch (err: any) {
            console.error('Error saving post:', err);
            setError(`Gagal menyimpan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toolbarButtons = [
        { cmd: 'bold', icon: BoldIcon, title: 'Bold' },
        { cmd: 'italic', icon: ItalicIcon, title: 'Italic' },
        { cmd: 'underline', icon: UnderlineIcon, title: 'Underline' },
        { cmd: 'insertUnorderedList', icon: ListUnorderedIcon, title: 'Bulleted List' },
        { cmd: 'insertOrderedList', icon: ListOrderedIcon, title: 'Numbered List' },
        { cmd: 'justifyLeft', icon: AlignLeftIcon, title: 'Align Left' },
        { cmd: 'justifyCenter', icon: AlignCenterIcon, title: 'Align Center' },
        { cmd: 'justifyRight', icon: AlignRightIcon, title: 'Align Right' },
        { cmd: 'justifyFull', icon: AlignJustifyIcon, title: 'Align Justify' }
    ];
    
    const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 48, 64];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900 font-orbitron text-left">
                    {isEditing ? 'Edit Postingan' : 'Buat Postingan Baru'}
                </h1>
                <button type="button" onClick={onBack} className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors">
                    Kembali
                </button>
            </div>

            {/* Mobile View Toggle */}
            <div className="lg:hidden flex border-b border-slate-300 mb-4">
                <button type="button" onClick={() => setShowPreview(false)} className={`flex-1 py-2 text-sm font-semibold transition-colors ${!showPreview ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>
                    Editor
                </button>
                <button type="button" onClick={() => setShowPreview(true)} className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${showPreview ? 'border-b-2 border-[color:var(--accent1)] text-[color:var(--accent1)]' : 'text-slate-500'}`}>
                    <EyeIcon className="w-5 h-5" /> Preview
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Editor */}
                <div className={`${showPreview ? 'hidden' : 'block'} lg:block`}>
                    <form onSubmit={handleSubmit} className="glass p-6 md:p-8 space-y-4">
                        <div><label htmlFor="title" className="block text-sm font-medium text-slate-700">Judul Artikel</label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug URL (otomatis)</label><input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" readOnly /></div>
                        <div><label htmlFor="category" className="block text-sm font-medium text-slate-700">Kategori</label><select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white text-slate-800"><option>Tips & Trik</option><option>Review</option><option>Berita</option></select></div>
                        <div><label htmlFor="published_at" className="block text-sm font-medium text-slate-700">Tanggal Publikasi</label><input type="date" name="published_at" id="published_at" value={formData.published_at || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="image_url" className="block text-sm font-medium text-slate-700">URL Gambar Utama</label><input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://images.unsplash.com/..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                        <div><label htmlFor="excerpt" className="block text-sm font-medium text-slate-700">Ringkasan (Excerpt)</label><textarea name="excerpt" id="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required></textarea></div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-slate-700">Isi Konten Lengkap</label>
                            <div className="mt-1 border border-slate-300 rounded-md">
                                <div className="sticky top-[72px] md:top-[100px] z-10 flex items-center flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-300 rounded-t-md">
                                    <div className="relative flex items-center" title="Format Teks">
                                        <select
                                            onChange={(e) => applyFormatBlock(e.target.value)}
                                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded bg-transparent appearance-none text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        >
                                            <option value="p">Paragraf</option>
                                            <option value="h2">Judul 2</option>
                                            <option value="h3">Judul 3</option>
                                        </select>
                                    </div>
                                    <div className="relative flex items-center" title="Ukuran Font">
                                        <FontSizeIcon className="w-5 h-5 absolute left-2 pointer-events-none text-slate-600"/>
                                        <select
                                            onChange={(e) => applyFontSize(e.target.value)}
                                            className="p-1.5 pl-8 text-slate-600 hover:bg-slate-200 rounded bg-transparent appearance-none text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        >
                                            <option value="">Ukuran</option>
                                            {fontSizes.map(size => (
                                                <option key={size} value={String(size)}>{size}px</option>
                                            ))}
                                        </select>
                                    </div>
                                    {toolbarButtons.map(btn => {
                                        const Icon = btn.icon;
                                        return (
                                        <button key={btn.cmd} type="button" onClick={() => applyCommand(btn.cmd)} title={btn.title} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded">
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    )})}
                                    <label className="relative p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer" title="Ubah Warna Teks">
                                        <TextColorIcon className="w-5 h-5"/>
                                        <input type="color" onInput={(e) => applyCommand('foreColor', (e.target as HTMLInputElement).value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                    </label>
                                    <button type="button" onClick={handleImageToolbarClick} title="Sisipkan Gambar" className="p-1.5 text-slate-600 hover:bg-slate-200 rounded">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </div>
                                <div
                                    ref={contentRef}
                                    id="content"
                                    onInput={handleContentChange}
                                    contentEditable={true}
                                    className="p-3 min-h-[250px] bg-white rounded-b-md focus:outline-none prose max-w-none"
                                ></div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                                {loading ? 'Menyimpan...' : (isEditing ? 'Perbarui Postingan' : 'Publikasikan')}
                            </button>
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        {success && <p className="text-sm text-green-600 text-center">{success}</p>}
                    </form>
                </div>

                {/* Right Column: Preview */}
                <div className={`${!showPreview ? 'hidden' : 'block'} lg:block`}>
                    <div className="lg:sticky lg:top-[100px]">
                        <div className="glass h-[calc(100vh-10rem)] overflow-y-auto">
                            <PostPreview post={{...formData}} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Preview Component (replaces modal) ---
const PostPreview: React.FC<{ post: Omit<BlogPost, 'id' | 'created_at'> }> = ({ post }) => (
    <>
        <div className="p-6 md:p-8">
            <article>
                <p className="text-sm font-bold text-[color:var(--accent1)]">{post.category}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                    {post.title || "Judul Artikel Anda"}
                </h1>
                <div className="mt-4 text-xs text-slate-400 flex items-center gap-4">
                    <span>Oleh <strong>{post.author}</strong></span>
                    <span>{new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-auto max-h-80 object-cover rounded-lg my-6" />}

                <div 
                    className="prose max-w-none text-slate-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content || "<p>Konten artikel akan muncul di sini...</p>" }}
                >
                </div>
            </article>
        </div>
         <style>{`
            .prose p, .prose div, .prose li { margin-bottom: 1em; }
            .prose h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
            .prose h3 { font-size: 1.25em; font-weight: bold; margin-top: 1.25em; margin-bottom: 0.5em; }
            .prose ul { list-style-position: inside; list-style-type: disc; margin-left: 1em; margin-bottom: 1em; }
            .prose ol { list-style-position: inside; list-style-type: decimal; margin-left: 1em; margin-bottom: 1em; }
            .prose a { color: #4f46e5; text-decoration: underline; }
            .prose strong, .prose b { font-weight: bold; }
            .prose em, .prose i { font-style: italic; }
            .prose u { text-decoration: underline; }
            .prose img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1em auto; }
        `}</style>
    </>
);

export default AdminDashboard;