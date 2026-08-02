import React from 'react';
import { AlertTriangle, Clock, Calendar, Info } from 'lucide-react';
import { OrdenTrabajoLinea } from '../../types';

interface PanelAlertasProps {
  macroWarnings: Array<{ ot_marco: number; expected: number; actual: number; simbolo_moneda: string }>;
  overdueFacturaLines: OrdenTrabajoLinea[];
  soonToExecuteLines: OrdenTrabajoLinea[];
}

export default function PanelAlertas({
  macroWarnings,
  overdueFacturaLines,
  soonToExecuteLines
}: PanelAlertasProps) {
  if (macroWarnings.length === 0 && overdueFacturaLines.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col gap-3.5" id="ot-panel-alertas">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
        <AlertTriangle className="text-teal-brand shrink-0" size={16} />
        <span>Panel de Alertas y Auditoría Financiera Operacional</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[11px]">
        {macroWarnings.map(w => {
          const isExceeded = w.actual > w.expected;
          const currency = w.simbolo_moneda || '$';
          const difference = Math.abs(w.expected - w.actual);

          if (isExceeded) {
            return (
              <div key={w.ot_marco} className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex justify-between items-center shadow-sm text-rose-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                  <span>
                    <strong className="font-extrabold font-mono">OT Marco #{w.ot_marco}</strong> excede presupuesto:
                  </span>
                </span>
                <span className="font-mono text-right leading-normal">
                  Contrato: <strong className="font-bold text-slate-800">{currency}{w.expected.toLocaleString()}</strong> <br />
                  Suma Cuotas: <strong className="font-bold text-rose-600">{currency}{w.actual.toLocaleString()}</strong> <br />
                  <span className="text-[10px] font-bold text-rose-500">Exceso: +{currency}{difference.toLocaleString()}</span>
                </span>
              </div>
            );
          } else {
            // Under-budget is a completely normal "in-progress" status, styled with pleasant info colors (blue/slate)
            return (
              <div key={w.ot_marco} className="bg-blue-50/70 border border-blue-100/80 p-3 rounded-xl flex justify-between items-center shadow-sm text-blue-800">
                <span className="font-semibold flex items-center gap-1.5">
                  <Info size={13} className="text-blue-500 shrink-0" />
                  <span>
                    <strong className="font-extrabold font-mono">OT Marco #{w.ot_marco}</strong> (Distribución en progreso):
                  </span>
                </span>
                <span className="font-mono text-right leading-normal text-blue-800">
                  Total Contrato: <strong className="font-bold text-slate-800">{currency}{w.expected.toLocaleString()}</strong> <br />
                  Programado: <strong className="font-bold text-blue-700">{currency}{w.actual.toLocaleString()}</strong> <br />
                  <span className="text-[10px] font-extrabold text-blue-600">Por programar: {currency}{difference.toLocaleString()}</span>
                </span>
              </div>
            );
          }
        })}
        
        {overdueFacturaLines.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex justify-between items-center md:col-span-2 shadow-sm text-amber-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>
                Se detectaron <strong className="font-mono font-black text-rose-600">{overdueFacturaLines.length}</strong> cuotas programadas para meses pasados que siguen pendientes de facturación.
              </span>
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold font-mono shrink-0">
              Requiere Facturar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
