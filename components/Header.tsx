
import React, { useState } from 'react';
import LogoIcon from './icons/LogoIcon';

const Header: React.FC<{ page: string; setPage: (page: string) => void }> = ({ page, setPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', key: 'home' },
    { label: 'Smart Review', key: 'review' },
    { label: 'Battle Mode', key: 'battle' },
    { label: 'Phone Match', key: 'finder' },
    { label: 'About', key: 'about' }
  ];

  const handleNavClick = (e: React.MouseEvent, pageKey: string) => {
      e.preventDefault();
      setPage(pageKey);
      setIsMobileMenuOpen(false); // Close menu on navigation
  };

  return (
    <header className="py-3 px-6 md:px-12 backdrop-blur-sm bg-[#0a0f1f]/60 border-b border-indigo-500/20 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left: Logo & Title */}
        <a href="#" className="flex items-center space-x-3 cursor-pointer" onClick={(e) => handleNavClick(e, 'home')}>
          <LogoIcon />
          <div className="flex flex-col">
            <span className="font-orbitron text-xl font-bold tracking-wider text-white leading-tight">
              JAGO-HP
            </span>
            <span className="hidden md:inline text-xs font-normal tracking-wide text-indigo-400/70">
              #1 Platform Rekomendasi HP with AI di Indonesia
            </span>
          </div>
        </a>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden lg:flex mr-48">
          <ul className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = page === item.key;
              return (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={(e) => handleNavClick(e, item.key)}
                    className={`transition-colors duration-300 text-sm font-semibold tracking-wide relative group ${isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-indigo-400'}`}
                  >
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-400 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right: CTA Button (Desktop) & Hamburger (Mobile) */}
        <div className="flex items-center">
            <button
              onClick={() => {
                  setPage('leaderboard');
                  setIsMobileMenuOpen(false);
              }}
              className="hidden lg:inline-flex bg-fuchsia-500/10 border border-fuchsia-400 text-fuchsia-400 px-5 py-1.5 rounded-full text-sm font-bold 
                         hover:bg-fuchsia-400 hover:text-[#0a0f1f] hover:shadow-lg hover:shadow-fuchsia-400/40 
                         transition-all duration-300 ease-in-out"
            >
              Top Leaderboard
            </button>
            
            {/* Hamburger Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                )}
              </button>
            </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0f1f]/95 backdrop-blur-sm absolute top-full left-0 w-full animate-fade-in-down">
          <ul className="flex flex-col items-center p-4 space-y-4">
            {navItems.map((item) => {
              const isActive = page === item.key;
              return (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={(e) => handleNavClick(e, item.key)}
                    className={`transition-colors duration-300 text-base font-semibold ${isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-indigo-400'}`}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <style>{`
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
      `}</style>
    </header>
  );
};

export default Header;
