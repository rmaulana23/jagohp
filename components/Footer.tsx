
import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
  page: string;
  onOpenDonationModal: () => void;
}

const Footer: React.FC<FooterProps> = ({ setPage, page, onOpenDonationModal }) => {
  const footerLinks = [
    { label: 'Donasi', key: 'donation', isModal: true },
    { label: 'FAQ', key: 'faq' },
    { label: 'Privacy Policy', key: 'privacy' },
  ];

  const handleNavClick = (e: React.MouseEvent, link: any) => {
    e.preventDefault();
    if (link.isModal) {
      onOpenDonationModal();
    } else {
      setPage(link.key);
    }
  };

  return (
    <footer className="mt-auto py-8 hidden md:block">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className={`text-sm text-center sm:text-left ${page === 'jcc' ? 'text-slate-400' : 'text-slate-500'}`}>
          © JAGO-HP 2025 All Rights Reserved.
        </div>
        <div className="flex justify-center sm:justify-end items-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
          {footerLinks.map(link => (
            <a
              key={link.key}
              href={`#${link.key}`}
              onClick={(e) => handleNavClick(e, link)}
              className={`text-sm ${page === 'jcc' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'} transition-colors`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
