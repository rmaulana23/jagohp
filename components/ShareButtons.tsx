import React, { useState } from 'react';

interface ShareButtonsProps {
  shareText: string;
  shareUrl: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ shareText, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }, () => alert('Gagal menyalin tautan.'));
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;

  return (
    <div className="flex items-center justify-center gap-3 mt-6 border-t border-slate-200 pt-5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center bg-green-500/10 text-green-600 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors"
      >
        Share WhatsApp
      </a>
      <button
        onClick={handleCopyToClipboard}
        className="flex-1 bg-slate-500/10 text-slate-600 border border-slate-500/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-500/20 transition-colors disabled:opacity-70"
      >
        {copied ? 'Link Disalin!' : 'Copy Tautan'}
      </button>
    </div>
  );
};

export default ShareButtons;