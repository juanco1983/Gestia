import React, { useMemo } from 'react';
import { Client, OT, TechnicalReport } from '../../types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

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

      // Evaluate text for real faults vs benign positive maintenance notes
      const positiveKeywords = ['óptimo', 'optimo', 'sin anomalías', 'sin anomalias', 'sin fallas', 'operación normal', 'operacion normal', 'operativo sin problemas'];
      const faultKeywords = ['falla', 'reemplazo', 'reemplazar', 'crítico', 'critico', 'avería', 'averia', 'ruido', 'sobrecalentamiento', 'sulfatad', 'desgastad', 'descalibrad', 'anomalía', 'anomalia', 'reparar', 'reparación', 'reparacion', 'dañad', 'danad', 'bajo voltaje', 'sobrevoltaje'];

      const textToEvaluate = `${r.observacionesDiagnostico || ''} ${r.comentariosAdicionales || ''} ${r.pasos?.paso6_observaciones || ''}`.toLowerCase();
      const hasFaultKeyword = faultKeywords.some(kw => textToEvaluate.includes(kw));
      const isPositiveNote = positiveKeywords.some(kw => textToEvaluate.includes(kw)) && !hasFaultKeyword;

      // Check if report has real observations, bypass, or repair needed
      const hasFalla = Boolean(
        r.indicadoresBateria?.bypassActivo ||
        r.pasos?.paso1_funcionamiento === 'bypass' ||
        hasFaultKeyword ||
        (r.correccionesSupervisor && r.correccionesSupervisor.trim().length > 0) ||
        (linkedOt?.estado === 'Observada') ||
        (textToEvaluate.length > 0 && !isPositiveNote && !textToEvaluate.includes('limpieza con brocha'))
      );

      if (hasFalla) {
        if (!equipFailMap[itemKey]) {
          equipFailMap[itemKey] = {
            tag: equipTag,
            clientName,
            tipoCat: r.indicadoresBateria?.bypassActivo ? '(Bypass Activo)' : '(Atención Req.)',
            causa: hasFaultKeyword ? r.observacionesDiagnostico || r.comentariosAdicionales || 'Anomalía registrada en informe' : 'Incidencia en revisión técnica',
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
                onClick={() => onNavigateToTab?.('InventarioEquipos')}
                className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-center justify-between gap-3 hover:bg-white hover:border-[#00B594]/40 hover:shadow-xs transition-all cursor-pointer group"
                title="Haz clic para abrir el inventario y revisar las incidencias de este equipo"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-base font-black font-mono shrink-0 ${item.rankColor}`}>
                    {item.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5 truncate">
                      <h4 className="text-xs font-black font-mono text-slate-900 truncate group-hover:text-[#00B594] transition-colors">
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
                  <span className="text-[9px] font-mono font-bold text-[#00B594] group-hover:underline flex items-center gap-0.5 mt-1">
                    Ver Incidencias <ArrowRight size={10} />
                  </span>
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
