import React from 'react';
import { OT, OTStatus } from '../../types';
import { Calendar, Zap, Search, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

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

  const enRevision = ots.filter(o =>
    o.estado === OTStatus.INFORME_ENVIADO ||
    o.estado === OTStatus.EN_REVISION
  ).length;

  const pendientes = ots.filter(o =>
    o.estado === OTStatus.INFORME_PENDIENTE ||
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
      barColor: 'bg-blue-500',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      Icon: Calendar,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50'
    },
    {
      id: 'en_ejecucion',
      label: 'En Ejecución',
      count: enEjecucion,
      percentage: Math.round((enEjecucion / total) * 100),
      barColor: 'bg-[#00B594]',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      Icon: Zap,
      iconColor: 'text-[#00B594]',
      iconBg: 'bg-emerald-50'
    },
    {
      id: 'en_revision',
      label: 'En Revisión',
      count: enRevision,
      percentage: Math.round((enRevision / total) * 100),
      barColor: 'bg-amber-500',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      Icon: Search,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50'
    },
    {
      id: 'pendientes',
      label: 'Pendientes',
      count: pendientes,
      percentage: Math.round((pendientes / total) * 100),
      barColor: 'bg-orange-500',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/60',
      Icon: Clock,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50'
    },
    {
      id: 'cerradas',
      label: 'Cerradas',
      count: cerradas,
      percentage: Math.round((cerradas / total) * 100),
      barColor: 'bg-emerald-600',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100'
    }
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pipeline de Órdenes de Trabajo</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Flujo de trabajo activo por etapa de ejecución
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab?.('Monitoreo')}
          className="text-xs font-bold text-[#00B594] hover:text-[#009b7e] transition-colors self-start sm:self-center cursor-pointer"
        >
          Ver módulo Operaciones →
        </button>
      </div>

      {/* 5-Stage Kanban Cards Grid with Step Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {stages.map((stg, idx) => {
          const Icon = stg.Icon;
          const isLast = idx === stages.length - 1;

          return (
            <div
              key={stg.id}
              onClick={() => onNavigateToTab?.('Monitoreo', stg.id)}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-xl ${stg.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={14} className={stg.iconColor} />
                </div>
                {!isLast && (
                  <ChevronRight size={14} className="text-slate-300 hidden lg:block" />
                )}
              </div>

              <div>
                <span className="text-[11px] font-extrabold text-slate-600 block mb-1">
                  {stg.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {stg.count}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                    ({stg.percentage}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-segment Color Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 mb-2">
        {stages.map(stg => (
          <div
            key={stg.id}
            style={{ width: `${Math.max(2, stg.percentage)}%` }}
            className={`h-full ${stg.barColor} transition-all duration-500`}
            title={`${stg.label}: ${stg.count} (${stg.percentage}%)`}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <span className="text-[11px] font-mono font-bold text-slate-500">
          Total: {ots.length} OT activas
        </span>
      </div>
    </div>
  );
};

export default PipelineOTs;
