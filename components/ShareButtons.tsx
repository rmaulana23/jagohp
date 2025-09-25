
import React, { useState } from 'react';
import WhatsappIcon from './icons/WhatsappIcon';
import LinkIcon from './icons/LinkIcon';

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
          setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        }, (err) => {
          console.error('Could not copy text: ', err);
          alert('Gagal menyalin tautan.');
        });
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;

  return (
    <div className="flex items-center justify-center gap-4 mt-6 border-t border-indigo-500/20 pt-5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/50 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-500/20 transition-colors"
      >
        <WhatsappIcon className="w-5 h-5" />
        Share WhatsApp
      </a>
      <button
        onClick={handleCopyToClipboard}
        className="flex items-center gap-2 bg-gray-500/10 text-gray-300 border border-gray-500/50 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-500/20 transition-colors disabled:opacity-70"
      >
        <LinkIcon className="w-5 h-5" />
        {copied ? 'Link Disalin!' : 'Copy Tautan'}
      </button>
    </div>
  );
};

export default ShareButtons;
