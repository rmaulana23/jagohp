import React from 'react';

const TokopediaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path
      d="M211.53 211.53a4 4 0 0 1-5.66 0l-45.16-45.17a4 4 0 0 1 0-5.65l3.06-3.07a4 4 0 0 1 5.66 0l45.16 45.17a4 4 0 0 1 0 5.65ZM184 72a60 60 0 1 0-79.16 57.87 4 4 0 0 0 3.82 2.13h10.68a4 4 0 0 0 3.82-2.13A36 36 0 1 1 148 72a4 4 0 0 0 0-8 44 44 0 1 0-44 44 4 4 0 0 0 4 4h4a4 4 0 0 0 0-8h-4a28 28 0 1 1 28-28 4 4 0 0 0 4-4 60 60 0 0 0-40-56Z"
    />
  </svg>
);

export default TokopediaIcon;
