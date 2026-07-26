import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaPortadaProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
}

export default function PaginaPortada({ report, ot, client }: PaginaPortadaProps) {
  const c = report.caracteristicas || {};

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-8 text-center px-4">
        <div className="space-y-4 max-w-lg">
          <h1 className="text-xl font-extrabold text-slate-950 font-sans tracking-tight uppercase leading-snug">
            SERVICIO DE MANTENIMIENTO PREVENTIVO DE UPS
          </h1>
          <h2 className="text-base font-bold text-slate-800 uppercase leading-snug font-mono">
            "UPS - {ot.id.replace('OT-', '')}" DE "CAPACIDAD {ot.potenciaKva} KVA" - "{c['MARCA'] || 'MARCA'}"
          </h2>
          <div className="h-1.5 w-24 bg-blue-700 mx-auto rounded-full"></div>
          <p className="text-sm font-semibold text-slate-800 font-sans tracking-tight uppercase">
            EMPRESA: "{client.razonSocial}"
          </p>
          <p className="text-[11px] font-medium text-slate-500 font-sans uppercase">
            AREA: {c['UBICACIÓN'] || 'SALA DE BASE CRITICA'}
          </p>
        </div>
        <div className="p-6 border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col items-center space-y-2 select-none shadow-xs">
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-3xl font-extrabold text-blue-900 font-mono tracking-wider">Mafor<span className="text-emerald-500">t</span></span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-mono">SERVICIOS DE SOPORTE DE ENERGIA CRITICA</span>
        </div>
        <div className="w-full max-w-md border border-slate-300 p-5 rounded-lg text-left bg-slate-50 space-y-2.5 font-sans">
          <div className="grid grid-cols-12 text-[10px] gap-y-1.5 text-slate-700">
            <div className="col-span-4 font-mono font-bold uppercase text-slate-400">DIRECCION:</div>
            <div className="col-span-8 font-bold text-slate-900">{client.direccionSede}, {client.distrito}</div>
            <div className="col-span-4 font-mono font-bold uppercase text-slate-400">CONTACTO:</div>
            <div className="col-span-8 font-medium text-slate-800">{client.contactoNombre}</div>
            <div className="col-span-4 font-mono font-bold uppercase text-slate-400">CARGO:</div>
            <div className="col-span-8 text-slate-600 font-medium">Responsable Logistico / Data Center</div>
            <div className="col-span-4 font-mono font-bold uppercase text-slate-400">MOVIL:</div>
            <div className="col-span-8 text-slate-800 font-mono">{client.contactoTelefono || '9993709'}</div>
            <div className="col-span-4 font-mono font-bold uppercase text-slate-400">EMAIL:</div>
            <div className="col-span-8 text-blue-600 font-mono font-bold lowercase">{client.contactoEmail}</div>
          </div>
        </div>
      </div>
      <PdfFooter />
    </div>
  );
}
