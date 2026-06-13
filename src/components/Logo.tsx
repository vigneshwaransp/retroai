import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className} select-none`}
    >
      {/* Very small inverted sharp yellow triangle logo */}
      <path 
        d="M 36 38 L 64 38 L 50 62 Z" 
        stroke="#FBBF24" 
        strokeWidth="11" 
        strokeLinecap="square" 
        strokeLinejoin="miter" 
        fill="none" 
      />
    </svg>
  );
}
