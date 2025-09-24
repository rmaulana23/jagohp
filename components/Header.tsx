
import React from 'react';
import LogoIcon from './icons/LogoIcon';

const Header: React.FC<{ page: string; setPage: (page: string) => void }> = ({ page, setPage }) => {
  const navItems = [
    { label: 'Home', key: 'home' },
    { label: 'Smart Review', key: 'review' },
    { label: 'Battle Mode', key: 'battle' },
    { label: 'Smart Pick', key: 'finder' },
    { label: 'Insight Public', key: 'insight' },
    { label: 'About', key: 'about' }
  ];

  const handleNavClick = (e: React.MouseEvent, pageKey: string) => {
      e.preventDefault();
      setPage(pageKey);
  };

  return (
    <header className="py-3 px-6 md:px-12 backdrop-blur-sm bg-[#0a0f1f]/60 border-b border-cyan-400/20 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left: Logo & Title */}
        <a href="#" className="flex items-center space-x-3 cursor-pointer" onClick={(e) => handleNavClick(e, 'home')}>
          <LogoIcon />
          <div className="flex flex-col">
            <span className="font-orbitron text-xl font-bold tracking-wider text-white leading-tight">
              JAGO-HP
            </span>
            <span className="hidden md:inline text-xs font-normal tracking-wide text-cyan-400/70">
              #1 Review HP with AI di Indonesia
            </span>
          </div>
        </a>

        {/* Center: Navigation */}
        <nav className="hidden lg:flex mr-16">
          <ul className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = page === item.key;
              return (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={(e) => handleNavClick(e, item.key)}
                    className={`transition-colors duration-300 text-sm font-semibold tracking-wide relative group ${isActive ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400'}`}
                  >
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-cyan-400 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right: CTA Button */}
        <button
          onClick={() => setPage('leaderboard')}
          className="bg-green-500/10 border border-green-400 text-green-400 px-5 py-1.5 rounded-full text-sm font-bold 
                     hover:bg-green-400 hover:text-[#0a0f1f] hover:shadow-lg hover:shadow-green-400/40 
                     transition-all duration-300 ease-in-out"
        >
          Top Leaderboard
        </button>
      </div>
    </header>
  );
};

export default Header;