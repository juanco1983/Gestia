import React from 'react';
import { OT, OTStatus } from '../../types';
import { Calendar, Zap, FileText, CheckCircle2 } from 'lucide-react';

interface PipelineOTsProps {
  ots: OT[];
  onNavigateToTab?: (tabId: string, filter?: string) => void;
}

export const PipelineOTs: React.FC<PipelineOTsProps> = ({ ots, onNavigateToTab }) => {
  // Count by stage
  const programadas = ots.filter(o => 
    o.estado === OTStatus.PROGRAMADA || 
    o.estado === OTStatus.ASIGNADA || 
    o.estado === OTStatus.PENDIENTE_PROGRAMACION
  ).length;

  const enEjecucion = ots.filter(o => 
    o.estado === OTStatus.EN_CAMINO || 
    o.estado === OTStatus.EN_SITIO || 
    o.estado === OTStatus.TRABAJO_EN_EJECUCION
  ).length;

  const informePendiente = ots.filter(o => 
    o.estado === OTStatus.INFORME_PENDIENTE || 
    o.estado === OTStatus.INFORME_ENVIADO || 
    o.estado === OTStatus.EN_REVISION ||
    o.estado === OTStatus.OBSERVADA
  ).length;

  const cerradas = ots.filter(o => 
    o.estado === OTStatus.APROBADA || 
    o.estado === OTStatus.FIRMADA || 
    o.estado === OTStatus.FACTURADA || 
    o.estado === OTStatus.CERRADA
  ).length;

  const total = ots.length || 1;

  const stages = [
    {
      id: 'programadas',
      label: 'Programadas',
      count: programadas,
      percentage: Math.round((programadas / total) * 100),
      color: 'bg-blue-500',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      Icon: Calendar,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      desc: 'Listas para iniciar'
    },
    {
      id: 'en_ejecucion',
      label: 'En Ejecución',
      count: enEjecucion,
      percentage: Math.round((enEjecucion / total) * 100),
      color: 'bg-[#00B594]',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      Icon: Zap,
      iconColor: 'text-[#00B594]',
      iconBg: 'bg-emerald-50',
      desc: 'Técnicos en sitio'
    },
    {
      id: 'informe_pendiente',
      label: 'Informe Pendiente',
      count: informePendiente,
      percentage: Math.round((informePendiente / total) * 100),
      color: 'bg-amber-500',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      Icon: FileText,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      desc: 'En revisión supervisor',
      highlight: informePendiente > 5 // Bottle-neck warning
    },
    {
      id: 'cerradas',
      label: 'Cerradas',
      count: cerradas,
      percentage: Math.round((cerradas / total) * 100),
      color: 'bg-slate-400',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/60',
      Icon: CheckCircle2,
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-100',
      desc: 'Servicio completado'
    }
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pipeline de Órdenes de Trabajo</span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {ots.length} OTs
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Flujo de trabajo activo por etapa de ejecución
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab?.('Monitoreo')}
          className="text-xs font-bold text-[#00B594] hover:text-[#009b7e] transition-colors self-start sm:self-center"
        >
          Ver Módulo Operaciones →
        </button>
      </div>

      {/* Visual Funnel Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 mb-6">
        {stages.map(stg => (
          <div
            key={stg.id}
            style={{ width: `${stg.percentage}%` }}
            className={`h-full ${stg.color} transition-all duration-500`}
            title={`${stg.label}: ${stg.count} (${stg.percentage}%)`}
          />
        ))}
      </div>

      {/* Funnel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stg) => {
          const Icon = stg.Icon;
          return (
            <div
              key={stg.id}
              onClick={() => onNavigateToTab?.('Monitoreo', stg.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                stg.highlight
                  ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-sm'
                  : 'bg-slate-50/60 border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl ${stg.iconBg} flex items-center justify-center`}>
                  <Icon size={16} className={stg.iconColor} />
                </div>
                {stg.highlight && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                    Cuello de Botella
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1">
                {stg.label}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {stg.count}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  ({stg.percentage}%)
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                {stg.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineOTs;
