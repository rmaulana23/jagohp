import React from 'react';

interface EcommerceButtonsProps {
  phoneName: string;
  isCompact?: boolean;
}

const EcommerceButtons: React.FC<EcommerceButtonsProps> = ({ phoneName, isCompact = false }) => {
  if (!phoneName) return null;

  const tokopediaUrl = `https://www.tokopedia.com/search?q=${encodeURIComponent(phoneName)}`;
  const shopeeUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(phoneName)}`;

  if (isCompact) {
    return (
      <div className="mt-4 flex gap-2">
        <a
          href={tokopediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Beli ${phoneName} di Tokopedia`}
          className="flex-1 flex items-center justify-center bg-[#03AC0E]/10 text-[#008C0A] border border-[#03AC0E]/30 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#03AC0E]/20 transition-colors"
        >
          <span>Tokopedia</span>
        </a>
        <a
          href={shopeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Beli ${phoneName} di Shopee`}
          className="flex-1 flex items-center justify-center bg-[#FF5722]/10 text-[#EE4D2D] border border-[#FF5722]/30 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#FF5722]/20 transition-colors"
        >
          <span>Shopee</span>
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h4 className="text-center font-semibold text-slate-700 mb-3 text-sm">
        Beli Sekarang di:
      </h4>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={tokopediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center bg-[#03AC0E]/10 text-[#008C0A] border border-[#03AC0E]/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#03AC0E]/20 transition-colors"
        >
          <span>Tokopedia</span>
        </a>
        <a
          href={shopeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center bg-[#FF5722]/10 text-[#EE4D2D] border border-[#FF5722]/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#FF5722]/20 transition-colors"
        >
          <span>Shopee</span>
        </a>
      </div>
    </div>
  );
};

export default EcommerceButtons;