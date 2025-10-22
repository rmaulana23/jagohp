import React from 'react';

const TargetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-2.474m0 0L3.182 15.042a.75.75 0 0 1 .571-1.256l5.518-.442a.75.75 0 0 0 .562-.328l2.225-2.511a.75.75 0 0 1 1.342 0l2.225 2.511a.75.75 0 0 0 .562.328l5.518.442a.75.75 0 0 1 .571 1.256l-5.518 4.42a.75.75 0 0 0-.569 1.175l2.474 5.518a.75.75 0 0 1-1.256.571l-4.42-5.518a.75.75 0 0 0-1.175 0Z" />
    </svg>
);

export default TargetIcon;
