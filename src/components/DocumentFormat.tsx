import React from 'react';
import { TechnicalReport, OT, Client, ServiceType } from '../types';
import { ALL_ACCIONES, getPhotoSlotsForKva } from '../utils/reportDefaults';

interface DocumentFormatProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
}

export default function DocumentFormat({ report, ot, client }: DocumentFormatProps) {
  // Safe field retrievers to accommodate any partial state or fallback to defaults
  const infoN = report.informeN || `INF-2026-${ot.id.replace('OT-','')}`;
  const hojaServ = report.hojaServicioN || `HJ-544-${ot.id.replace('OT-','')}`;
  const fechaSel = report.fechaServicio || ot.fechaProgramada || new Date().toISOString().split('T')[0];
  const horaSel = report.horaInicio || "09:00 AM";
  const tech1 = report.tecnico1 || ot.tecnicoTitular;
  const tech2 = report.tecnico2 || ot.tecnicoApoyo || "Ninguno";
  
  // Clean default characteristics
  const c = report.caracteristicas || {};

  // Clean steps
  const steps = report.pasos || {};

  // Clean measurements
  const medEnt = report.medicionesEntrada || {
    lnVoltaje: ["220", "220", "220"],
    lnIntensidad: ["0", "0", "0"],
    frecuencia: ["60.0", "60.0", "60.0"],
    llVoltaje: ["380", "380", "380"]
  };
  const medSal = report.medicionesSalida || {
    lnVoltaje: ["220", "220", "220"],
    lnIntensidad: ["0", "0", "0"],
    frecuencia: ["60.0", "60.0", "60.0"],
    llVoltaje: ["380", "380", "380"]
  };

  const gab = report.diagnosticoGabinete || {};
  const norm = report.revisionNormas || {};
  const recs = report.recomendaciones || [];

  // Resolve official photo slots matching the current power rating (kVA)
  const matchedSlots = getPhotoSlotsForKva(ot.potenciaKva) || [];

  // Helper to verify if an image should be shown
  const isRealImage = (base64?: string) => {
    return !!base64;
  };

  // Construct exactly 8 items for Page 5 (Photos 1 to 8)
  const page1Photos = Array.from({ length: 8 }).map((_, idx) => {
    const existing = report.fotosLabeled && report.fotosLabeled[idx];
    const slotName = existing?.slotName || matchedSlots[idx] || `Foto S.L.A Slot #${idx + 1}`;
    const base64 = existing?.base64 || '';
    return { slotName, base64 };
  });

  // Construct exactly 8 items for Page 6 (Photos 9 to 16)
  const page2Photos = Array.from({ length: 8 }).map((_, i) => {
    const idx = 8 + i;
    const existing = report.fotosLabeled && report.fotosLabeled[idx];
    const slotName = existing?.slotName || matchedSlots[idx] || `Foto S.L.A Slot #${idx + 1}`;
    const base64 = existing?.base64 || '';
    return { slotName, base64 };
  });

  // Construct exactly 4 items for Page 7 (Photos 17 to 20)
  const page3Photos = Array.from({ length: 4 }).map((_, i) => {
    const idx = 16 + i;
    const existing = report.fotosLabeled && report.fotosLabeled[idx];
    const slotName = existing?.slotName || matchedSlots[idx] || `Foto S.L.A Slot #${idx + 1}`;
    const base64 = existing?.base64 || '';
    return { slotName, base64 };
  });

  // Repeated Header component for pages
  const PageHeader = () => (
    <div className="border border-slate-900 text-[10px] uppercase font-sans mb-4 shrink-0 bg-white" style={{ contentVisibility: 'auto' }}>
      <div className="grid grid-cols-12 border-b border-slate-900">
        {/* Logo 1 */}
        <div className="col-span-3 p-2 flex items-center justify-center border-r border-slate-900 bg-white">
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-blue-800 text-sm tracking-wider font-mono">Mafor<span className="text-emerald-500">t</span></span>
            <span className="text-[7px] text-slate-400 font-bold block shrink-0 font-mono">SERVICE S.A.C</span>
          </div>
        </div>
        
        {/* Title details */}
        <div className="col-span-6 p-2 text-center flex flex-col justify-center border-r border-slate-900 leading-tight">
          <strong className="text-[9px] font-bold text-slate-900 font-mono">
            SERVICIO DE MANTENIMIENTO PREVENTIVO
          </strong>
          <span className="text-[8px] text-slate-700 font-semibold block mt-0.5">
            DE "UPS - {ot.id.replace('OT-','')}" DE "CAPACIDAD {ot.potenciaKva} KVA" - "{c["MARCA"] || 'MARCA'}"
          </span>
          <span className="text-[8px] text-slate-800 font-extrabold block">
            EMPRESA: "{client.razonSocial}"
          </span>
          <span className="text-[8px] text-slate-500 font-bold block">
            AREA: {c["UBICACIÓN"] ? c["UBICACIÓN"].substring(0, 45) : 'SALA DE SERVIDORES'}
          </span>
        </div>

        {/* Logo 2 */}
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

  // Repeated Footer on pages
  const PageFooter = () => (
    <div className="border-t border-slate-300 pt-2 text-[7px] text-slate-400 text-center uppercase font-mono mt-auto shrink-0 leading-normal bg-white">
      Jr. Cerro Azul N° 597 Urb. San Ignacio de Monterrico LIMA - Santiago de Surco | Email: ventas@mafortservice.pe / ventas1@mafortservice.pe / ventas2@mafortservice.pe <br />
      OFICINA: Telf. +511 5442114 / EMERGENCIAS: 999993709 / CEL. 998-194-696
    </div>
  );

  return (
    <div className="space-y-8 print:space-y-0" id="official-printout-report-doc">
      
      {/* PAGE 1: PORTADA (COVERSHEET) */}
      <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
        
        {/* Header Block repeatable */}
        <PageHeader />

        {/* Big Centered Coversheet Title block */}
        <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-8 text-center px-4">
          
          <div className="space-y-4 max-w-lg">
            <h1 className="text-xl font-extrabold text-slate-950 font-sans tracking-tight uppercase leading-snug">
              SERVICIO DE MANTENIMIENTO PREVENTIVO DE UPS
            </h1>
            <h2 className="text-base font-bold text-slate-800 uppercase leading-snug font-mono">
              "UPS - {ot.id.replace('OT-','')}" DE "CAPACIDAD {ot.potenciaKva} KVA" - "{c["MARCA"] || 'MARCA'}"
            </h2>
            <div className="h-1.5 w-24 bg-blue-700 mx-auto rounded-full"></div>
            <p className="text-sm font-semibold text-slate-800 font-sans tracking-tight uppercase">
              EMPRESA: "{client.razonSocial}"
            </p>
            <p className="text-[11px] font-medium text-slate-500 font-sans uppercase">
              AREA: {c["UBICACIÓN"] || 'SALA DE BASE CRÍTICA'}
            </p>
          </div>

          {/* Large Cover Emblem */}
          <div className="p-6 border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col items-center space-y-2 select-none shadow-xs">
            <div className="flex items-center gap-1.5 select-none">
              <span className="text-3xl font-extrabold text-blue-900 font-mono tracking-wider">Mafor<span className="text-emerald-500">t</span></span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-mono">SERVICIOS DE SOPORTE DE ENERGÍA CRÍTICA</span>
          </div>

          {/* Recipient Details Card */}
          <div className="w-full max-w-md border border-slate-300 p-5 rounded-lg text-left bg-slate-50 space-y-2.5 font-sans">
            <div className="grid grid-cols-12 text-[10px] gap-y-1.5 text-slate-700">
              <div className="col-span-4 font-mono font-bold uppercase text-slate-400">DIRECCIÓN:</div>
              <div className="col-span-8 font-bold text-slate-900">{client.direccionSede}, {client.distrito}</div>
              
              <div className="col-span-4 font-mono font-bold uppercase text-slate-400">CONTACTO:</div>
              <div className="col-span-8 font-medium text-slate-800">{client.contactoNombre}</div>

              <div className="col-span-4 font-mono font-bold uppercase text-slate-400">CARGO:</div>
              <div className="col-span-8 text-slate-600 font-medium">Responsable Logístico / Data Center</div>

              <div className="col-span-4 font-mono font-bold uppercase text-slate-400">MÓVIL:</div>
              <div className="col-span-8 text-slate-800 font-mono">{client.contactoTelefono || '9993709'}</div>

              <div className="col-span-4 font-mono font-bold uppercase text-slate-400">EMAIL:</div>
              <div className="col-span-8 text-blue-600 font-mono font-bold lowercase">{client.contactoEmail}</div>
            </div>
          </div>

        </div>

        {/* Page Footer */}
        <PageFooter />
      </div>


      {/* PAGE 2: INFORME TÉCNICO, ANTECEDENTES Y ACCIONES */}
      <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
        
        <PageHeader />

        <div className="flex-1 space-y-5 text-[9px] leading-relaxed">
          
          <h2 className="text-center font-bold text-slate-900 border-b border-double border-slate-900 pb-1 text-sm tracking-widest font-mono">
            INFORME TÉCNICO #{infoN}
          </h2>

          {/* Quick specs table */}
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
                <td className="p-1 px-2 text-slate-900 font-bold uppercase">: MANTENIMIENTO PREVENTIVO DE {ot.tipoEquipo} DE {ot.potenciaKva} KVA {c["MARCA"] && `- ${c["MARCA"]} ${c["MODELO"]}`}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">FECHA DEL SERVICIO</td>
                <td className="p-1 px-2 text-slate-700 font-mono font-bold">: {fechaSel} (Hora Inicio: {horaSel})</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">TECNICOS RESPONSABLES</td>
                <td className="p-1 px-2 text-slate-800 font-bold">: {tech1} {tech2 !== 'Ninguno' ? ` / ${tech2}` : ''}</td>
              </tr>
              <tr>
                <td className="p-1 px-2 font-mono font-bold text-slate-400 bg-slate-50">N° HOJA DE SERVICIO</td>
                <td className="p-1 px-2 text-blue-700 font-mono font-bold">: {hojaServ}</td>
              </tr>
            </tbody>
          </table>

          {/* Antecedentes narrative */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">
              ANTECEDENTES:
            </h3>
            <p className="text-slate-700 text-justify font-sans leading-normal">
              {report.antecedentes || `El siguiente informe Técnico se presenta a solicitud de la empresa: "${client.razonSocial}" de acuerdo con la programación y coordinación con el responsable por parte del Cliente, el "${client.contactoNombre}". El servicio se efectuó el día: ${fechaSel}. El equipo intervenido es el identificado como el UPS de potencia: ${ot.potenciaKva} KVA, marca: "${c["MARCA"] || 'MARCA'}", modelo: "${c["MODELO"] || 'MODELO'}" y con número serie: "${c["SERIE"] || 'SERIE'}". Se encontró el equipo cargando adecuadamente proveyendo protección integral a las cargas críticas de la compañía. Se verificaron parámetros estables de entrada y salida.`}
            </p>
          </div>

          {/* Acciones Realizadas checklist */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">
              ACCIONES REALIZADAS:
            </h3>
            
            {/* Grid checklist styled with X markings */}
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

          {/* Pasos de Trabajo */}
          <div className="space-y-2 pt-1">
            <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase text-[10px]">
              CRONOGRAMA DE PROCEDIMIENTO DE ENERGÍA:
            </h3>

            <div className="space-y-2">
              <div className="bg-slate-50/50 p-2 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°1: VISUALIZACIÓN INICIAL Y TRASPASO DIRECTO</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">
                  {steps.paso1 || `Se procedió a visualizar el estado actual del UPS, indicando que SI se encontró operativo en el estado de modo inversor protegiendo las cargas de TI. El equipo cuenta con sistema de bypass ${steps.paso1_bypass || 'interno'} activo para posibilitar el mantenimiento físico.`}
                </p>
              </div>

              <div className="bg-slate-50/50 p-2 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°2: APERTURA Y MEDIDAS DE SEGURIDAD INDUSTRIAL</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">
                  {steps.paso2 || "Se procedió a abrir la carcasa tomando todas las medidas de seguridad reglamentarias de energía cero en tableros y cables, eliminando inducciones residuales para trabajo seguro."}
                </p>
              </div>
            </div>
          </div>

        </div>

        <PageFooter />
      </div>


      {/* PAGE 3: CONTINUING STEPS & SPECIFICATIONS TABLE */}
      <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
        
        <PageHeader />

        <div className="flex-1 space-y-5 text-[9px]">
          
          {/* Continuing steps */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">
              CRONOGRAMA DE PROCEDIMIENTO DE ENERGÍA (CONTINUACIÓN):
            </h3>

            <div className="space-y-2">
              <div className="bg-slate-50/50 p-2.5 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°3: LIMPIEZA INTERNA Y AJUSTES TÉRMICOS</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">
                  {steps.paso3 || "Se realizó la adecuada limpieza de polvo de las tarjetas principales y ajuste de las partes mecánicas y térmicas en la zona de conexión de energía para evitar falsos contactos."}
                </p>
              </div>

              <div className="bg-slate-50/50 p-2.5 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°4: MEDICIONES DE BATERÍAS & RESISTENCIA DE CELDA</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">
                  {steps.paso4 || "Se procedió a hacer mediciones físicas a las baterías internas, en estado de flotación nominal de celdas para verificar la resistencia de placas químicas e impedancia."}
                </p>
              </div>

              <div className="bg-slate-50/50 p-2.5 border border-slate-200 rounded">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°5: PRUEBA CON CARGA, SIMULACIÓN Y ENCENDIDO DE INVERSROR</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug">
                  {steps.paso5 || "Después del respectivo mantenimiento sopleteado se procedió a cerrar gabinetes y reactivar el equipo. Se realizaron pruebas de encendido en vacío y con carga nominal, simulando un corte general."}
                </p>
              </div>

              <div className="bg-slate-50/50 p-2.5 border border-slate-200 rounded font-sans">
                <span className="font-extrabold text-indigo-700 block text-[8px] font-mono select-none">PASO N°6: CONCLUSIÓN DE OPERABILIDAD FINAL</span>
                <p className="text-slate-600 mt-0.5 text-[8px] leading-snug font-bold">
                  ESTADO FINAL DE OPERACIÓN CONCLUIDO: {steps.paso6_concluido === 'no' ? 'NO' : 'SI'}.
                </p>
                <p className="text-slate-500 mt-0.5 text-[8px]">
                  {steps.paso6_concluido === 'no' ? steps.paso6_observaciones : (steps.paso6 || "El UPS queda correctamente operando en modo Inversor, entregando energía limpia regulada a las cargas del cliente de manera estable.")}
                </p>
              </div>
            </div>
          </div>

          {/* Characteristics Table */}
          <div className="space-y-1.5" style={{ contentVisibility: 'auto' }}>
            <h3 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wide border-b border-slate-300 pb-0.5">
              CARACTERÍSTICAS TÉCNICAS DEL UPS Y EQUIPAMIENTO EVALUADO:
            </h3>

            <div className="grid grid-cols-12 gap-4">
              
              {/* Table values */}
              <div className="col-span-12 font-sans overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono uppercase text-[7px] text-center">
                      <th className="p-1 px-2 border border-slate-300 text-left">FILTRO / COMPONENTE</th>
                      <th className="p-1 px-2 border border-slate-300">VALOR REGISTRADO EN INFOCAMPO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(c).slice(0, 16).map(([key, val], idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                        <td className="p-1 px-2 border border-slate-200 font-bold text-slate-500 font-mono text-[7.5px] uppercase">{key}</td>
                        <td className="p-1 px-2 border border-slate-200 text-slate-800 font-semibold">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>

        <PageFooter />
      </div>


      {/* PAGE 4: CONTINUACIÓN DE FICHA TÉCNICA Y ACCESORIOS */}
      <div className="mafort-pdf-page w-full max-w-[800px] min-h-[1050px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:min-h-0 print:page-break-after-always">
        
        <PageHeader />

        <div className="flex-1 space-y-4 text-[9px]">
          
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 font-sans tracking-wide uppercase border-b border-slate-300 pb-0.5 text-[10px]">
              CARACTERÍSTICAS TÉCNICAS (CONEXIÓN Y DETALLES DEL SISTEMA DE ENTRADA):
            </h3>

            <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
              <thead>
                <tr className="bg-slate-900 text-white font-mono uppercase text-[7px] text-center">
                  <th className="p-1 px-2 border border-slate-300 text-left">ELEMENTO / REDUNDANCIA</th>
                  <th className="p-1 px-2 border border-slate-300">VALOR TÉCNICO REGISTRADO</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(c).slice(16).map(([key, val], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="p-1 px-2 border border-slate-201 font-bold text-slate-500 font-mono text-[7.5px] uppercase">{key}</td>
                    <td className="p-1 px-2 border border-slate-201 text-slate-800 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Isolation transformer note */}
          <div className="p-3 bg-blue-50 border border-blue-200 text-slate-700 leading-relaxed font-sans rounded text-[8px]">
            <strong>SOPORTE DE TRANSFORMADOR DE AISLAMIENTO:</strong> El transformador de la red comercial regula la impedancia neutro-tierra a menos de 0.5V AC. Se validó la no existencia de corrientes de armónicos excesivos que recalienten el embobinado principal de cobre.
          </div>

        </div>

        <PageFooter />
      </div>



      {/* PAGE 5: CHECKLIST DE EVIDENCIA FOTOGRÁFICA (REFERENCIA S.L.A) */}
      <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
        <PageHeader />
        <div className="flex-1 py-4 space-y-4 font-sans text-[8.5px]">
          <div className="text-center border-b border-slate-900 pb-2">
            <h3 className="text-[10px] font-extrabold text-slate-900 uppercase">FOTOGRAFIAS SERVICIO DE MANTENIMIENTO PREVENTIVO DEL UPS "SELECCIONE POTENCIA"</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <h4 className="font-bold border-b border-slate-200 pb-1">1KVA = FOTOGRAFIAS DEL EQUIPO UPS DE 1KVA</h4>
              <p className="pl-2">1. CARACTERÍSTICAS / SERIE- MODELO | 2. ESTADO INICIAL | 3. AIRE ACONDICIONADO | 4. RETIRO EQUIPO | 5. LIMPIEZA INTERNA | 6. VENTILADORES</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold border-b border-slate-200 pb-1">10KVA = FOTOGRAFIAS DEL TRANSFORMADOR DE 10KVA</h4>
              <p className="pl-2">1. PLACA CARACTERÍSTICAS | 2. ESTADO INICIAL | 3. POLUCION | 4. LIMPIEZA BROCHA | 5. SOPLETEO | 6. BORNERAS | 7. AJUSTE MECANICO</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold border-b border-slate-200 pb-1">20KVA = FOTOGRAFIAS DEL UPS - 20KVA</h4>
              <p className="pl-2">1. CARACTERISTICAS | 2. MODO LINEA | 3. ETAPA POTENCIA | 4. LIMPIEZA GENERAL | 5. VENTILADORES | 6. BATERIAS | 7. MEDICIONES | 8. VOLTAJES</p>
            </div>
          </div>
        </div>
        <PageFooter pageNum={5} />
      </div>

      {/* PAGE 6: CHECKLIST DE EVIDENCIA FOTOGRÁFICA (CONTINUACIÓN) */}
      <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
        <PageHeader />
        <div className="flex-1 py-4 space-y-6 font-sans text-[8.5px]">
          <div className="space-y-2">
            <h4 className="font-bold border-b-2 border-slate-900 pb-1 uppercase">40KVA = FOTOGRAFIAS DEL SERVICIO DEL UPS 40 KVA</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <p>1. PLACA CARACTERÍSTICAS</p><p>9. CARACTERÍSTICAS DE BATERIAS</p>
              <p>2. ESTADO INICIAL EQUIPO</p><p>10. FECHA FABRICACIÓN BATERIAS</p>
              <p>3. CARACTERÍSTICAS TRANSFORMADOR</p><p>11. MEDICIÓN BANCO BATERÍAS</p>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <h4 className="font-bold border-b-2 border-slate-900 pb-1 uppercase">80KVA = FOTOGRAFIAS DEL SERVICIO UPS - 80KVA</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <p>1. CARACTERISTICAS GENERALES</p><p>9. FOTOGRAFIA MEDICIONES</p>
              <p>2. ESTADO CARGA ACTUAL</p><p>10. BATERIAS MODELO / CANTIDAD</p>
              <p>3. MONITOREO SNMP</p><p>11. MEDICIONES VOLTAJE DC</p>
            </div>
          </div>
        </div>
        <PageFooter pageNum={6} />
      </div>

      {/* PAGE 7: REGISTRO FOTOGRÁFICO REAL (1-8 fotos) */}
      <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
        
        <PageHeader />

        <div className="flex-1 space-y-2">
          <div className="border-b-2 border-slate-900 pb-1 text-center">
            <h3 className="font-extrabold text-slate-900 text-[11px] tracking-widest uppercase font-mono">
              REGISTRO FOTOGRÁFICO DE CAMPO CON ENCUADRE DE AUDITORÍA S.L.A
            </h3>
            <span className="text-[8px] text-slate-400 block font-mono">ESTRUCTURA DE ALINEACIÓN SEGÚN POTENCIA DE {ot.potenciaKva} KVA</span>
          </div>

          {/* Render first 8 photos in beautiful labeled slots with stable symmetric proportion inside stable borders */}
          <div className="grid grid-cols-2 gap-2 pb-1">
            {page1Photos.map((photo, idx) => (
              <div key={idx} className="border border-slate-900 bg-white p-1 flex flex-col space-y-1 rounded select-none h-[195px] justify-between">
                <span className="text-[7.5px] font-bold text-slate-900 uppercase font-mono block text-center truncate border-b border-slate-200 pb-0.5 bg-slate-50">
                  {idx + 1}. {photo.slotName}
                </span>
                {isRealImage(photo.base64) ? (
                  <div className="h-[155px] w-full bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center relative">
                    <img 
                      src={photo.base64} 
                      alt={photo.slotName} 
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain" 
                    />
                    <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                      {ot.id} - EVIDENCIA #{idx + 1}
                    </span>
                  </div>
                ) : (
                  <div className="h-[155px] w-full bg-[#f5f5f5] border-2 border-dashed border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center relative text-center">
                    <div className="flex flex-col items-center justify-center p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider font-sans mb-0.5 block">Fotografía pendiente de carga</span>
                      <span className="text-[6.5px] text-slate-400 font-mono italic max-w-[150px] truncate block">Espacio reservado para {photo.slotName}</span>
                    </div>
                    <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                      {ot.id} - EVIDENCIA #{idx + 1}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        <PageFooter />
      </div>



      {/* PAGE 8: REGISTRO FOTOGRÁFICO REAL (9-16 fotos) */}
      {matchedSlots.length > 8 && (
        <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
          
          <PageHeader />

          <div className="flex-1 space-y-2">
            <div className="border-b-2 border-slate-900 pb-1 text-center">
              <h3 className="font-extrabold text-slate-900 text-[11px] tracking-widest uppercase font-mono">
                REGISTRO FOTOGRÁFICO DE CAMPO CON ENCUADRE DE AUDITORÍA S.L.A (PARTE II)
              </h3>
              <span className="text-[8px] text-slate-400 block font-mono">FOTOGRAFÍAS ADICIONALES AUTORIZADAS SECTOR DE SOPORTE</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {page2Photos.map((photo, idx) => (
                <div key={idx} className="border border-slate-900 bg-white p-1 flex flex-col space-y-1 rounded select-none h-[195px] justify-between">
                  <span className="text-[7.5px] font-bold text-slate-900 uppercase font-mono block text-center truncate border-b border-slate-200 pb-0.5 bg-slate-50">
                    {idx + 9}. {photo.slotName}
                  </span>
                  {isRealImage(photo.base64) ? (
                    <div className="h-[155px] w-full bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center relative">
                      <img 
                        src={photo.base64} 
                        alt={photo.slotName} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain" 
                      />
                      <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                        {ot.id} - EVIDENCIA #{idx + 9}
                      </span>
                    </div>
                  ) : (
                    <div className="h-[155px] w-full bg-[#f5f5f5] border-2 border-dashed border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center relative text-center">
                      <div className="flex flex-col items-center justify-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider font-sans mb-0.5 block">Fotografía pendiente de carga</span>
                        <span className="text-[6.5px] text-slate-400 font-mono italic max-w-[150px] truncate block">Espacio reservado para {photo.slotName}</span>
                      </div>
                      <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                        {ot.id} - EVIDENCIA #{idx + 9}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          <PageFooter />
        </div>
      )}



      {/* PAGE 9: REGISTRO FOTOGRÁFICO REAL (17-20 fotos) */}
      {matchedSlots.length > 16 && (
        <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
          
          <PageHeader />

          <div className="flex-1 space-y-2">
            <div className="border-b-2 border-slate-900 pb-1 text-center">
              <h3 className="font-extrabold text-slate-900 text-[11px] tracking-widest uppercase font-mono">
                REGISTRO FOTOGRÁFICO DE CAMPO CON ENCUADRE DE AUDITORÍA S.L.A (PARTE III)
              </h3>
              <span className="text-[8px] text-slate-400 block font-mono">FOTOGRAFÍAS FINALES DE REPORTE CRÍTICO</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {page3Photos.map((photo, idx) => (
                <div key={idx} className="border border-slate-900 bg-white p-1 flex flex-col space-y-1 rounded select-none h-[195px] justify-between">
                  <span className="text-[7.5px] font-bold text-slate-900 uppercase font-mono block text-center truncate border-b border-slate-200 pb-0.5 bg-slate-50">
                    {idx + 17}. {photo.slotName}
                  </span>
                  {isRealImage(photo.base64) ? (
                    <div className="h-[155px] w-full bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center relative">
                      <img 
                        src={photo.base64} 
                        alt={photo.slotName} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain" 
                      />
                      <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                        {ot.id} - EVIDENCIA #{idx + 17}
                      </span>
                    </div>
                  ) : (
                    <div className="h-[155px] w-full bg-[#f5f5f5] border-2 border-dashed border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center relative text-center">
                      <div className="flex flex-col items-center justify-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider font-sans mb-0.5 block">Fotografía pendiente de carga</span>
                        <span className="text-[6.5px] text-slate-400 font-mono italic max-w-[150px] truncate block">Espacio reservado para {photo.slotName}</span>
                      </div>
                      <span className="absolute bottom-1 right-2 bg-slate-950/70 text-white font-mono text-[6px] rounded px-1 py-0.5">
                        {ot.id} - EVIDENCIA #{idx + 17}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          <PageFooter />
        </div>
      )}


      {/* PAGE 10: MEDICIONES, RECOMENDACIONES Y FIRMAS FINALES */}
      <div className="mafort-pdf-page w-full max-w-[800px] h-[1120px] mx-auto bg-white border border-slate-300 shadow-xl p-8 flex flex-col justify-between print:border-0 print:shadow-none print:p-0 print:page-break-after-always overflow-hidden">
        
        <PageHeader />

        <div className="flex-1 py-2 space-y-4 font-sans">
          
          <div className="text-center">
            <h4 className="text-[10px] font-extrabold text-slate-900 uppercase underline decoration-1 underline-offset-4 tracking-tighter">MEDICIONES Y PARAMETROS ELECTRICOS DEL TRANSFORMADOR / UPS</h4>
          </div>

          {/* Combined Measurements Section */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <h5 className="text-[8px] font-bold text-slate-900 uppercase text-center bg-slate-100 py-1 border border-slate-300">MEDICIONES DE ENTRADA Y SALIDA</h5>
              <div className="grid grid-cols-2 gap-2">
                <table className="w-full border-collapse border border-slate-400 text-[7px]">
                  <thead className="bg-slate-900 text-white">
                    <tr><th className="border border-slate-400 p-1">ENTRADA</th><th className="border border-slate-400 p-1">R</th><th className="border border-slate-400 p-1">S</th><th className="border border-slate-400 p-1">T</th></tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-300 p-1 font-bold">VOLT (V)</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnVoltaje[0]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnVoltaje[1]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnVoltaje[2]}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-1 font-bold">AMP (A)</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnIntensidad[0]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnIntensidad[1]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medEnt.lnIntensidad[2]}</td>
                    </tr>
                  </tbody>
                </table>
                <table className="w-full border-collapse border border-slate-400 text-[7px]">
                  <thead className="bg-slate-900 text-white">
                    <tr><th className="border border-slate-400 p-1">SALIDA</th><th className="border border-slate-400 p-1">R</th><th className="border border-slate-400 p-1">S</th><th className="border border-slate-400 p-1">T</th></tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-300 p-1 font-bold">VOLT (V)</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnVoltaje[0]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnVoltaje[1]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnVoltaje[2]}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-1 font-bold">AMP (A)</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnIntensidad[0]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnIntensidad[1]}</td>
                      <td className="border border-slate-300 p-1 text-center">{medSal.lnIntensidad[2]}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-900 p-2 bg-slate-50 space-y-1.5">
              <h5 className="text-[9px] font-extrabold text-slate-900 uppercase">DIAGNOSTICO DEL EQUIPO "UPS {ot.potenciaKva} KVA"</h5>
              <div className="text-[7.5px] leading-tight space-y-1">
                <p>✓ <strong>GABINETE:</strong> {gab.cuentaConGabinete === 'si' ? 'SI = El equipo se encontró dentro de Gabinete.' : 'NO = El equipo se encontró sin Gabinete.'} {gab.tipoEstructura || 'Estructura Rack'}.</p>
                <p>✓ <strong>ESTADO OPERATIVO:</strong> El equipo UPS después de las pruebas de funcionamiento queda operativo sin alarmas y protegiendo cargas.</p>
                <p>✓ <strong>CONDICIÓN:</strong> UPS encendido en modo inversor, protegiendo cargas eléctricas y operando a un 30% de su capacidad total.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-[9px] uppercase border-b border-slate-900 pb-0.5">RECOMENDACIONES:</h4>
            <div className="space-y-1.5 text-[8.2px] pl-1 leading-relaxed text-slate-700 italic">
              {recs.map((rec, id) => (
                <p key={id} className="flex items-start gap-2"><span>❖</span> <span>{rec}</span></p>
              ))}
              {recs.length === 0 && (
                <p className="flex items-start gap-2 text-slate-400"><span>❖</span> <span>Sin recomendaciones adicionales.</span></p>
              )}
            </div>
          </div>

          <div className="pt-8 mt-4">
            <p className="text-[8.5px] italic mb-10 text-slate-600">Sin otro particular, Atentamente:</p>
            <div className="grid grid-cols-2 gap-12 px-8">
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-400 h-16 flex items-center justify-center relative mb-2">
                  <span className="text-[7px] text-slate-300 absolute bottom-1">Firma y Sello Técnico</span>
                </div>
                <p className="text-[8.5px] font-bold uppercase text-slate-900">MAFORT SERVICE S.A.C</p>
                <p className="text-[7.5px] text-slate-500">SOPORTE TÉCNICO</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-400 h-16 flex items-center justify-center relative mb-2">
                  {report.firmaCliente ? (
                    <img src={report.firmaCliente} alt="Firma Cliente" className="h-14 object-contain" />
                  ) : (
                    <span className="text-[7px] text-slate-300 absolute bottom-1">Firma de Conformidad Cliente</span>
                  )}
                </div>
                <p className="text-[8.5px] font-bold uppercase text-slate-900">{client.razonSocial}</p>
                <p className="text-[7.5px] text-slate-500">RESPONSABLE DE SEDE</p>
              </div>
            </div>
          </div>
        </div>

        <PageFooter pageNum={10} />
      </div>

    </div>
  );
}
