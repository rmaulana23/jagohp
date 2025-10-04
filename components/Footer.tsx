import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  const footerLinks = [
    { label: 'FAQ', key: 'faq' },
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
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div className="flex justify-center items-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 mb-4">
          {footerLinks.map(link => (
            <a
              key={link.key}
              href="#"
              onClick={(e) => handleNavClick(e, link.key)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="text-slate-500 text-sm">
          © JAGO-HP 2025 All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
