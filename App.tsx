import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // State to hold full results for detail pages
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [latestReviewResult, setLatestReviewResult] = useState<ReviewResult | null>(null);

  const navigateToFullReview = (result: ReviewResult) => {
    setReviewResult(result);
    setPage('review');
  };

  const navigateToFullBattle = (result: BattleResult) => {
    setBattleResult(result);
    setPage('battle');
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
                            setLatestReviewResult={setLatestReviewResult}
                           />;
      case 'battle': return <PhoneBattle initialResult={battleResult} />;
      case 'review': return <SmartReview initialResult={reviewResult} />;
      case 'finder': return <PhoneFinder />;
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
                        setLatestReviewResult={setLatestReviewResult}
                       />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header page={page} setPage={setPage} />
      
      <main className="flex-grow pt-24">
        {mainContent()}
      </main>

      <Footer setPage={setPage} />

      <TanyaAI 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
      />
    </div>
  );
};

export default App;