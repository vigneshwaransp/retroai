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
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className} select-none`}
    >
      <defs>
        {/* Glow Filter */}
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Gradients for 3D Faces */}
        <linearGradient id="face-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="face-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="face-top" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
      </defs>

      {/* Outer 3D Hexagon/Isometric Cube structure */}
      <g filter="url(#logo-glow)">
        {/* Left isometric face */}
        <path 
          d="M 60 20 L 25 40 L 25 80 L 60 60 Z" 
          fill="url(#face-left)" 
          opacity="0.95"
        />
        {/* Right isometric face */}
        <path 
          d="M 60 60 L 95 80 L 95 40 L 60 20 Z" 
          fill="url(#face-right)" 
          opacity="0.85"
        />
        {/* Top isometric face */}
        <path 
          d="M 60 20 L 95 40 L 60 60 L 25 40 Z" 
          fill="url(#face-top)" 
        />
        
        {/* Inner floating cybernetic core node */}
        <circle cx="60" cy="50" r="10" fill="#ffffff" opacity="0.9" />
        
        {/* Connected isometric links */}
        <path 
          d="M 60 60 L 60 100 L 25 80 M 60 100 L 95 80" 
          stroke="#ef4444" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
