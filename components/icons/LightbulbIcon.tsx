import React from 'react';

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
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
            d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c-1.421-.492-2.682-1.233-3.654-2.11M12 6.01a6.01 6.01 0 0 1 4.5 0m-4.5 0a6.01 6.01 0 0 0-4.5 0M12 3a9 9 0 0 1 9 9c0 3.86-2.22 7.17-5.36 8.654m-1.896-.062a12.025 12.025 0 0 1-3.822 0" 
        />
    </svg>
);

export default LightbulbIcon;
