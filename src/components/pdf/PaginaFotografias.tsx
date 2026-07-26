import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaFotografiasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
  startIdx?: number;
  count?: number;
}

export default function PaginaFotografias({ report, ot, client, pageNum, startIdx = 0, count = 8 }: PaginaFotografiasProps) {
  const photos = Array.from({ length: count }).map((_, i) => {
    const idx = startIdx + i;
    const existing = report.fotosLabeled?.[idx];
    return {
      slotName: existing?.slotName || `Foto S.L.A Slot #${idx + 1}`,
      base64: existing?.base64 || '',
      description: existing?.description
    };
  });

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1">
        <h2 className="text-center font-bold text-slate-900 border-b border-slate-300 pb-1 text-[11px] tracking-wider font-mono mb-4">
          REGISTRO FOTOGRAFICO DEL SERVICIO
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
              <div className="relative bg-slate-50 flex items-center justify-center min-h-[155px]">
                {photo.base64 ? (
                  <img src={photo.base64} alt={photo.slotName} className="w-full h-[155px] object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 p-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span className="text-[7px] font-mono mt-1">FOTO #{startIdx + idx + 1}</span>
                  </div>
                )}
                {photo.base64 && (
                  <span className="absolute bottom-1 right-2 text-[6px] text-slate-400 font-mono bg-white/80 px-1 rounded">
                    {ot.id} - EVIDENCIA #{startIdx + idx + 1}
                  </span>
                )}
              </div>
              <div className="px-2 py-1 border-t border-slate-100">
                <span className="text-[7.5px] font-bold uppercase font-mono text-slate-500">
                  {String(startIdx + idx + 1).padStart(2, '0')}. {photo.slotName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
