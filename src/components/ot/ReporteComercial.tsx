import React from 'react';
import { UserCheck } from 'lucide-react';

interface CommercialReportItem {
  comercial: string;
  facturado: number;
  pendiente: number;
  total: number;
  cartera: number;
  cuotas: number;
  ots: number;
  pctEjecucion: number;
}

interface ReporteComercialProps {
  reportComercial: CommercialReportItem[];
}

export default function ReporteComercial({ reportComercial }: ReporteComercialProps) {
  return (
    <div className="space-y-6" id="ot-reporte-comercial">
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-base font-black text-slate-800">Cartera de Ejecutivos y Facturación</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Cartera comprometida (sub_importe), nº de OTs y cuotas ejecutadas por gestor comercial. Reemplaza las hojas de Excel individuales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportComercial.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-6 text-center col-span-full">No hay comerciales registrados en las OTs de este año.</p>
        ) : (
          reportComercial.map(rep => (
            <div key={rep.comercial} className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-md transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-teal-brand" size={16} />
                  {rep.comercial}
                </span>
                <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Vendedor</span>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-semibold">Cartera comprometida:</span>
                  <strong className="font-mono font-black text-teal-brand">${rep.cartera.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-semibold">Facturado real:</span>
                  <strong className="font-mono font-bold text-slate-600">${rep.facturado.toLocaleString()}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">{rep.ots} {rep.ots === 1 ? 'OT' : 'OTs'}</span>
                  <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{rep.cuotas} {rep.cuotas === 1 ? 'cuota' : 'cuotas'}</span>
                  <span className="text-[10px] font-bold font-mono bg-teal-mist text-teal-brand px-2 py-0.5 rounded-md">{rep.pctEjecucion}% ejecutado</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-xs">
                  <span className="text-slate-700 font-black">Cartera Total (USD):</span>
                  <strong className="font-mono font-extrabold text-lg text-slate-900">${rep.total.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-semibold">Backlog a facturar:</span>
                  <strong className="font-mono font-extrabold text-base text-slate-900">{rep.cuotas}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
