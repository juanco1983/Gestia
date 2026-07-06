import React from 'react';
import { UserCheck } from 'lucide-react';

interface CommercialReportItem {
  comercial: string;
  facturado: number;
  pendiente: number;
  total: number;
}

interface ReporteComercialProps {
  reportComercial: CommercialReportItem[];
}

export default function ReporteComercial({ reportComercial }: ReporteComercialProps) {
  return (
    <div className="space-y-6" id="ot-reporte-comercial">
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150">
        <h3 className="text-base font-black text-slate-800">Cartera de Ejecutivos y Facturación</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Ventas en dólares adjudicadas, ejecutadas y pendientes de cobrar agrupadas por gestor comercial. Reemplaza las hojas de Excel individuales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportComercial.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-6 text-center col-span-full">No hay comerciales registrados en las OTs de este año.</p>
        ) : (
          reportComercial.map(rep => (
            <div key={rep.comercial} className="bg-white border border-slate-150 rounded-3xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-[#00B594]" size={16} />
                  {rep.comercial}
                </span>
                <span className="text-[9px] font-black font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Vendedor</span>
              </div>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-semibold">Facturado Real:</span>
                  <strong className="font-mono font-black text-[#00B594]">${rep.facturado.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-semibold">Pendiente de Facturar:</span>
                  <strong className="font-mono font-bold text-slate-600">${rep.pendiente.toLocaleString()}</strong>
                </div>
                
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-xs">
                  <span className="text-slate-700 font-black">Cartera Total (USD):</span>
                  <strong className="font-mono font-extrabold text-lg text-slate-900">${rep.total.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
