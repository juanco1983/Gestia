import React from 'react';
import { TechnicalReport, OT, Client, ServiceType } from '../../types';
import { ALL_ACCIONES } from '../../utils/reportDefaults';
import { getTemplate } from '../../utils/serviceTemplates';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaInformeTecnicoProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

export default function PaginaInformeTecnico({ report, ot, client, pageNum }: PaginaInformeTecnicoProps) {
  const infoN = report.informeN || `INF-2026-${ot.id.replace('OT-', '')}`;
  const hojaServ = report.hojaServicioN || `HJ-544-${ot.id.replace('OT-', '')}`;
  const fechaSel = report.fechaServicio || ot.fechaProgramada || new Date().toISOString().split('T')[0];
  const horaSel = report.horaInicio || '09:00 AM';
  const tech1 = report.tecnico1 || ot.tecnicoTitular;
  const tech2 = report.tecnico2 || ot.tecnicoApoyo || 'Ninguno';
  const c = report.caracteristicas || {};
  const tipo = report.tipoServicio ?? ot.tipoMantenimiento ?? ServiceType.PREVENTIVO;
  const template = getTemplate(tipo);
  const pasosLista = report.pasosLista ?? template.pasos.map((desc, i) => ({ numero: i + 1, descripcion: desc }));

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-5 text-[9px] leading-relaxed">
        <h2 className="text-center font-bold text-slate-900 border-b border-double border-slate-900 pb-1 text-sm tracking-widest font-mono">
          INFORME TECNICO #{infoN}
        </h2>
        <table className="w-full text-left border-collapse border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 w-1/4 bg-slate-50">EMPRESA</td>
              <td className="p-1 px-2 text-slate-800 font-bold uppercase">: {client.razonSocial}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">LOCAL / SEDE</td>
              <td className="p-1 px-2 text-slate-700">: {client.direccionSede} - {client.distrito}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">ENCARGADO</td>
              <td className="p-1 px-2 text-slate-700 font-medium">: {client.contactoNombre}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">ASUNTO</td>
              <td className="p-1 px-2 text-slate-900 font-bold uppercase">: {template.display} DE {ot.tipoEquipo} DE {ot.potenciaKva} KVA {c['MARCA'] && `- ${c['MARCA']} ${c['MODELO']}`}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">FECHA DEL SERVICIO</td>
              <td className="p-1 px-2 text-slate-700 font-mono font-bold">: {fechaSel} (Hora Inicio: {horaSel}{report.horaFin ? ` / Fin: ${report.horaFin}` : ''})</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">TECNICOS RESPONSABLES</td>
              <td className="p-1 px-2 text-slate-800 font-bold">: {tech1} {tech2 !== 'Ninguno' ? ` / ${tech2}` : ''}</td>
            </tr>
            <tr>
              <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">N HOJA DE SERVICIO</td>
              <td className="p-1 px-2 text-blue-700 font-mono font-bold">: {hojaServ}</td>
            </tr>
          </tbody>
        </table>
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">ANTECEDENTES:</h3>
          <p className="text-slate-700 text-justify font-sans leading-normal">
            {report.antecedentes || `El siguiente informe Tecnico se presenta a solicitud de la empresa: "${client.razonSocial}" de acuerdo con la programacion y coordinacion con el responsable por parte del Cliente, el "${client.contactoNombre}". El servicio se efectuo el dia: ${fechaSel}. El equipo intervenido es el identificado como el UPS de potencia: ${ot.potenciaKva} KVA, marca: "${c['MARCA'] || 'MARCA'}", modelo: "${c['MODELO'] || 'MODELO'}" y con numero serie: "${c['SERIE'] || 'SERIE'}".`}
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">ACCIONES REALIZADAS:</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-slate-200 p-3.5 bg-slate-50 rounded-lg">
            {ALL_ACCIONES.map((action, idx) => {
              const isChecked = report.accionesRealizadas ? report.accionesRealizadas.includes(action) : true;
              return (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-0.5 text-[8px] font-sans">
                  <span className="text-slate-700 font-medium">{action}</span>
                  <span className="font-mono font-bold text-blue-700 bg-white border border-slate-300 rounded px-1.5 py-0.2 ml-2 min-w-[20px] text-center">
                    {isChecked ? 'X' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase text-[10px]">CRONOGRAMA DE PROCEDIMIENTO:</h3>
          <div className="space-y-2">
            {pasosLista.map((paso, idx) => (
              <div key={idx} className="bg-slate-50/50 p-2 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N{idx + 1}: {paso.titulo || ''}</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
