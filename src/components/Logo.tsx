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
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        {/* Mask that defines the shape of our slim, elegant crescent moon */}
        <mask id="crt-moon-mask">
          <path 
            d="M12 3 A 8 8 0 0 0 20 11 A 9 9 0 1 1 12 3 Z" 
            fill="#FFFFFF" 
          />
        </mask>
        
        {/* Color Gradient matching our green visual identity */}
        <linearGradient id="logo-moon-grad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent-primary, #10B981)" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Tiled CRT horizontal scanlines masked inside the moon shape */}
      <g mask="url(#crt-moon-mask)">
        <rect x="2" y="3.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="5.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="7.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="9.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="11.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="13.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="15.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="17.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
        <rect x="2" y="19.2" width="20" height="1.4" fill="url(#logo-moon-grad)" />
      </g>

      {/* Little Premium Stars */}
      <path d="M19 4.5l.3.6.6.3-.6.3-.3.6-.3-.6-.6-.3.6-.3z" fill="#34D399" />
      <path d="M14.5 2l.2.4.4.2-.4.2-.2.4-.2-.4-.4-.2.4-.2z" fill="#6EE7B7" />
      <path d="M21.5 8l.2.4.4.2-.4.2-.2.4-.2-.4-.4-.2.4-.2z" fill="#059669" />
    </svg>
  );
}
