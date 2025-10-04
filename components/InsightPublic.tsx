import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface FeedItem {
    id: number;
    content: string;
    created_at: string;
}

const InsightPublic: React.FC = () => {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFeed = useCallback(async () => {
        if (!supabase) {
            setError("Koneksi database tidak terkonfigurasi.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('public_feed')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            setFeed(data || []);
        } catch (err) {
            setError("Gagal memuat feed. Coba segarkan halaman.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = comment.trim();
        if (!content || !supabase) return;

        try {
            const { data, error } = await supabase
                .from('public_feed')
                .insert([{ content }])
                .select();
            
            if (error) throw error;

            if (data) {
                setFeed(prevFeed => [data[0], ...prevFeed]);
                setComment('');
            }
        } catch (err) {
            setError("Gagal mengirim postingan.");
            console.error(err);
        }
    };

    return (
        <section id="insight" className="flex-grow flex flex-col items-center pb-12 px-4 sm:px-6 w-full">
            <div className="container mx-auto max-w-4xl text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 neon-text font-orbitron">
                    Public Insight
                </h1>
                <p className="text-base text-slate-400 mb-10">
                    Lihat apa yang sedang dibicarakan komunitas secara real-time.
                </p>

                <div className="glass rounded-2xl p-6 text-left">
                    <h2 className="text-xl font-bold text-white mb-2">Insight Feed</h2>
                    <p className="text-sm small-muted mb-4">Postingan akan otomatis hilang setelah 24 jam.</p>
                    
                    <form onSubmit={handlePost} className="mb-4">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-md bg-[color:var(--card)] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent1)]"
                            placeholder="Tulis status singkat anonim..."
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!comment.trim()}
                                className="px-3 py-1 rounded-md bg-[color:var(--accent1)]/10 border border-[color:var(--accent1)]/30 text-[color:var(--accent1)] font-semibold hover:bg-[color:var(--accent1)]/20 transition-colors disabled:opacity-50"
                            >
                                Post
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {loading && <p className="text-center small-muted">Memuat feed...</p>}
                        {error && <p className="text-center text-red-400">{error}</p>}
                        {!loading && feed.length === 0 && <p className="text-center small-muted">Belum ada postingan.</p>}
                        {feed.map(item => (
                            <div key={item.id} className="p-3 rounded-lg bg-black/20 text-slate-300 text-sm animate-fade-in">
                                {item.content}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InsightPublic;
