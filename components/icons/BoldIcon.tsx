import React from 'react';

const BoldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`font-bold text-base ${className}`} style={{fontFamily: 'serif', lineHeight: 1}}>
        B
    </span>
);

export default BoldIcon;