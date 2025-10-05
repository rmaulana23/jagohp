import React from 'react';

const ShopeeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M13.682 4.378c.322-.44.98-.44 1.302 0l4.318 5.922a.8.8 0 0 1-.65 1.25H5.35a.8.8 0 0 1-.651-1.25l4.318-5.922h4.665zM12 13.5c-4.43 0-8 1.933-8 4.318C4 20.2 7.57 22 12 22s8-1.799 8-4.182c0-2.385-3.57-4.318-8-4.318zm-5.32 3.194c.548 0 .992.34.992.76c0 .418-.444.759-.991.759c-.548 0-.992-.34-.992-.76c0-.418.444-.758.991-.758zm10.64 0c.548 0 .992.34.992.76c0 .418-.444.759-.991.759c-.548 0-.992-.34-.992-.76c0-.418.444-.758.991-.758z" />
    </svg>
);

export default ShopeeIcon;
