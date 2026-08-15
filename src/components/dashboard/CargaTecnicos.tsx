import React from 'react';
import { User, OT, OTStatus } from '../../types';

interface CargaTecnicosProps {
  users: User[];
  ots: OT[];
  onNavigateToTab?: (tabId: string) => void;
}

export const CargaTecnicos: React.FC<CargaTecnicosProps> = ({ users, ots, onNavigateToTab }) => {
  // Filter technical staff (exclusivamente rol 'Tecnico')
  const tecnicos = users.filter(u => u.role === 'Tecnico');

  // Active OTs count by technician
  const activeOts = ots.filter(o => o.estado !== OTStatus.APROBADA && o.estado !== OTStatus.CERRADA && o.estado !== OTStatus.FACTURADA);

  const colors = [
    { bg: 'bg-cyan-500', circle: 'bg-cyan-100 text-cyan-800' },
    { bg: 'bg-blue-500', circle: 'bg-blue-100 text-blue-800' },
    { bg: 'bg-amber-500', circle: 'bg-purple-100 text-purple-800' },
    { bg: 'bg-emerald-500', circle: 'bg-emerald-100 text-emerald-800' },
    { bg: 'bg-teal-500', circle: 'bg-teal-100 text-teal-800' }
  ];

  const techStats = tecnicos.map((tech, idx) => {
    const assignedOts = activeOts.filter(
      o => o.tecnicoTitularId === tech.id || o.tecnicoTitular === tech.username || o.tecnicoApoyoId === tech.id
    );
    const count = assignedOts.length;
    // Calculate load percentage (5 active OTs is 100% capacity)
    const loadPct = count > 0 ? Math.min(100, Math.round((count / 5) * 100)) : 0;
    const styleColor = colors[idx % colors.length];

    const initials = tech.username
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return {
      tech,
      count,
      loadPct,
      styleColor,
      initials
    };
  });

  // Sort by count descending
  techStats.sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Carga del Equipo Técnico</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                {tecnicos.length} registrados
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Distribución de OTs activas por técnico
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {techStats.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No hay técnicos registrados</p>
          ) : (
            techStats.map(({ tech, count, loadPct, styleColor, initials }) => (
              <div
                key={tech.id}
                className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 font-mono ${styleColor.circle}`}>
                    {initials}
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {tech.username}
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${styleColor.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-black font-mono text-slate-800 shrink-0 w-9 text-right">
                    {loadPct}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CargaTecnicos;
