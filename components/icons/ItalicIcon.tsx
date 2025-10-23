import React from 'react';

const ItalicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 6v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V6z" />
    </svg>
);

export default ItalicIcon;