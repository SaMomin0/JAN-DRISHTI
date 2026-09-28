'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: 'subtle' | 'highlight' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  ...props
}) => {
  const glowStyles = {
    subtle: 'border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]',
    highlight: 'border-black/15 shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
    none: 'border-black/5 hover:border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]',
  };

  return (
    <div
      className={`relative rounded-3xl border bg-white p-6 md:p-8 backdrop-blur-xl transition-all duration-200 text-[rgb(26,26,26)] ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
