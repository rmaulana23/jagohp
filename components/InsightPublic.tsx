import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface PollOption {
    id: number;
    text: string;
    votes: number;
}

const InsightPublic: React.FC = () => {
    const [options, setOptions] = useState<PollOption[]>([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [votedId, setVotedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const calculateTotalVotes = (opts: PollOption[]) => opts.reduce((sum, opt) => sum + opt.votes, 0);

    const fetchAndSetPoll = useCallback(async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // This RPC function should be created in Supabase:
            // CREATE OR REPLACE FUNCTION get_random_poll_options()
            // RETURNS TABLE(id bigint, text text, votes bigint) AS $$
            //   SELECT id, text, votes FROM dealbreakers_poll ORDER BY random() LIMIT 3;
            // $$ LANGUAGE sql;
            const { data, error: rpcError } = await supabase.rpc('get_random_poll_options');
            if (rpcError) throw rpcError;

            if (data && data.length > 0) {
                setOptions(data);
                setTotalVotes(calculateTotalVotes(data));
                localStorage.setItem('dailyPoll', JSON.stringify({
                    timestamp: Date.now(),
                    options: data
                }));
                 localStorage.removeItem('dailyPollVoteId'); // Clear old vote
            }
        } catch (err: any) {
            console.error("Error fetching poll:", err.message || err);
            setError('Gagal memuat polling saat ini.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedPollRaw = localStorage.getItem('dailyPoll');
        const storedVoteIdRaw = localStorage.getItem('dailyPollVoteId');
        
        if (storedPollRaw) {
            const { timestamp, options: storedOptions } = JSON.parse(storedPollRaw);
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                setOptions(storedOptions);
                setTotalVotes(calculateTotalVotes(storedOptions));
                if (storedVoteIdRaw) {
                    setVotedId(parseInt(storedVoteIdRaw, 10));
                }
                setLoading(false);
            } else {
                fetchAndSetPoll();
            }
        } else {
            fetchAndSetPoll();
        }
    }, [fetchAndSetPoll]);

    const handleVote = async (id: number) => {
        if (votedId || !supabase) return;

        setVotedId(id);
        localStorage.setItem('dailyPollVoteId', String(id));

        // Optimistic UI update
        const oldOptions = options;
        const newOptions = options.map(opt =>
            opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
        );
        setOptions(newOptions);
        setTotalVotes(prev => prev + 1);
        
        const storedPollData = JSON.parse(localStorage.getItem('dailyPoll') || '{}');
        localStorage.setItem('dailyPoll', JSON.stringify({ ...storedPollData, options: newOptions }));

        try {
            // This RPC function should be created in Supabase:
            // CREATE OR REPLACE FUNCTION increment_poll_vote(option_id bigint)
            // RETURNS void AS $$
            //   UPDATE dealbreakers_poll SET votes = votes + 1 WHERE id = option_id;
            // $$ LANGUAGE sql SECURITY DEFINER;
            const { error: rpcError } = await supabase.rpc('increment_poll_vote', { option_id: id });
            if (rpcError) throw rpcError;
        } catch (err: any) {
            console.error("Failed to save vote:", err.message || err);
            // Rollback optimistic update on failure
            setOptions(oldOptions);
            setTotalVotes(calculateTotalVotes(oldOptions));
            setVotedId(null);
            localStorage.setItem('dailyPoll', JSON.stringify({ ...storedPollData, options: oldOptions }));
            localStorage.removeItem('dailyPollVoteId');
            setError('Gagal menyimpan suara.');
        }
    };
    
    if (loading) {
        return (
            <div className="glass rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-8 bg-slate-700/50 rounded-lg"></div>
                    <div className="h-8 bg-slate-700/50 rounded-lg"></div>
                    <div className="h-8 bg-slate-700/50 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
           <div className="glass rounded-2xl p-4">
               <h3 className="font-semibold text-white mb-2 text-base">Polling: Apa Dealbreaker-mu?</h3>
               <div className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                   {error}
               </div>
           </div>
       );
   }

    if (!options || options.length === 0) {
        return null; // Don't render if no options are available
    }

    return (
        <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
                <span>Polling: Apa Dealbreaker-mu?</span>
                <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Live Voting</span>
            </h3>
            <div className="space-y-2">
                {options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const isVotedOption = option.id === votedId;

                    return (
                        <div key={option.id} className="text-sm">
                            {votedId !== null ? (
                                <div className="relative w-full bg-slate-700/50 rounded-lg p-2 overflow-hidden border-2 border-transparent">
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-md ${isVotedOption ? 'bg-[color:var(--accent1)]/30' : 'bg-slate-600/30'}`}
                                        style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
                                    ></div>
                                    <div className="relative flex justify-between items-center text-slate-200">
                                        <span className={`font-medium ${isVotedOption ? 'text-white' : ''}`}>{option.text}</span>
                                        <span className="font-semibold">{percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleVote(option.id)}
                                    className="w-full text-left p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-slate-200"
                                >
                                    {option.text}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-center small-muted mt-3">Polling direset setiap 24 jam.</p>
        </div>
    );
};

export default InsightPublic;