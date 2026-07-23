import React, { useMemo } from 'react';
import { Client, OT, TechnicalReport } from '../../types';
import { ShieldAlert } from 'lucide-react';

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
  // Build items 100% dynamically from real DB reports and OTs with human-readable equipment names and client names
  const items = useMemo(() => {
    const equipFailMap: Record<string, { tag: string; clientName: string; tipoCat: string; causa: string; count: number }> = {};

    reports.forEach(r => {
      if (!r.equipoId && !r.otId) return;

      // Find associated OT and Client
      const linkedOt = ots.find(o => o.id === r.otId || o.id === r.equipoId);
      const linkedClient = clients.find(c => c.id === (linkedOt?.clientId || r.otId));
      const clientName = linkedClient?.razonSocial || (linkedOt as any)?.cliente || 'Cliente Registrado';

      // Format a clean, human-readable equipment name
      let equipTag = '';
      if (linkedOt?.tipoEquipo) {
        equipTag = `${linkedOt.tipoEquipo} ${linkedOt.potenciaKva ? `${linkedOt.potenciaKva}kVA` : ''}`.trim();
      } else {
        equipTag = 'Equipo Industrial';
      }

      // Unique key per equipment and client
      const itemKey = `${equipTag} (${clientName})`;

      // Check if report has observations, bypass, or repair needed
      const hasFalla = Boolean(
        r.observacionesDiagnostico ||
        r.comentariosAdicionales ||
        r.indicadoresBateria?.bypassActivo ||
        r.pasos?.paso1_funcionamiento === 'bypass' ||
        r.pasos?.paso6_observaciones
      );

      if (hasFalla) {
        if (!equipFailMap[itemKey]) {
          equipFailMap[itemKey] = {
            tag: equipTag,
            clientName,
            tipoCat: r.indicadoresBateria?.bypassActivo ? '(Bypass)' : '(Mantenimiento)',
            causa: r.observacionesDiagnostico || r.comentariosAdicionales || r.pasos?.paso6_observaciones || 'Observación registrada en informe',
            count: 0
          };
        }
        equipFailMap[itemKey].count += 1;
      }
    });

    const rankList = Object.values(equipFailMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const rankColors = ['text-rose-500', 'text-amber-500', 'text-yellow-500', 'text-yellow-600', 'text-emerald-500'];
    const barBgs = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-emerald-500'];

    return rankList.map((item, idx) => ({
      rank: `${idx + 1}.`,
      rankColor: rankColors[idx] || 'text-slate-500',
      tag: item.tag,
      clientName: item.clientName,
      tipoCat: item.tipoCat,
      causa: item.causa,
      incidenciasCount: item.count,
      barBg: barBgs[idx] || 'bg-slate-400',
      textColor: rankColors[idx] || 'text-slate-500'
    }));
  }, [reports, ots, clients]);

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

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">Sin incidencias registradas</p>
            <p className="text-[11px] text-slate-400 mt-1">No hay fallas ni observaciones reportadas en la base de datos.</p>
          </div>
        ) : (
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
                    <p className="text-[10px] text-emerald-700 font-bold font-mono truncate mt-0.5">
                      🏢 {item.clientName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {item.causa}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-xs font-black font-mono ${item.textColor}`}>
                    {item.incidenciasCount} fallas
                  </span>
                  <div className="w-14 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${item.barBg} rounded-full`}
                      style={{ width: `${Math.min(100, item.incidenciasCount * 20)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingEquiposFallas;
