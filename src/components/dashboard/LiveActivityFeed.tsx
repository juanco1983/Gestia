import React, { useMemo } from 'react';
import { OT, TechnicalReport, Client } from '../../types';
import { ShieldAlert, Play, FileText, Zap, CheckCircle2, Clock } from 'lucide-react';

interface LiveActivityFeedProps {
  ots: OT[];
  reports: TechnicalReport[];
  clients: Client[];
  onNavigateToTab?: (tabId: string) => void;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ ots, reports, clients, onNavigateToTab }) => {
  // Build 100% dynamic events from real DB OTs & Reports
  const events: ActivityEvent[] = useMemo(() => {
    const list: ActivityEvent[] = [];

    // Map recent reports
    reports.slice(0, 3).forEach(r => {
      list.push({
        id: `rep_${r.id}`,
        time: 'Reciente',
        actor: 'Informe Técnico',
        action: 'registrado/actualizado -',
        target: `${r.otId || 'OT'} (${r.tecnico1 || 'Técnico'})`,
        iconBg: 'bg-[#E6F7F4]',
        iconColor: 'text-[#00B594]',
        Icon: FileText
      });
    });

    // Map recent OTs
    ots.slice(0, 5).forEach(o => {
      const clientName = clients.find(c => c.id === o.clientId)?.razonSocial || o.clientId || 'Cliente';
      let icon = Zap;
      let bg = 'bg-blue-100';
      let color = 'text-blue-600';
      let actionText = 'creada en sistema -';

      if (o.estado === 'Aprobada' || o.estado === 'Cerrada' || o.estado === 'Facturada') {
        icon = CheckCircle2;
        bg = 'bg-emerald-100';
        color = 'text-emerald-600';
        actionText = 'finalizada y aprobada -';
      } else if (o.estado === 'Trabajo en Ejecución' || o.estado === 'En Sitio' || o.estado === 'En Camino') {
        icon = Play;
        bg = 'bg-amber-100';
        color = 'text-amber-600';
        actionText = 'en proceso en campo -';
      } else if (o.estado === 'En Revisión' || o.estado === 'Informe Pendiente') {
        icon = ShieldAlert;
        bg = 'bg-purple-100';
        color = 'text-purple-600';
        actionText = 'pendiente de revisión -';
      }

      list.push({
        id: `ot_${o.id}`,
        time: o.fechaProgramada || 'Hoy',
        actor: o.tecnicoTitular || 'Operaciones',
        action: actionText,
        target: `${clientName} (${o.id})`,
        iconBg: bg,
        iconColor: color,
        Icon: icon
      });
    });

    return list.slice(0, 5);
  }, [ots, reports, clients]);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Actividad en Tiempo Real</span>
              <span className={`w-2.5 h-2.5 rounded-full ${events.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Últimos eventos registrados en la base de datos
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Clock size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">Sin actividad en tiempo real</p>
            <p className="text-[11px] text-slate-400 mt-1">No hay órdenes de trabajo ni informes registrados en la BD.</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {events.map((ev) => {
              const Icon = ev.Icon;
              return (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-center gap-3 hover:bg-white hover:border-slate-200 transition-all text-left"
                >
                  <div className={`w-9 h-9 rounded-xl ${ev.iconBg} ${ev.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-800 truncate">
                        {ev.actor}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {ev.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      <span className="font-medium text-slate-400">{ev.action}</span>{' '}
                      <span className="font-bold text-slate-700">{ev.target}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
