import React from 'react';
import { TechnicalReport, Contrato, OT, User } from '../../types';
import { AlertTriangle, Clock, FileText, CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';

interface AlertasRiesgoPanelProps {
  reports: TechnicalReport[];
  contratos: Contrato[];
  ots: OT[];
  users: User[];
  onNavigateToTab?: (tabId: string) => void;
}

export const AlertasRiesgoPanel: React.FC<AlertasRiesgoPanelProps> = ({
  reports,
  contratos,
  ots,
  users,
  onNavigateToTab,
}) => {
  const alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel: string;
    targetTab: string;
    icon: React.ElementType;
  }> = [];

  // 1. Bypass Active check
  const bypassReports = reports.filter(
    r =>
      r.indicadoresBateria?.bypassActivo === true ||
      r.pasos?.paso1_funcionamiento === 'bypass' ||
      r.diagnosticoGabinete?.equipoEnBypass === 'si'
  );

  if (bypassReports.length > 0) {
    alerts.push({
      id: 'bypass_activo',
      type: 'critical',
      title: `${bypassReports.length} Equipo(s) en Modo Bypass Activo`,
      description: 'Equipos desprotegidos ante corte de energía comercial. Requieren auditoría o correctivo inmediato.',
      actionLabel: 'Ver Informes →',
      targetTab: 'Supervisor',
      icon: ShieldAlert
    });
  }

  // 2. Contracts expiring in <= 45 days
  const today = new Date();
  const expCutoff = new Date();
  expCutoff.setDate(today.getDate() + 45);

  const expiringContracts = contratos.filter(c => {
    if (!c.fecha_fin) return false;
    const end = new Date(c.fecha_fin);
    return end >= today && end <= expCutoff;
  });

  if (expiringContracts.length > 0) {
    alerts.push({
      id: 'contratos_vencer',
      type: 'warning',
      title: `${expiringContracts.length} Contrato(s) por vencer en los próximos 45 días`,
      description: 'Revisar visitas de mantenimiento preventivo pendientes antes del vencimiento.',
      actionLabel: 'Ver Contratos →',
      targetTab: 'Monitoreo',
      icon: Clock
    });
  }

  // 3. Technicians overloaded (> 3 active OTs)
  const techMap: Record<string, number> = {};
  ots.forEach(o => {
    if (o.tecnicoTitularId) {
      techMap[o.tecnicoTitularId] = (techMap[o.tecnicoTitularId] || 0) + 1;
    }
  });

  const overloadedTechIds = Object.keys(techMap).filter(id => techMap[id] > 3);
  if (overloadedTechIds.length > 0) {
    alerts.push({
      id: 'tecnicos_sobrecargados',
      type: 'warning',
      title: `${overloadedTechIds.length} Técnico(s) con Alta Carga Operativa`,
      description: 'Más de 3 Órdenes de Trabajo activas asignadas simultáneamente.',
      actionLabel: 'Ver Monitoreo →',
      targetTab: 'Monitoreo',
      icon: Wrench
    });
  }

  // 4. Delayed Reports (> 5 pending)
  const pendingReportsCount = ots.filter(o => o.estado === 'Informe Pendiente' || o.estado === 'En Revisión').length;
  if (pendingReportsCount >= 4) {
    alerts.push({
      id: 'informes_acumulados',
      type: 'info',
      title: `${pendingReportsCount} Informes Pendientes de Revisión`,
      description: 'Acumulación de informes de servicio esperando validación de supervisor.',
      actionLabel: 'Aprobar Informes →',
      targetTab: 'Supervisor',
      icon: FileText
    });
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Riesgos y Alertas Operativas</span>
            {alerts.length > 0 ? (
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {alerts.length} activas
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Sin riesgos
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Detección automática de eventos críticos en campo
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xs font-bold text-slate-700">Operación 100% Controlada</p>
          <p className="text-[11px] text-slate-400 mt-1">No hay alertas de bypass ni retrasos en SLAs actualmente.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
          {alerts.map(alert => {
            const isCritical = alert.type === 'critical';
            const isWarning = alert.type === 'warning';
            const Icon = alert.icon;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                    : 'bg-blue-50/50 border-blue-200 text-blue-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCritical
                      ? 'bg-rose-100 text-rose-600'
                      : isWarning
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-snug">{alert.title}</h4>
                    <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab?.(alert.targetTab)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 self-start sm:self-center transition-all ${
                    isCritical
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                      : isWarning
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {alert.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 mt-2 flex justify-end">
        <button
          onClick={() => onNavigateToTab?.('Supervisor')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Ver todas las alertas</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default AlertasRiesgoPanel;
