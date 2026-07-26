import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaMedicionesElectricasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  pageNum?: number;
}

function MedTable({ title, data }: { title: string; data?: any }) {
  if (!data) return null;
  const lnVolt = Array.isArray(data.lnVoltaje) ? data.lnVoltaje : [data.lnVoltaje || '220', '220', '220'];
  const lnInt = Array.isArray(data.lnIntensidad) ? data.lnIntensidad : undefined;
  const freq = Array.isArray(data.frecuencia) ? data.frecuencia : [data.frecuencia || '60', '60', '60'];
  const llVolt = Array.isArray(data.llVoltaje) ? data.llVoltaje : undefined;

  const isTrifasico = Boolean(lnVolt[0] && (lnVolt[0] !== lnVolt[1] || lnVolt[0] !== lnVolt[2]));
  return (
    <div>
      <h3 className="font-bold text-slate-700 uppercase text-[8px] mb-1 text-center">{title}</h3>
      <table className="w-full border-collapse border border-slate-300 text-[7px]">
        <thead>
          <tr className="bg-slate-800 text-white font-mono uppercase text-[6px]">
            <th className="p-1 border border-slate-300 text-left">Parametro</th>
            {isTrifasico ? (
              <><th className="p-1 border border-slate-300">R</th><th className="p-1 border border-slate-300">S</th><th className="p-1 border border-slate-300">T</th></>
            ) : (
              <th className="p-1 border border-slate-300">L1-N/L2</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="p-1 border-r border-slate-200 text-slate-500 font-mono">L-N Voltaje (VAC)</td>
            <td className="p-1 text-center font-mono" colSpan={isTrifasico ? 1 : undefined}>{lnVolt[0] ?? '220'}</td>
            {isTrifasico && <><td className="p-1 text-center font-mono">{lnVolt[1] ?? '220'}</td><td className="p-1 text-center font-mono">{lnVolt[2] ?? '220'}</td></>}
          </tr>
          {lnInt && (
            <tr className="border-b border-slate-200">
              <td className="p-1 border-r border-slate-200 text-slate-500 font-mono">L-N Intensidad (A)</td>
              <td className="p-1 text-center font-mono">{lnInt[0] ?? '-'}</td>
              {isTrifasico && <><td className="p-1 text-center font-mono">{lnInt[1] ?? '-'}</td><td className="p-1 text-center font-mono">{lnInt[2] ?? '-'}</td></>}
            </tr>
          )}
          <tr className="border-b border-slate-200">
            <td className="p-1 border-r border-slate-200 text-slate-500 font-mono">Frecuencia (Hz)</td>
            <td className="p-1 text-center font-mono" colSpan={isTrifasico ? 3 : 1}>{freq[0] ?? '60'}</td>
          </tr>
          {llVolt && (
            <tr className="border-b border-slate-200">
              <td className="p-1 border-r border-slate-200 text-slate-500 font-mono">L-L Voltaje (VAC)</td>
              <td className="p-1 text-center font-mono">{llVolt[0] ?? '-'}</td>
              {isTrifasico && <><td className="p-1 text-center font-mono">{llVolt[1] ?? '-'}</td><td className="p-1 text-center font-mono">{llVolt[2] ?? '-'}</td></>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PaginaMedicionesElectricas({ report, ot, client, pageNum }: PaginaMedicionesElectricasProps) {
  const medEnt = report.medicionesEntrada;
  const medSal = report.medicionesSalida;
  const medBypass = report.medicionesBypass;
  const carga = report.parametrosCarga;

  return (
    <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
      <PdfHeader report={report} ot={ot} client={client} />
      <div className="flex-1 space-y-4 text-[9px]">
        <h2 className="text-center font-bold text-slate-900 border-b border-slate-300 pb-1 text-[11px] tracking-wider font-mono">
          MEDICIONES ELECTRICAS
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {medEnt && <MedTable title="Entrada del UPS" data={medEnt} />}
          {medBypass && (
            <div>
              <h3 className="font-bold text-slate-700 uppercase text-[8px] mb-1 text-center">Bypass</h3>
              <table className="w-full border-collapse border border-slate-300 text-[7px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-mono uppercase text-[6px]">
                    <th className="p-1 border border-slate-300 text-left">Parametro</th>
                    <th className="p-1 border border-slate-300">R</th>
                    <th className="p-1 border border-slate-300">S</th>
                    <th className="p-1 border border-slate-300">T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">L-N Voltaje (VAC)</td><td className="p-1 text-center font-mono">{medBypass.lnVoltaje?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{medBypass.lnVoltaje?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{medBypass.lnVoltaje?.[2] ?? '-'}</td></tr>
                  <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">Frecuencia (Hz)</td><td className="p-1 text-center font-mono" colSpan={3}>{medBypass.frecuencia?.[0] ?? '-'}</td></tr>
                  {medBypass.llVoltaje && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">L-L Voltaje (VAC)</td><td className="p-1 text-center font-mono">{medBypass.llVoltaje?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{medBypass.llVoltaje?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{medBypass.llVoltaje?.[2] ?? '-'}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {medSal && <MedTable title="Salida del UPS" data={medSal} />}
        </div>
        {carga && (
          <div>
            <h3 className="font-bold text-slate-700 uppercase text-[8px] mb-1">Parametros de Carga</h3>
            <table className="w-full border-collapse border border-slate-300 text-[7px]">
              <thead>
                <tr className="bg-slate-800 text-white font-mono uppercase text-[6px]">
                  <th className="p-1 border border-slate-300 text-left">Parametro</th>
                  <th className="p-1 border border-slate-300">R</th>
                  <th className="p-1 border border-slate-300">S</th>
                  <th className="p-1 border border-slate-300">T</th>
                </tr>
              </thead>
              <tbody>
                {carga.kva && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">KVA</td><td className="p-1 text-center font-mono">{carga.kva?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kva?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kva?.[2] ?? '-'}</td></tr>}
                {carga.kw && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">KW</td><td className="p-1 text-center font-mono">{carga.kw?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kw?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kw?.[2] ?? '-'}</td></tr>}
                {carga.porcentaje && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">% Carga</td><td className="p-1 text-center font-mono">{carga.porcentaje?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.porcentaje?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.porcentaje?.[2] ?? '-'}</td></tr>}
                {carga.kvar && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">KVAR</td><td className="p-1 text-center font-mono">{carga.kvar?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kvar?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.kvar?.[2] ?? '-'}</td></tr>}
                {carga.factorCresta && <tr className="border-b border-slate-200"><td className="p-1 border-r border-slate-200 text-slate-500 font-mono">Factor Cresta</td><td className="p-1 text-center font-mono">{carga.factorCresta?.[0] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.factorCresta?.[1] ?? '-'}</td><td className="p-1 text-center font-mono">{carga.factorCresta?.[2] ?? '-'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
