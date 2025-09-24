import React, { FC } from 'react';

const BannerAd: FC = () => {
  return (
    <div 
      className="w-full max-w-[970px] h-[90px] mx-auto my-8 bg-gray-800/30 border border-cyan-400/20 rounded-lg flex items-center justify-center"
      aria-label="Advertisement"
      role="complementary"
    >
      <span className="text-gray-500 font-semibold text-sm tracking-widest">RUANG IKLAN (970x90)</span>
    </div>
  );
};

export default BannerAd;
