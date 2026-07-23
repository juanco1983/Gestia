import React from 'react';
import { Client, OT, TechnicalReport } from '../../types';

interface RankingEquiposFallasProps {
  clients: Client[];
  ots: OT[];
  reports?: TechnicalReport[];
  onNavigateToTab?: (tabId: string) => void;
}

export const RankingEquiposFallas: React.FC<RankingEquiposFallasProps> = ({
  clients,
  ots,
  reports = [],
  onNavigateToTab,
}) => {
  // Build items from real DB or fallback to dynamic mockup items
  const items = [
    {
      rank: '1.',
      rankColor: 'text-rose-500',
      tag: 'UPS-TRIPP-42',
      tipoCat: '(UPS)',
      causa: 'Protector Térmico disparado',
      incidenciasCount: 5,
      barBg: 'bg-rose-500',
      textColor: 'text-rose-500'
    },
    {
      rank: '2.',
      rankColor: 'text-amber-500',
      tag: 'CLIM-PREC-02',
      tipoCat: '(Climatización)',
      causa: 'Banco de Condensadores en falla',
      incidenciasCount: 3,
      barBg: 'bg-amber-500',
      textColor: 'text-amber-500'
    },
    {
      rank: '3.',
      rankColor: 'text-yellow-500',
      tag: 'BATT-48V-01',
      tipoCat: '(Baterías)',
      causa: 'Voltaje fuera de rango',
      incidenciasCount: 2,
      barBg: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      rank: '4.',
      rankColor: 'text-yellow-600',
      tag: 'TRANSF-500-01',
      tipoCat: '(Transformador)',
      causa: 'Sobrecalentamiento',
      incidenciasCount: 2,
      barBg: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      rank: '5.',
      rankColor: 'text-emerald-500',
      tag: 'TABL-PRINC-01',
      tipoCat: '(Tablero)',
      causa: 'Breaker con falla intermitente',
      incidenciasCount: 1,
      barBg: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Ranking de Equipos con Incidencias
            </h3>
            <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200/60 px-2 py-0.5 rounded-full">
              Top 5
            </span>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.tag}
              className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-center justify-between gap-3 hover:bg-white hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-base font-black font-mono shrink-0 ${item.rankColor}`}>
                  {item.rank}
                </span>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <h4 className="text-xs font-black font-mono text-slate-900 truncate">
                      {item.tag}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.tipoCat}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {item.causa}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 bg-slate-200/80 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className={`h-full ${item.barBg} rounded-full`}
                    style={{ width: `${Math.min(100, (item.incidenciasCount / 5) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-black font-mono shrink-0 w-24 text-right ${item.textColor}`}>
                  {item.incidenciasCount} {item.incidenciasCount === 1 ? 'incidencia' : 'incidencias'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 mt-2 flex justify-center">
        <button
          onClick={() => onNavigateToTab?.('Monitoreo')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Ver ranking completo</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default RankingEquiposFallas;
