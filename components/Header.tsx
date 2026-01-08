
import React, { useState } from 'react';
import AndroidIcon from './icons/AndroidIcon';

interface HeaderProps {
    page: string;
    setPage: (page: string) => void;
    onLogoClick: () => void;
    isAdminAuthenticated: boolean;
    onAdminLogout: () => void;
    onOpenDonationModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ page, setPage, onLogoClick, isAdminAuthenticated, onAdminLogout, onOpenDonationModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const baseNavItems = [
    { label: 'Beranda', key: 'home' },
    { label: 'Smart Review', key: 'review' },
    { label: 'Compare', key: 'battle' },
    { label: 'Phone Match', key: 'finder' },
    { label: 'Tentang', key: 'about' }
  ];

  const adminNavItems = [
    { label: 'Dashboard', key: 'admin' },
    { label: 'Blog', key: 'blog' },
  ];

  const navItems = isAdminAuthenticated 
    ? adminNavItems
    : baseNavItems;

  const handleNavClick = (e: React.MouseEvent, pageKey: string) => {
      e.preventDefault();
      setPage(pageKey);
      setIsMobileMenuOpen(false);
  };

  const logoSubtextClasses = 'text-slate-200';
  const navLinkClasses = 'text-slate-200 hover:text-white';
  const activeNavLinkClasses = 'text-white font-semibold';
  const leaderboardBtnClasses = 'border-white text-white hover:bg-white/20';
  
  const currentRootPage = page.split('/')[0] || 'home';


  return (
    <header className="w-full fixed top-0 left-0 bg-[color:var(--accent1)] shadow-lg z-40 hidden md:block">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
        {/* Left: Logo & Title */}
        <a href="#" className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.preventDefault(); onLogoClick(); }}>
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="https://raw.githubusercontent.com/rmaulana23/jagohp/main/JAGO-HP.png" alt="JAGO-HP Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className={`text-base font-semibold text-white`}> </div>
            <div className={`text-xs hidden lg:block ${logoSubtextClasses}`}>#1 Platform Rekomendasi HP Berbasis AI</div>
          </div>
        </a>

        {/* Center: Navigation */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
        {navItems.map(item => {
            const isActive = currentRootPage === item.key;
            return (
            <li key={item.key}>
                <a
                href={`#${item.key}`}
                onClick={(e) => handleNavClick(e, item.key)}
                className={`transition-colors duration-200 ${isActive ? activeNavLinkClasses : navLinkClasses}`}
                >
                {item.label}
                </a>
            </li>
            )
        })}
        </ul>

        {/* Right: CTA Button & Admin Logout */}
        <div className="flex items-center gap-3">
        {isAdminAuthenticated ? (
            <button 
                onClick={onAdminLogout}
                className={`px-4 py-2 rounded-md text-sm border transition-colors ${leaderboardBtnClasses}`}
            >
                Keluar
            </button>
        ) : (
            <a 
                href="https://github.com/rmaulana23/jagohp/raw/main/com.jagohp.app.v1.5.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-sm bg-white text-[color:var(--accent1)] font-bold hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
                <span>JAGO-HP App</span>
                <AndroidIcon className="w-4 h-4 text-[#3DDC84]" />
            </a>
        )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
