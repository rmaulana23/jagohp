import React from 'react';

const BatteryIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18.75 9H5.25A2.25 2.25 0 003 11.25v1.5A2.25 2.25 0 005.25 15h13.5A2.25 2.25 0 0021 12.75v-1.5A2.25 2.25 0 0018.75 9zM22.5 10.5a.75.75 0 000 1.5h.75a.75.75 0 000-1.5h-.75z"
      clipRule="evenodd"
    />
  </svg>
);

export default BatteryIcon;
