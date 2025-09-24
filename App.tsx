import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PhoneBattle from './components/PhoneBattle';
import SmartReview from './components/SmartReview';
import TanyaAI from './components/TanyaAI';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import InsightPublic from './components/InsightPublic';
import Footer from './components/Footer'; 
import Partnership from './components/Partnership';
import FAQ from './components/FAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import PhoneFinder from './components/PhoneFinder'; // Import baru
import ChatBubbleIcon from './components/icons/ChatBubbleIcon';

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1f] text-gray-200 overflow-x-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] opacity-50">
        </div>
      </div>
      
      <Header page={page} setPage={setPage} />
      
      {/* Main content wrapper that grows */}
      <main className="relative z-10 flex-grow flex">
        {page === 'home' && <Hero setPage={setPage} openChat={() => setIsChatOpen(true)} />}
        {page === 'battle' && <PhoneBattle />}
        {page === 'review' && <SmartReview />}
        {page === 'finder' && <PhoneFinder />} {/* Halaman baru ditambahkan */}
        {page === 'leaderboard' && <Leaderboard />}
        {page === 'insight' && <InsightPublic />}
        {page === 'about' && <About />}
        {page === 'partnership' && <Partnership />}
        {page === 'faq' && <FAQ />}
        {page === 'privacy' && <PrivacyPolicy />}
      </main>

      <Footer setPage={setPage} />

      {/* Tanya AI Widget */}
      <TanyaAI 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        isHomePage={page === 'home'}
      />

      {/* Floating Chat Bubble */}
      {page !== 'home' && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-green-500 text-white flex items-center justify-center
                     shadow-lg shadow-cyan-500/30 hover:scale-110 transition-all duration-300 animate-fade-in"
          aria-label="Buka Tanya AI"
        >
          <ChatBubbleIcon className="w-7 h-7" />
        </button>
      )}
    </div>
  );
};

export default App;