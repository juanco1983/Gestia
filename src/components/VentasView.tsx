import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Plus, 
  UserPlus, 
  FilePlus, 
  Calendar, 
  MapPin, 
  Hash, 
  Briefcase,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  FileSpreadsheet,
  DownloadCloud,
  Printer,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search
} from 'lucide-react';
import { Client, Contract, OT, ServiceType, EquipmentType, OTStatus, TechnicalReport, Contrato } from '../types';
import DocumentFormat from './DocumentFormat';
import { ALL_ACCIONES } from '../utils/reportDefaults';

function CircularProgress({ value, max, text, colorClass, trailColorClass = "stroke-slate-100/70" }: { value: number; max: number; text: string; colorClass: string; trailColorClass?: string }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`${trailColorClass} stroke-[4] fill-transparent`}
        />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`${colorClass} stroke-[4] fill-transparent transition-all duration-500 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-slate-800 font-mono tracking-tighter">{text}</span>
    </div>
  );
}

interface VentasViewProps {
  clients: Client[];
  contracts: Contract[];
  contratosComerciales?: Contrato[];
  ots: OT[];
  reports: TechnicalReport[];
  onAddClient: (client: Client) => void;
  onAddContract: (contract: Contract) => void;
  onAddOT: (ot: OT) => void;
  onUpdateOT?: (ot: OT) => void;
}

export default function VentasView({
  clients,
  contracts,
  contratosComerciales = [],
  ots,
  reports,
  onAddClient,
  onAddContract,
  onAddOT,
  onUpdateOT
}: VentasViewProps) {
  // Modal toggles and form states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showOtModal, setShowOTModal] = useState(false);
  const [otModalMode, setOtModalMode] = useState<'create' | 'edit'>('create');
  const [editingOtId, setEditingOtId] = useState<string | null>(null);

  // Active sub-tab in VentasView: 'emision' (default) or 'informes'
  const [ventasTab, setVentasTab] = useState<'emision' | 'informes'>('emision');

  // PDF and Word preview / export states
  const [selectedPreviewOt, setSelectedPreviewOt] = useState<OT | null>(null);
  const [simulatedDocxDownloaded, setSimulatedDocxDownloaded] = useState(false);
  const [zoom, setZoom] = useState(90);
  const [pdfOt, setPdfOt] = useState<OT | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form inputs - Client
  const [clientForm, setClientForm] = useState({
    razonSocial: '',
    ruc: '',
    direccionSede: '',
    distrito: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: ''
  });

  // Form inputs - Contract
  const [contractForm, setContractForm] = useState({
    clientId: '',
    tipoEquipo: EquipmentType.UPS,
    visitasAnuales: 4,
    fechaInicio: '',
    fechaFin: ''
  });

  // Form inputs - OT
  const [otForm, setOtForm] = useState({
    id: '',
    clientId: '',
    contratoId: '',
    costo_estimado_usd: 0,
    tipoMantenimiento: ServiceType.PREVENTIVO,
    tipoEquipo: EquipmentType.UPS,
    potenciaKva: 50,
    fechaProgramada: '',
    tecnicoTitular: 'Carlos Ocsa',
    tecnicoApoyo: ''
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form submission handlers
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.razonSocial || !clientForm.ruc) return;
    const newClient: Client = {
      id: `client_${Date.now()}`,
      ...clientForm
    };
    onAddClient(newClient);
    setShowClientModal(false);
    setClientForm({
      razonSocial: '',
      ruc: '',
      direccionSede: '',
      distrito: '',
      contactoNombre: '',
      contactoEmail: '',
      contactoTelefono: ''
    });
  };

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.clientId) return;
    const newContract: Contract = {
      id: `contra_${Date.now()}`,
      clientId: contractForm.clientId,
      tipoEquipo: contractForm.tipoEquipo,
      visitasAnuales: Number(contractForm.visitasAnuales),
      fechaInicio: contractForm.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: contractForm.fechaFin || new Date(Date.now() + 31536000000).toISOString().split('T')[0]
    };
    onAddContract(newContract);
    setShowContractModal(false);
  };

  const handleOtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otForm.clientId) return;

    if (otModalMode === 'edit' && editingOtId && onUpdateOT) {
      const existingOT = ots.find(o => o.id === editingOtId);
      if (existingOT) {
        onUpdateOT({
          ...existingOT,
          id: otForm.id.trim() || existingOT.id,
          clientId: otForm.clientId,
          tipoMantenimiento: otForm.tipoMantenimiento,
          tipoEquipo: otForm.tipoEquipo,
          potenciaKva: Number(otForm.potenciaKva),
          fechaProgramada: otForm.fechaProgramada || existingOT.fechaProgramada,
          tecnicoTitular: otForm.tecnicoTitular,
          tecnicoApoyo: otForm.tecnicoApoyo || undefined,
        });
      }
    } else {
      const cleanId = otForm.id.trim() || `OT-${Math.floor(4000 + Math.random() * 999)}`;
      const newOT: OT = {
        id: cleanId,
        clientId: otForm.clientId,
        contratoId: otForm.contratoId || undefined,
        costo_estimado_usd: otForm.costo_estimado_usd || undefined,
        tipoMantenimiento: otForm.tipoMantenimiento,
        tipoEquipo: otForm.tipoEquipo,
        potenciaKva: Number(otForm.potenciaKva),
        fechaProgramada: otForm.fechaProgramada || new Date().toISOString().split('T')[0],
        tecnicoTitular: otForm.tecnicoTitular,
        tecnicoApoyo: otForm.tecnicoApoyo || undefined,
        estado: OTStatus.CREADA
      };
      onAddOT(newOT);
    }
    setShowOTModal(false);
  };

  const openEditOtModal = (ot: OT) => {
    setOtModalMode('edit');
    setEditingOtId(ot.id);
    setOtForm({
      id: ot.id,
      clientId: ot.clientId,
      contratoId: ot.contratoId || '',
      costo_estimado_usd: ot.costo_estimado_usd || 0,
      tipoMantenimiento: ot.tipoMantenimiento,
      tipoEquipo: ot.tipoEquipo,
      potenciaKva: ot.potenciaKva,
      fechaProgramada: ot.fechaProgramada,
      tecnicoTitular: ot.tecnicoTitular,
      tecnicoApoyo: ot.tecnicoApoyo || ''
    });
    setShowOTModal(true);
  };

  const openCreateOtModal = () => {
    setOtModalMode('create');
    setEditingOtId(null);
    setOtForm({
      id: `OT-${Math.floor(4000 + Math.random() * 999)}`,
      clientId: '',
      contratoId: '',
      costo_estimado_usd: 0,
      tipoMantenimiento: ServiceType.PREVENTIVO,
      tipoEquipo: EquipmentType.UPS,
      potenciaKva: 50,
      fechaProgramada: '',
      tecnicoTitular: 'Carlos Ocsa',
      tecnicoApoyo: ''
    });
    setShowOTModal(true);
  };

  // Pre-load logic helper
  const handleClientSelectInOt = (clientId: string) => {
    const matchedContract = contracts.find(c => c.clientId === clientId);
    setOtForm(prev => ({
      ...prev,
      clientId,
      tipoEquipo: matchedContract ? matchedContract.tipoEquipo : prev.tipoEquipo
    }));
  };

  const handleDownloadPDF = async (selectedOt: OT) => {
    if (!selectedOt) return;
    const report = reports.find(r => r.otId === selectedOt.id);
    if (!report) {
      alert("ATENCIÓN: El informe técnico aún no ha sido redactado por el personal técnico.");
      return;
    }

    // Open a new browser tab/window synchronously to prevent pop-up blocker issues in frames
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("El navegador bloqueó la ventana emergente para exportar a PDF. Por favor, habilite los permisos de ventanas emergentes (pop-ups) para esta página en la barra de direcciones de su navegador para permitir la descarga directa.");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfOt(selectedOt);

    const client = clients.find(c => c.id === selectedOt.clientId) || { razonSocial: 'Cliente_General' };

    // Wait a brief moment for the hidden container to render in the DOM
    setTimeout(() => {
      try {
        const element = document.getElementById('pdf-download-element');
        if (!element) {
          printWindow.close();
          throw new Error('Elemento de impresión no encontrado en el DOM');
        }

        const htmlContent = element.innerHTML;

        // Gather all current stylesheets (Vite CSS + Tailwind)
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map(el => el.outerHTML)
          .join('\n');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>SLA Mafort - Reporte ${selectedOt.id} - ${client.razonSocial}</title>
              ${styles}
              <style>
                @media print {
                  body {
                    background: #ffffff !important;
                    color: #000000 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 12mm 10mm 12mm 10mm;
                  }
                  .mafort-pdf-page {
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 0 25px 0 !important;
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    min-height: auto !important;
                  }
                  /* Prevent final empty page breaks */
                  .mafort-pdf-page:last-child {
                    page-break-after: avoid !important;
                    margin-bottom: 0 !important;
                  }
                }
                body {
                  background-color: #f1f5f9;
                  margin: 0;
                  padding: 24px;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .mafort-pdf-page {
                  background: #ffffff;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  border: 1px solid #e2e8f0;
                  margin: 0 auto 30px auto;
                  padding: 32px;
                  max-width: 820px;
                  min-height: 1050px;
                  box-sizing: border-box;
                }
              </style>
              <script>
                window.onload = function() {
                  var images = Array.from(document.getElementsByTagName('img'));
                  var total = images.length;
                  var loaded = 0;
                  
                  function doPrint() {
                    setTimeout(function() {
                      window.print();
                    }, 500);
                  }
                  
                  if (total === 0) {
                    doPrint();
                    return;
                  }
                  
                  var fallback = setTimeout(function() {
                    window.print();
                  }, 4000);
                  
                  images.forEach(function(img) {
                    if (img.complete && img.naturalWidth > 0) {
                      loaded++;
                      if (loaded === total) {
                        clearTimeout(fallback);
                        doPrint();
                      }
                    } else {
                      img.onload = function() {
                        loaded++;
                        if (loaded === total) {
                          clearTimeout(fallback);
                          doPrint();
                        }
                      };
                      img.onerror = function() {
                        loaded++;
                        if (loaded === total) {
                          clearTimeout(fallback);
                          doPrint();
                        }
                      };
                    }
                  });
                };
              </script>
            </head>
            <body>
              <div class="max-w-[820px] mx-auto">
                ${htmlContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();

      } catch (err) {
        console.error(err);
        alert('Error al preparar el documento imprimible. Intente de nuevo.');
      } finally {
        setIsGeneratingPdf(false);
        setPdfOt(null);
      }
    }, 400);
  };

  const handleDownloadDocx = (selectedOt: OT) => {
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
    const report = reports.find(r => r.otId === selectedOt.id);
    if (!report) {
      alert("ATENCIÓN: El informe técnico aún no ha sido redactado por el personal técnico.");
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

    // Assembly
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>SLA Mafort Technical Report ${selectedOt.id}</title>
        <style>
          @page WordSection1 {size:595.3pt 841.9pt; margin:36.0pt 36.0pt 36.0pt 36.0pt;}
          div.WordSection1 {page:WordSection1;}
          body {font-family: Arial, sans-serif;}
          table {border-collapse: collapse; width:100%;}
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- PAGE 1: CORE INFRASTRUCTURE AND CHARACTERISTICS -->
          ${headerH}
          <div style="font-size:11pt;font-weight:bold;color:#0f172a;border-bottom:2px solid #0f172a;padding-bottom:3px;margin-top:15px;font-family:sans-serif;">I. REPORTE TÉCNICO COMPLETO</div>
          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <tr>
              <td style="width:25%;border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">ORDEN DE TRABAJO</td>
              <td style="width:25%;border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;color:#1e3a8a;">${selectedOt.id}</td>
              <td style="width:25%;border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">HOJA SERVICIO N°</td>
              <td style="width:25%;border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;">${hojaServ}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">CLIENTE</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;">${client.razonSocial}</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">R.U.C.</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;">${client.ruc}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">DIRECCIÓN SEDE</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;">${client.direccionSede}</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">DISTRITO / REGION</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;">${client.distrito}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">LÍDER TÉCNICO MAFORT</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;">${tech1}</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;font-weight:bold;background:#f1f5f9;">CO-EQUIPERO / AUXILIAR</td>
              <td style="border:1px solid #cbd5e1;padding:5px;font-size:8pt;">${tech2}</td>
            </tr>
          </table>

          <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:16px;text-transform:uppercase;">1. ESPECIFICACIONES TÉCNICAS DEL SISTEMA</div>
          <table style="width:100%;border-collapse:collapse;margin-top:6px;">
            <tr style="vertical-align:top;">
              <td style="width:50%;padding-right:6px;">
                <table style="width:100%;border-collapse:collapse;">${charRows1}</table>
              </td>
              <td style="width:50%;padding-left:6px;">
                <table style="width:100%;border-collapse:collapse;">${charRows2 || '<tr><td style="border:1px solid #cbd5e1;padding:8px;font-size:8pt;color:#94a3b8;text-align:center;">Sin características secundarias</td></tr>'}</table>
              </td>
            </tr>
          </table>

          <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:16px;text-transform:uppercase;">2. MEDICIONES ELÉCTRICAS DETALLADAS</div>
          <table style="width:100%;border-collapse:collapse;margin-top:6px;">
            <tr style="background:#0f172a;color:#ffffff;font-size:8pt;font-weight:bold;">
              <th style="border:1px solid #cbd5e1;padding:4px;text-align:left;">PARÁMETRO DE TENSIÓN (V)</th>
              <th style="border:1px solid #cbd5e1;padding:4px;text-align:center;">R (L1)</th>
              <th style="border:1px solid #cbd5e1;padding:4px;text-align:center;">S (L2)</th>
              <th style="border:1px solid #cbd5e1;padding:4px;text-align:center;">T (L3)</th>
            </tr>
            <tr style="font-size:8pt;">
              <td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;background:#f8fafc;">VOLTAJE ENTRADA L-N</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.lnVoltaje[0]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.lnVoltaje[1]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.lnVoltaje[2]} V</td>
            </tr>
            <tr style="font-size:8pt;">
              <td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;background:#f8fafc;">VOLTAJE ENTRADA L-L</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.llVoltaje[0]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.llVoltaje[1]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medEnt.llVoltaje[2]} V</td>
            </tr>
            <tr style="font-size:8pt;">
              <td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;background:#f8fafc;">VOLTAJE SALIDA L-N</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnVoltaje[0]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnVoltaje[1]} V</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnVoltaje[2]} V</td>
            </tr>
            <tr style="font-size:8pt;">
              <td style="border:1px solid #cbd5e1;padding:4px;font-weight:bold;background:#f8fafc;">CORRIENTE SALIDA (A)</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnIntensidad[0]} A</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnIntensidad[1]} A</td>
              <td style="border:1px solid #cbd5e1;padding:4px;text-align:center;">${medSal.lnIntensidad[2]} A</td>
            </tr>
          </table>

          <p style="font-size:7.5pt;color:#475569;margin-top:6px;font-family:sans-serif;">Frecuencias registradas nominales: Entrada ${medEnt.frecuencia[0] || '60'} Hz | Salida ${medSal.frecuencia[0] || '60'} Hz • Tipo Conexión: Trifásica equilibrada estrella</p>
          ${footerH}

          <br style="page-break-before:always; clear:both;" />

          <!-- PAGE 2: PROCEDURES AND INSPECTION CHECKLIST -->
          ${headerH}
          <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:10px;text-transform:uppercase;">3. CHECKLIST COMPLETO DE ACCIONES REALIZADAS</div>
          <table style="width:100%;border-collapse:collapse;margin-top:6px;">
            ${actionsRows}
          </table>

          <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:16px;text-transform:uppercase;">4. RECOMENDACIONES TÉCNICAS (CONTRALORÍA DE PROYECTO)</div>
          <div style="border:1px solid #cbd5e1;background:#f8fafc;padding:10px;margin-top:6px;font-size:8pt;line-height:1.4;">
            ${recs.length > 0 ? recs.map((r: string, idx: number) => `<div style="margin-bottom:4px;"><b>[Recomendación #${idx+1}]:</b> ${r}</div>`).join('') : '<i>Ninguna recomendación u observación crítica reportada por el líder técnico. El sistema opera dentro del SLA regular establecido.</i>'}
          </div>

          <table style="width:100%;margin-top:35px;border-collapse:collapse;">
            <tr>
              <td style="width:50%;text-align:center;font-size:8.5pt;vertical-align:top;">
                <div style="border-bottom:1px dashed #64748b;height:50px;line-height:50px;font-style:italic;color:#1e3a8a;font-weight:bold;margin:0 auto 6px auto;width:160px;text-align:center;">
                  MAFORT SERVICE SUPPORT
                </div>
                <b>FIRMA LÍDER TÉCNICO MAFORT</b><br/>
                <span>Ing. Resp: ${tech1}</span>
              </td>
              <td style="width:50%;text-align:center;font-size:8.5pt;vertical-align:top;">
                <div style="width:160px;height:70px;border-bottom:1px solid #94a3b8;margin:0 auto 6px auto;text-align:center;overflow:hidden;">
                  ${report.firmaCliente ? `<img src="${report.firmaCliente}" style="max-height:65px;width:auto;" />` : `<span style="color:#94a3b8;font-size:8pt;font-style:italic;line-height:70px;">Conformidad Cliente</span>`}
                </div>
                <b>FIRMA DE CONFORMIDAD CLIENTE</b><br/>
                <span>Representante de Operaciones</span>
              </td>
            </tr>
          </table>
          ${footerH}

          <!-- PAGE 3+: PHOTO ATTACHMENTS (IF AVAILABLE) -->
          ${photosPage1 ? `
            <br style="page-break-before:always; clear:both;" />
            ${headerH}
            <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:10px;text-transform:uppercase;margin-bottom:10px;">ANEXOS: PANEL DE REGISTRO FOTOGRÁFICO (REPORTE DE CAMPO)</div>
            <table style="width:100%;border-collapse:collapse;">
              ${photosPage1}
            </table>
            ${footerH}
          ` : ''}

          ${photosPage2 ? `
            <br style="page-break-before:always; clear:both;" />
            ${headerH}
            <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:10px;text-transform:uppercase;margin-bottom:10px;">ANEXOS: PANEL DE REGISTRO FOTOGRÁFICO - SECCIÓN II</div>
            <table style="width:100%;border-collapse:collapse;">
              ${photosPage2}
            </table>
            ${footerH}
          ` : ''}

          ${photosPage3 ? `
            <br style="page-break-before:always; clear:both;" />
            ${headerH}
            <div style="font-size:9.5pt;font-weight:bold;color:#1e3a8a;margin-top:10px;text-transform:uppercase;margin-bottom:10px;">ANEXOS: PANEL DE REGISTRO FOTOGRÁFICO - SECCIÓN III</div>
            <table style="width:100%;border-collapse:collapse;">
              ${photosPage3}
            </table>
            ${footerH}
          ` : ''}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLA_Mafort_Reporte_\${selectedOt.id}_\${client.razonSocial.replace(/\\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" id="ventas-dashboard-container">
      
      {/* Sub-tab switcher inside VentasView */}
      <div className="flex border-b border-slate-200/60 pb-px gap-6 mb-6">
        <button
          onClick={() => setVentasTab('emision')}
          className={`pb-3 text-xs font-bold font-sans tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            ventasTab === 'emision'
              ? 'border-[#00B594] text-[#00B594] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          <Layers size={14} />
          <span>Gestión de Contratos & Emisión de OTs</span>
        </button>
        <button
          onClick={() => setVentasTab('informes')}
          className={`pb-3 text-xs font-bold font-sans tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            ventasTab === 'informes'
              ? 'border-[#00B594] text-[#00B594] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Informes Técnicos Aprobados (Control de Calidad)</span>
        </button>
      </div>

      {ventasTab === 'emision' ? (
        <>
          {/* Metric Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: SLA TOTAL OTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">SLA TOTAL OTS</span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-3xl font-black text-slate-800 leading-none">6</h3>
                  <span className="text-xs font-bold text-slate-400 font-sans">programadas</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Mantenimiento de UPS en curso</p>
              </div>
              <CircularProgress value={14} max={20} text="14/20" colorClass="stroke-emerald-500" />
            </div>

            {/* CARD 2: VISITAS ANUALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">VISITAS ANUALES</span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-3xl font-black text-slate-800 leading-none">11</h3>
                  <span className="text-xs font-bold text-slate-400 font-sans">totales</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Soportado en contrato SLA</p>
              </div>
              <CircularProgress value={10} max={15} text="10/15" colorClass="stroke-amber-500" />
            </div>

            {/* CARD 3: SATISFACCIÓN CLIENTE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">SATISFACCIÓN CLIENTE</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-800 leading-none">92%</h3>
                  <span className="text-xs font-bold text-emerald-500 font-sans">SLA OK</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Basado en firmas validadas</p>
              </div>
              <CircularProgress value={92} max={100} text="92%" colorClass="stroke-cyan-500" />
            </div>

            {/* CARD 4: BYPASS ACTIVO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">BYPASS ACTIVO</span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-3xl font-black text-slate-800 leading-none">1</h3>
                  <span className="text-xs font-bold text-rose-500 font-sans">Crítico</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Requiere auditoría inmediata</p>
              </div>
              <CircularProgress value={3} max={14} text="3/14" colorClass="stroke-rose-500" />
            </div>
          </div>

      {/* Main Operations Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por Razón Social o RUC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            id="search-clients-input"
          />
        </div>

        <button
          onClick={openCreateOtModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
          id="btn-nueva-ot-ventas"
        >
          Nueva OT
        </button>
      </div>

      {/* Grid of Master Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Clients & Outbound Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contracts / Clients list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
                <Building2 size={16} className="text-slate-500" />
                <span>Maestro de Clientes y Contratos</span>
              </h2>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">Base Corriente</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {clients.filter(c => c.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) || c.ruc.includes(searchQuery)).map(client => {
                const clientContracts = contracts.filter(con => con.clientId === client.id);
                return (
                  <div key={client.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-sans text-base">{client.razonSocial}</span>
                        <span className="text-xs uppercase bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">RUC {client.ruc}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs font-sans">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {client.direccionSede}, {client.distrito}</span>
                        <span className="text-slate-300">|</span>
                        <span>Soporte: {client.contactoNombre} ({client.contactoTelefono})</span>
                      </div>
                    </div>
                    {/* Associated Active SLAs */}
                    <div className="flex flex-wrap gap-1.5 items-center justify-start sm:justify-end">
                      {clientContracts.length === 0 ? (
                        <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-1 rounded font-medium">Sin contrato activo</span>
                      ) : (
                        clientContracts.map(con => (
                          <div key={con.id} className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg text-xs font-sans">
                            <div className="font-bold">{con.tipoEquipo}</div>
                            <div className="text-[10px] text-emerald-600">{con.visitasAnuales} visitas preventivas/año</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
              {clients.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  Ningún cliente registrado en el sistema. Registre uno para comenzar.
                </div>
              )}
            </div>
          </div>

          {/* OTs History List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <span>Historial de Órdenes de Trabajo Emitidas</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {ots.map(ot => {
                const clientObj = clients.find(c => c.id === ot.clientId);
                return (
                  <div key={ot.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-500">{ot.id}</span>
                        <span className="font-bold text-slate-900 text-sm">{clientObj?.razonSocial || 'Cliente Desconocido'}</span>
                      </div>
                      <div className="grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-slate-500 text-xs font-semibold font-mono">
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{ot.tipoMantenimiento}</span>
                        <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{ot.tipoEquipo} ({ot.potenciaKva} KVA)</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {ot.fechaProgramada}</span>
                        <span className="text-slate-600 font-sans">Ing: {ot.tecnicoTitular}</span>
                      </div>
                    </div>
                    {/* OT Status Tag & Actions */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        ot.estado === OTStatus.CREADA || ot.estado === OTStatus.PENDIENTE_PROGRAMACION || ot.estado === OTStatus.ASIGNADA ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                        ot.estado === OTStatus.PROGRAMADA ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        ot.estado === OTStatus.TRABAJO_EN_EJECUCION ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                        ot.estado === OTStatus.EN_REVISION ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        ot.estado === OTStatus.OBSERVADA ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        ot.estado === OTStatus.APROBADA ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {ot.estado}
                      </span>
                      {(ot.estado === OTStatus.CREADA || ot.estado === OTStatus.PENDIENTE_PROGRAMACION || ot.estado === OTStatus.PROGRAMADA) && (
                        <button
                          onClick={() => openEditOtModal(ot)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          Modificar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Dynamic CRM Intelligence Info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" />
              <span>Eficiencia del Flujo de Trabajo</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Antes de este sistema, los técnicos de campo recolectaban firmas en papel autocopiativo. Al estar en viaje continuo por provincias, se acumulaba un retraso de 20-30 días para pasar la ficha fáctica a un informe de Word editable y PDF final en Lima, deteniendo la facturación de servicios por cobrar. 
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tiempo de Facturación Tradicional:</span>
                <span className="text-rose-500 font-bold">~ 30 Días</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Con el nuevo sistema Mafort ODS:</span>
                <span className="text-emerald-500 font-bold">&lt; 1 h (Sincronizado)</span>
              </div>
              <div className="bg-slate-900 text-slate-100 p-2.5 rounded border border-slate-800 text-center font-bold text-[10px]">
                🚀 SVE ROI Estimado: Reducción del 95% del ciclo financiero
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-tight">
              Reglas de Negocio en la Emisión
            </h3>
            <ul className="text-xs text-slate-500 space-y-2.5 list-disc pl-4 font-sans leading-relaxed">
              <li>El técnico requiere el ingreso de un <strong>Nivel mínimo de evidencias fotográficas obligatorias</strong> de acuerdo a la carga seleccionada:
                <ul className="list-circle pl-4 mt-1 font-mono text-[10px] space-y-0.5 text-slate-600">
                  <li>Carga de Baja Potencia (&lt;10 KVA): 4 a 6 fotos</li>
                  <li>Carga de Alta Potencia (&ge;10 KVA): Mínimo 8 fotos</li>
                </ul>
              </li>
              <li>La orden de trabajo precarga la sede, facilitando el control de las celdas de combustible e indicadores de baterías del UPS.</li>
            </ul>
          </div>
        </div>
      </div>
      </>
      ) : (
        /* REPOSITORIO DE INFORMES TÉCNICOS APROBADOS */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-indigo-500 animate-pulse" />
                  <span>Repositorio de Control y Ventas de Informes Técnicos</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Control de OTs firmadas y aprobadas para facturación, cobranzas y auditoría directa del cliente</p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total de Informes de Campo: <span className="font-bold text-indigo-600">{reports.length}</span>
              </div>
            </div>

            {/* Filter & Search inside Reports tab */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Buscar informe por OT, cliente o técnico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono italic">
                * Filtre por cliente o técnico para descargar el expediente completo.
              </span>
            </div>

            {/* List Table */}
            {(() => {
              // Find OTs that have reports and match search query
              const filteredReportedOts = ots.filter(ot => {
                const hasReport = reports.some(r => r.otId === ot.id);
                if (!hasReport) return false;

                const client = clients.find(c => c.id === ot.clientId);
                const textMatch = (client?.razonSocial || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  ot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (ot.tecnicoTitular || '').toLowerCase().includes(searchQuery.toLowerCase());
                return textMatch;
              });

              if (filteredReportedOts.length === 0) {
                return (
                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                    <FileText className="mx-auto text-slate-300" size={36} />
                    <h4 className="font-bold text-slate-700 text-xs">Sin Informes que Coincidan</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                      No se encontraron OTs con informes técnicos que coincidan con la búsqueda.
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase font-mono border-b border-slate-200">
                        <th className="py-3 px-4">Orden de Trabajo (OT)</th>
                        <th className="py-3 px-4">Cliente / Razón Social</th>
                        <th className="py-3 px-4">Técnico Realizador (Líder)</th>
                        <th className="py-3 px-4">Fecha de Servicio</th>
                        <th className="py-3 px-4">Detalles del Equipo</th>
                        <th className="py-3 px-4">Estado del Informe</th>
                        <th className="py-3 px-4 text-right">Acciones de Expediente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredReportedOts.map(ot => {
                        const client = (clients.find(c => c.id === ot.clientId) || {
                          id: 'f',
                          razonSocial: 'Cliente General',
                          ruc: 'N/A',
                          direccionSede: '',
                          distrito: '',
                          contactoNombre: '',
                          contactoEmail: '',
                          contactoTelefono: ''
                        }) as Client;
                        const report = reports.find(r => r.otId === ot.id)!;

                        return (
                          <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ot.id}</td>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-slate-900 leading-snug">{client.razonSocial}</div>
                              <div className="text-[10px] text-slate-400 font-mono">RUC: {client.ruc || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] font-mono shrink-0">
                                  {ot.tecnicoTitular ? ot.tecnicoTitular.split(' ').map(n => n[0]).join('') : 'T'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{ot.tecnicoTitular}</div>
                                  <div className="text-[9px] text-slate-400 font-mono">Apoyo: {ot.tecnicoApoyo || 'Ninguno'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{report.fechaServicio || ot.fechaProgramada || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-700">{ot.tipoEquipo}</div>
                              <div className="text-[10px] text-slate-450 font-mono">{ot.potenciaKva} KVA • {ot.tipoMantenimiento}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                ot.estado === OTStatus.FIRMADA ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                ot.estado === OTStatus.APROBADA ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                ot.estado === OTStatus.EN_REVISION ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                ot.estado === OTStatus.OBSERVADA ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                                'bg-slate-100 text-slate-600 border'
                              }`}>
                                {ot.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                {(() => {
                                  const isRejected = ot.estado === OTStatus.OBSERVADA;
                                  return (
                                    <>
                                      <button
                                        onClick={() => !isRejected && setSelectedPreviewOt(ot)}
                                        disabled={isRejected}
                                        className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 font-mono ${
                                          isRejected
                                            ? "bg-slate-50 text-slate-350 border border-slate-150 cursor-not-allowed"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                        }`}
                                        title={isRejected ? "No disponible: Informe rechazado por el supervisor" : "Ver Vista Previa Completa del S.L.A."}
                                      >
                                        <Eye size={12} className={isRejected ? "text-slate-300" : "text-slate-500"} />
                                        <span>VISTA SLA</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => !isRejected && handleDownloadPDF(ot)}
                                        disabled={isGeneratingPdf || isRejected}
                                        className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs font-mono ${
                                          isRejected
                                            ? "bg-slate-50 text-slate-300 border border-slate-150 cursor-not-allowed"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                        }`}
                                        title={isRejected ? "No disponible: Informe rechazado por el supervisor" : "Exportar Reporte Directamente a PDF"}
                                      >
                                        {isGeneratingPdf && pdfOt?.id === ot.id ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <DownloadCloud size={12} className={isRejected ? "text-slate-300" : "text-white"} />
                                        )}
                                        <span>{isGeneratingPdf && pdfOt?.id === ot.id ? 'GENERANDO...' : 'EXPORTAR PDF'}</span>
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FULL-SCREEN DIGITAL S.L.A. PREVIEW MODAL FOR SALES ROLE */}
      {selectedPreviewOt && (() => {
        const client = clients.find(c => c.id === selectedPreviewOt.clientId) || {
          id: 'f_1',
          razonSocial: 'Cliente General',
          ruc: '2010000000',
          direccionSede: 'Sede Principal',
          distrito: 'Lima',
          contactoNombre: 'Encargado',
          contactoEmail: 'contacto@client.pe',
          contactoTelefono: '999999999'
        };
        const report = reports.find(r => r.otId === selectedPreviewOt.id);
        if (!report) return null;

        return (
          <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex flex-col p-4 md:p-6 animate-fade-in text-slate-800 font-sans" id="fullscreen-preview-modal-sales">
            <div className="bg-slate-100 w-full h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-700/30">
              {/* Modal Header */}
              <div className="bg-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-950 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm font-sans text-white text-left">Control de Ventas & Facturación - Reporte S.L.A</h3>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wide text-left">Expediente: {selectedPreviewOt.id} | Cliente: {client.razonSocial}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedPreviewOt)}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-indigo-600 disabled:bg-indigo-400 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all font-mono cursor-pointer disabled:cursor-not-allowed shadow shadow-indigo-600/20"
                    title="Exportar Reporte Completo a PDF de alta resolución"
                  >
                    {isGeneratingPdf && pdfOt?.id === selectedPreviewOt.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <DownloadCloud size={14} />
                    )}
                    <span>{isGeneratingPdf && pdfOt?.id === selectedPreviewOt.id ? 'Generando PDF...' : 'Exportar a PDF'}</span>
                  </button>

                  {/* Interactive Zoom UI */}
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/50" id="zoom-controls-sales-modal">
                    <button
                      onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                      className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all cursor-pointer"
                      title="Alejar Zoom"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[10px] font-bold font-mono px-2 text-amber-400 min-w-[40px] text-center">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                      className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all cursor-pointer"
                      title="Acercar Zoom"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedPreviewOt(null)}
                    className="bg-slate-800 hover:bg-rose-600 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    title="Cerrar Visualizador de Control de Calidad"
                  >
                    Cerrar (ESC)
                  </button>
                </div>
              </div>

              {/* Simulated notification banner */}
              {simulatedDocxDownloaded && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 text-emerald-600 text-xs font-mono flex items-center gap-2 text-left shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>PREPARANDO ARCHIVO COMPATIBLE: Ensamblando mediciones eléctricas, checklist de acciones de campo y evidencias embebidas en formato Base64 para visualización nativa... Descargado exitosamente.</span>
                </div>
              )}

              {/* Scrollable layout centering DocumentFormat */}
              <div className="flex-1 overflow-auto p-6 md:p-10 bg-slate-900 flex justify-center items-start">
                <div 
                  className="w-full max-w-[850px] shadow-2xl bg-white border border-slate-300 rounded-xl p-8 hover:shadow-indigo-500/5 transition-all origin-top duration-150 text-left"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    margin: '0 auto'
                  }}
                  id="zoomable-preview-container-sales"
                >
                  <DocumentFormat report={report} ot={selectedPreviewOt} client={client as Client} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold font-mono flex items-center gap-2">
                <Building2 size={16} className="text-amber-400" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleClientSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Razón Social</label>
                <input required type="text" name="razonSocial" value={clientForm.razonSocial} onChange={(e) => setClientForm({...clientForm, razonSocial: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Ej. Banco de la Nación S.A." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">RUC (11 dígitos)</label>
                  <input required maxLength={11} type="text" name="ruc" value={clientForm.ruc} onChange={(e) => setClientForm({...clientForm, ruc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="20101010101" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Contacto Autorizado</label>
                  <input required type="text" name="contactoNombre" value={clientForm.contactoNombre} onChange={(e) => setClientForm({...clientForm, contactoNombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Nombre completo" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Dirección Sede</label>
                  <input required type="text" name="direccionSede" value={clientForm.direccionSede} onChange={(e) => setClientForm({...clientForm, direccionSede: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Ej. Calle Amador Medina 201" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Distrito</label>
                  <input required type="text" name="distrito" value={clientForm.distrito} onChange={(e) => setClientForm({...clientForm, distrito: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Ej. San Isidro, Lima" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Email Contacto</label>
                  <input required type="email" name="contactoEmail" value={clientForm.contactoEmail} onChange={(e) => setClientForm({...clientForm, contactoEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="correo@empresa.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Teléfono</label>
                  <input required type="text" name="contactoTelefono" value={clientForm.contactoTelefono} onChange={(e) => setClientForm({...clientForm, contactoTelefono: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="999888777" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-colors uppercase font-mono tracking-wider cursor-pointer">
                Confirmar Registro de Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-5 py-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold font-mono flex items-center gap-2">
                <FilePlus size={16} className="text-indigo-400" />
                <span>Asociar Contrato de Mantenimiento</span>
              </h3>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleContractSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Seleccionar Cliente</label>
                <select required value={contractForm.clientId} onChange={(e) => setContractForm({...contractForm, clientId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                  <option value="">-- Seleccione Cliente --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Tipo de Equipamiento</label>
                  <select value={contractForm.tipoEquipo} onChange={(e) => setContractForm({...contractForm, tipoEquipo: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                    {Object.values(EquipmentType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Visitas Preventivas Planificadas</label>
                  <input required min={1} max={12} type="number" name="visitasAnuales" value={contractForm.visitasAnuales} onChange={(e) => setContractForm({...contractForm, visitasAnuales: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Fecha Inicio</label>
                  <input type="date" value={contractForm.fechaInicio} onChange={(e) => setContractForm({...contractForm, fechaInicio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Fecha Término</label>
                  <input type="date" value={contractForm.fechaFin} onChange={(e) => setContractForm({...contractForm, fechaFin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-colors uppercase font-mono tracking-wider cursor-pointer">
                Generar Contrato SLA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New OT Modal */}
      {showOtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold font-mono flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400" />
                <span>{otModalMode === 'edit' ? 'Modificar Orden de Trabajo (OT)' : 'Emitir Orden de Trabajo (OT)'}</span>
              </h3>
              <button onClick={() => setShowOTModal(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleOtSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">1. Seleccionar Cliente</label>
                <select required value={otForm.clientId} onChange={(e) => handleClientSelectInOt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-bold text-slate-800">
                  <option value="">-- Seleccione Cliente --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Código / ID de la OT (e.g. OT-250)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: OT-250" 
                  value={otForm.id} 
                  onChange={(e) => setOtForm({...otForm, id: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Contrato Marco (Opcional)</label>
                  <select 
                    value={otForm.contratoId} 
                    onChange={(e) => setOtForm({...otForm, contratoId: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm"
                  >
                    <option value="">-- Sin Contrato --</option>
                    {contratosComerciales.filter(c => c.clientId === otForm.clientId).map(c => (
                      <option key={c.id} value={c.id}>Contrato: {c.id} - {c.tipo_contrato} (Saldo: ${c.saldo_disponible_usd ?? c.presupuesto_total_usd ?? 0})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Costo a descontar (USD)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    disabled={!otForm.contratoId}
                    placeholder={otForm.contratoId ? "Monto USD" : "Requiere contrato"}
                    value={otForm.costo_estimado_usd || ''} 
                    onChange={(e) => setOtForm({...otForm, costo_estimado_usd: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Grupo de Servicio</label>
                  <select value={otForm.tipoMantenimiento} onChange={(e) => setOtForm({...otForm, tipoMantenimiento: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                    {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Categoría de Equipo</label>
                  <select value={otForm.tipoEquipo} onChange={(e) => setOtForm({...otForm, tipoEquipo: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                    {Object.values(EquipmentType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Potencia de Equipo (KVA)</label>
                  <input required min={1} max={1500} type="number" value={otForm.potenciaKva} onChange={(e) => setOtForm({...otForm, potenciaKva: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" />
                  <span className="text-[9px] text-slate-400 font-mono italic">
                    {otForm.potenciaKva >= 10 ? 'Alta carga (Requiere ≥8 fotos)' : 'Baja carga (Requiere ≥4 fotos)'}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Fecha Planificada</label>
                  <input type="date" value={otForm.fechaProgramada} onChange={(e) => setOtForm({...otForm, fechaProgramada: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Técnico Titular</label>
                  <select value={otForm.tecnicoTitular} onChange={(e) => setOtForm({...otForm, tecnicoTitular: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                    <option value="Carlos Ocsa">Carlos Ocsa</option>
                    <option value="Gino Murillo">Gino Murillo</option>
                    <option value="Juan Córdova">Juan Córdova</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Técnico Apoyo (Opcional)</label>
                  <select value={otForm.tecnicoApoyo} onChange={(e) => setOtForm({...otForm, tecnicoApoyo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm">
                    <option value="">Ninguno</option>
                    <option value="Josué Ale">Josué Ale</option>
                    <option value="Carlos Ocsa">Carlos Ocsa</option>
                    <option value="Juan Córdova">Juan Córdova</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded text-xs hover:bg-amber-400 transition-colors uppercase font-mono tracking-wider cursor-pointer">
                {otModalMode === 'edit' ? 'Guardar Cambios' : 'Confirmar Emisión Automática (Carga ODS)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden container for PDF high-fidelity generation */}
      {pdfOt && (() => {
        const client = (clients.find(c => c.id === pdfOt.clientId) || {
          id: 'f',
          razonSocial: 'Cliente General',
          ruc: 'N/A',
          direccionSede: '',
          distrito: '',
          contactoNombre: '',
          contactoEmail: '',
          contactoTelefono: ''
        }) as Client;
        const report = reports.find(r => r.otId === pdfOt.id);
        if (!report) return null;
        return (
          <div style={{ position: 'absolute', left: '-9999px', top: '0px', width: '820px', background: '#ffffff', color: '#1e293b' }}>
            <div id="pdf-download-element" className="p-8">
              <DocumentFormat report={report} ot={pdfOt} client={client} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
