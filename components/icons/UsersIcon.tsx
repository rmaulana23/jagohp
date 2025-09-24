import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.966c.59-1.3 1.58-2.347 2.754-3.042a9.094 9.094 0 0 1 4.26-1.053m-5.89-1.426a5.25 5.25 0 0 1 7.424 0M15 15.75a3 3 0 0 1-6 0m6 0a9.094 9.094 0 0 0-1.254-.83m-4.04-1.42a5.25 5.25 0 0 1 7.424 0m-7.424 0a5.25 5.25 0 0 0-7.424 0M3 15.75a3 3 0 0 1 6 0m0 0a9.094 9.094 0 0 0 1.254-.83m4.04-1.42a5.25 5.25 0 0 0-7.424 0" 
        />
    </svg>
);

export default UsersIcon;
