import React from 'react';
import { TechnicalReport, OT, Client, ServiceType } from '../types';
import { getTemplate, getPhotoSlotsForTipo } from '../utils/serviceTemplates';
import PaginaPortada from './pdf/PaginaPortada';
import PaginaInformeTecnico from './pdf/PaginaInformeTecnico';
import PaginaCaracteristicas from './pdf/PaginaCaracteristicas';
import PaginaMedicionesElectricas from './pdf/PaginaMedicionesElectricas';
import PaginaMedicionesBaterias from './pdf/PaginaMedicionesBaterias';
import PaginaHistorialAlarmas from './pdf/PaginaHistorialAlarmas';
import PaginaDiagnosticoRecomendaciones from './pdf/PaginaDiagnosticoRecomendaciones';
import PaginaFotografias from './pdf/PaginaFotografias';

import ErrorBoundary from './shared/ErrorBoundary';

interface DocumentFormatProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
}

export default function DocumentFormat({ report, ot, client }: DocumentFormatProps) {
  const tipo = report.tipoServicio ?? ot.tipoMantenimiento ?? ServiceType.PREVENTIVO;
  const template = getTemplate(tipo);
  const totalPhotos = getPhotoSlotsForTipo(tipo, ot.potenciaKva);
  const photosPerPage = 8;
  const photoPageCount = Math.ceil(totalPhotos / photosPerPage);

  let pageNum = 1;
  const pages: React.ReactNode[] = [];

  const add = (keyStr: string, node: React.ReactNode) => {
    pages.push(
      <ErrorBoundary key={keyStr} fallback={
        <div className="mafort-pdf-page w-full max-w-[800px] min-h-[200px] mx-auto bg-white border border-slate-200 p-6 text-center text-slate-400 font-mono text-xs">
          Sección de informe ({keyStr}) en procesamiento de datos.
        </div>
      }>
        {node}
      </ErrorBoundary>
    );
    pageNum++;
  };

  add("p1", <PaginaPortada report={report} ot={ot} client={client} />);
  add("p2", <PaginaInformeTecnico report={report} ot={ot} client={client} pageNum={pageNum} />);
  add("p3", <PaginaCaracteristicas report={report} ot={ot} client={client} pageNum={pageNum} />);
  add("p4", <PaginaMedicionesElectricas report={report} ot={ot} client={client} pageNum={pageNum} />);

  if (template.tieneBaterias) {
    add("p-bat", <PaginaMedicionesBaterias report={report} ot={ot} client={client} pageNum={pageNum} />);
  }
  if (template.tieneHistorialAlarmas) {
    add("p-alarm", <PaginaHistorialAlarmas report={report} ot={ot} client={client} pageNum={pageNum} />);
  }

  for (let p = 0; p < photoPageCount; p++) {
    const startIdx = p * photosPerPage;
    const count = Math.min(photosPerPage, totalPhotos - startIdx);
    add(
      `p-foto-${p}`,
      <PaginaFotografias
        report={report}
        ot={ot}
        client={client}
        pageNum={pageNum}
        startIdx={startIdx}
        count={count}
      />
    );
  }

  add("p-fin", <PaginaDiagnosticoRecomendaciones report={report} ot={ot} client={client} pageNum={pageNum} />);

  return (
    <div className="space-y-8 print:space-y-0" id="official-printout-report-doc">
      {pages}
    </div>
  );
}
