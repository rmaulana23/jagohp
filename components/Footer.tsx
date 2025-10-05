import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  const footerLinks = [
    { label: 'Saran', key: 'saran' },
    { label: 'Partnership', key: 'partnership' },
    { label: 'Privacy Policy', key: 'privacy' },
  ];

  const handleNavClick = (e: React.MouseEvent, pageKey: string) => {
    e.preventDefault();
    setPage(pageKey);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  return (
    <footer className="mt-auto py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-slate-500 text-sm text-center sm:text-left">
          © JAGO-HP 2025 All Rights Reserved.
        </div>
        <div className="flex justify-center sm:justify-end items-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
          {footerLinks.map(link => (
            <a
              key={link.key}
              href="#"
              onClick={(e) => handleNavClick(e, link.key)}
              className="text-sm text-slate-400 hover:text-slate-800 transition-colors"
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