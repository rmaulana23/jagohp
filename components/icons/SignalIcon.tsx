import React from 'react';

const SignalIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 20 16" fill="currentColor" className={className} aria-hidden="true">
        <rect x="0" y="10" width="3" height="6" rx="1" opacity="0.4"></rect>
        <rect x="5" y="7" width="3" height="9" rx="1" opacity="0.6"></rect>
        <rect x="10" y="4" width="3" height="12" rx="1" opacity="0.8"></rect>
        <rect x="15" y="0" width="3" height="16" rx="1"></rect>
    </svg>
);

export default SignalIcon;
