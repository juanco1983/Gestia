import React from 'react';

interface CircularProgressProps {
  value: number;
  total: number;
  color?: string;
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  total,
  color = '#00B594',
  size = 44
}) => {
  const percentage = Math.min(100, Math.max(0, total > 0 ? Math.round((value / total) * 100) : 0));
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold font-mono text-slate-700">
        {percentage}%
      </span>
    </div>
  );
};

export interface KpiCardData {
  id: string;
  title: string;
  value: number | string;
  subtext: string;
  badge?: { text: string; color: 'emerald' | 'amber' | 'rose' | 'blue' };
  targetTab?: string;
  progressValue?: number;
  progressTotal?: number;
  color?: string;
  iconName?: string;
}

interface KpiCardsGridProps {
  cards: KpiCardData[];
  onNavigateToTab?: (tabId: string) => void;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ cards, onNavigateToTab }) => {
  const getBadgeClass = (color: 'emerald' | 'amber' | 'rose' | 'blue') => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/60';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {cards.map((card) => {
        const isClickable = !!card.targetTab && !!onNavigateToTab;
        return (
          <div
            key={card.id}
            onClick={() => isClickable && onNavigateToTab?.(card.targetTab!)}
            className={`bg-white rounded-[24px] border border-slate-100 p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all ${
              isClickable
                ? 'cursor-pointer hover:border-slate-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.04)] group'
                : ''
            }`}
          >
            <div className="space-y-1.5 min-w-0 pr-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono truncate">
                {card.title}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2.5xl font-mono font-medium text-slate-900 leading-none group-hover:text-[#00B594] transition-colors">
                  {card.value}
                </span>
                {card.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${getBadgeClass(card.badge.color)}`}>
                    {card.badge.text}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {card.subtext}
              </p>
            </div>

            {card.progressTotal !== undefined && card.progressValue !== undefined ? (
              <CircularProgress
                value={card.progressValue}
                total={card.progressTotal}
                color={card.color || '#00B594'}
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-50 group-hover:text-[#00B594] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KpiCardsGrid;
