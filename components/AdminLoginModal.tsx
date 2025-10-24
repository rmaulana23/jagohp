import React, { useState } from 'react';
import XMarkIcon from './icons/XMarkIcon';

interface AdminLoginModalProps {
    onClose: () => void;
    onSubmit: (code: string) => boolean;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSubmit }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim() === '') {
            setError('Kode tidak boleh kosong.');
            triggerShake();
            return;
        }
        
        const success = onSubmit(code);
        if (!success) {
            setError('Kode akses salah!');
            triggerShake();
            setCode(''); // Clear input on failure
        }
    };
    
    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    return (
        <>
            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <section 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 opacity-100"
                aria-modal="true"
                role="dialog"
            >
                <div className={`w-full max-w-sm flex flex-col glass shadow-2xl transition-transform duration-300 ease-out scale-100 ${isShaking ? 'animate-shake' : ''}`}>
                     <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <h2 className="text-base font-semibold text-slate-800">Akses Admin</h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Tutup">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                     </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="admin-code" className="block text-sm font-medium text-slate-700">Masukkan Kode Akses</label>
                            <input
                                type="password"
                                id="admin-code"
                                value={code}
                                onChange={(e) => { setCode(e.target.value); setError(''); }}
                                className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[color:var(--accent1)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Masuk
                            </button>
                        </div>
                    </form>
                 </div>
            </section>
        </>
    );
};

export default AdminLoginModal;