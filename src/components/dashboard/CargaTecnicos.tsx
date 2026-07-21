import React from 'react';
import { User, OT, OTStatus } from '../../types';
import { Users, ArrowRight } from 'lucide-react';

interface CargaTecnicosProps {
  users: User[];
  ots: OT[];
  onNavigateToTab?: (tabId: string) => void;
}

export const CargaTecnicos: React.FC<CargaTecnicosProps> = ({ users, ots, onNavigateToTab }) => {
  // Filter technical staff
  const tecnicos = users.filter(u => u.role === 'Tecnico' || u.role === 'Administrador');

  // Active OTs count by technician ID or name
  const activeOts = ots.filter(o => o.estado !== OTStatus.APROBADA && o.estado !== OTStatus.CERRADA && o.estado !== OTStatus.FACTURADA);

  const techStats = tecnicos.map(tech => {
    const assignedOts = activeOts.filter(
      o => o.tecnicoTitularId === tech.id || o.tecnicoTitular === tech.username || o.tecnicoApoyoId === tech.id
    );
    const count = assignedOts.length;

    let statusLabel = 'Disponible';
    let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let dotColor = 'bg-emerald-500';

    if (count >= 5) {
      statusLabel = 'Sobrecargado';
      statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
    } else if (count >= 3) {
      statusLabel = 'Carga Media';
      statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
    }

    return {
      tech,
      count,
      statusLabel,
      statusColor,
      dotColor,
      assignedOts
    };
  });

  // Sort by count descending
  techStats.sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={16} className="text-slate-700" />
            <span>Carga del Equipo Técnico</span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {tecnicos.length} personal
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Distribución de OTs activas por técnico
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab?.('Monitoreo')}
          className="text-xs font-bold text-[#00B594] hover:text-[#009b7e] transition-colors flex items-center gap-1"
        >
          <span>Asignar</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {techStats.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No hay técnicos registrados</p>
        ) : (
          techStats.map(({ tech, count, statusLabel, statusColor, dotColor }) => (
            <div
              key={tech.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-slate-200/80 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0 font-mono">
                  {tech.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {tech.username}
                  </h4>
                  <span className="text-[10.5px] text-slate-400 font-medium block truncate">
                    {tech.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-slate-900 block">
                    {count} OTs
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${statusColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CargaTecnicos;
