import React, { FC } from 'react';

interface StarIconProps {
  variant?: 'full' | 'half' | 'empty';
  className?: string;
}

const StarIcon: FC<StarIconProps> = ({ variant = 'full', className = 'w-5 h-5' }) => {
  const baseClasses = "text-yellow-400";
  const emptyClasses = "text-slate-700";
  
  const starPath = "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z";

  if (variant === 'empty') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`${className} ${emptyClasses}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={starPath} />
      </svg>
    );
  }

  if (variant === 'half') {
    return (
      <div className={`relative ${className}`}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-full h-full ${emptyClasses}`}
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d={starPath} />
        </svg>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-full h-full ${baseClasses} absolute top-0 left-0`}
            style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' }}
            aria-hidden="true"
        >
            <path d={starPath} />
        </svg>
      </div>
    );
  }

  // full
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${className} ${baseClasses}`}
    >
      <path d={starPath} />
    </svg>
  );
};

export default StarIcon;