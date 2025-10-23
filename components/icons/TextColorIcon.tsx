import React from 'react';

const TextColorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.93 13.5h4.14L12 7.98z" />
        <path d="M20 22H4v-2h16v2zM12 2.98 4.87 20h14.26L12 2.98zM12 5.27l5.31 12.75H6.69L12 5.27z" />
    </svg>
);

export default TextColorIcon;