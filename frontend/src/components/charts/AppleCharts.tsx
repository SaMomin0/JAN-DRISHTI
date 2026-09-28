'use client';

import React, { useState } from 'react';

// User specified secondary pastel palette
export const APPLE_PALETTE = {
  coral: '#FFADAD',   // Soft Coral / Red
  peach: '#FFD6A5',   // Soft Peach / Orange
  yellow: '#FDFFB6',  // Soft Butter / Yellow
  mint: '#CAFFBF',    // Soft Mint / Light Green
  sky: '#9BF6FF',     // Soft Sky / Cyan
  blue: '#A0C4FF',    // Soft Periwinkle / Blue
  purple: '#BDB2FF',  // Soft Lavender / Purple
  pink: '#FFC6FF',    // Soft Pink / Magenta
};

export const PASTEL_ARRAY = [
  '#A0C4FF', // Blue
  '#BDB2FF', // Purple
  '#FFC6FF', // Pink
  '#FFADAD', // Coral
  '#FFD6A5', // Peach
  '#FDFFB6', // Yellow
  '#CAFFBF', // Mint
  '#9BF6FF', // Sky
];

export interface ChartSegment {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
}

// 1. Apple Interactive Donut Chart
interface DonutChartProps {
  data: ChartSegment[];
  size?: number;
  thickness?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

export const AppleDonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 240,
  thickness = 32,
  centerTitle,
  centerSubtitle,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const radius = size / 2;
  const innerRadius = radius - thickness;
  const center = radius;

  let cumulativeAngle = -90; // Start at 12 o'clock

