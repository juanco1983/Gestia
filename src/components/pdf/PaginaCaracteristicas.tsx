import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaCaracteristicasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

export default function PaginaCaracteristicas({ report, ot, client, pageNum }: PaginaCaracteristicasProps) {
  const c = report.caracteristicas || {};
  const entries = Object.entries(c);

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-4 text-[9px]">
        <h3 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wide border-b border-slate-300 pb-0.5">
          CARACTERISTICAS TECNICAS DEL UPS Y EQUIPAMIENTO EVALUADO:
        </h3>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 font-sans">
            <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
              <thead>
                <tr className="bg-slate-900 text-white font-mono uppercase text-[7px] text-center">
                  <th className="p-1 px-2 border border-slate-300 text-left">FILTRO / COMPONENTE</th>
                  <th className="p-1 px-2 border border-slate-300">VALOR REGISTRADO EN INFOCAMPO</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 16).map(([key, val], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="p-1 px-2 border border-slate-200 font-bold text-slate-500 font-mono text-[7.5px] uppercase">{key}</td>
                    <td className="p-1 px-2 border border-slate-200 text-slate-800 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-span-5 space-y-2">
            <div className="border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center min-h-[120px]">
              {report.panoramaFoto ? (
                <img src={report.panoramaFoto} alt="Vista panoramica" className="w-full h-auto object-contain max-h-[120px]" />
              ) : (
                <span className="text-[7px] text-slate-400 uppercase font-mono">Vista Panoramica</span>
              )}
            </div>
            <div className="border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center min-h-[80px]">
              <span className="text-[7px] text-slate-400 uppercase font-mono">UPS</span>
            </div>
          </div>
        </div>
        {entries.length > 16 && (
          <div className="col-span-12">
            <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
              <tbody>
                {entries.slice(16).map(([key, val], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="p-1 px-2 border border-slate-200 font-bold text-slate-500 font-mono text-[7.5px] uppercase w-1/3">{key}</td>
                    <td className="p-1 px-2 border border-slate-200 text-slate-800 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
