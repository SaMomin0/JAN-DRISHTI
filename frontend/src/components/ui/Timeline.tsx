'use client';

import React from 'react';
import { CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  date?: string;
  description?: string;
  status: 'completed' | 'active' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div className={`space-y-6 relative border-l-2 border-gray-800 ml-3 pl-6 text-xs ${className}`}>
      {items.map((item, idx) => {
        const isCompleted = item.status === 'completed';
        const isActive = item.status === 'active';

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isActive
                  ? 'bg-blue-500 border-blue-400 text-slate-950 animate-pulse'
                  : 'bg-gray-900 border-gray-700 text-gray-500'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              ) : isActive ? (
                <Clock className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              )}
            </div>

            {/* Content */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-gray-800/80 space-y-1 hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-center">
                <span
                  className={`font-semibold text-xs ${
                    isCompleted ? 'text-white' : isActive ? 'text-blue-400 font-bold' : 'text-gray-400'
                  }`}
                >
                  {item.title}
                </span>
                {item.date && (
                  <span className="text-[10px] text-gray-500 font-mono flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-500 mr-1" />
                    {item.date}
                  </span>
                )}
              </div>
              {item.description && <p className="text-[11px] text-gray-400 leading-relaxed">{item.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
