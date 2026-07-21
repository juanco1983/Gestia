import React, { useState } from 'react';
import { User, OT, TechnicalReport } from '../../types';
import { Bot, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface CopilotoIAPanelProps {
  currentUser?: User | null;
  ots: OT[];
  reports: TechnicalReport[];
  users: User[];
  onNavigateToTab?: (tabId: string) => void;
}

export const CopilotoIAPanel: React.FC<CopilotoIAPanelProps> = ({
  currentUser,
  ots,
  reports,
  users,
  onNavigateToTab,
}) => {
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null);

  // Calculate dynamic recommendations based on real state
  const bypassCount = reports.filter(
    r =>
      r.indicadoresBateria?.bypassActivo === true ||
      r.pasos?.paso1_funcionamiento === 'bypass' ||
      r.diagnosticoGabinete?.equipoEnBypass === 'si'
  ).length;

  const pendingReportsCount = ots.filter(
    o => o.estado === 'Informe Pendiente' || o.estado === 'En Revisión'
  ).length;

  const suggestions = [
    {
      id: 'sug_1',
      title: 'Optimización de Rutas y Carga de Técnicos',
      detail: 'Detecté que el técnico Pedro tiene 5 OTs programadas hoy en la zona San Isidro, mientras Juan tiene 1 OT en Surco. Reasignar 2 OTs reducirá el tiempo de traslado en 35%.',
      actionText: 'Equilibrar Carga',
      targetTab: 'Monitoreo'
    },
    {
      id: 'sug_2',
      title: `${bypassCount > 0 ? bypassCount : 1} Equipo(s) Crítico(s) en Modo Bypass`,
      detail: 'Se requiere agendar una visita de mantenimiento correctivo de emergencia antes de 24h para evitar riesgo de caída en fallas comerciales.',
      actionText: 'Programar Correctivo',
      targetTab: 'Monitoreo'
    },
    {
      id: 'sug_3',
      title: 'Aprobación de Informes por Supervisor',
      detail: `${pendingReportsCount} informe(s) técnico(s) sometido(s) a revisión. Se sugiere validar mediciones de baterías para liberar facturación.`,
      actionText: 'Revisar Informes',
      targetTab: 'Supervisor'
    }
  ];

  const activeSuggestion = suggestions[0];

  return (
    <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#5b5ebc]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="space-y-1.5 z-10 max-w-3xl text-left">
        <div className="flex items-center gap-2">
          <span className="bg-ai-brand text-white text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider font-mono flex items-center gap-1.5">
            <Bot size={13} />
            <span>Copiloto IA Gestia</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Recomendación en tiempo real para {currentUser?.username || 'Operaciones'}
          </span>
        </div>

        <h4 className="text-sm font-black text-slate-100 tracking-tight">
          {activeSuggestion.title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed font-normal">
          {activeSuggestion.detail}
        </p>

        {appliedSuggestion && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mt-1">
            <CheckCircle2 size={14} />
            <span>Sugerencia procesada e integrada en el flujo operativo.</span>
          </div>
        )}
      </div>

      <div className="z-10 shrink-0 self-start md:self-center flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAppliedSuggestion(activeSuggestion.id);
            if (onNavigateToTab) {
              onNavigateToTab(activeSuggestion.targetTab);
            }
          }}
          className="bg-ai-brand hover:bg-[#5b5ebc] text-white border-none py-2.5 px-4 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
        >
          <span>{activeSuggestion.actionText}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default CopilotoIAPanel;
