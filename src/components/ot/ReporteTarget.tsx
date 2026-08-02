import React from 'react';
import { OrdenTrabajoLinea, TargetVentas } from '../../types';

interface TargetReportItem extends TargetVentas {
  actual: number;
  cumplimiento: number;
}

interface ReporteTargetProps {
  lineas: OrdenTrabajoLinea[];
  targetVentas: TargetVentas[];
  targetReport: TargetReportItem[];
}

export default function ReporteTarget({ lineas, targetVentas, targetReport }: ReporteTargetProps) {
  const totalFacturado = lineas.filter(l => l.estado === 'FACTURADO').reduce((acc, curr) => acc + curr.total_usd, 0);
  const totalTarget = targetVentas.reduce((acc, curr) => acc + curr.target_ventas_usd, 0);

  return (
    <div className="space-y-6 text-left" id="ot-reporte-target">
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800">Control de Metas de Ventas Anual</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Comparación mes a mes de facturación real realizada (FACTURADO en USD) vs. la meta comercial programada.
          </p>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex gap-4 font-mono text-[11px] font-bold border border-slate-800 shadow-sm shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-black">Total Facturado</span>
            <span className="text-sm font-black text-teal-brand">${totalFacturado.toLocaleString()} USD</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase font-black">Meta Consolidada</span>
            <span className="text-sm font-black text-slate-100">${totalTarget.toLocaleString()} USD</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 font-mono text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="px-5 py-3">Mes Operativo</th>
              <th className="px-5 py-3">Meta Programada (USD)</th>
              <th className="px-5 py-3">Billed Real (USD)</th>
              <th className="px-5 py-3">Diferencia Comercial</th>
              <th className="px-5 py-3">% de Cumplimiento</th>
              <th className="px-5 py-3 text-center">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targetReport.map(report => {
              const diff = report.actual - report.target_ventas_usd;
              const percent = report.cumplimiento;
              return (
                <tr key={report.id} className="hover:bg-slate-50/40 transition-colors text-xs font-medium">
                  <td className="px-5 py-4 font-black text-slate-800 font-mono">{report.mes} {report.anio}</td>
                  <td className="px-5 py-4 font-mono text-slate-600 font-bold">${report.target_ventas_usd.toLocaleString()}</td>
                  <td className="px-5 py-4 font-mono font-black text-slate-900">${report.actual.toLocaleString()}</td>
                  <td className={`px-5 py-4 font-mono font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 w-full max-w-[140px]">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full ${percent >= 100 ? 'bg-teal-brand' : percent >= 70 ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-black text-slate-800 shrink-0">{percent.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
                      percent >= 100 
                        ? 'bg-teal-mist text-teal-brand border border-teal-brand/20' 
                        : percent >= 70 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/20' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200/20'
                    }`}>
                      {percent >= 100 ? 'META LOGRADA' : percent >= 70 ? 'CUBIERTO PARCIAL' : 'BAJO LA META'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
