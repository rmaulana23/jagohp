import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  return (
    <footer className="mt-auto py-6">
      <div className="max-w-5xl mx-auto px-4 small-muted text-sm text-center">
        © JAGO-HP 2025 • Review Cepat, Pilih Tepat
      </div>
    </footer>
  );
};

export default Footer;