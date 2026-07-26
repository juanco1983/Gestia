import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';

interface PdfHeaderProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
}

export default function PdfHeader({ report, ot, client }: PdfHeaderProps) {
  const infoN = report.informeN || `INF-2026-${ot.id.replace('OT-', '')}`;
  const fechaSel = report.fechaServicio || ot.fechaProgramada || new Date().toISOString().split('T')[0];
  const c = report.caracteristicas || {};

  return (
    <div className="border border-slate-900 text-[10px] uppercase font-sans mb-4 shrink-0 bg-white" style={{ contentVisibility: 'auto' }}>
      <div className="grid grid-cols-12 border-b border-slate-900">
        <div className="col-span-3 p-2 flex items-center justify-center border-r border-slate-900 bg-white">
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-blue-800 text-sm tracking-wider font-mono">Mafor<span className="text-emerald-500">t</span></span>
            <span className="text-[7px] text-slate-400 font-bold block shrink-0 font-mono">SERVICE S.A.C</span>
          </div>
        </div>
        <div className="col-span-6 p-2 text-center flex flex-col justify-center border-r border-slate-900 leading-tight">
          <strong className="text-[9px] font-bold text-slate-900 font-mono">
            SERVICIO DE MANTENIMIENTO PREVENTIVO
          </strong>
          <span className="text-[8px] text-slate-700 font-semibold block mt-0.5">
            DE "UPS - {ot.id.replace('OT-', '')}" DE "CAPACIDAD {ot.potenciaKva} KVA" - "{c['MARCA'] || 'MARCA'}"
          </span>
          <span className="text-[8px] text-slate-800 font-extrabold block">
            EMPRESA: "{client.razonSocial}"
          </span>
          <span className="text-[8px] text-slate-500 font-bold block">
            AREA: {c['UBICACIÓN'] ? c['UBICACIÓN'].substring(0, 45) : 'SALA DE SERVIDORES'}
          </span>
        </div>
        <div className="col-span-3 p-2 flex items-center justify-center bg-white">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-sky-400 to-amber-400 flex items-center justify-center opacity-85">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[8px] font-bold text-slate-900 font-mono">M</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 text-[8px] bg-slate-50 text-slate-700 font-semibold">
        <div className="col-span-3 p-1.5 border-r border-slate-900">
          <span className="text-[6px] text-slate-400 block font-mono">Elaborado por:</span>
          <strong>MAFORT SERVICE S.A.C</strong>
        </div>
        <div className="col-span-3 p-1.5 border-r border-slate-900">
          <span className="text-[6px] text-slate-400 block font-mono">Fecha:</span>
          <strong>{fechaSel}</strong>
        </div>
        <div className="col-span-3 p-1.5 border-r border-slate-900">
          <span className="text-[6px] text-slate-400 block font-mono">Referente:</span>
          <strong>{infoN}</strong>
        </div>
        <div className="col-span-3 p-1.5">
          <span className="text-[6px] text-slate-400 block font-mono">Orden de Trabajo:</span>
          <strong className="text-blue-700">{ot.id}</strong>
        </div>
      </div>
    </div>
  );
}
