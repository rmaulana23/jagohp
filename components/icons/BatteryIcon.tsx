import React from 'react';

const BatteryIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 10.5h.75A2.25 2.25 0 0124 12.75v0A2.25 2.25 0 0121.75 15h-.75"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 9A2.25 2.25 0 001.5 11.25v1.5A2.25 2.25 0 003.75 15h15A2.25 2.25 0 0021 12.75v-1.5A2.25 2.25 0 0018.75 9h-15z"
    />
    <rect x="5" y="10.5" width="12" height="3" fill="currentColor" rx="1" />
  </svg>
);

export default BatteryIcon;
