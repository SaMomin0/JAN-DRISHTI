'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  progressPct?: number;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progressPct,
  accentColor = '#BDB2FF', // Default soft pastel
}) => {
  return (
    <SpotlightCard className="flex flex-col justify-between space-y-4">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#6e6e73]">{title}</span>
        <div
          className="p-2.5 rounded-2xl border border-black/5 text-[rgb(26,26,26)] shadow-xs transition-transform hover:scale-105"
          style={{ backgroundColor: accentColor ? `${accentColor}40` : '#f5f5f7' }}
        >
          <Icon className="w-4 h-4 text-[rgb(26,26,26)]" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-[rgb(26,26,26)] tracking-tight font-sans tabular-nums">{value}</div>
        <div className="flex items-center justify-between text-xs pt-0.5">
          {subtitle && <span className="text-[#86868b] text-xs font-normal">{subtitle}</span>}
          {trend && (
            <span className="font-mono font-semibold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide inline-flex items-center gap-1.5 border border-black/5 bg-[#f5f5f7] text-[rgb(26,26,26)]">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: trend.positive ? '#CAFFBF' : '#FFADAD' }}
              />
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {progressPct !== undefined && (
        <div className="space-y-1 pt-1">
          <div className="w-full bg-[#f0f0f3] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(Math.max(progressPct, 0), 100)}%`,
                backgroundColor: accentColor || 'rgb(26,26,26)',
              }}
            />
          </div>
        </div>
      )}
    </SpotlightCard>
  );
};
