import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { OrdenTrabajoLinea } from '../../types';

export interface ContratoAuditoriaAlerta {
  contratoId: string;
  n_contrato: string;
  cliente: string;
  montoBase: number;
  sumaAdendas: number;
  adendasCount: number;
  totalContrato: number;
  totalContratoConIgv: number;
  consumido: number;
  consumidoConIgv: number;
  saldo: number;
  exceso: number;
  isExceeded: boolean;
  isHighRisk?: boolean;
  pctConsumo?: number;
  cuotasCount: number;
  simbolo_moneda: string;
}

interface PanelAlertasProps {
  contractWarnings: ContratoAuditoriaAlerta[];
  overdueFacturaLines: OrdenTrabajoLinea[];
  soonToExecuteLines: OrdenTrabajoLinea[];
}

export default function PanelAlertas({
  contractWarnings,
  overdueFacturaLines,
  soonToExecuteLines
}: PanelAlertasProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Si no hay alertas críticas ni cuotas atrasadas, el panel permanece oculto y no ocupa espacio.
  if (contractWarnings.length === 0 && overdueFacturaLines.length === 0) {
    return null;
  }

  const criticalCount = contractWarnings.filter(w => w.isExceeded).length;
  const warningCount = contractWarnings.filter(w => !w.isExceeded).length;

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col gap-3.5" id="ot-panel-alertas">
      <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-amber-500 shrink-0" size={16} />
          <span>Panel de Alertas y Excepciones Presupuestales</span>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {contractWarnings.length} {contractWarnings.length === 1 ? 'contrato con aviso' : 'contratos con avisos'}
          </span>
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {criticalCount} en exceso
            </span>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-600 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Contraer' : 'Expandir'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[11px] pt-1">
          {contractWarnings.map(w => {
            const currency = w.simbolo_moneda || '$';

            if (w.isExceeded) {
              return (
                <div key={w.contratoId} className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex flex-col gap-2 shadow-sm text-rose-800">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold flex items-center gap-1.5 text-xs">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                      <span>Contrato #{w.n_contrato} ({w.cliente})</span>
                    </span>
                    <span className="text-[9px] font-mono font-black uppercase bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded-full">
                      Presupuesto Excedido
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white/90 p-2 rounded-xl border border-rose-200 text-center font-mono text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Total (Base+{w.adendasCount} Adendas)</span>
                      <strong className="text-slate-800">{currency}{w.totalContrato.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Cuotas ({w.cuotasCount})</span>
                      <strong className="text-rose-700">{currency}{w.consumido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span className="text-rose-600 block text-[9px] font-bold">Exceso Real</span>
                      <strong className="text-rose-600 font-black">+{currency}{w.exceso.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={w.contratoId} className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex flex-col gap-2 shadow-sm text-amber-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <Info size={14} className="text-amber-600 shrink-0" />
                      <span>Contrato #{w.n_contrato} ({w.cliente})</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Consumo Alto ({w.pctConsumo?.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-xl border border-amber-100 text-center font-mono text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Total Vigente</span>
                      <strong className="text-slate-800">{currency}{w.totalContrato.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Consumido ({w.cuotasCount})</span>
                      <strong className="text-amber-700">{currency}{w.consumido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span className="text-teal-700 block text-[9px] font-bold">Saldo Disponible</span>
                      <strong className="text-teal-700 font-black">{currency}{w.saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
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
      )}
    </div>
  );
}
