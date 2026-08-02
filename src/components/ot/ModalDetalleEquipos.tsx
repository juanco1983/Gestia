import React, { useState, useMemo } from 'react';
import { X, Cpu, Calendar, FileText, History, Download, Eye, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { OT, OTStatus, Client, TechnicalReport, Equipo, OtEquipoAsignacion } from '../../types';

interface ModalDetalleEquiposProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  ots: OT[];
  otEquipoAsignaciones: OtEquipoAsignacion[];
  reports: TechnicalReport[];
  clients: Client[];
}

export default function ModalDetalleEquipos({
  isOpen,
  onClose,
  contract,
  ots,
  otEquipoAsignaciones,
  reports,
  clients
}: ModalDetalleEquiposProps) {
  const [expandedEquipmentHistory, setExpandedEquipmentHistory] = useState<Record<string, boolean>>({});
  const [selectedReportForView, setSelectedReportForView] = useState<TechnicalReport | null>(null);

  if (!isOpen || !contract) return null;

  // 1. Get all unique equipments of the contract and its adendas
  const allEquipments = useMemo(() => {
    const primary = contract.equipos || [];
    const adendas = contract.ampliaciones || [];
    const list = [...primary];
    
    adendas.forEach((adenda: any) => {
      const adendaEquips = adenda.equiposAdenda
        ? adenda.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean)
        : [];
      adendaEquips.forEach((eq: any) => {
        if (!list.some(e => e.id === eq.id)) {
          list.push(eq);
        }
      });
    });
    return list;
  }, [contract]);

  // 2. Client associated with the contract
  const client = useMemo(() => {
    return clients.find(c => c.id === contract.clientId) || {
      id: contract.clientId || 'unknown',
      razonSocial: contract.cliente || 'Cliente No Identificado',
      ruc: 'S/D',
      direccionSede: 'S/D',
      distrito: 'S/D',
      contactoNombre: 'S/D',
      contactoEmail: 'S/D',
      contactoTelefono: 'S/D'
    };
  }, [clients, contract]);

  const toggleHistory = (eqId: string) => {
    setExpandedEquipmentHistory(prev => ({
      ...prev,
      [eqId]: !prev[eqId]
    }));
  };

  // Helper to download report as Word (.doc)
  const handleDownloadDoc = (report: TechnicalReport, ot: OT) => {
    const infoN = report.informeN || `INF-2026-${ot.id.replace('OT-','')}`;
    const hojaServ = report.hojaServicioN || `HJ-544-${ot.id.replace('OT-','')}`;
    const fechaSel = report.fechaServicio || ot.fechaProgramada || new Date().toISOString().split('T')[0];
    const tech1 = report.tecnico1 || ot.tecnicoTitular || 'Técnico General';
    const tech2 = report.tecnico2 || ot.tecnicoApoyo || "Ninguno";
    const c = report.caracteristicas || {};
    const steps = report.pasos || {};
    const recs = report.recomendaciones || [];

    const medEnt = report.medicionesEntrada || { lnVoltaje: ["220","220","220"], lnIntensidad: ["0","0","0"], frecuencia: ["60.0","60.0","60.0"], llVoltaje: ["380","380","380"] };
    const medSal = report.medicionesSalida || { lnVoltaje: ["220","220","220"], lnIntensidad: ["0","0","0"], frecuencia: ["60.0","60.0","60.0"], llVoltaje: ["380","380","380"] };
    const gab = report.diagnosticoGabinete || {};
    const norm = report.revisionNormas || {};

    const ALL_ACCIONES = [
      'Inspección visual general', 'Ajuste de conexiones eléctricas',
      'Medición de voltajes de entrada/salida', 'Prueba de transferencia a bypass',
      'Limpieza interna de gabinetes', 'Verificación de ventiladores',
      'Medición de corriente de carga', 'Prueba de autonomía de baterías'
    ];

    let actionsRows = '';
    for (let i = 0; i < ALL_ACCIONES.length; i += 2) {
      const isOk1 = report.accionesRealizadas ? report.accionesRealizadas.includes(ALL_ACCIONES[i]) : true;
      const isOk2 = ALL_ACCIONES[i+1] ? (report.accionesRealizadas ? report.accionesRealizadas.includes(ALL_ACCIONES[i+1]) : true) : false;
      actionsRows += `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:4px;font-size:7.5pt;font-family:Arial,sans-serif;width:50%;">[${isOk1 ? 'X' : ' '}] ${ALL_ACCIONES[i]}</td>
          <td style="border:1px solid #cbd5e1;padding:4px;font-size:7.5pt;font-family:Arial,sans-serif;width:50%;">${ALL_ACCIONES[i+1] ? `[${isOk2 ? 'X' : ' '}] ${ALL_ACCIONES[i+1]}` : ''}</td>
        </tr>
      `;
    }

    const charRows1 = Object.entries(c).slice(0, 16).map(([key, val]) => `
      <tr><td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;font-size:8pt;font-family:monospace;background:#f8fafc;">${key}</td><td style="border:1px solid #cbd5e1;padding:4px;font-size:8pt;font-weight:bold;">${val}</td></tr>
    `).join('');

    const charRows2 = Object.entries(c).slice(16).map(([key, val]) => `
      <tr><td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;font-size:8pt;font-family:monospace;background:#f8fafc;">${key}</td><td style="border:1px solid #cbd5e1;padding:4px;font-size:8pt;font-weight:bold;">${val}</td></tr>
    `).join('');

    const headerH = `
      <table style="width:100%;border-collapse:collapse;border:2px solid #0f172a;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:12px;">
        <tr>
          <td style="width:25%;border:1px solid #0f172a;padding:4px;text-align:center;font-weight:bold;color:#1e3a8a;">MAFORT SERVICE</td>
          <td style="width:50%;border:1px solid #0f172a;padding:4px;text-align:center;font-size:7.5pt;font-weight:bold;">PREVENTIVO UPS - ${ot.id} | CLIENTE: ${client.razonSocial}</td>
          <td style="width:25%;border:1px solid #0f172a;padding:4px;text-align:center;font-weight:bold;">M</td>
        </tr>
        <tr style="font-size:6.5pt;font-weight:bold;background:#f8fafc;color:#475569;">
          <td style="border:1px solid #0f172a;padding:3px;">MAFORT S.A.C</td>
          <td style="border:1px solid #0f172a;padding:3px;text-align:center;">Fecha: ${fechaSel}</td>
          <td style="border:1px solid #0f172a;padding:3px;text-align:right;">Ref: ${infoN}</td>
        </tr>
      </table>
    `;

    const footerH = `
      <div style="border-top:1px solid #cbd5e1;font-size:6.5pt;color:#94a3b8;text-align:center;margin-top:12px;text-transform:uppercase;font-family:monospace;">
        Jr. Cerro Azul N° 597 Urb. San Ignacio de Monterrico - Santiago de Surco | Central Telf: +511 5442114
      </div>
    `;

    const breakH = '<br style="page-break-before:always;clear:both;" />';

    const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Arial', sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { border: 1px solid #94a3b8; padding: 5px; text-align: left; }
th { background-color: #f1f5f9; font-weight: bold; font-size: 8pt; text-transform: uppercase; color: #1e293b; }
.sect { background-color: #1e3a8a; color: white; font-weight: bold; padding: 5px 10px; font-size: 10pt; margin-top: 15px; text-transform: uppercase; border-left: 4px solid #10b981; }
.box { background-color: #f8fafc; border-left: 3px solid #4f46e5; padding: 8px; margin-top: 6px; border: 1px solid #e2e8f0; border-left: 3px solid #4f46e5; }
.title { font-weight: bold; color: #1e3a8a; font-size: 18pt; text-align: center; margin-top: 40px; }
.subtitle { font-weight: bold; color: #0d9488; font-size: 11pt; text-align: center; margin-top: 5px; margin-bottom: 30px; }
</style>
</head>
<body>
  <div class="page-container">
    <div>
      ${headerH}
      <div class="title">INFORME TÉCNICO OFICIAL S.L.A</div>
      <div class="subtitle">ORDEN DE TRABAJO ${ot.id} - ${ot.tipoMantenimiento}</div>
      <div style="border:1px solid #cbd5e1;padding:12px;background:#f8fafc;margin-top:20px;border-radius:6px;font-size:9pt;line-height:1.6;">
        <b>DIRECCIÓN DE SEDE:</b> ${client.direccionSede}, ${client.distrito}<br/>
        <b>CONTACTO TÉCNICO:</b> ${client.contactoNombre}<br/>
        <b>CARGO:</b> Responsable Logístico<br/>
        <b>MÓVIL CONTÁCTANOS:</b> ${client.contactoTelefono || 'S/D'}<br/>
        <b>EMAIL ASOCIADO:</b> ${client.contactoEmail}
      </div>
      <div style="margin-top:100px;text-align:center;">
        <strong style="color:#1e3a8a;font-size:12pt;font-family:monospace;">MAFORT SERVICE S.A.C</strong><br/>
        <span style="font-size:8pt;color:#94a3b8;font-weight:bold;">SOPORTE TÉCNICO AUTORIZADO DE ENERGÍA CRÍTICA</span>
      </div>
      <div style="margin-top:160px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div style="text-align:center;font-weight:bold;font-size:11pt;margin-bottom:10px;">INFORME TÉCNICO OFICIAL #${infoN}</div>
      <table>
        <tr style="background:#f8fafc;"><td><b>EMPRESA</b></td><td>: ${client.razonSocial}</td></tr>
        <tr><td><b>LOCAL / SEDE</b></td><td>: ${client.direccionSede} - ${client.distrito}</td></tr>
        <tr style="background:#f8fafc;"><td><b>CONTACTO</b></td><td>: ${client.contactoNombre}</td></tr>
        <tr><td><b>ASUNTO</b></td><td style="color:#1e3a8a;font-weight:bold;">: PREVENTIVO DE ${ot.tipoEquipo} de ${ot.potenciaKva} KVA</td></tr>
        <tr style="background:#f8fafc;"><td><b>FECHA Y HOJA</b></td><td>: ${fechaSel} / Hoja Servicio: ${hojaServ}</td></tr>
        <tr><td><b>TÉCNICOS</b></td><td>: ${tech1} ${tech2 !== 'Ninguno' ? `/ ${tech2}` : ''}</td></tr>
      </table>
      <div class="sect">I. ANTECEDENTES DEL SERVICIO</div>
      <div style="background:#f8fafc;border-left:3px solid #1e3a8a;padding:8px;font-size:8.5pt;margin-top:6px;text-align:justify;line-height:1.5;">
        ${report.observacionesDiagnostico || `El servicio se realizó conforme a las especificaciones solicitadas en ${client.razonSocial}, encontrando el equipo ${ot.tipoEquipo} de potencia ${ot.potenciaKva} KVA operable en flotación estable y libre de alarmas de advertencia activas.`}
      </div>
      <div class="sect">II. ACCIONES DE MANTENIMIENTO PREVENTIVO REALIZADAS</div>
      <table style="font-size:8pt;margin-top:5px;">${actionsRows}</table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">III. PROCEDIMIENTOS DE ENERGÍA EJECUTADOS</div>
      <div class="box"><b>P01: INSPECCIÓN PRE-INTERVENCIÓN:</b><div>${steps.paso1 || 'Medición inicial de parámetros funcionales en inversor.'}</div></div>
      <div class="box"><b>P02: DES-ENERGIZACIÓN Y CORTE CONTROLADO:</b><div>${steps.paso2 || 'Traspaso mecánico a bypass sincrónico para seguridad industrial.'}</div></div>
      <div class="box"><b>P03: SOPLETEADO Y AJUSTE TÉRMICO:</b><div>${steps.paso3 || 'Limpieza interna sopleteada profunda y reajuste de torque en borneras.'}</div></div>
      <div class="box"><b>P04: EVALUACIÓN DE IMPEDANCIA BATERÍAS:</b><div>${steps.paso4 || 'Mediciones individuales del banco de baterías de plomo ácido.'}</div></div>
      <div class="box"><b>P05: RETESTEO CON CARGA DE TRABAJO:</b><div>${steps.paso5 || 'Simulacro preventivo de corte comercial.'}</div></div>
      <div class="box" style="border-left-color:#10b981;"><b style="color:#10b981;">P06: DECLARACIÓN DE OPERABILIDAD FINAL:</b><div><b>ESTADO: ${steps.paso6_concluido === 'no' ? 'NO CONCLUIDO' : 'SI OPERATIVO'}</b><br/>${steps.paso6_concluido === 'no' ? steps.paso6_observaciones : (steps.paso6 || 'Equipo estabilizado en inversor sustentando la carga con total normalidad.')}</div></div>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">IV. CARACTERÍSTICAS TÉCNICAS DEL EQUIPO (PARTE I)</div>
      <table style="width:100%;">
        <tr style="background:#1e3a8a;">
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:50%;">CARACTERÍSTICA</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:50%;">VALOR REGISTRADO</td>
        </tr>
        ${charRows1 || '<tr><td colspan="2">No hay especificaciones registradas.</td></tr>'}
      </table>
      <div style="margin-top:100px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">IV. CARACTERÍSTICAS TÉCNICAS DEL EQUIPO (PARTE II)</div>
      <table style="width:100%;">
        <tr style="background:#1e3a8a;">
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:50%;">ELEMENTO / REDUNDANCIA</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:50%;">VALOR REGISTRADO</td>
        </tr>
        ${charRows2 || '<tr><td colspan="2" style="text-align:center;color:#94a3b8;">Ficha técnica completada en sección previa.</td></tr>'}
      </table>
      <div style="margin-top:100px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">VI. MEDICIONES Y PARÁMETROS ELECTRICOS DE OPERATIVIDAD</div>
      <p style="font-weight:bold;color:#1e3a8a;margin-top:8px;">A. ENTRADA DE RED COMERCIAL</p>
      <table>
        <tr style="background:#1e293b;">
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">PARÁMETRO</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE R (RS)</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE S (ST)</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE T (TR)</td>
        </tr>
        <tr><td>Voltaje L-N</td><td>${medEnt.lnVoltaje[0]} V</td><td>${medEnt.lnVoltaje[1]} V</td><td>${medEnt.lnVoltaje[2]} V</td></tr>
        <tr style="background:#f8fafc;"><td>Intensidad L-N</td><td>${medEnt.lnIntensidad[0]} A</td><td>${medEnt.lnIntensidad[1]} A</td><td>${medEnt.lnIntensidad[2]} A</td></tr>
        <tr><td>Frecuencia</td><td>${medEnt.frecuencia[0]} Hz</td><td>${medEnt.frecuencia[1]} Hz</td><td>${medEnt.frecuencia[2]} Hz</td></tr>
        <tr style="background:#f8fafc;"><td>Voltaje L-L</td><td>${medEnt.llVoltaje[0]} V</td><td>${medEnt.llVoltaje[1]} V</td><td>${medEnt.llVoltaje[2]} V</td></tr>
      </table>
      <p style="font-weight:bold;color:#1e3a8a;margin-top:12px;">B. SALIDA A CARGA PROTEGIDA</p>
      <table>
        <tr style="background:#1e293b;">
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">PARÁMETRO</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE R (RS)</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE S (ST)</td>
          <td style="color:#ffffff;font-weight:bold;font-size:8pt;padding:6px;width:25%;">FASE T (TR)</td>
        </tr>
        <tr><td>Voltaje L-N</td><td>${medSal.lnVoltaje[0]} V</td><td>${medSal.lnVoltaje[1]} V</td><td>${medSal.lnVoltaje[2]} V</td></tr>
        <tr style="background:#f8fafc;"><td>Intensidad L-N</td><td>${medSal.lnIntensidad[0]} A</td><td>${medSal.lnIntensidad[1]} A</td><td>${medSal.lnIntensidad[2]} A</td></tr>
        <tr><td>Frecuencia</td><td>${medSal.frecuencia[0]} Hz</td><td>${medSal.frecuencia[1]} Hz</td><td>${medSal.frecuencia[2]} Hz</td></tr>
        <tr style="background:#f8fafc;"><td>Voltaje L-L</td><td>${medSal.llVoltaje[0]} V</td><td>${medSal.llVoltaje[1]} V</td><td>${medSal.llVoltaje[2]} V</td></tr>
      </table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">VIII. AUDITORÍA REGLAMENTARIA Y RECOMENDACIONES</div>
      <div style="font-size:8.5pt;color:#334155;line-height:1.5;">
        <b>✓ CONTROL DE FLUIDOS:</b> Mantenimiento preventivo sopleteado totalmente concluido.<br/>
        <b>✓ CONTROL DE RIESGO QUÍMICO (BATERÍAS):</b> Año Baterías: ${norm.anioBaterias || 2022}.<br/>
        <b>✓ CONTROL TERMICO:</b> Área en óptimas condiciones de climatización (21°C promedio).<br/>
        <b>✓ ESTADO OPERATORIO:</b> El equipo queda 100% OPERATIVO sobre inversor estable.
      </div>
      <div class="sect">IX. RECOMENDACIONES EMITIDAS</div>
      <div style="background:#f8fafc;padding:8px;border:1px dashed #cbd5e1;font-size:8.5pt;color:#475569;">
        ${recs.map((rec: string, id: number) => `<div><b>❖ Rec #${id+1}:</b> ${rec}</div>`).join('')}
        ${recs.length === 0 ? '<i>Sin recomendaciones adicionales.</i>' : ''}
      </div>
      <table style="width:100%;border:none;margin-top:40px;">
        <tr style="background:none;">
          <td style="border:none;width:50%;text-align:center;vertical-align:top;">
            <div style="border-bottom:1px dashed #64748b;height:50px;line-height:50px;font-style:italic;color:#1e3a8a;font-weight:bold;">MAFORT SERVICE SUPPORT</div>
            <div style="font-size:7.5pt;margin-top:5px;color:#475569;"><b>MAFORT SERVICE S.A.C</b><br/>SOPORTE DE ENERGÍA CRÍTICA</div>
          </td>
          <td style="border:none;width:50%;text-align:center;vertical-align:top;">
            <div style="border-bottom:1px dashed #64748b;height:50px;line-height:50px;overflow:hidden;">
              ${report.firmaCliente ? `<img src="${report.firmaCliente}" style="max-height:48px;" />` : `<span style="color:#94a3b8;font-size:8pt;font-style:italic;">Conformidad Cliente</span>`}
            </div>
            <div style="font-size:7.5pt;margin-top:5px;color:#475569;"><b>${client.razonSocial}</b><br/>REPRESENTANTE DEL CLIENTE</div>
          </td>
        </tr>
      </table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_Tecnico_${ot.id}_${report.equipoId || 'EQ'}_SLA.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-wider">
              Detalle de Equipos
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Cliente: <span className="font-bold text-slate-700">{client.razonSocial}</span> | Contrato #{contract.n_contrato || contract.id.replace('cont_', '')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {allEquipments.map((eq: Equipo) => {
              // 1. Find all OTs associated with this equipment
              const eqOts = ots.filter(ot => {
                const hasAssignment = otEquipoAsignaciones.some(a => a.otId === ot.id && a.equipoId === eq.id);
                if (hasAssignment) return true;
                if (ot.equipoId) {
                  const ids = ot.equipoId.split(',').map(id => id.trim());
                  return ids.includes(eq.id);
                }
                return false;
              });

              // 2. Determine active OT (not Cerrada) and latest OT
              const activeOt = eqOts.find(ot => ot.estado !== OTStatus.CERRADA);
              const latestOt = eqOts[eqOts.length - 1];
              const currentOt = activeOt || latestOt;

              // 3. Visit status
              const visitStatus = activeOt ? activeOt.estado : (latestOt ? 'Finalizada (Cerrada)' : 'No Programado');
              
              // 4. Report status for the current OT
              let reportStatus = 'N/A';
              let reportColor = 'bg-slate-100 text-slate-500 border-slate-200';
              let currentReport: TechnicalReport | undefined;

              if (currentOt) {
                currentReport = reports.find(r => r.otId === currentOt.id && r.equipoId === eq.id);
                if (!currentReport) {
                  // Fallback for single-equipo reports
                  currentReport = reports.find(r => r.otId === currentOt.id);
                }

                if (!currentReport) {
                  reportStatus = 'Pendiente de creación';
                  reportColor = 'bg-amber-50 text-amber-600 border-amber-200';
                } else {
                  if (currentOt.estado === OTStatus.INFORME_ENVIADO || currentOt.estado === OTStatus.EN_REVISION) {
                    reportStatus = 'Enviado / En revisión';
                    reportColor = 'bg-blue-50 text-blue-600 border-blue-200';
                  } else if (currentOt.estado === OTStatus.OBSERVADA) {
                    reportStatus = 'Observado';
                    reportColor = 'bg-rose-50 text-rose-600 border-rose-200';
                  } else if (currentOt.estado === OTStatus.CORREGIDA) {
                    reportStatus = 'Corregido';
                    reportColor = 'bg-teal-50 text-teal-600 border-teal-200';
                  } else if ([OTStatus.APROBADA, OTStatus.FIRMADA, OTStatus.FACTURADA, OTStatus.CERRADA].includes(currentOt.estado)) {
                    reportStatus = 'Aprobado / Firmado';
                    reportColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                  } else {
                    reportStatus = 'Borrador';
                    reportColor = 'bg-slate-50 text-slate-600 border-slate-200';
                  }
                }
              }

              // 5. History of all reports for this equipment
              const eqReports = reports.filter(r => {
                if (r.equipoId === eq.id) return true;
                const hasAssignment = otEquipoAsignaciones.some(a => a.otId === r.otId && a.equipoId === eq.id);
                return hasAssignment;
              }).map(r => {
                const ot = ots.find(o => o.id === r.otId);
                return { report: r, ot };
              }).filter(item => item.ot !== undefined) as Array<{ report: TechnicalReport, ot: OT }>;

              const isHistoryExpanded = expandedEquipmentHistory[eq.id];

              return (
                <div key={eq.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm text-left">
                  {/* Equipment summary row */}
                  <div className="p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl text-teal-brand shrink-0 border border-emerald-100">
                        <Cpu size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded">
                            {eq.codigo}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 font-mono">
                            {eq.tipo}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {eq.potenciaKva} kVA
                          </span>
                        </div>
                        <span className="text-xs text-slate-700 block mt-1">
                          {eq.marca} {eq.modelo} · <span className="text-slate-400 font-mono">S/N: {eq.serie || 'S/D'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Ubicación: {eq.ubicacion || 'No especificada'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {/* Visit Status Badge */}
                      <div className="text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Estado de Visita</span>
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg border ${
                          activeOt 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : latestOt 
                              ? 'bg-slate-100 text-slate-500 border-slate-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {visitStatus}
                        </span>
                      </div>

                      {/* Report Status Badge */}
                      <div className="text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Estado del Informe</span>
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg border ${reportColor}`}>
                          {reportStatus}
                        </span>
                      </div>

                      {/* Expand History Button */}
                      <button
                        onClick={() => toggleHistory(eq.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-colors border mt-3.5 ${
                          isHistoryExpanded
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <History size={12} />
                        <span>Historial ({eqReports.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* History expanded list */}
                  {isHistoryExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50/20 space-y-3">
                      <h4 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <History size={11} className="text-slate-400" />
                        <span>Historial de Informes de Servicio ({eqReports.length})</span>
                      </h4>

                      <div className="space-y-2">
                        {eqReports.map((item, idx) => {
                          const rDate = item.report.fechaServicio || item.report.creadoEn.split('T')[0];
                          return (
                            <div key={item.report.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700 font-mono">{rDate}</span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.ot.id}</span>
                                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">
                                    {item.report.informeN || `INF-${item.report.id.slice(0, 6)}`}
                                  </span>
                                </div>
                                <p className="text-slate-600">
                                  <strong>Diagnóstico:</strong> {item.report.observacionesDiagnostico || 'UPS operando dentro de los parámetros normales.'}
                                </p>
                                {item.report.comentariosAdicionales && (
                                  <p className="text-slate-500 text-[11px] italic">
                                    <strong>Notas:</strong> {item.report.comentariosAdicionales}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => setSelectedReportForView(item.report)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wider transition-colors w-full sm:w-auto justify-center"
                                >
                                  <Eye size={11} />
                                  <span>Ver Detalles</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadDoc(item.report, item.ot)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wider transition-colors w-full sm:w-auto justify-center"
                                >
                                  <Download size={11} />
                                  <span>Word</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {eqReports.length === 0 && (
                          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl">
                            <History size={20} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-[11px] italic">No se registran informes históricos para este equipo.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {allEquipments.length === 0 && (
              <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-3xl">
                <Cpu size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm font-medium">Este contrato no registra equipos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Report details view modal (Inner popup) */}
        {selectedReportForView && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] w-full max-w-3xl max-h-[75vh] flex flex-col overflow-hidden border border-slate-100">
              
              {/* Inner Header */}
              <div className="px-5 py-3.5 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center text-left">
                <div>
                  <h4 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
                    Ficha de Informe: {selectedReportForView.informeN || `INF-${selectedReportForView.id.slice(0, 6)}`}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Servicio de energía crítica · SLA Oficial
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Inner Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left text-xs">
                {/* Voltages */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Voltaje Entrada</span>
                    <strong className="text-sm text-slate-800 block mt-0.5 font-mono">{selectedReportForView.voltajeEntrada} V</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Voltaje Salida</span>
                    <strong className="text-sm text-slate-800 block mt-0.5 font-mono">{selectedReportForView.voltajeSalida} V</strong>
                  </div>
                </div>

                {/* Battery info */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1.5">Estado Banco de Baterías</h5>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Nivel Carga</span>
                      <strong className="text-slate-800 font-mono text-xs">{selectedReportForView.indicadoresBateria?.nivelCarga || 0}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Temp. Promedio</span>
                      <strong className="text-slate-800 font-mono text-xs">{selectedReportForView.indicadoresBateria?.temperaturaC || 0}°C</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Estado Celdas</span>
                      <strong className="text-slate-800 font-mono text-xs">{selectedReportForView.indicadoresBateria?.estadoCeldas || 'S/D'}</strong>
                    </div>
                  </div>
                </div>

                {/* Diagnostic and comments */}
                <div className="space-y-3">
                  <div>
                    <strong className="text-slate-700 block mb-1">Diagnóstico Técnico y Observaciones:</strong>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 italic">
                      {selectedReportForView.observacionesDiagnostico || 'UPS operando dentro de los parámetros normales de flotación estable.'}
                    </div>
                  </div>

                  {selectedReportForView.comentariosAdicionales && (
                    <div>
                      <strong className="text-slate-700 block mb-1">Comentarios Adicionales:</strong>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 italic">
                        {selectedReportForView.comentariosAdicionales}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <strong className="text-slate-700 block mb-1">Recomendaciones del Técnico:</strong>
                    <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl space-y-1">
                      {selectedReportForView.recomendaciones && selectedReportForView.recomendaciones.length > 0 ? (
                        selectedReportForView.recomendaciones.map((rec, rIdx) => (
                          <div key={rIdx} className="flex gap-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-teal-brand" />
                            <span>{rec}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No se registraron recomendaciones adicionales en esta visita.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inner Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/60 flex justify-end">
                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors text-xs uppercase tracking-wider"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
