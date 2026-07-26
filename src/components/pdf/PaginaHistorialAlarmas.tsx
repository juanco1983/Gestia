import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaHistorialAlarmasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

export default function PaginaHistorialAlarmas({ report, ot, client, pageNum }: PaginaHistorialAlarmasProps) {
  const alarmas = report.historialAlarmas ?? [];

  if (alarmas.length === 0) return null;

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-3 text-[9px]">
        <h2 className="text-center font-bold text-slate-900 border-b border-slate-300 pb-1 text-[11px] tracking-wider font-mono">
          HISTORIAL DE ALARMAS SEGUN DISPLAY
        </h2>
        <table className="w-full border-collapse border border-slate-300 text-[6px]">
          <thead>
            <tr className="bg-slate-800 text-white font-mono uppercase text-[5px]">
              <th className="p-1 border border-slate-300">N ALARMA</th>
              <th className="p-1 border border-slate-300">EVENTO</th>
              <th className="p-1 border border-slate-300">FECHA</th>
              <th className="p-1 border border-slate-300">HORA</th>
              <th className="p-1 border border-slate-300">CODIGO</th>
              <th className="p-1 border border-slate-300">DESCRIPCION</th>
            </tr>
          </thead>
          <tbody>
            {alarmas.map((a, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                <td className="p-1 border border-slate-200 text-center font-mono">{a.numero}</td>
                <td className="p-1 border border-slate-200 text-center">{a.evento}</td>
                <td className="p-1 border border-slate-200 text-center font-mono">{a.fecha}</td>
                <td className="p-1 border border-slate-200 text-center font-mono">{a.hora}</td>
                <td className="p-1 border border-slate-200 text-center font-mono">{a.codigo}</td>
                <td className="p-1 border border-slate-200">{a.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
