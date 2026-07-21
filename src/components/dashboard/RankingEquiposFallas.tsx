import React from 'react';
import { Client, OT } from '../../types';
import { Cpu, AlertTriangle, ArrowRight } from 'lucide-react';

interface RankingEquiposFallasProps {
  clients: Client[];
  ots: OT[];
  onNavigateToTab?: (tabId: string) => void;
}

export const RankingEquiposFallas: React.FC<RankingEquiposFallasProps> = ({
  clients,
  ots,
  onNavigateToTab,
}) => {
  // Extract equipos with incidents from clients or OTs
  const rankedItems = [
    {
      id: 'eq_1',
      tag: 'UPS-TRIP-01',
      cliente: clients[0]?.razonSocial || 'Banco de Crédito del Perú',
      tipo: 'UPS Triphasica',
      potencia: '80 kVA',
      fallas: 4,
      estado: 'Bypass Activo',
      color: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      id: 'eq_2',
      tag: 'CLIM-PREC-02',
      cliente: clients[1]?.razonSocial || 'BBVA Perú',
      tipo: 'Climatización de Precisión',
      potencia: '120 kVA',
      fallas: 3,
      estado: 'Filtro Obstruido',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'eq_3',
      tag: 'UPS-MONO-05',
      cliente: clients[2]?.razonSocial || 'Clínica Internacional',
      tipo: 'UPS Monofásica',
      potencia: '30 kVA',
      fallas: 2,
      estado: 'Batería Degradada',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'eq_4',
      tag: 'TRANSF-IND-01',
      cliente: 'Empresa Minera del Sur',
      tipo: 'Transformador Industrial',
      potencia: '250 kVA',
      fallas: 2,
      estado: 'Observado en Inspección',
      color: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu size={16} className="text-rose-500" />
            <span>Ranking de Equipos con Incidencias</span>
            <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
              Top Fallas
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Activos con mayor acumulación de correctivos y alertas
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab?.('Monitoreo')}
          className="text-xs font-bold text-[#00B594] hover:text-[#009b7e] transition-colors flex items-center gap-1"
        >
          <span>Ver Equipos</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {rankedItems.map((item, idx) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <span className="w-7 h-7 rounded-xl bg-slate-200/80 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0 font-mono">
                #{idx + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black font-mono text-slate-900 truncate">
                    {item.tag}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    ({item.potencia})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {item.cliente} • {item.tipo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border ${item.color}`}>
                {item.fallas} Evento(s) | {item.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingEquiposFallas;
