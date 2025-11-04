import React from 'react';
import XMarkIcon from './icons/XMarkIcon';
import HeartIcon from './icons/HeartIcon';

interface DonationModalProps {
    onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ onClose }) => {
    return (
        <>
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
                <div className="w-full max-w-md flex flex-col glass shadow-2xl transition-transform duration-300 ease-out scale-100">
                     <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <HeartIcon className="w-6 h-6 text-red-500"/>
                            <h2 className="text-base font-semibold text-slate-800">Dukung JAGO-HP!</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Tutup">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                     </div>
                    
                    <div className="p-6 text-center space-y-4">
                        <p className="text-slate-600 leading-relaxed">
                            Jika kamu merasa JAGO-HP membantumu, dukung kami dengan donasi agar kami bisa terus berkembang dan memberikan fitur-fitur AI yang lebih canggih lagi.
                        </p>
                        <p className="text-sm text-slate-500">Setiap dukunganmu sangat berarti!</p>
                        <div>
                            <a
                              href="https://saweria.co/minekaze"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={onClose} // close modal when they click to donate
                              className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Lanjut Donasi ke Saweria
                            </a>
                        </div>
                    </div>
                 </div>
            </section>
        </>
    );
};

export default DonationModal;
