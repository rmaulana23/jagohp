import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PhoneBattle, { BattleResult } from './components/PhoneBattle';
import SmartReview, { ReviewResult } from './components/SmartReview';
import TanyaAI from './components/TanyaAI';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import Footer from './components/Footer';
import Partnership from './components/Partnership';
import FAQ from './components/FAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import PhoneFinder from './components/PhoneFinder';
import Saran from './components/Saran';
import BottomNav from './components/BottomNav';
import Blog from './components/Blog';
import AdminLoginModal from './components/AdminLoginModal';
import AdminDashboard from './components/AdminDashboard';
import BlogPost from './components/BlogPost';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.hash.substring(1) || 'home');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // State to hold full results for detail pages
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewResult[]>([]);
  const [reviewQuery, setReviewQuery] = useState('');

  // Admin state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Blog post state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

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
  
  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('reviewHistory');
      if (storedHistory) {
        setReviewHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse review history from localStorage", error);
      localStorage.removeItem('reviewHistory');
    }
  }, []);

  const handleAddToReviewHistory = (result: ReviewResult) => {
    setReviewHistory(prevHistory => {
      // Remove if already exists to move it to the front
      const filteredHistory = prevHistory.filter(item => item.phoneName.toLowerCase() !== result.phoneName.toLowerCase());
      // Add to the beginning and limit to 5
      const newHistory = [result, ...filteredHistory].slice(0, 5);
      try {
        localStorage.setItem('reviewHistory', JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save review history to localStorage", error);
      }
      return newHistory;
    });
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
    navigate('review');
  };

  const navigateToFullBattle = (result: BattleResult) => {
    setBattleResult(result);
    navigate('battle');
  };

  const navigateToReviewWithQuery = (phoneName: string) => {
    setReviewResult(null);
    setReviewQuery(phoneName);
    navigate('review');
  };
  
  const clearGlobalReviewResult = () => {
    setReviewResult(null);
  };

  const navigateToBlogPost = (post: any) => {
    setSelectedPost(post);
    navigate(`blog/${post.slug}`);
  };
  
  const openChat = () => setIsChatModalOpen(true);

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
                            reviewHistory={reviewHistory}
                            onAddToHistory={handleAddToReviewHistory}
                            navigateToReviewWithQuery={navigateToReviewWithQuery}
                            navigateToBlogPost={navigateToBlogPost}
                           />;
      case 'battle': return <PhoneBattle initialResult={battleResult} />;
      case 'review': return <SmartReview initialResult={reviewResult} initialQuery={reviewQuery} clearGlobalResult={clearGlobalReviewResult} reviewHistory={reviewHistory} onAddToHistory={handleAddToReviewHistory} />;
      case 'finder': return <PhoneFinder />;
      case 'blog': 
        if (param) {
          return <BlogPost 
                    post={selectedPost} 
                    slug={param} 
                    setPage={navigate} 
                    setSelectedPost={setSelectedPost} 
                    isAdminAuthenticated={isAdminAuthenticated}
                    reviewHistory={reviewHistory}
                    onAddToHistory={handleAddToReviewHistory}
                    navigateToFullReview={navigateToFullReview}
                 />;
        }
        return <Blog setPage={navigate} navigateToBlogPost={navigateToBlogPost} />;
      case 'leaderboard': return <Leaderboard />;
      case 'about': return <About />;
      case 'partnership': return <Partnership />;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        page={path} 
        setPage={navigate} 
        onLogoClick={handleLogoClick}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />
      
      <main className="flex-grow pt-6 md:pt-28 pb-20 md:pb-0">
        {mainContent()}
      </main>

      <Footer setPage={navigate} page={path} />
      
      <BottomNav 
        page={path} 
        setPage={navigate} 
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      <TanyaAI 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
        openAdminLogin={openAdminLogin}
      />

      {showAdminLogin && (
        <AdminLoginModal 
            onClose={() => setShowAdminLogin(false)}
            onSubmit={handleAdminLogin}
        />
      )}
    </div>
  );
};

export default App;
