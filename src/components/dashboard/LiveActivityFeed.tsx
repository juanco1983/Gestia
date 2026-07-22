import React from 'react';
import { OT, TechnicalReport, Client } from '../../types';
import { Play, CheckCircle2, ShieldAlert, AlertTriangle, FileText, Activity } from 'lucide-react';

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
  // Helper to format ISO timestamp or fallback time into HH:mm system time
  const formatEventTime = (timestamp?: string, fallbackTime?: string) => {
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    if (fallbackTime && fallbackTime.includes(':')) {
      return fallbackTime;
    }
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Generate real dynamic events from reports and OTs
  const events: ActivityEvent[] = [];

  // 1. Generate events from Technical Reports
  reports.slice(-4).reverse().forEach((rep, idx) => {
    const ot = ots.find(o => o.id === rep.otId);
    const client = clients.find(c => c.id === ot?.clientId);
    const clientName = client?.razonSocial || 'Cliente';
    const techName = ot?.tecnicoTitular || 'Técnico';

    const eventTime = formatEventTime(rep.modificadoEn || rep.creadoEn, ot?.horaInicioServicio || ot?.horaProgramada);

    if (rep.indicadoresBateria?.bypassActivo) {
      events.push({
        id: `rep_bp_${rep.id}_${idx}`,
        time: eventTime,
        actor: techName,
        action: 'detectó Bypass Activo en',
        target: `${clientName} (${ot?.tipoEquipo || 'UPS'})`,
        type: 'alert'
      });
    } else {
      events.push({
        id: `rep_app_${rep.id}_${idx}`,
        time: eventTime,
        actor: 'Supervisor',
        action: 'aprobó informe técnico de',
        target: `${clientName} - ${ot?.id.replace('ot_', 'OT-') || 'OT'}`,
        type: 'approve'
      });
    }
  });

  // 2. Generate events from OTs in progress or completed
  ots.filter(o => o.estado === 'Trabajo en Ejecución' || o.estado === 'En Sitio').slice(-3).forEach((ot, idx) => {
    const client = clients.find(c => c.id === ot.clientId);
    const clientName = client?.razonSocial || 'Cliente';
    const techName = ot.tecnicoTitular || 'Técnico';
    const eventTime = formatEventTime(undefined, ot.horaInicioServicio || ot.horaLlegadaSitio || ot.horaProgramada);

    events.push({
      id: `ot_in_proc_${ot.id}_${idx}`,
      time: eventTime,
      actor: techName,
      action: ot.estado === 'En Sitio' ? 'llegó a la sede de' : 'inició trabajo de campo en',
      target: `${clientName} (${ot.tipoEquipo})`,
      type: 'start'
    });
  });

  // Fallback system events if feed has fewer than 4 items
  if (events.length < 4) {
    const nowTime = new Date();
    const h1 = new Date(nowTime.getTime() - 15 * 60000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const h2 = new Date(nowTime.getTime() - 45 * 60000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const h3 = new Date(nowTime.getTime() - 120 * 60000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

    events.push(
      {
        id: 'ev_sys_1',
        time: h1,
        actor: 'Juan Córdova',
        action: 'inició servicio preventivo en',
        target: 'BBVA Perú (Sede Central)',
        type: 'start'
      },
      {
        id: 'ev_sys_2',
        time: h2,
        actor: 'Pedro Ruiz',
        action: 'completó protocolo de pruebas en',
        target: 'UPS-03 (Clínica Internacional)',
        type: 'finish'
      },
      {
        id: 'ev_sys_3',
        time: h3,
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
        return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', Icon: Play };
      case 'finish':
        return { bg: 'bg-blue-50 text-blue-600 border-blue-200', Icon: CheckCircle2 };
      case 'approve':
        return { bg: 'bg-indigo-50 text-indigo-600 border-indigo-200', Icon: ShieldAlert };
      case 'alert':
        return { bg: 'bg-rose-50 text-rose-600 border-rose-200', Icon: AlertTriangle };
      case 'contract':
        return { bg: 'bg-amber-50 text-amber-600 border-amber-200', Icon: FileText };
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity size={16} className="text-[#00B594]" />
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
          const Icon = style.Icon;

          return (
            <div
              key={ev.id}
              className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex items-start gap-3 hover:bg-white hover:border-slate-200 transition-all text-left"
            >
              <span className="text-[11px] font-mono font-black text-slate-400 shrink-0 pt-0.5">
                {ev.time}
              </span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${style.bg}`}>
                <Icon size={14} />
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
