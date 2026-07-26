import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaDiagnosticoRecomendacionesProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

export default function PaginaDiagnosticoRecomendaciones({ report, ot, client, pageNum }: PaginaDiagnosticoRecomendacionesProps) {
  const recs = report.recomendaciones ?? [];
  const diagnostico = report.observacionesDiagnostico || '';

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-4 text-[9px]">
        <h2 className="text-center font-bold text-slate-900 border-b border-slate-300 pb-1 text-[11px] tracking-wider font-mono">
          DIAGNOSTICO Y RECOMENDACIONES
        </h2>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-700 uppercase text-[9px]">Diagnostico del Equipo UPS:</h3>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[60px]">
            {diagnostico ? (
              <p className="text-slate-700 text-justify leading-relaxed">{diagnostico}</p>
            ) : (
              <p className="text-slate-400 italic">Sin diagnostico registrado.</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-700 uppercase text-[9px]">Recomendaciones:</h3>
          <ul className="space-y-1">
            {recs.length > 0 ? (
              recs.map((r, idx) => (
                <li key={idx} className="flex gap-2 text-[8px]">
                  <span className="text-teal-700 font-bold shrink-0 mt-0.5">-</span>
                  <span className="text-slate-700">{r}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic text-[8px]">Sin recomendaciones registradas.</li>
            )}
          </ul>
        </div>
        <div className="border-t border-slate-300 pt-4 mt-6">
          <div className="text-[8px] text-slate-500 italic mb-1">Sin otro particular.</div>
          <div className="text-[8px] text-slate-500 italic mb-4">Atentamente,</div>
          <div className="grid grid-cols-2 gap-8 mt-4">
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px]"></div>
              <div className="text-[8px] font-bold text-slate-800">MAFORT SERVICE S.A.C</div>
              <div className="text-[7px] text-slate-500">SOPORTE TECNICO</div>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px]">
                {report.firmaCliente ? (
                  <img src={report.firmaCliente} alt="Firma Cliente" className="h-10 mx-auto" />
                ) : (
                  <span className="text-[7px] text-slate-400 font-mono">FIRMA CLIENTE</span>
                )}
              </div>
              <div className="text-[8px] font-bold text-slate-800">CLIENTE</div>
              <div className="text-[7px] text-slate-500">RESPONSABLE DE SEDE</div>
            </div>
          </div>
        </div>
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
