import React from 'react';

const ListOrderedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 17h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V3H7zM4 17h1v-5H3V9.5h2.5v.5H4v1h1.5V13H3v-1.5h1V17zM3 4h2.5v1H4v1h1.5v1H3V4zm1 2.5h1V5H3V6.5z" />
    </svg>
);

export default ListOrderedIcon;