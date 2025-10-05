import React, { useState } from 'react';

const Header: React.FC<{ page: string; setPage: (page: string) => void }> = ({ page, setPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', key: 'home' },
    { label: 'Smart Review', key: 'review' },
    { label: 'Compare', key: 'battle' },
    { label: 'Phone Match', key: 'finder' },
    { label: 'About', key: 'about' }
  ];

  const handleNavClick = (e: React.MouseEvent, pageKey: string) => {
      e.preventDefault();
      setPage(pageKey);
      setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full fixed top-2 left-0 px-4 z-40">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-3 rounded-2xl px-4 bg-gradient-to-r from-[color:var(--accent1)] to-[color:var(--accent2)] shadow-lg">
        {/* Left: Logo & Title */}
        <a href="#" className="flex items-center gap-3 cursor-pointer" onClick={(e) => handleNavClick(e, 'home')}>
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-orbitron text-[color:var(--accent1)] text-lg">JH</div>
          <div>
            <div className="text-base font-semibold text-white">JAGO-HP</div>
            <div className="text-xs text-slate-200">#1 Platform Rekomendasi HP Berbasis AI</div>
          </div>
        </a>

        {/* Center: Navigation (Desktop) */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map(item => {
            const isActive = page === item.key;
            return (
              <li key={item.key}>
                <a
                  href="#"
                  onClick={(e) => handleNavClick(e, item.key)}
                  className={`transition-colors duration-200 text-slate-200 ${isActive ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>

        {/* Right: CTA Button (Desktop) & Hamburger (Mobile) */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPage('leaderboard')} 
            className="hidden md:inline-block px-3 py-1.5 rounded-md text-sm border border-white text-white hover:bg-white/20 transition-colors"
          >
            Top Leaderboard
          </button>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 glass p-4 animate-fade-in-down">
          <ul className="flex flex-col gap-3">
            {navItems.map(item => {
              const isActive = page === item.key;
              return (
                <li key={item.key}>
                  <a
                    href="#"
                    onClick={(e) => handleNavClick(e, item.key)}
                    className={`block text-center py-2 rounded-lg ${isActive ? 'bg-[color:var(--accent1)]/10 text-[color:var(--accent1)] font-semibold' : 'hover:bg-slate-100'}`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
             <li className="pt-2">
                <button
                    onClick={() => { setPage('leaderboard'); setIsMobileMenuOpen(false); }}
                    className="w-full px-3 py-2 rounded-md text-sm border border-[color:var(--accent1)] bg-[color:var(--accent1)]/10 text-[color:var(--accent1)]"
                >
                    Top Leaderboard
                </button>
            </li>
          </ul>
        </div>
      )}
       <style>{`
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
      `}</style>
    </header>
  );
};

export default Header;