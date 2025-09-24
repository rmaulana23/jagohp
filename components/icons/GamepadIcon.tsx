import React from 'react';

const GamepadIcon: React.FC<{ className?: string }> = ({ className }) => (
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
            d="M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01M8.25 7.5h7.5a2.25 2.25 0 0 1 2.25 2.25v3.75a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-3.75a2.25 2.25 0 0 1 2.25-2.25Z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3 13.5a7.5 7.5 0 1 0 15 0 7.5 7.5 0 0 0-15 0Zm10.5-1.5h-3.75V9" 
        />
    </svg>
);

export default GamepadIcon;
