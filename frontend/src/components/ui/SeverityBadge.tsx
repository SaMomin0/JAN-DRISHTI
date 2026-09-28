'use client';

import React from 'react';

interface SeverityBadgeProps {
  level: string;
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level, className = '', showDot = true }) => {
  const norm = (level || '').toUpperCase();

  let isCritical = norm.includes('CRITICAL');
  let isHigh = norm.includes('HIGH') && !isCritical;
  let isMedium = norm.includes('MED');
  let isLow = norm.includes('LOW') || norm.includes('CLEAR') || norm.includes('VERIFIED');

  let bgColor = isCritical
    ? '#FFADAD' // Coral
    : isHigh
    ? '#FFD6A5' // Peach
    : isMedium
    ? '#FDFFB6' // Yellow
    : isLow
    ? '#CAFFBF' // Mint
    : '#A0C4FF'; // Sky / Periwinkle

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold text-[rgb(26,26,26)] border border-black/10 transition-all ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[rgb(26,26,26)] opacity-70" />}
      <span>{level}</span>
    </span>
  );
};
