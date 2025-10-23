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
  published_at?: string;
  created_at?: string;
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
            <div className="container mx-auto max-w-4xl">
                {view === 'overview' ? (
                    <Overview
                        posts={posts}
                        loading={loadingPosts}
                        error={errorPosts}
                        onNewPost={handleNewPost}
                        onEditPost={handleEditPost}
                        onDeletePost={handleDeletePost}
                        onAdminLogout={onAdminLogout}
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
    onDeletePost: (id: number) => void, onAdminLogout: () => void
}> = ({ posts, loading, error, onNewPost, onEditPost, onDeletePost, onAdminLogout }) => (
    <div>
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
        <div className="glass p-6 md:p-8">
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
        </div>
    </div>
);

// --- Post Editor Component ---
const PostEditor: React.FC<{ post: BlogPost | null, onBack: () => void, onSuccess: () => void }> = ({ post, onBack, onSuccess }) => {
    const isEditing = post !== null;
    const initialFormState: Omit<BlogPost, 'id' | 'created_at' | 'published_at'> = {
        title: '', slug: '', category: 'Tips & Trik', excerpt: '',
        content: '', author: 'Tim JAGO-HP', image_url: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const editor = contentRef.current;
        if (editor) {
            const currentContent = post?.content || '';
            if (editor.innerHTML !== currentContent) {
                editor.innerHTML = currentContent;
            }
        }
        if (post) {
            setFormData(post);
        } else {
            setFormData(initialFormState);
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

    const applyFormat = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
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
            const imageHtml = `<img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1em auto; cursor: nwse-resize;" contenteditable="true" />`;
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

        const { id, created_at, ...updateData } = formData;
        // Make sure content from the ref is the latest
        const finalContent = contentRef.current?.innerHTML || updateData.content;
        const finalUpdateData = { ...updateData, content: finalContent };


        try {
            if (isEditing && post?.id) {
                const { error: dbError } = await supabase.from('blog_posts').update(finalUpdateData).eq('id', post.id);
                if (dbError) throw dbError;
                setSuccess('Postingan berhasil diperbarui!');
            } else {
                 const newPostData = { ...finalUpdateData, published_at: new Date().toISOString() };
                const { error: dbError } = await supabase.from('blog_posts').insert([newPostData]);
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

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-900 font-orbitron text-left mb-4">
                {isEditing ? 'Edit Postingan' : 'Buat Postingan Baru'}
            </h1>
            <form onSubmit={handleSubmit} className="glass p-6 md:p-8 space-y-4">
                 <div><label htmlFor="title" className="block text-sm font-medium text-slate-700">Judul Artikel</label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                 <div><label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug URL (otomatis)</label><input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" readOnly /></div>
                 <div><label htmlFor="category" className="block text-sm font-medium text-slate-700">Kategori</label><select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white text-slate-800"><option>Tips & Trik</option><option>Review</option><option>Berita</option></select></div>
                 <div><label htmlFor="image_url" className="block text-sm font-medium text-slate-700">URL Gambar Utama</label><input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://images.unsplash.com/..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required /></div>
                 <div><label htmlFor="excerpt" className="block text-sm font-medium text-slate-700">Ringkasan (Excerpt)</label><textarea name="excerpt" id="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required></textarea></div>

                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700">Isi Konten Lengkap</label>
                    <div className="mt-1 border border-slate-300 rounded-md">
                        <div className="sticky top-0 z-10 flex items-center flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-300 rounded-t-md">
                            {toolbarButtons.map(btn => {
                                const Icon = btn.icon;
                                return (
                                <button key={btn.cmd} type="button" onClick={() => applyFormat(btn.cmd)} title={btn.title} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded">
                                    <Icon className="w-5 h-5" />
                                </button>
                            )})}
                             <label className="relative p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer" title="Ubah Warna Teks">
                                <TextColorIcon className="w-5 h-5"/>
                                <input type="color" onInput={(e) => applyFormat('foreColor', (e.target as HTMLInputElement).value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            </label>
                            <button type="button" onClick={handleImageToolbarClick} title="Sisipkan Gambar" className="p-1.5 text-slate-600 hover:bg-slate-200 rounded">
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                        <div
                            ref={contentRef}
                            id="content"
                            contentEditable={true}
                            onInput={handleContentChange}
                            onBlur={handleContentChange} // Capture content when editor loses focus too
                            className="p-3 min-h-[250px] bg-white rounded-b-md focus:outline-none prose max-w-none"
                        ></div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                         <button type="button" onClick={onBack} className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors">
                            Kembali
                        </button>
                        <button type="button" onClick={() => setShowPreview(true)} className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors flex items-center gap-2">
                            <EyeIcon className="w-5 h-5" /> Preview
                        </button>
                    </div>
                    <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-[color:var(--accent1)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                        {loading ? 'Menyimpan...' : (isEditing ? 'Perbarui Postingan' : 'Publikasikan')}
                    </button>
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center">{success}</p>}
            </form>

            {showPreview && <PreviewModal post={{...formData, content: contentRef.current?.innerHTML || formData.content}} onClose={() => setShowPreview(false)} />}
        </div>
    );
};

// --- Preview Modal Component ---
const PreviewModal: React.FC<{ post: Omit<BlogPost, 'id'>, onClose: () => void }> = ({ post, onClose }) => (
    <>
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100"
            onClick={onClose}
        ></div>
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-3xl h-[85vh] flex flex-col glass shadow-2xl transition-all duration-300 ease-out scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-base font-semibold text-slate-800">Pratinjau Artikel</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Tutup">
                        X
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                     <article>
                        <p className="text-sm font-bold text-[color:var(--accent1)]">{post.category}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                            {post.title}
                        </h1>
                        <div className="mt-4 text-xs text-slate-400 flex items-center gap-4">
                            <span>Oleh <strong>{post.author}</strong></span>
                            <span>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-64 md:h-80 object-cover rounded-lg my-6" />}

                        <div 
                            className="prose max-w-none text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        >
                        </div>
                    </article>
                </div>
            </div>
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