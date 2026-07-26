import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';
import BatteryBarChart from './BatteryBarChart';

interface PaginaMedicionesBateriasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

export default function PaginaMedicionesBaterias({ report, ot, client, pageNum }: PaginaMedicionesBateriasProps) {
  const bat = report.medicionesBaterias;
  const banco1 = bat?.banco1 ?? [];
  const banco2 = bat?.banco2 ?? [];

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-4 text-[9px]">
        <h2 className="text-center font-bold text-slate-900 border-b border-slate-300 pb-1 text-[11px] tracking-wider font-mono">
          MEDICIONES DEL BANCO DE BATERIAS
        </h2>
        {banco1.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-700 uppercase text-[9px]">Banco 1 (Interno)</h3>
            <table className="w-full border-collapse border border-slate-300 text-[7px]">
              <thead>
                <tr className="bg-slate-800 text-white font-mono uppercase text-[6px]">
                  <th className="p-1 border border-slate-300">#</th>
                  <th className="p-1 border border-slate-300">V. Flotacion (VDC)</th>
                  <th className="p-1 border border-slate-300">Resistencia Interna (mOhm)</th>
                  <th className="p-1 border border-slate-300">SOH %</th>
                </tr>
              </thead>
              <tbody>
                {banco1.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="p-1 border border-slate-200 text-center font-mono">{String(b.numero).padStart(2, '0')}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.voltajeFlotacion}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.resistenciaInterna ?? '-'}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.soh != null ? `${b.soh}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="border border-slate-200 rounded-lg p-2">
                <div className="text-[7px] font-mono text-slate-500 text-center mb-1">Voltaje Flotacion B1 (VDC)</div>
                <BatteryBarChart data={banco1} tipo="voltaje" />
              </div>
              <div className="border border-slate-200 rounded-lg p-2">
                <div className="text-[7px] font-mono text-slate-500 text-center mb-1">Resistencia Interna B1 (mOhm)</div>
                <BatteryBarChart data={banco1} tipo="resistencia" />
              </div>
            </div>
          </div>
        )}
        {banco2.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-700 uppercase text-[9px]">Banco 2 (Externo)</h3>
            <table className="w-full border-collapse border border-slate-300 text-[7px]">
              <thead>
                <tr className="bg-slate-800 text-white font-mono uppercase text-[6px]">
                  <th className="p-1 border border-slate-300">#</th>
                  <th className="p-1 border border-slate-300">V. Flotacion (VDC)</th>
                  <th className="p-1 border border-slate-300">Resistencia Interna (mOhm)</th>
                  <th className="p-1 border border-slate-300">SOH %</th>
                </tr>
              </thead>
              <tbody>
                {banco2.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="p-1 border border-slate-200 text-center font-mono">{String(b.numero).padStart(2, '0')}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.voltajeFlotacion}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.resistenciaInterna ?? '-'}</td>
                    <td className="p-1 border border-slate-200 text-center font-mono">{b.soh != null ? `${b.soh}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="border border-slate-200 rounded-lg p-2">
                <div className="text-[7px] font-mono text-slate-500 text-center mb-1">Voltaje Flotacion B2 (VDC)</div>
                <BatteryBarChart data={banco2} tipo="voltaje" />
              </div>
              <div className="border border-slate-200 rounded-lg p-2">
                <div className="text-[7px] font-mono text-slate-500 text-center mb-1">Resistencia Interna B2 (mOhm)</div>
                <BatteryBarChart data={banco2} tipo="resistencia" />
              </div>
            </div>
          </div>
        )}
        {bat?.notas && (
          <p className="text-[7px] text-slate-400 italic">Notas: {bat.notas}</p>
        )}
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
