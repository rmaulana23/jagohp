import React from 'react';

const ListUnorderedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 17h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V3H7zM4 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-6c.83 0 1.5.67 1.5 1.5S4.83 13.5 4 13.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM4 4.5c.83 0 1.5.67 1.5 1.5S4.83 7.5 4 7.5 2.5 6.83 2.5 6s.67-1.5 1.5-1.5z" />
    </svg>
);

export default ListUnorderedIcon;