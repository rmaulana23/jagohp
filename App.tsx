
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PhoneBattle, { BattleResult } from './components/PhoneBattle';
import SmartReview, { ReviewResult } from './components/SmartReview';
import TanyaAI from './components/TanyaAI';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import PhoneFinder from './components/PhoneFinder';
import Saran from './components/Saran';
import BottomNav from './components/BottomNav';
import Blog from './components/Blog';
import AdminLoginModal from './components/AdminLoginModal';
import AdminDashboard from './components/AdminDashboard';
import BlogPost from './components/BlogPost';
import DonationModal from './components/DonationModal';
import ChatBubbleLeftEllipsisIcon from './components/icons/ChatBubbleLeftEllipsisIcon';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.hash.substring(1) || 'home');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);


  // State to hold full results for detail pages
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [reviewQuery, setReviewQuery] = useState('');
  const [battleQueryA, setBattleQueryA] = useState('');

  // Admin state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Blog post state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Persistent Quick Review State
  const [persistentQuickReviewResult, setPersistentQuickReviewResultState] = useState<ReviewResult | null>(null);

  useEffect(() => {
    const onHashChange = () => {
        setPath(window.location.hash.substring(1) || 'home');
        window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    // Set initial path
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      const savedReview = localStorage.getItem('lastQuickReviewResult');
      if (savedReview) {
        setPersistentQuickReviewResultState(JSON.parse(savedReview));
      }
    } catch (error) {
      console.error("Gagal memuat review cepat dari localStorage:", error);
      localStorage.removeItem('lastQuickReviewResult');
    }
  }, []);

  const handleSetPersistentQuickReview = (result: ReviewResult | null) => {
    setPersistentQuickReviewResultState(result);
    if (result) {
      try {
        localStorage.setItem('lastQuickReviewResult', JSON.stringify(result));
      } catch (error) {
        console.error("Gagal menyimpan review cepat ke localStorage:", error);
      }
    }
  };
  
  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  const handleLogoClick = () => {
    if (isAdminAuthenticated) {
        navigate('admin');
    } else {
        navigate('home');
    }
  };
  
  const openAdminLogin = () => {
    setIsChatModalOpen(false);
    setShowAdminLogin(true);
  };

  const handleAdminLogin = (code: string): boolean => {
      if (code === 'adminjago1') {
          setIsAdminAuthenticated(true);
          setShowAdminLogin(false);
          navigate('admin');
          return true;
      } else {
          return false;
      }
  };
  
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    navigate('home');
  };

  const navigateToFullReview = (result: ReviewResult) => {
    setReviewResult(result);
    setReviewQuery('');
    navigate(`review/${encodeURIComponent(result.phoneName.replace(/\s+/g, '-'))}`);
  };

  const navigateToFullBattle = (result: BattleResult) => {
    setBattleResult(result);
    navigate('battle');
  };

  const navigateToReviewWithQuery = (phoneName: string) => {
    setReviewResult(null);
    setReviewQuery(phoneName);
    navigate(`review/${encodeURIComponent(phoneName.replace(/\s+/g, '-'))}`);
  };

  const navigateToBattleWithPhone = (phoneName: string) => {
    setBattleQueryA(phoneName);
    setBattleResult(null);
    navigate('battle');
  };
  
  const clearGlobalResult = () => {
    setReviewResult(null);
    setReviewQuery('');
  };

  const clearGlobalBattleResult = () => {
    setBattleResult(null);
  };

  const navigateToBlogPost = (post: any) => {
    setSelectedPost(post);
    navigate(`blog/${post.slug}`);
  };

  const openChat = () => {
    // If mobile width, navigate to dedicated chat page
    if (window.innerWidth < 768) {
      navigate('chat');
    } else {
      setIsChatModalOpen(true);
    }
  };

  const mainContent = () => {
    const pathParts = path.split('/');
    const page = pathParts[0] || 'home';
    const param = pathParts[1];

    switch (page) {
      case 'home': return <Hero 
                            setPage={navigate} 
                            openChat={openChat} 
                            navigateToFullReview={navigateToFullReview} 
                            navigateToFullBattle={navigateToFullBattle} 
                            navigateToReviewWithQuery={navigateToReviewWithQuery}
                            navigateToBlogPost={navigateToBlogPost}
                            persistentQuickReviewResult={persistentQuickReviewResult}
                            onSetPersistentQuickReviewResult={handleSetPersistentQuickReview}
                            onOpenDonationModal={() => setIsDonationModalOpen(true)}
                           />;
      case 'battle': return <PhoneBattle 
                                initialResult={battleResult} 
                                initialPhoneA={battleQueryA} 
                                clearInitialPhoneA={() => setBattleQueryA('')} 
                                clearGlobalBattleResult={clearGlobalBattleResult}
                             />;
      case 'review': return <SmartReview 
                                initialResult={reviewResult} 
                                initialQuery={param ? decodeURIComponent(param.replace(/-/g, ' ')) : reviewQuery} 
                                clearGlobalResult={clearGlobalResult} 
                                onCompare={navigateToBattleWithPhone}
                             />;
      case 'finder': return <PhoneFinder />;
      case 'chat': return <TanyaAI isOpen={true} isPage={true} onClose={() => navigate('home')} openAdminLogin={openAdminLogin} />;
      case 'blog': 
        if (param) {
          return <BlogPost 
                    post={selectedPost} 
                    slug={param} 
                    setPage={navigate} 
                    setSelectedPost={setSelectedPost} 
                    isAdminAuthenticated={isAdminAuthenticated}
                    navigateToFullReview={navigateToFullReview}
                 />;
        }
        return <Blog setPage={navigate} navigateToBlogPost={navigateToBlogPost} />;
      case 'leaderboard': return <Leaderboard />;
      case 'about': return <About />;
      case 'faq': return <FAQ />;
      case 'privacy': return <PrivacyPolicy />;
      case 'saran': return <Saran />;
      case 'admin': 
        if (isAdminAuthenticated) {
            return <AdminDashboard setPage={navigate} onAdminLogout={handleAdminLogout} />;
        }
        navigate('home');
        return null;
      default: 
        navigate('home');
        return null;
    }
  }

  const isHomePage = path.split('/')[0] || 'home';
  const isChatPage = path.split('/')[0] === 'chat';

  return (
    <div className="min-h-screen flex flex-col">
      {!isChatPage && (
        <Header 
          page={path} 
          setPage={navigate} 
          onLogoClick={handleLogoClick}
          isAdminAuthenticated={isAdminAuthenticated}
          onAdminLogout={handleAdminLogout}
          onOpenDonationModal={() => setIsDonationModalOpen(true)}
        />
      )}
      
      <main className={`flex-grow ${isChatPage ? 'pt-0 pb-0' : 'pt-6 md:pt-28 pb-20 md:pb-0'}`}>
        {mainContent()}
      </main>

      {!isChatPage && <Footer setPage={navigate} page={path} onOpenDonationModal={() => setIsDonationModalOpen(true)} />}
      
      {!isChatPage && (
        <BottomNav 
          page={path} 
          setPage={navigate} 
          isAdminAuthenticated={isAdminAuthenticated}
          onAdminLogout={handleAdminLogout}
        />
      )}

      {/* Floating AI Chat Bot Trigger - Hidden on Home Page and Chat Page */}
      {path.split('/')[0] !== 'home' && !isChatPage && (
        <button
          onClick={openChat}
          className="fixed z-50 right-5 bottom-20 md:bottom-8 w-14 h-14 bg-[color:var(--accent1)] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group border border-white/20"
          aria-label="JagoBot AI - Tanya AI JAGO-HP"
        >
          <div className="relative">
            <ChatBubbleLeftEllipsisIcon className="w-7 h-7" />
          </div>
          <span className="absolute right-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            JagoBot AI
          </span>
        </button>
      )}

      {/* Modal version for desktop */}
      {!isChatPage && (
        <TanyaAI 
          isOpen={isChatModalOpen} 
          onClose={() => setIsChatModalOpen(false)} 
          openAdminLogin={openAdminLogin}
        />
      )}

      {showAdminLogin && (
        <AdminLoginModal 
            onClose={() => setShowAdminLogin(false)}
            onSubmit={handleAdminLogin}
        />
      )}

      {isDonationModalOpen && (
        <DonationModal 
            onClose={() => setIsDonationModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
