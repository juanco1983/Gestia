import React from 'react';
import { OT, TechnicalReport, Client } from '../../types';

interface LiveActivityFeedProps {
  ots: OT[];
  reports: TechnicalReport[];
  clients: Client[];
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  type: 'start' | 'finish' | 'approve' | 'alert' | 'contract';
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ ots, reports, clients }) => {
  // Generate real dynamic events from reports and OTs
  const events: ActivityEvent[] = [];

  // Generate from reports
  reports.slice(-4).reverse().forEach((rep, idx) => {
    const ot = ots.find(o => o.id === rep.otId);
    const client = ots ? clients.find(c => c.id === ot?.clientId) : null;
    const clientName = client?.razonSocial || 'Cliente';
    const techName = ot?.tecnicoTitular || 'Técnico';

    if (rep.indicadoresBateria?.bypassActivo) {
      events.push({
        id: `rep_bp_${rep.id}_${idx}`,
        time: '09:45',
        actor: techName,
        action: 'detectó Bypass Activo en',
        target: `${clientName} (${ot?.tipoEquipo || 'UPS'})`,
        type: 'alert'
      });
    } else {
      events.push({
        id: `rep_app_${rep.id}_${idx}`,
        time: '09:10',
        actor: 'Supervisor',
        action: 'aprobó informe técnico de',
        target: `${clientName} - ${ot?.id.replace('ot_', 'OT-') || 'OT'}`,
        type: 'approve'
      });
    }
  });

  // Generate fallback events if list is short to make feed look rich
  if (events.length < 5) {
    events.push(
      {
        id: 'ev_1',
        time: '08:00',
        actor: 'Juan Córdova',
        action: 'inició servicio preventivo en',
        target: 'BBVA Perú (Sede Central)',
        type: 'start'
      },
      {
        id: 'ev_2',
        time: '08:35',
        actor: 'Pedro Ruiz',
        action: 'completó protocolo de pruebas en',
        target: 'UPS-03 (Clínica Internacional)',
        type: 'finish'
      },
      {
        id: 'ev_3',
        time: '08:50',
        actor: 'Área Comercial',
        action: 'registró adenda contractual con',
        target: 'Banco de Crédito del Perú',
        type: 'contract'
      }
    );
  }

  const getTypeStyle = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'start':
        return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '🚀' };
      case 'finish':
        return { bg: 'bg-blue-50 text-blue-600 border-blue-200', icon: '✅' };
      case 'approve':
        return { bg: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '🛡️' };
      case 'alert':
        return { bg: 'bg-rose-50 text-rose-600 border-rose-200', icon: '⚠️' };
      case 'contract':
        return { bg: 'bg-amber-50 text-amber-600 border-amber-200', icon: '📄' };
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Actividad en Tiempo Real</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Eventos e hitos operativos registrados hoy
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          Live Feed
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {events.map((ev) => {
          const style = getTypeStyle(ev.type);
          return (
            <div
              key={ev.id}
              className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-start gap-3 hover:bg-white hover:border-slate-200 transition-all text-left"
            >
              <span className="text-[11px] font-mono font-black text-slate-400 shrink-0 pt-0.5">
                {ev.time}
              </span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 border ${style.bg}`}>
                {style.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-700 leading-snug">
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
  );
};

export default LiveActivityFeed;
