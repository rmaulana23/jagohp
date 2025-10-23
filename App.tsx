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
  const [page, setPage] = useState('home');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // State to hold full results for detail pages
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [latestReviewResult, setLatestReviewResult] = useState<ReviewResult | null>(null);
  const [reviewQuery, setReviewQuery] = useState('');

  // Admin state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Blog post state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    try {
      const storedReview = localStorage.getItem('latestQuickReview');
      if (storedReview) {
        setLatestReviewResult(JSON.parse(storedReview));
      }
    } catch (error) {
      console.error("Failed to parse latest review from localStorage", error);
      localStorage.removeItem('latestQuickReview');
    }
  }, []);

  const handleSetLatestReviewResult = (result: ReviewResult | null) => {
    setLatestReviewResult(result);
    if (result) {
      try {
        localStorage.setItem('latestQuickReview', JSON.stringify(result));
      } catch (error) {
        console.error("Failed to save latest review to localStorage", error);
      }
    } else {
      localStorage.removeItem('latestQuickReview');
    }
  };

  const handleLogoClick = () => {
    if (isAdminAuthenticated) {
        setPage('admin');
    } else {
        setPage('home');
    }
  };
  
  const openAdminLogin = () => {
    setIsChatModalOpen(false);
    setShowAdminLogin(true);
  };

  const handleAdminLogin = (code: string) => {
      if (code === '221212') {
          setIsAdminAuthenticated(true);
          setShowAdminLogin(false);
          setPage('admin');
      } else {
          alert('Kode akses salah!');
      }
  };
  
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setPage('home');
  };

  const navigateToFullReview = (result: ReviewResult) => {
    setReviewResult(result);
    setReviewQuery('');
    setPage('review');
  };

  const navigateToFullBattle = (result: BattleResult) => {
    setBattleResult(result);
    setPage('battle');
  };

  const navigateToReviewWithQuery = (phoneName: string) => {
    setReviewResult(null);
    setReviewQuery(phoneName);
    setPage('review');
  };

  const navigateToBlogPost = (post: any) => {
    setSelectedPost(post);
    setPage('blog-post');
  };
  
  const openChat = () => setIsChatModalOpen(true);

  const mainContent = () => {
    switch (page) {
      case 'home': return <Hero 
                            setPage={setPage} 
                            openChat={openChat} 
                            navigateToFullReview={navigateToFullReview} 
                            navigateToFullBattle={navigateToFullBattle} 
                            latestReviewResult={latestReviewResult}
                            setLatestReviewResult={handleSetLatestReviewResult}
                            navigateToReviewWithQuery={navigateToReviewWithQuery}
                           />;
      case 'battle': return <PhoneBattle initialResult={battleResult} />;
      case 'review': return <SmartReview initialResult={reviewResult} initialQuery={reviewQuery} />;
      case 'finder': return <PhoneFinder />;
      case 'blog': return <Blog setPage={setPage} navigateToBlogPost={navigateToBlogPost} />;
      case 'blog-post': return <BlogPost post={selectedPost} setPage={setPage} />;
      case 'leaderboard': return <Leaderboard />;
      case 'about': return <About />;
      case 'partnership': return <Partnership />;
      case 'faq': return <FAQ />;
      case 'privacy': return <PrivacyPolicy />;
      case 'saran': return <Saran />;
      case 'admin': return isAdminAuthenticated ? <AdminDashboard setPage={setPage} onAdminLogout={handleAdminLogout} /> : <Hero setPage={setPage} openChat={openChat} navigateToFullReview={navigateToFullReview} navigateToFullBattle={navigateToFullBattle} latestReviewResult={latestReviewResult} setLatestReviewResult={handleSetLatestReviewResult} navigateToReviewWithQuery={navigateToReviewWithQuery} />;
      default: return <Hero 
                        setPage={setPage} 
                        openChat={openChat} 
                        navigateToFullReview={navigateToFullReview} 
                        navigateToFullBattle={navigateToFullBattle} 
                        latestReviewResult={latestReviewResult}
                        setLatestReviewResult={handleSetLatestReviewResult}
                        navigateToReviewWithQuery={navigateToReviewWithQuery}
                       />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        page={page} 
        setPage={setPage} 
        onLogoClick={handleLogoClick}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />
      
      <main className="flex-grow pt-6 md:pt-28 pb-20 md:pb-0">
        {mainContent()}
      </main>

      <Footer setPage={setPage} page={page} />
      
      <BottomNav page={page} setPage={setPage} />

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