import React, { useState } from 'react';

interface BlogShareButtonsProps {
  title: string;
  slug: string;
}

const BlogShareButtons: React.FC<BlogShareButtonsProps> = ({ title, slug }) => {
  const [copyStatus, setCopyStatus] = useState('');

  const postUrl = `${window.location.origin}/#blog/${slug}`;
  const shareTextWhatsapp = `*${title}*\n\nBaca selengkapnya di JAGO-HP:\n${postUrl}`;
  const shareTextSocial = `Artikel keren dari JAGO-HP: "${title}"\n\n#jagohp #rekomendasihp #gadget #reviewhp\n\nBaca selengkapnya di ${postUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareTextWhatsapp)}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(`${type} disalin!`);
      setTimeout(() => setCopyStatus(''), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyStatus('Gagal menyalin');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">
          Bagikan artikel ini:
        </p>
        {copyStatus && <span className="text-sm text-green-600 transition-opacity duration-300">{copyStatus}</span>}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md text-white text-sm font-semibold bg-[#1c8000] hover:opacity-90 transition-opacity"
        >
          WhatsApp
        </a>
        <button
          onClick={() => copyToClipboard(shareTextSocial, 'Teks Instagram')}
          className="px-3 py-1.5 rounded-md text-white text-sm font-semibold bg-[#8c3c62] hover:opacity-90 transition-opacity"
        >
          Instagram
        </button>
        <button
          onClick={() => copyToClipboard(shareTextSocial, 'Teks TikTok')}
          className="px-3 py-1.5 rounded-md text-white text-sm font-semibold bg-[#0f0d0e] hover:opacity-90 transition-opacity"
        >
          TikTok
        </button>
        <button
          onClick={() => copyToClipboard(postUrl, 'Tautan')}
          className="px-3 py-1.5 rounded-md text-white text-sm font-semibold bg-[#404040] hover:opacity-90 transition-opacity"
        >
          Salin Tautan
        </button>
      </div>
    </div>
  );
};

export default BlogShareButtons;
