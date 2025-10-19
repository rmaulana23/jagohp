import React, { useState, useEffect } from 'react';
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
import JagoCardArena from './components/JagoCardArena';

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // State to hold full results for detail pages
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [latestReviewResult, setLatestReviewResult] = useState<ReviewResult | null>(null);
  const [reviewQuery, setReviewQuery] = useState('');

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

  const navigateToFullReview = (result: ReviewResult) => {
    setReviewResult(result);
    setReviewQuery(''); // Clear query when navigating with full data
    setPage('review');
  };

  const navigateToFullBattle = (result: BattleResult) => {
    setBattleResult(result);
    setPage('battle');
  };

  const navigateToReviewWithQuery = (phoneName: string) => {
    setReviewResult(null); // Clear full result data
    setReviewQuery(phoneName); // Set the query string
    setPage('review');
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
      case 'jago-card-arena': return <JagoCardArena />;
      case 'leaderboard': return <Leaderboard />;
      case 'about': return <About />;
      case 'partnership': return <Partnership />;
      case 'faq': return <FAQ />;
      case 'privacy': return <PrivacyPolicy />;
      case 'saran': return <Saran />;
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
    <div className={`min-h-screen flex flex-col ${page === 'jago-card-arena' ? 'bg-[color:var(--accent1)]' : ''}`}>
      <Header page={page} setPage={setPage} />
      
      <main className="flex-grow pt-24">
        {mainContent()}
      </main>

      <Footer setPage={setPage} page={page} />

      <TanyaAI 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
      />
    </div>
  );
};

export default App;