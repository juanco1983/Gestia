import React from 'react';
import { OT, TechnicalReport, Client } from '../../types';
import { ShieldAlert, Play, FileText, Zap, CheckCircle2 } from 'lucide-react';

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
  // Mockup matched live feed events
  const mockEvents: ActivityEvent[] = [
    {
      id: 'ev_1',
      time: '11:36 AM',
      actor: 'Supervisor',
      action: 'aprobó Informe Técnico de',
      target: 'Cliente Demo 178352024 S.A.C. - OT-20005-1',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      Icon: ShieldAlert
    },
    {
      id: 'ev_2',
      time: '11:28 AM',
      actor: 'Técnico Pedro R.',
      action: 'inició trabajo en campo -',
      target: 'OT-20039-2',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      Icon: Play
    },
    {
      id: 'ev_3',
      time: '11:15 AM',
      actor: 'Informe técnico',
      action: 'enviado para revisión -',
      target: 'OT-20038-1',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      Icon: FileText
    },
    {
      id: 'ev_4',
      time: '11:08 AM',
      actor: 'Nueva OT',
      action: 'creada por Operaciones -',
      target: 'OT-20041-1',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      Icon: Zap
    },
    {
      id: 'ev_5',
      time: '10:59 AM',
      actor: 'Técnico Ana G.',
      action: 'llegó a sitio -',
      target: 'OT-20037-1',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      Icon: CheckCircle2
    }
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Actividad en Tiempo Real</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Últimos eventos registrados
            </p>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {mockEvents.map((ev) => {
            const Icon = ev.Icon;
            return (
              <div
                key={ev.id}
                className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-center gap-3 hover:bg-white hover:border-slate-200 transition-all text-left"
              >
                <span className="text-xs font-mono font-bold text-slate-400 shrink-0 w-16">
                  {ev.time}
                </span>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${ev.iconBg}`}>
                  <Icon size={13} className={ev.iconColor} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 leading-snug truncate">
                    <strong className="font-extrabold text-slate-900">{ev.actor}</strong>{' '}
                    <span className="text-slate-600">{ev.action}</span>{' '}
                    <strong className="font-extrabold text-slate-900">{ev.target}</strong>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 mt-2 flex justify-center">
        <button
          onClick={() => onNavigateToTab?.('Supervisor')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Ver todas las actividades</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
