import React from 'react';

const FontSizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.88 15.5h4.24l1.83-4.5H8.05l1.83 4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.19 13.52-2.2-5.48h-4L7.81 15.52l-1.93-.76 4.39-10.74h1.45l4.39 10.74-1.92.76z" />
    </svg>
);

export default FontSizeIcon;