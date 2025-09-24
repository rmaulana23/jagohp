import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  return (
    <footer className="relative z-10 py-4 px-4 text-center">
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <p className="text-sm text-gray-500">
          © 2025 JAGO-HP All rights reserved.
        </p>
        <span className="hidden sm:inline text-gray-600">|</span>
        <button
          onClick={() => setPage('faq')}
          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
        >
          FAQ
        </button>
        <span className="hidden sm:inline text-gray-600">|</span>
        <button
          onClick={() => setPage('partnership')}
          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
        >
          Partnership
        </button>
        <span className="hidden sm:inline text-gray-600">|</span>
        <button
          onClick={() => setPage('privacy')}
          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
        >
          Privacy Policy
        </button>
      </div>
    </footer>
  );
};

export default Footer;