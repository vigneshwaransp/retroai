'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export default function Tilt3D({ children, className = '', glowColor = 'rgba(239, 68, 68, 0.15)' }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for tilt angles
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to avoid jumpy rotations
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { damping: 25, stiffness: 200 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { damping: 25, stiffness: 200 });

  // Light reflection/glare effect coordinates
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [showGlare, setShowGlare] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Relative cursor position normalized between -0.5 and 0.5
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;

    x.set(relativeX);
    y.set(relativeY);

    // Update glare coordinates
    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;
    setGlarePosition({ x: glareX, y: glareY });
  };

  const handleMouseEnter = () => {
    setShowGlare(true);
  };

  const handleMouseLeave = () => {
    setShowGlare(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-[1000px] w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={`relative rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-xl transition-shadow duration-300 ${className}`}
        whileHover={{
          boxShadow: `0 10px 30px -10px ${glowColor}, 0 1px 1px 0 rgba(239, 68, 68, 0.1) inset`,
        }}
      >
        {/* Glowing glass glare effect overlay */}
        {showGlare && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 180px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.08), transparent 80%)`,
            }}
          />
        )}

        {/* 3D Depth Card Content Wrapper */}
        <div style={{ transform: 'translateZ(20px)' }} className="h-full w-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
