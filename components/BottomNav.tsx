import React from 'react';
import HomeIcon from './icons/HomeIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SwitchHorizontalIcon from './icons/SwitchHorizontalIcon';
import SparklesIcon from './icons/SparklesIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';

const BottomNav: React.FC<{ page: string; setPage: (page: string) => void }> = ({ page, setPage }) => {
  const navItems = [
    { label: 'Home', key: 'home', icon: HomeIcon },
    { label: 'Review', key: 'review', icon: DocumentTextIcon },
    { label: 'Compare', key: 'battle', icon: SwitchHorizontalIcon },
    { label: 'Match', key: 'finder', icon: SparklesIcon },
    { label: 'About', key: 'about', icon: InformationCircleIcon },
  ];
  
  const handleNavClick = (pageKey: string) => {
      setPage(pageKey);
      window.scrollTo(0, 0);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
      <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center">
        {navItems.map(item => {
          const isActive = page === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className="flex flex-col items-center justify-center h-full gap-0.5 text-slate-400 transition-colors duration-200"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'text-white scale-110' : ''}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;