  const slices = data.map((seg, idx) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    const color = seg.color || PASTEL_ARRAY[idx % PASTEL_ARRAY.length];

    return { ...seg, d, color, percentage: Math.round((seg.value / total) * 100) };
  });

  const activeSegment = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.d}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth="2.5"
              className="transition-all duration-200 cursor-pointer hover:opacity-90"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: hoveredIdx === i ? 'scale(1.04)' : 'scale(1)',
                filter: hoveredIdx === i ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
          {activeSegment ? (
            <>
              <span className="text-xl font-bold font-mono text-[rgb(26,26,26)]">
                {activeSegment.percentage}%
              </span>
              <span className="text-[11px] font-medium text-[#6e6e73] truncate max-w-[110px]">
                {activeSegment.label}
              </span>
              {activeSegment.sublabel && (
                <span className="text-[10px] font-mono text-[#86868b]">
                  {activeSegment.sublabel}
                </span>
              )}
            </>
          ) : (
            <>
              {centerTitle && (
                <span className="text-2xl font-bold font-mono text-[rgb(26,26,26)] tracking-tight">
                  {centerTitle}
                </span>
              )}
              {centerSubtitle && (
                <span className="text-[11px] font-medium text-[#6e6e73]">
                  {centerSubtitle}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 text-xs w-full max-w-[210px]">
        {slices.map((s, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between gap-3 p-1.5 rounded-xl transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-[#f5f5f7]' : ''
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[rgb(26,26,26)] font-medium truncate">{s.label}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[#6e6e73] text-[11px]">
              <span>{s.value.toLocaleString()}</span>
              <span className="font-bold text-[rgb(26,26,26)]">({s.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Apple Classic Sliced Pie Chart
export const ApplePieChart: React.FC<{ data: ChartSegment[]; size?: number }> = ({
  data,
  size = 200,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const radius = size / 2;
  const center = radius;

  let cumulativeAngle = -90;

  const slices = data.map((seg, idx) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const color = seg.color || PASTEL_ARRAY[idx % PASTEL_ARRAY.length];

    return { ...seg, d, color, percentage: Math.round((seg.value / total) * 100) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <svg width={size} height={size} className="overflow-visible">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.d}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="transition-all duration-200 cursor-pointer hover:opacity-90"
            style={{
              transformOrigin: `${center}px ${center}px`,
              transform: hoveredIdx === i ? 'scale(1.05)' : 'scale(1)',
              filter: hoveredIdx === i ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))' : 'none',
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>

      <div className="space-y-1.5 text-xs w-full max-w-[210px]">
        {slices.map((s, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between gap-4 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-[#f5f5f7]' : ''
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[rgb(26,26,26)] font-medium truncate">{s.label}</span>
            </div>
            <span className="font-mono text-[#6e6e73] font-semibold">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Apple Polar Area / Rose Pie Chart (Distinct type of pie chart with equal angles but variable radiuses)
export const ApplePolarAreaChart: React.FC<{ data: ChartSegment[]; size?: number }> = ({
  data,
  size = 210,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const maxRadius = (size / 2) - 10;
  const center = size / 2;
  const count = data.length;
  const angleStep = 360 / count;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background concentric reference rings */}
        {[0.33, 0.66, 1].map((pct, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={maxRadius * pct}
            fill="none"
            stroke="#f0f0f3"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        ))}

        {data.map((seg, idx) => {
          const r = Math.max((seg.value / maxVal) * maxRadius, 15);
          const startAngle = idx * angleStep - 90;
          const endAngle = (idx + 1) * angleStep - 90;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = center + r * Math.cos(startRad);
          const y1 = center + r * Math.sin(startRad);
          const x2 = center + r * Math.cos(endRad);
          const y2 = center + r * Math.sin(endRad);

          const d = `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
          const color = seg.color || PASTEL_ARRAY[idx % PASTEL_ARRAY.length];

          return (
            <path
              key={idx}
              d={d}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-all duration-200 cursor-pointer hover:opacity-90"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: hoveredIdx === idx ? 'scale(1.06)' : 'scale(1)',
                filter: hoveredIdx === idx ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.16))' : 'none',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
      </svg>

      <div className="space-y-1.5 text-xs w-full max-w-[210px]">
        {data.map((s, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between gap-3 px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-[#f5f5f7]' : ''
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || PASTEL_ARRAY[idx % PASTEL_ARRAY.length] }} />
              <span className="text-[rgb(26,26,26)] font-medium truncate">{s.label}</span>
            </div>
            <span className="font-mono text-[#6e6e73] font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Apple Semi-Circle Speedometer / Arc Gauge
export const AppleSemiCircleGauge: React.FC<{
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
  max?: number;
}> = ({ value, label = 'Health Index', sublabel = 'Normalized Score', color = APPLE_PALETTE.mint, size = 200, max = 100 }) => {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = clamped / max;
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength * (1 - pct);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 25} className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke="#f0f0f3"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Value Arc */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Metric */}
        <div className="absolute inset-0 top-6 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-bold font-mono text-[rgb(26,26,26)] tracking-tight">
            {value.toFixed(1)}
          </span>
          <span className="text-[11px] font-semibold text-[rgb(26,26,26)] mt-0.5">{label}</span>
          <span className="text-[10px] text-[#86868b]">{sublabel}</span>
        </div>
      </div>
    </div>
  );
};

// 5. Apple Concentric Activity Progress Rings
export const AppleActivityRings: React.FC<{
  rings: { label: string; current: number; target: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}> = ({ rings, size = 180, strokeWidth = 14 }) => {
  const gap = 4;
  const center = size / 2;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <svg width={size} height={size}>
        {rings.map((ring, idx) => {
          const r = center - strokeWidth / 2 - idx * (strokeWidth + gap);
          const circumference = 2 * Math.PI * r;
          const pct = Math.min(Math.max(ring.current / ring.target, 0), 1);
          const offset = circumference * (1 - pct);

          return (
            <g key={idx}>
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#f0f0f3"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-700 ease-out"
              />
            </g>
          );
        })}
      </svg>

      <div className="space-y-2 text-xs">
        {rings.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
            <div>
              <div className="font-semibold text-[rgb(26,26,26)]">{r.label}</div>
              <div className="text-[11px] font-mono text-[#6e6e73]">
                {r.current} / {r.target} ({Math.round((r.current / r.target) * 100)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Apple Rounded Pill Bar Chart (Grouped / Comparative)
export const AppleBarChart: React.FC<{
  data: { label: string; value: number; secondaryValue?: number; color?: string; secondaryColor?: string }[];
  height?: number;
  showSecondaryLegend?: boolean;
  secondaryLegendText?: string;
}> = ({ data, height = 200 }) => {
  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0))) * 1.15 || 1;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-end justify-between gap-3 pt-6 pb-2" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * (height - 30);
          const secHeight = d.secondaryValue !== undefined ? (d.secondaryValue / maxVal) * (height - 30) : 0;
          const color = d.color || APPLE_PALETTE.blue;
          const secColor = d.secondaryColor || APPLE_PALETTE.mint;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded-lg bg-[rgb(26,26,26)] text-white text-[10px] font-mono font-medium whitespace-nowrap pointer-events-none z-10 shadow-md">
                ₹{d.value.toLocaleString()}k Cr
              </div>

              <div className="flex items-end gap-1 w-full justify-center">
                <div
                  className="w-full max-w-[18px] rounded-full transition-all duration-300 group-hover:opacity-85"
                  style={{
                    height: `${Math.max(barHeight, 6)}px`,
                    backgroundColor: color,
                  }}
                />
                {d.secondaryValue !== undefined && (
                  <div
                    className="w-full max-w-[18px] rounded-full transition-all duration-300 group-hover:opacity-85"
                    style={{
                      height: `${Math.max(secHeight, 6)}px`,
                      backgroundColor: secColor,
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-[#86868b] truncate max-w-[55px] text-center">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 7. Apple Stacked Multi-Segment Progress Bar
export const AppleStackedBarChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ segments, height = 16 }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="space-y-3 w-full">
      <div 
        className="w-full rounded-full overflow-hidden flex bg-[#f0f0f3] p-0.5 gap-0.5 border border-black/5"
        style={{ height }}
      >
        {segments.map((seg, idx) => {
          const pct = (seg.value / total) * 100;
          return (
            <div
              key={idx}
              className="h-full rounded-full transition-all duration-300 hover:opacity-90"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.value} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[#6e6e73] font-medium">{seg.label}:</span>
            <span className="font-mono font-semibold text-[rgb(26,26,26)]">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 8. Apple Smooth Area Spline Chart (Supports Multi-Series and Single-Series)
export const AppleAreaSplineChart: React.FC<{
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  yAxisLabel?: string;
}> = ({ categories, series, height = 240, yAxisLabel = '₹k Cr' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 600;
  const paddingX = 40;
  const paddingY = 30;

  const allValues = series.flatMap(s => s.values);
  const maxVal = Math.max(...allValues) * 1.15 || 1;
  const minVal = 0;

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={`splineGrad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* Reference grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            return (
              <g key={idx}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f0f0f3" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 3} fill="#86868b" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="end">
                  {Math.round(maxVal * pct)}
                </text>
              </g>
            );
          })}

          {/* Render Spline Series */}
          {series.map((s, sIdx) => {
            const points = s.values.map((v, i) => {
              const x = paddingX + (i / (categories.length - 1)) * (width - 2 * paddingX);
              const y = height - paddingY - ((v - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
              return { x, y, v };
            });

            const pathD = points.reduce((acc, pt, i, arr) => {
              if (i === 0) return `M ${pt.x},${pt.y}`;
              const prev = arr[i - 1];
              const cx1 = prev.x + (pt.x - prev.x) / 2;
              const cy1 = prev.y;
              const cx2 = prev.x + (pt.x - prev.x) / 2;
              const cy2 = pt.y;
              return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
            }, '');

            const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

            return (
              <g key={sIdx}>
                <path d={areaD} fill={`url(#splineGrad_${sIdx})`} />
                <path d={pathD} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
                {points.map((p, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIdx === pIdx ? 5.5 : 3.5}
                    fill="#ffffff"
                    stroke={s.color}
                    strokeWidth="2"
                    className="transition-all cursor-pointer"
                  />
                ))}
              </g>
            );
          })}

          {/* Category X Axis Labels */}
          {categories.map((cat, idx) => {
            const x = paddingX + (idx / (categories.length - 1)) * (width - 2 * paddingX);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                fill="#86868b"
                fontSize="10"
                fontFamily="IBM Plex Mono"
                textAnchor="middle"
                className="cursor-pointer hover:font-bold"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {cat}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Series Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-xs pt-1 border-t border-black/5">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-semibold text-[rgb(26,26,26)]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 9. Apple Multivariate Scatter Plot (Sanction Outlay vs. Risk Index vs. Volume)
export const AppleMultivariateScatterChart: React.FC<{
  points: { label: string; x: number; y: number; sizeVal: number; color: string }[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}> = ({ points, xLabel = 'Sanction Allocation (₹ Cr)', yLabel = 'Composite Risk Index (0-100)', height = 220 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const width = 600;
  const paddingX = 50;
  const paddingY = 30;

  const maxX = Math.max(...points.map(p => p.x)) * 1.1 || 1;
  const maxY = 100;

  return (
    <div className="w-full space-y-2 relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid reference */}
        {[25, 50, 75, 100].map(val => {
          const y = height - paddingY - (val / maxY) * (height - 2 * paddingY);
          return (
            <g key={val}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f0f0f3" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} fill="#86868b" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* Data Bubbles */}
        {points.map((pt, idx) => {
          const cx = paddingX + (pt.x / maxX) * (width - 2 * paddingX);
          const cy = height - paddingY - (pt.y / maxY) * (height - 2 * paddingY);
          const r = Math.min(Math.max((pt.sizeVal / 1000) * 1.5, 6), 18);

          return (
            <g
              key={idx}
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={pt.color}
                fillOpacity="0.75"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all hover:scale-125"
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
              <text
                x={cx}
                y={cy + 3}
                fill="#1a1a1a"
                fontSize="8"
                fontFamily="IBM Plex Mono"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {pt.label.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Axis titles */}
      <div className="flex justify-between items-center text-[11px] font-mono text-[#86868b] px-4 pt-1 border-t border-black/5">
        <span>0</span>
        <span className="font-semibold text-[rgb(26,26,26)]">{xLabel}</span>
        <span>₹{Math.round(maxX)} Cr</span>
      </div>

      {hoveredPoint && (
        <div className="absolute top-2 right-4 p-3 rounded-2xl bg-white border border-black/10 shadow-xl text-xs space-y-0.5 font-mono z-20">
          <div className="font-bold text-[rgb(26,26,26)]">{hoveredPoint.label}</div>
          <div className="text-[#6e6e73]">Sanction: ₹{hoveredPoint.x.toLocaleString()} Cr</div>
          <div className="text-[rgb(26,26,26)] font-bold">Risk Index: {hoveredPoint.y}/100</div>
          <div className="text-[#86868b]">Works Monitored: {hoveredPoint.sizeVal.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
};
