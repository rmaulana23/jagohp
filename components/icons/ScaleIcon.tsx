
import React from 'react';

const ScaleIcon: React.FC<{ className?: string }> = ({ className }) => (
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
            d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v1.666c0 .414-.168.79-.44 1.062a4.006 4.006 0 0 1-5.714 0c-.272-.271-.44-.648-.44-1.062V4.97m-3.75 0c.99.203 1.99.377 3 .52m-3-.52V6.636c0 .414.168.79.44 1.062.272.272.648.44 1.062.44s.79-.168 1.062-.44c.272-.272.44-.648.44-1.062V4.97M3.75 4.97c.99.203 1.99.377 3 .52m-3-.52V6.636c0 .414.168.79.44 1.062.272.272.648.44 1.062.44s.79-.168 1.062-.44c.272-.272.44-.648.44-1.062V4.97" 
        />
    </svg>
);

export default ScaleIcon;
