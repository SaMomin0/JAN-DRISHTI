'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  selectFilters?: {
    id: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: FilterOption[];
  }[];
  onReset?: () => void;
  onApply?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  selectFilters = [],
  onReset,
  onApply,
  className = '',
}) => {
  return (
    <div className={`bg-[#0a0a0a]/90 border border-white/10 border-t-white/20 p-5 rounded-3xl space-y-3 backdrop-blur-2xl ring-1 ring-inset ring-white/5 shadow-2xl ${className}`}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-900/90 text-white placeholder-neutral-500 text-xs pl-11 pr-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-white/40 transition-all font-sans ring-1 ring-inset ring-white/5"
          />
        </div>

        {/* Dropdown Select Filters */}
        {selectFilters.map((sf) => (
          <div key={sf.id} className="min-w-[170px]">
            <select
              value={sf.value}
              onChange={(e) => sf.onChange(e.target.value)}
              className="w-full bg-neutral-900/90 text-neutral-200 text-xs px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-white/40 transition-all cursor-pointer font-sans ring-1 ring-inset ring-white/5"
            >
              <option value="" className="bg-[#0a0a0a] text-neutral-400">{sf.label}</option>
              {sf.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0a0a0a] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white text-xs rounded-full font-medium flex items-center space-x-1.5 border border-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="px-5 py-2 bg-white text-black hover:bg-neutral-200 text-xs rounded-full font-bold flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Filter className="w-3.5 h-3.5 text-black" />
              <span>Apply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
