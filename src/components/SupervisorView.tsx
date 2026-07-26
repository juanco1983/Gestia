import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  ThumbsUp,
  ThumbsDown,
  DownloadCloud,
  AlertTriangle,
  CheckSquare,
  CheckCircle2,
  Info,
  Printer,
  FileCheck2,
  Sparkles,
  Eye,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Cpu
} from 'lucide-react';
import { OT, OTStatus, Client, TechnicalReport, OtEquipoAsignacion } from '../types';
import DocumentFormat from './DocumentFormat';
import { ALL_ACCIONES } from '../utils/reportDefaults';
import { useLocalToast } from './shared/ToastModal';
import ErrorBoundary from './shared/ErrorBoundary';

interface SupervisorViewProps {
  ots: OT[];
  clients: Client[];
  reports: TechnicalReport[];
  onUpdateOtStatus: (otId: string, status: OTStatus) => void;
  onUpdateReport: (report: TechnicalReport) => void;
  otEquipoAsignaciones?: OtEquipoAsignacion[];
}

export default function SupervisorView({
  ots,
  clients,
  reports,
  onUpdateOtStatus,
  onUpdateReport,
  otEquipoAsignaciones = []
}: SupervisorViewProps) {
  // Filter OTs in "Sometido a Revisión" or "Rechazado" to review report
  const pendingOts = ots.filter(o => o.estado === OTStatus.EN_REVISION || o.estado === OTStatus.OBSERVADA);
  
  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  const [correccionText, setCorreccionText] = useState<string>('');
  const [simulatedDocxDownloaded, setSimulatedDocxDownloaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'previsualizacion'>('resumen');
  const { notifySuccess, notifyError, toastView } = useLocalToast();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string>('');

  const otEquipoIds = useMemo(() => {
    if (!selectedOt?.equipoId) return [];
    return selectedOt.equipoId.split(',').map(x => x.trim()).filter(Boolean);
  }, [selectedOt?.equipoId]);

  // Retrieve current report associated with selected OT and equipo
  const getAssociatedReport = (otId: string, equipoId?: string) => {
    if (!otId) return undefined;
    const cleanOtId = otId.trim().toUpperCase();
    const matchesOt = (r: TechnicalReport) => Boolean(r.otId && r.otId.trim().toUpperCase() === cleanOtId);

    if (equipoId) {
      const cleanEqId = equipoId.trim().toUpperCase();
      const exact = reports.find(r => matchesOt(r) && r.equipoId && r.equipoId.trim().toUpperCase() === cleanEqId);
      if (exact) return exact;

      const partial = reports.find(r => matchesOt(r) && r.equipoId && r.equipoId.split(',').map(x => x.trim().toUpperCase()).includes(cleanEqId));
      if (partial) return partial;
    }

    // Guaranteed fallback: return any report registered for this OT
    return reports.find(r => matchesOt(r));
  };

  const handleSelectOt = (ot: OT) => {
    setSelectedOt(ot);
    const equiposIds = ot.equipoId ? ot.equipoId.split(',').map(x => x.trim()).filter(Boolean) : [];
    setSelectedEquipoId(equiposIds[0] || '');
    const report = getAssociatedReport(ot.id, equiposIds[0]);
    setCorreccionText(report?.correccionesSupervisor || '');
    setSimulatedDocxDownloaded(false);
    setActiveTab('resumen');
    setIsFullscreen(false);
    setZoom(100);
  };

  const handleApproveReport = () => {
    if (!selectedOt) return;
    const isApprovedOrCompleted = ['Aprobada', 'Conformidad Firmada (Listo para Facturar)', 'Firmada', 'Cerrada', 'Facturada'].includes(selectedOt.estado);
    if (isApprovedOrCompleted) {
      notifyError('Acción Restringida', 'Este informe ya ha sido aprobado previamente y no se pueden realizar nuevas aprobaciones.');
      return;
    }
    onUpdateOtStatus(selectedOt.id, OTStatus.APROBADA);
    notifySuccess('Informe Aprobado', 'Se envió la notificación automatizada al cliente para firma de conformidad.');
    setSelectedOt(null);
  };

  const handleDeclineReport = () => {
    if (!selectedOt) return;
    const isApprovedOrCompleted = ['Aprobada', 'Conformidad Firmada (Listo para Facturar)', 'Firmada', 'Cerrada', 'Facturada'].includes(selectedOt.estado);
    if (isApprovedOrCompleted) {
      notifyError('Acción Restringida', 'No se puede cancelar ni rechazar un informe ya aprobado.');
      return;
    }
    if (!correccionText.trim()) {
      notifyError('Validación Requerida', 'Debe redactar una nota de corrección explicando qué mediciones o fotos se deben re-evaluar.');
      return;
    }

    const report = getAssociatedReport(selectedOt.id, selectedEquipoId || undefined);
    if (report) {
      const updatedReport = {
        ...report,
        correccionesSupervisor: correccionText
      };
      onUpdateReport(updatedReport);
    }

    onUpdateOtStatus(selectedOt.id, OTStatus.OBSERVADA);
    notifySuccess('Enviado a Corrección', 'El informe regresó a la bandeja del técnico con las anotaciones correspondientes.');
    setSelectedOt(null);
  };

  const handleDownloadDocx = () => {
    if (!selectedOt) return;
    const client = clients.find(c => c.id === selectedOt.clientId) || {
      id: 'fallback_1',
      razonSocial: 'Cliente General S.A.',
      ruc: '20100123456',
      direccionSede: 'Sede Central',
      distrito: 'Surco, Lima',
      contactoNombre: 'Representante',
      contactoEmail: 'soporte@clientegeneral.pe',
      contactoTelefono: '999999999'
    };
    const report = getAssociatedReport(selectedOt.id, selectedEquipoId || undefined);
    if (!report) {
      notifyError('Informe no Redactado', 'El informe técnico aún no ha sido redactado por el personal técnico.');
      return;
    }

    setSimulatedDocxDownloaded(true);
    setTimeout(() => {
      setSimulatedDocxDownloaded(false);
    }, 4500);

    const infoN = report.informeN || `INF-2026-${selectedOt.id.replace('OT-','')}`;
    const hojaServ = report.hojaServicioN || `HJ-544-${selectedOt.id.replace('OT-','')}`;
    const fechaSel = report.fechaServicio || selectedOt.fechaProgramada || new Date().toISOString().split('T')[0];
    const tech1 = report.tecnico1 || selectedOt.tecnicoTitular;
    const tech2 = report.tecnico2 || selectedOt.tecnicoApoyo || "Ninguno";
    const c = report.caracteristicas || {};
    const steps = report.pasos || {};
    const recs = report.recomendaciones || [];

    const medEnt = report.medicionesEntrada || { lnVoltaje: ["220","220","220"], lnIntensidad: ["0","0","0"], frecuencia: ["60.0","60.0","60.0"], llVoltaje: ["380","380","380"] };
    const medSal = report.medicionesSalida || { lnVoltaje: ["220","220","220"], lnIntensidad: ["0","0","0"], frecuencia: ["60.0","60.0","60.0"], llVoltaje: ["380","380","380"] };
    const gab = report.diagnosticoGabinete || {};
    const norm = report.revisionNormas || {};

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

    const photoCells = (report.fotosLabeled || []).map((pic: any, index: number) => `
      <td style="width:50%;border:1px solid #cbd5e1;padding:6px;background:#ffffff;text-align:center;vertical-align:top;">
        <div style="font-size:7.5pt;font-weight:bold;background:#f8fafc;padding:3px;margin-bottom:6px;text-transform:uppercase;border-bottom:1px solid #cbd5e1;font-family:Arial,sans-serif;">${index+1}. ${pic.slotName}</div>
        <div style="text-align:center;margin-top:4px;">
          ${pic.base64 ? `<img src="${pic.base64}" width="260" height="195" style="width:260px;height:195px;object-fit:cover;border:1px solid #cbd5e1;display:inline-block;" />` : `<div style="height:195px;line-height:195px;background:#f1f5f9;border:1px solid #cbd5e1;font-size:7.5pt;color:#94a3b8;font-family:Arial,sans-serif;">EVIDENCIA FOTOGRÁFICA REGISTRADA</div>`}
        </div>
      </td>
    `);

    let photosPage1 = '';
    const pSlice1 = photoCells.slice(0, 8);
    for (let i = 0; i < pSlice1.length; i += 2) {
      photosPage1 += `<tr>${pSlice1[i]}${pSlice1[i+1] || '<td style="width:50%;border:1px solid #cbd5e1;background:#f8fafc;"></td>'}</tr>`;
    }

    let photosPage2 = '';
    const pSlice2 = photoCells.slice(8, 16);
    if (pSlice2.length > 0) {
      for (let i = 0; i < pSlice2.length; i += 2) {
        photosPage2 += `<tr>${pSlice2[i]}${pSlice2[i+1] || '<td style="width:50%;border:1px solid #cbd5e1;background:#f8fafc;"></td>'}</tr>`;
      }
    }

    let photosPage3 = '';
    const pSlice3 = photoCells.slice(16, 20);
    if (pSlice3.length > 0) {
      for (let i = 0; i < pSlice3.length; i += 2) {
        photosPage3 += `<tr>${pSlice3[i]}${pSlice3[i+1] || '<td style="width:50%;border:1px solid #cbd5e1;background:#f8fafc;"></td>'}</tr>`;
      }
    }

    const headerH = `
      <table style="width:100%;border-collapse:collapse;border:2px solid #0f172a;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:12px;">
        <tr>
          <td style="width:25%;border:1px solid #0f172a;padding:4px;text-align:center;font-weight:bold;color:#1e3a8a;">MAFORT SERVICE</td>
          <td style="width:50%;border:1px solid #0f172a;padding:4px;text-align:center;font-size:7.5pt;font-weight:bold;">PREVENTIVO UPS - ${selectedOt.id} | CLIENTE: ${client.razonSocial}</td>
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
    <!-- P1: PORTADA -->
    <div>
      ${headerH}
      <div class="title">INFORME TÉCNICO OFICIAL S.L.A</div>
      <div class="subtitle">ORDEN DE TRABAJO ${selectedOt.id} - ${selectedOt.tipoMantenimiento}</div>
      <div style="border:1px solid #cbd5e1;padding:12px;background:#f8fafc;margin-top:20px;border-radius:6px;font-size:9pt;line-height:1.6;">
        <b>DIRECCIÓN DE SEDE:</b> ${client.direccionSede}, ${client.distrito}<br/>
        <b>CONTACTO TÉCNICO:</b> ${client.contactoNombre}<br/>
        <b>CARGO:</b> Responsable Logístico / Data Center<br/>
        <b>MÓVIL CONTÁCTANOS:</b> ${client.contactoTelefono || '9993709'}<br/>
        <b>EMAIL ASOCIADO:</b> ${client.contactoEmail}
      </div>
      <div style="margin-top:100px;text-align:center;">
        <strong style="color:#1e3a8a;font-size:12pt;font-family:monospace;">MAFORT SERVICE S.A.C</strong><br/>
        <span style="font-size:8pt;color:#94a3b8;font-weight:bold;">SOPORTE TÉCNICO AUTORIZADO DE ENERGÍA CRÍTICA</span>
      </div>
      <div style="margin-top:160px;">${footerH}</div>
    </div>

    <!-- P2: ANTECEDENTES Y ACCIONES -->
    ${breakH}
    <div>
      ${headerH}
      <div style="text-align:center;font-weight:bold;font-size:11pt;margin-bottom:10px;">INFORME TÉCNICO OFICIAL #${infoN}</div>
      <table>
        <tr style="background:#f8fafc;"><td><b>EMPRESA</b></td><td>: ${client.razonSocial}</td></tr>
        <tr><td><b>LOCAL / SEDE</b></td><td>: ${client.direccionSede} - ${client.distrito}</td></tr>
        <tr style="background:#f8fafc;"><td><b>CONTACTO</b></td><td>: ${client.contactoNombre}</td></tr>
        <tr><td><b>ASUNTO</b></td><td style="color:#1e3a8a;font-weight:bold;">: PREVENTIVO DE ${selectedOt.tipoEquipo} de ${selectedOt.potenciaKva} KVA</td></tr>
        <tr style="background:#f8fafc;"><td><b>FECHA Y HOJA</b></td><td>: ${fechaSel} / Hoja Servicio: ${hojaServ}</td></tr>
        <tr><td><b>TÉCNICOS</b></td><td>: ${tech1} ${tech2 !== 'Ninguno' ? `/ ${tech2}` : ''}</td></tr>
      </table>
      <div class="sect">I. ANTECEDENTES DEL SERVICIO</div>
      <div style="background:#f8fafc;border-left:3px solid #1e3a8a;padding:8px;font-size:8.5pt;margin-top:6px;text-align:justify;line-height:1.5;">
        ${report.antecedentes || `El servicio se realizó conforme a las especificaciones solicitadas en ${client.razonSocial}, encontrando el equipo ${selectedOt.tipoEquipo} de potencia ${selectedOt.potenciaKva} KVA operable en flotación estable y libre de alarmas de advertencia activas.`}
      </div>
      <div class="sect">II. ACCIONES DE MANTENIMIENTO PREVENTIVO REALIZADAS</div>
      <table style="font-size:8pt;margin-top:5px;">${actionsRows}</table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>

    <!-- P3: PASOS Y FICHA TÉCNICA I -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">III. PROCEDIMIENTOS DE ENERGÍA EJECUTADOS</div>
      <div class="box"><b class="step-title">P01: INSPECCIÓN PRE-INTERVENCIÓN:</b><div class="step-content">${steps.paso1 || 'Medición inicial de parámetros funcionales en inversor.'}</div></div>
      <div class="box"><b class="step-title">P02: DES-ENERGIZACIÓN Y CORTE CONTROLADO:</b><div class="step-content">${steps.paso2 || 'Traspaso mecánico a bypass sincrónico para seguridad industrial.'}</div></div>
      <div class="box"><b class="step-title">P03: SOPLETEADO Y AJUSTE TÉRMICO:</b><div class="step-content">${steps.paso3 || 'Limpieza interna sopleteada profunda y reajuste de torque en borneras.'}</div></div>
      <div class="box"><b class="step-title">P04: EVALUACIÓN DE IMPEDANCIA BATERÍAS:</b><div class="step-content">${steps.paso4 || 'Mediciones individuales del banco de baterías de plomo ácido.'}</div></div>
      <div class="box"><b class="step-title">P05: RETESTEO CON CARGA DE TRABAJO:</b><div class="step-content">${steps.paso5 || 'Simulacro preventivo de corte comercial.'}</div></div>
      <div class="box" style="border-left-color:#10b981;"><b class="step-title" style="color:#10b981;">P06: DECLARACIÓN DE OPERABILIDAD FINAL:</b><div class="step-content"><b>ESTADO: ${steps.paso6_concluido === 'no' ? 'NO CONCLUIDO' : 'SI OPERATIVO'}</b><br/>${steps.paso6_concluido === 'no' ? steps.paso6_observaciones : (steps.paso6 || 'Equipo estabilizado en inversor sustentando la carga con total normalidad.')}</div></div>
      <div style="margin-top:40px;">${footerH}</div>
    </div>

    <!-- P4: CARACTERÍSTICAS TÉCNICAS PARTE I -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">IV. CARACTERÍSTICAS TÉCNICAS DEL EQUIPO (PARTE I)</div>
      <table style="width:100%;">
        <tr style="background:#1e3a8a;">
          <td style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:50%;">CARACTERÍSTICA</td>
          <td style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:50%;">VALOR REGISTRADO</td>
        </tr>
        ${charRows1}
      </table>
      <div style="margin-top:100px;">${footerH}</div>
    </div>

    <!-- P5: CARACTERÍSTICAS TÉCNICAS PARTE II -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">IV. CARACTERÍSTICAS TÉCNICAS DEL EQUIPO (PARTE II)</div>
      <table style="width:100%;">
        <tr style="background:#1e3a8a;">
          <td style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:50%;">ELEMENTO / REDUNDANCIA</td>
          <td style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:50%;">VALOR REGISTRADO</td>
        </tr>
        ${charRows2 || '<tr><td colspan="2" style="text-align:center;color:#94a3b8;">Ficha técnica completada en sección previa.</td></tr>'}
      </table>
      <div style="margin-top:12px;background:#eff6ff;padding:8px;border:1px solid #bfdbfe;font-size:8pt;color:#1e3a8a;">
        <b>ADVERTENCIA SOBRE TRANSFORMADORES:</b> Circuito derivado neutro-tierra inferior a 0.5V AC según normativa de energía crítica.
      </div>
      <div style="margin-top:100px;">${footerH}</div>
    </div>

    <!-- P6: REGISTRO FOTOGRÁFICO DE AUDITORÍA -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect" style="text-align:center;">V. REGISTRO FOTOGRÁFICO DE SEGURIDAD S.L.A (PARTE I)</div>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <colgroup>
          <col style="width:50%;" />
          <col style="width:50%;" />
        </colgroup>
        ${photosPage1 || '<tr><td colspan="2" style="padding:40px;color:#94a3b8;text-align:center;">Sin evidencias adjuntas.</td></tr>'}
      </table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>

    <!-- P7: REGISTRO FOTOGRÁFICO II -->
    ${photosPage2 ? `
    ${breakH}
    <div>
      ${headerH}
      <div class="sect" style="text-align:center;">V. REGISTRO FOTOGRÁFICO DE SEGURIDAD S.L.A (PARTE II)</div>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <colgroup>
          <col style="width:50%;" />
          <col style="width:50%;" />
        </colgroup>
        ${photosPage2}
      </table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
    ` : ''}

    <!-- P8: REGISTRO FOTOGRÁFICO III -->
    ${photosPage3 ? `
    ${breakH}
    <div>
      ${headerH}
      <div class="sect" style="text-align:center;">V. REGISTRO FOTOGRÁFICO DE SEGURIDAD S.L.A (PARTE III)</div>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <colgroup>
          <col style="width:50%;" />
          <col style="width:50%;" />
        </colgroup>
        ${photosPage3}
      </table>
      <div style="margin-top:40px;">${footerH}</div>
    </div>
    ` : ''}

    <!-- P9: MEDICIONES DE PARÁMETROS ELÉCTRICOS -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">VI. MEDICIONES Y PARÁMETROS ELECTRICOS DE OPERATIVIDAD</div>
      <p style="font-weight:bold;color:#1e3a8a;margin-top:8px;">A. ENTRADA DE RED COMERCIAL</p>
      <table>
        <tr style="background:#1e293b;">
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">PARÁMETRO</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE R (RS)</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE S (ST)</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE T (TR)</td>
        </tr>
        <tr><td>Voltaje L-N</td><td>${medEnt.lnVoltaje?.[0] ?? '220'} V</td><td>${medEnt.lnVoltaje?.[1] ?? '220'} V</td><td>${medEnt.lnVoltaje?.[2] ?? '220'} V</td></tr>
        <tr style="background:#f8fafc;"><td>Intensidad L-N</td><td>${medEnt.lnIntensidad?.[0] ?? '0'} A</td><td>${medEnt.lnIntensidad?.[1] ?? '0'} A</td><td>${medEnt.lnIntensidad?.[2] ?? '0'} A</td></tr>
        <tr><td>Frecuencia</td><td>${medEnt.frecuencia?.[0] ?? '60'} Hz</td><td>${medEnt.frecuencia?.[1] ?? '60'} Hz</td><td>${medEnt.frecuencia?.[2] ?? '60'} Hz</td></tr>
        <tr style="background:#f8fafc;"><td>Voltaje L-L</td><td>${medEnt.llVoltaje?.[0] ?? '380'} V</td><td>${medEnt.llVoltaje?.[1] ?? '380'} V</td><td>${medEnt.llVoltaje?.[2] ?? '380'} V</td></tr>
      </table>
      <p style="font-weight:bold;color:#1e3a8a;margin-top:12px;">B. SALIDA A CARGA PROTEGIDA</p>
      <table>
        <tr style="background:#1e293b;">
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">PARÁMETRO</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE R (RS)</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE S (ST)</td>
          <td style="background-color:#1e293b;color:#ffffff;font-weight:bold;font-size:8pt;font-family:Arial,sans-serif;padding:6px;width:25%;">FASE T (TR)</td>
        </tr>
        <tr><td>Voltaje L-N</td><td>${medSal.lnVoltaje?.[0] ?? '220'} V</td><td>${medSal.lnVoltaje?.[1] ?? '220'} V</td><td>${medSal.lnVoltaje?.[2] ?? '220'} V</td></tr>
        <tr style="background:#f8fafc;"><td>Intensidad L-N</td><td>${medSal.lnIntensidad?.[0] ?? '0'} A</td><td>${medSal.lnIntensidad?.[1] ?? '0'} A</td><td>${medSal.lnIntensidad?.[2] ?? '0'} A</td></tr>
        <tr><td>Frecuencia</td><td>${medSal.frecuencia?.[0] ?? '60'} Hz</td><td>${medSal.frecuencia?.[1] ?? '60'} Hz</td><td>${medSal.frecuencia?.[2] ?? '60'} Hz</td></tr>
        <tr style="background:#f8fafc;"><td>Voltaje L-L</td><td>${medSal.llVoltaje?.[0] ?? '380'} V</td><td>${medSal.llVoltaje?.[1] ?? '380'} V</td><td>${medSal.llVoltaje?.[2] ?? '380'} V</td></tr>
      </table>
      <div class="sect">VII. DIAGNÓSTICO INTEGRAL DE CAMPO</div>
      <div style="font-size:8.5pt;background:#f8fafc;padding:6px;border:1px solid #cbd5e1;margin-top:5px;line-height:1.4;">
        <b>¿OPERACIÓN CON GABINETE?</b> ${gab.cuentaConGabinete === 'si' ? `SI (Estructura: ${gab.tipoEstructura || 'modo Rack'})` : 'NO'}<br/>
        <b>¿ACOMPAÑADO DE BYPASS ACTIVO?</b> ${report.indicadoresBateria?.bypassActivo ? 'SI' : 'NO'}
      </div>
      <div style="margin-top:40px;">${footerH}</div>
    </div>

    <!-- P10: NORMAS, RECOMENDACIONES Y CONFORMIDAD -->
    ${breakH}
    <div>
      ${headerH}
      <div class="sect">VIII. AUDITORÍA REGLAMENTARIA Y RECOMENDACIONES</div>
      <div style="font-size:8.5pt;color:#334155;line-height:1.5;">
        <b>✓ CONTROL DE FLUIDOS:</b> Mantenimiento preventivo sopleteado totalmente concluido.<br/>
        <b>✓ CONTROL DE RIESGO QUÍMICO (BATERÍAS):</b> Año Baterías: ${norm.anioBaterias || 2022}. Diagnóstico: ${((new Date().getFullYear()) - (norm.anioBaterias || 2022) <= 3) ? 'Baterías dentro de rango seguro (<3 años).' : 'PROGRAMAR REEMPLAZO INMEDIATO DE BATERÍAS POR VENCIMIENTO (>3 años).'}<br/>
        <b>✓ CONTROL TERMICO:</b> Área en óptimas condiciones de climatización (21°C promedio).<br/>
        <b>✓ ESTADO OPERATORIO:</b> El equipo queda 100% OPERATIVO sobre inversor estable.
      </div>

      <div class="sect">IX. RECOMENDACIONES EMITIDAS</div>
      <div style="background:#f8fafc;padding:8px;border:1px dashed #cbd5e1;font-size:8.5pt;color:#475569;">
        ${recs.map((rec: string, id: number) => `<div><b>❖ Rec #${id+1}:</b> ${rec}</div>`).join('')}
        ${recs.length === 0 ? '<i>Sin recomendaciones adicionales.</i>' : ''}
      </div>

      <!-- Firmas side by side -->
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
    a.download = `Informe_Tecnico_${selectedOt.id}_SLA.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(r => {
    const ot = ots.find(o => o.id === r.otId);
    const client = clients.find(c => c.id === ot?.clientId);
    
    const searchLower = globalSearch.toLowerCase();
    const matchesTech = r.tecnico1?.toLowerCase().includes(searchLower) || r.tecnico2?.toLowerCase().includes(searchLower) || ot?.tecnicoTitular?.toLowerCase().includes(searchLower);
    const matchesOt = r.otId?.toLowerCase().includes(searchLower) || r.informeN?.toLowerCase().includes(searchLower);
    const matchesClient = client?.razonSocial?.toLowerCase().includes(searchLower);
    
    return matchesTech || matchesOt || matchesClient;
  });

  return (
    <ErrorBoundary>
    <div className="space-y-6 animate-fade-in" id="supervisor-parent-container">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800" id="supervisor-dashboard-container">
        {/* Submitted reports stack */}
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden self-start">
          <div className="px-5 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
            <h2 className="text-white text-sm font-bold uppercase font-mono tracking-tight flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Auditoría de Informes</span>
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              {pendingOts.length} pendientes
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {pendingOts.map(ot => {
              const client = clients.find(c => c.id === ot.clientId);
              const isSelected = selectedOt?.id === ot.id;
              const isRejected = ot.estado === OTStatus.OBSERVADA;

              return (
                <div 
                  key={ot.id}
                  onClick={() => handleSelectOt(ot)}
                  className={`p-4 transition-all cursor-pointer ${
                    isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'hover:bg-slate-50/50'
                  }`}
                  id={`audit-ot-${ot.id}-card`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-indigo-600 font-mono text-[11px] font-bold block">{ot.id}</span>
                      <h3 className="font-extrabold text-slate-950 text-xs leading-snug uppercase truncate max-w-[180px]">{client?.razonSocial || 'Cliente Desconocido'}</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{ot.tipoEquipo}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      isRejected ? 'bg-rose-50 text-rose-650 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-250/60'
                    }`}>
                      {isRejected ? 'Rechazado' : 'Por Revisar'}
                    </span>
                  </div>
                </div>
              );
            })}
            {pendingOts.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-mono py-16">
                Excelente: No hay reportes técnicos en cola de auditoría. All clear!
              </div>
            )}
          </div>
        </div>

        {/* Main audit panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOt ? (
            (() => {
              const client = clients.find(c => c.id === selectedOt.clientId) || {
                id: 'fallback_1',
                razonSocial: 'Cliente General S.A.',
                ruc: '20100123456',
                direccionSede: 'Sede Central',
                distrito: 'Surco, Lima',
                contactoNombre: 'Representante',
                contactoEmail: 'soporte@clientegeneral.pe',
                contactoTelefono: '999999999'
              };
    const report = getAssociatedReport(selectedOt.id, selectedEquipoId || undefined);

              return (
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                  {/* Header review */}
                  <div className="px-5 py-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-amber-500 font-mono font-bold">REPOSITORIO DE CONTROL DE PROYECTO</span>
                      <h2 className="text-sm font-bold font-sans mt-0.5">{selectedOt.id} — Panel de Revisión de Calidad</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleDownloadDocx}
                        className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-amber-400 transition-all font-mono cursor-pointer"
                        id="download-draft-docx"
                      >
                        <DownloadCloud size={14} />
                        <span>Exportar Word (.docx)</span>
                      </button>
                      
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500 transition-all font-mono shadow cursor-pointer"
                      >
                        <Printer size={14} />
                        <span>Imprimir SLA</span>
                      </button>
                    </div>
                  </div>

                  {/* Simulated docx download success notification */}
                  {simulatedDocxDownloaded && (
                    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 text-emerald-600 text-xs font-mono flex items-center gap-2">
                      <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Plantilla Generada Exitosamente:</strong> Se generó el archivo de Word oficial estructurando el informe completo y adaptando el encuadre de las fotografías. Descarga simulada iniciada.</span>
                    </div>
                  )}

                  {/* Tab Switcher */}
                  <div className="border-b border-slate-200 flex bg-slate-50/50 justify-between items-center px-4">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab('resumen')}
                        className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 cursor-pointer ${
                          activeTab === 'resumen' 
                          ? 'border-indigo-650 text-indigo-650bg-white' 
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Resumen Técnico
                      </button>
                      <button
                        onClick={() => setActiveTab('previsualizacion')}
                        className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-1 cursor-pointer ${
                          activeTab === 'previsualizacion' 
                          ? 'border-indigo-650 text-indigo-650 bg-white' 
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <FileCheck2 size={13} className="text-indigo-500" />
                        <span>Previsualización Impresa (Doble Marco)</span>
                      </button>
                    </div>

                    {activeTab === 'previsualizacion' && (
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1 rounded-lg text-[10px] uppercase transition-all cursor-pointer font-mono shadow-xs"
                        id="tab-maximize-btn"
                        title="Maximizar en Pantalla Completa"
                      >
                        <Maximize2 size={12} className="shrink-0" />
                        <span>Maximizar Vista</span>
                      </button>
                    )}
                  </div>

                  {/* Client Metadata context card */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-slate-400 block font-mono uppercase text-[9px]">Cliente de Mantenimiento</span>
                      <strong className="text-slate-900 block mt-0.5">{client?.razonSocial}</strong>
                      <span className="text-slate-500 block text-[10px]">RUC: {client?.ruc} | Sede: {client?.direccionSede}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono uppercase text-[9px]">Asignación de Técnicos</span>
                      <span className="text-slate-700 block mt-0.5 font-semibold">
                        Titular: {(() => {
                          const asg = (otEquipoAsignaciones || []).find(a => a.otId === selectedOt.id && a.equipoId === selectedEquipoId);
                          return asg ? asg.tecnicoTitular : selectedOt.tecnicoTitular;
                        })()}
                      </span>
                      <span className="text-slate-500 block text-[10px]">
                        Auxiliar: {(() => {
                          const asg = (otEquipoAsignaciones || []).find(a => a.otId === selectedOt.id && a.equipoId === selectedEquipoId);
                          return asg ? (asg.tecnicoApoyo || 'Ninguno') : (selectedOt.tecnicoApoyo || 'Ninguno');
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Per-equipo tab selector */}
                  {otEquipoIds.length > 1 && (
                    <div className="border-b border-slate-200 bg-slate-50/50 px-4 flex flex-wrap gap-1 py-2">
                      {otEquipoIds.map(eqId => (
                        <button
                          key={eqId}
                          type="button"
                          onClick={() => {
                            setSelectedEquipoId(eqId);
                            const eqReport = getAssociatedReport(selectedOt.id, eqId);
                            setCorreccionText(eqReport?.correccionesSupervisor || '');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedEquipoId === eqId
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 border border-transparent'
                          }`}
                        >
                          <Cpu size={12} />
                          <span>Equipo {eqId.slice(0, 6)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Report Content review */}
                  {report ? (
                    activeTab === 'resumen' ? (
                      <div className="p-6 space-y-6">
                        
                        {/* Measurements summary */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-slate-850 uppercase font-mono tracking-tight pb-1 border-b border-slate-100 flex items-center gap-1.5">
                            <Info size={14} className="text-slate-400" />
                            <span>Parámetros de Auditoría Rápida</span>
                          </h3>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-mono text-[9px] uppercase">Voltaje Entrada</span>
                              <strong className="text-base text-slate-900 block mt-0.5 font-mono">{report.voltajeEntrada} V</strong>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-mono text-[9px] uppercase">Voltaje Salida</span>
                              <strong className="text-base text-slate-900 block mt-0.5 font-mono">{report.voltajeSalida} V</strong>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-mono text-[9px] uppercase">Capacidad Display</span>
                              <strong className="text-base text-slate-900 block mt-0.5 font-mono">{report.revisionNormas?.inversorOperandoPorcentaje || 30}%</strong>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-150">
                              <span className="text-slate-400 block font-mono text-[9px] uppercase">Bypass Estado</span>
                              <strong className={`text-xs block mt-1 font-mono uppercase ${
                                report.indicadoresBateria?.bypassActivo ? 'text-amber-600 font-bold' : 'text-emerald-600'
                              }`}>
                                {report.indicadoresBateria?.bypassActivo ? 'ACTIVO (BYPASS)' : 'OPERANDO EN INVERSOR'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Photo evidence registry */}
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase font-sans">REGISTRO FOTOGRÁFICO DE CONFORMIDAD:</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans">
                            {(() => {
                              const displayPhotos: { name: string; url: string }[] = [];
                              if (Array.isArray(report.fotosLabeled) && report.fotosLabeled.length > 0) {
                                report.fotosLabeled.forEach((slot, idx) => {
                                  const fallbackUrl = Array.isArray(report.fotos) ? report.fotos[idx] : '';
                                  displayPhotos.push({
                                    name: slot.slotName || `Foto ${idx + 1}`,
                                    url: slot.base64 || (typeof fallbackUrl === 'string' ? fallbackUrl : '')
                                  });
                                });
                              } else if (Array.isArray(report.fotos) && report.fotos.length > 0) {
                                report.fotos.forEach((imgUrl, idx) => {
                                  displayPhotos.push({
                                    name: `Fotografía de Campo ${idx + 1}`,
                                    url: typeof imgUrl === 'string' ? imgUrl : ''
                                  });
                                });
                              }

                              if (displayPhotos.length === 0) {
                                return (
                                  <div className="col-span-full p-4 bg-white border border-slate-200 rounded-lg text-center text-slate-400 text-xs font-mono">
                                    No hay registros fotográficos adjuntos a este informe.
                                  </div>
                                );
                              }

                              return displayPhotos.map((photo, idx) => (
                                <div key={idx} className="border border-slate-200 bg-white p-1 rounded font-sans">
                                  {photo.url ? (
                                    <img src={photo.url} alt={photo.name} className="w-full h-20 object-cover rounded" />
                                  ) : (
                                    <div className="w-full h-20 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 font-mono">Sin foto</div>
                                  )}
                                  <span className="text-[8px] font-mono text-center block text-slate-600 uppercase mt-1 truncate px-0.5 select-none" title={photo.name}>
                                    {idx + 1}. {photo.name}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Narrative elements */}
                        <div className="space-y-3 font-sans">
                          <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-tight border-b border-slate-100 pb-1">Diagnóstico e Historial de Celdas</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block font-medium">Antecedentes redactados:</span>
                              <p className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-650 leading-relaxed text-left text-[11px] italic mt-1 font-sans">
                                "{report.antecedentes}"
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500 block font-medium">Observación de Cierre (Paso 6):</span>
                              <p className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-650 leading-relaxed text-left text-[11px] italic mt-1 font-sans">
                                "{report.pasos?.paso6 || 'El UPS queda operando satisfactoriamente en modo inversor.'}"
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Directives and Corrections */}
                        <div className="pt-4 border-t border-slate-200 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-slate-705 select-none">
                            <AlertTriangle size={15} className="text-amber-500" />
                            <label className="font-bold text-xs font-mono uppercase text-slate-700">Instrucciones de Corrección de Auditoría:</label>
                          </div>
                          <textarea
                            rows={3}
                            value={correccionText}
                            onChange={(e) => setCorreccionText(e.target.value)}
                            placeholder="Si el reporte requiere subsanar algún dato, redacte el comentario aquí y haga click en 'Rechazar y Regresar a Campo'..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
                            id="supervisor-correction-textarea"
                          />
                        </div>

                        {/* Operational Actions */}
                        {['Aprobada', 'Conformidad Firmada (Listo para Facturar)', 'Firmada', 'Cerrada', 'Facturada'].includes(selectedOt.estado) ? (
                          <div className="flex items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl w-full">
                            <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-xs">
                              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                              <span>INFORME APROBADO Y REGISTRADO — Este informe ya cuenta con la aprobación del supervisor y no puede ser modificado ni cancelado.</span>
                            </div>
                            <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                              {selectedOt.estado}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150">
                            <button 
                              type="button"
                              onClick={handleDeclineReport}
                              className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                              id="audit-reject-btn"
                            >
                              <ThumbsDown size={14} />
                              <span>Rechazar y Regresar a Campo</span>
                            </button>

                            <button 
                              type="button"
                              onClick={handleApproveReport}
                              className="flex items-center gap-1.5 bg-emerald-500 text-slate-955 px-5 py-2.5 text-xs font-extrabold rounded-lg hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
                              id="audit-approve-btn"
                            >
                              <ThumbsUp size={14} />
                              <span>Aprobar y Enviar a Cliente</span>
                            </button>
                          </div>
                        )}

                      </div>
                    ) : (
                      /* High Fidelity Printable Document Format inside an A4 mockup layout */
                      <div className="bg-slate-100 p-6 overflow-y-auto max-h-[640px]">
                        <div className="bg-amber-100 border border-amber-200 text-amber-900 rounded p-3 text-xs mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
                          <div className="flex items-center gap-2">
                            <Sparkles size={15} className="text-amber-600 font-bold shrink-0" />
                            <span><strong>DOCUMENTO LISTO CON DOBLE MARCO DE REUNIÓN:</strong> El siguiente panel reproduce las 10 páginas completas.</span>
                          </div>
                          <button
                            onClick={() => setIsFullscreen(true)}
                            className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors border border-slate-700/40"
                            id="preview-alert-maximize-btn"
                          >
                            <Maximize2 size={12} className="text-amber-400 shrink-0" />
                            <span>Maximizar Vista</span>
                          </button>
                        </div>
                        
                        <div className="shadow-2xl bg-white border border-slate-300 rounded-lg p-2 origin-top scale-95 font-sans">
                          <DocumentFormat report={report} ot={selectedOt} client={client as Client} />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono space-y-2">
                      <div>La data del reporte es ilegible o el técnico aún no inicia el cuestionario.</div>
                      <div className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded text-left">
                        <div>OT buscada: <strong>{selectedOt.id}</strong></div>
                        <div>Equipo ID: <strong>{selectedEquipoId || '(sin equipo)'}</strong></div>
                        <div>Reportes disponibles: <strong>{reports.length}</strong></div>
                        {reports.slice(0, 5).map((r, i) => (
                          <div key={i} className="text-[9px] text-slate-500">
                            #{i}: otId={r.otId} equipoId={r.equipoId || '(none)'} fotos={r.fotos?.length || 0} fotosLabeled={r.fotosLabeled?.length || 0}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200/80 p-12 text-center text-slate-400 space-y-3 font-sans h-full flex flex-col items-center justify-center min-h-[400px]">
              <CheckSquare size={36} className="text-slate-350" />
              <div className="space-y-1">
                <p className="font-bold text-slate-700 text-sm">Bandeja de Auditoría Despejada</p>
                <p className="text-slate-400 text-xs">Seleccione un informe enviado de la lista izquierda para auditar las lecturas y fotos enviadas.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN NUEVA: BUSCADOR HISTÓRICO GLOBAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4 text-left" id="supervisor-global-search-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-sans tracking-tight">
              <FileText className="text-amber-600" size={16} />
              <span>Buscador y Archivo de Informes Técnicos (S.L.A.)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingrese el nombre del técnico de soporte o el código identificador de la OT para filtrar los informes.
            </p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="🔍 Filtrar por técnico, OT o cliente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs text-left text-slate-600 border-collapse">
            <thead className="text-[10px] uppercase font-mono bg-slate-50 text-slate-400 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3 font-semibold">OT Código / Informe N°</th>
                <th className="p-3 font-semibold">Técnico Asignado</th>
                <th className="p-3 font-semibold">Cliente / Sede S.L.A</th>
                <th className="p-3 font-semibold">Fecha de Servicio</th>
                <th className="p-3 font-semibold">Estado de la OT</th>
                <th className="p-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredReports.map((r) => {
                const ot = ots.find(o => o.id === r.otId);
                const client = clients.find(c => c.id === ot?.clientId);
                
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 font-mono">{r.otId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Inf N° {r.informeN || 'S/N'}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      <div>👷 {r.tecnico1 || ot?.tecnicoTitular}</div>
                      {r.tecnico2 && r.tecnico2 !== 'Ninguno' && <div className="text-[10px] text-slate-400">Aux: {r.tecnico2}</div>}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-slate-700">{client?.razonSocial || 'Cliente General'}</div>
                      <div className="text-[10px] text-slate-400">{client?.distrito || 'Lima'}</div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {r.fechaServicio || 'Programado'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        ot?.estado === OTStatus.FIRMADA ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        ot?.estado === OTStatus.APROBADA ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        ot?.estado === OTStatus.EN_REVISION ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        ot?.estado === OTStatus.TRABAJO_EN_EJECUCION ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-655 border-slate-205'
                      }`}>
                        {ot?.estado || 'S/E'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (ot) {
                            handleSelectOt(ot);
                            document.getElementById('supervisor-parent-container')?.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            notifyError('OT Inactiva', 'La orden de trabajo de este informe ya no se encuentra activa en el sistema.');
                          }
                        }}
                        className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1.5 rounded-xl font-bold font-sans transition-all flex items-center gap-1 ml-auto border border-slate-200 hover:border-indigo-200 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Revisar Expediente</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-mono">
                    ⚠️ No se encontraron informes históricos coincidiendo con el criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL-SCREEN MAXIMIZED PREVIEW MODAL OVERLAY */}
      {isFullscreen && selectedOt && (() => {
        const client = clients.find(c => c.id === selectedOt.clientId) || {
          id: 'fallback_1',
          razonSocial: 'Cliente General S.A.',
          ruc: '20100123456',
          direccionSede: 'Sede Central',
          distrito: 'Surco, Lima',
          contactoNombre: 'Representante',
          contactoEmail: 'soporte@clientegeneral.pe',
          contactoTelefono: '999999999'
        };
        const report = getAssociatedReport(selectedOt.id, selectedEquipoId || undefined);
        if (!report) return null;

        return (
          <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex flex-col p-4 md:p-6 animate-fade-in text-slate-800 font-sans" id="fullscreen-preview-modal">
            <div className="bg-slate-100 w-full h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-700/30">
              {/* Modal Header */}
              <div className="bg-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-950 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm font-sans text-white">Visualizador de Auditoría S.L.A</h3>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wide">Expediente: {selectedOt.id} | Cliente: {client.razonSocial}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadDocx}
                    className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-amber-400 transition-all font-mono cursor-pointer"
                    title="Exportar a Word Completo"
                  >
                    <DownloadCloud size={14} />
                    <span>Exportar Word (.docx)</span>
                  </button>

                  {/* Interacciones de Zoom */}
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/50" id="zoom-controls-wrapper">
                    <button
                      onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                      className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all cursor-pointer"
                      title="Alejar Zoom"
                      id="zoom-out-btn"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[10px] font-bold font-mono px-2 text-amber-400 min-w-[40px] text-center" id="zoom-percentage">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                      className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all cursor-pointer"
                      title="Acercar Zoom"
                      id="zoom-in-btn"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500 transition-all font-mono shadow-sm cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Imprimir SLA</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border border-slate-700/50 flex items-center gap-1.5 px-3"
                    id="minimize-modal-btn"
                    title="Restaurar Tamaño"
                  >
                    <Minimize2 size={14} />
                    <span>Minimizar</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Layout and centered DocumentFormat */}
              <div className="flex-1 overflow-auto p-6 md:p-10 bg-slate-900 flex justify-center items-start">
                <div 
                  className="w-full max-w-[850px] shadow-2xl bg-white border border-slate-300 rounded-xl p-8 hover:shadow-amber-500/5 transition-all origin-top duration-150"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    margin: '0 auto'
                  }}
                  id="zoomable-preview-container"
                >
                  <DocumentFormat report={report} ot={selectedOt} client={client as Client} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {toastView}
    </div>
    </ErrorBoundary>
  );
}
