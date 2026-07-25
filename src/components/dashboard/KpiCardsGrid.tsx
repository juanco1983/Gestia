import React from 'react';
import { Calendar, Zap, FileText, CheckCircle2, Activity, Clock, ShieldAlert } from 'lucide-react';

interface SparklineProps {
  color?: string;
  data?: number[];
}

const MiniSparkline: React.FC<SparklineProps> = ({ color = '#00B594', data = [10, 15, 8, 22, 18, 26, 30] }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 90 + 5;
      const y = 35 - ((val - min) / range) * 25;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-20 h-9 overflow-visible" viewBox="0 0 100 40">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
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
  sparklineData?: number[];
  percentageChange?: string;
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

  const getCardIcon = (id: string, color?: string) => {
    const strokeColor = color || '#3B82F6';
    if (id.includes('prog') || id.includes('programada')) return <Calendar size={18} style={{ color: strokeColor }} />;
    if (id.includes('ejec') || id.includes('ejecucion')) return <Zap size={18} style={{ color: strokeColor }} />;
    if (id.includes('pend') || id.includes('informe')) return <FileText size={18} style={{ color: strokeColor }} />;
    if (id.includes('cerr') || id.includes('aprob')) return <CheckCircle2 size={18} style={{ color: strokeColor }} />;
    if (id.includes('sla')) return <Activity size={18} style={{ color: strokeColor }} />;
    return <Clock size={18} style={{ color: strokeColor }} />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {cards.map((card, idx) => {
        const isClickable = !!card.targetTab && !!onNavigateToTab;
        const iconColor = card.color || (idx === 0 ? '#3B82F6' : idx === 1 ? '#00B594' : idx === 2 ? '#F59E0B' : '#8B5CF6');

        return (
          <div
            key={card.id}
            onClick={() => isClickable && onNavigateToTab?.(card.targetTab!)}
            className={`bg-white rounded-[24px] border border-slate-100 p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all ${
              isClickable
                ? 'cursor-pointer hover:border-slate-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.04)] group'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {getCardIcon(card.id, iconColor)}
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono truncate">
                  {card.title}
                </span>
              </div>

              {card.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border whitespace-nowrap shrink-0 ${getBadgeClass(card.badge.color)}`}>
                  {card.badge.text}
                </span>
              )}
            </div>

            <div className="flex items-end justify-between mt-1 min-w-0">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-3xl font-mono font-black text-slate-900 leading-none group-hover:text-[#00B594] transition-colors">
                    {card.value}
                  </span>
                  {card.percentageChange && (
                    <span className="text-xs font-bold font-mono text-emerald-600 whitespace-nowrap shrink-0">
                      {card.percentageChange}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                  {card.subtext}
                </p>
              </div>

              <div className="shrink-0 pl-2">
                <MiniSparkline color={iconColor} data={card.sparklineData} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCardsGrid;
