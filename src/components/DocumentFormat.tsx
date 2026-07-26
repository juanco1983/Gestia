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

  const add = (node: React.ReactNode) => {
    pages.push(node);
    pageNum++;
  };

  add(<PaginaPortada key="p1" report={report} ot={ot} client={client} />);
  add(<PaginaInformeTecnico key="p2" report={report} ot={ot} client={client} pageNum={pageNum} />);
  add(<PaginaCaracteristicas key="p3" report={report} ot={ot} client={client} pageNum={pageNum} />);
  add(<PaginaMedicionesElectricas key="p4" report={report} ot={ot} client={client} pageNum={pageNum} />);

  if (template.tieneBaterias) {
    add(<PaginaMedicionesBaterias key="p-bat" report={report} ot={ot} client={client} pageNum={pageNum} />);
  }
  if (template.tieneHistorialAlarmas) {
    add(<PaginaHistorialAlarmas key="p-alarm" report={report} ot={ot} client={client} pageNum={pageNum} />);
  }

  for (let p = 0; p < photoPageCount; p++) {
    const startIdx = p * photosPerPage;
    const count = Math.min(photosPerPage, totalPhotos - startIdx);
    add(
      <PaginaFotografias
        key={`p-foto-${p}`}
        report={report}
        ot={ot}
        client={client}
        pageNum={pageNum}
        startIdx={startIdx}
        count={count}
      />
    );
  }

  add(<PaginaDiagnosticoRecomendaciones key="p-fin" report={report} ot={ot} client={client} pageNum={pageNum} />);

  return (
    <div className="space-y-8 print:space-y-0" id="official-printout-report-doc">
      {pages}
    </div>
  );
}
