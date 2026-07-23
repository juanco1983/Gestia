import React, { useState, useMemo, useEffect } from 'react';
import { Layers, CheckCircle2, AlertCircle, Clock, Search, MessageSquare, X, ChevronLeft, ChevronRight, SlidersHorizontal, AlertTriangle, Eye, FileText, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { OrdenTrabajoLinea, OT, TechnicalReport, Client } from '../../types';
import { TIPO_VENTA_VALUES, ESTADO_VALUES, PENDIENTE_VALUES, MESES_ESPANOL, getFinancialStatusInfo } from '../../utils/otDefaults';
import DocumentFormat from '../DocumentFormat';

interface TablaOrdenesTrabajoProps {
  lineas: OrdenTrabajoLinea[]; // All lineas (or filtered from outside)
  onEditClick: (line: OrdenTrabajoLinea) => void;
  onCommentsClick: (line: OrdenTrabajoLinea) => void;
  onCancelClick: (line: OrdenTrabajoLinea) => void;
  onAssignTechClick?: (line: OrdenTrabajoLinea) => void;
  pastMonths: string[];
  currentAbsoluteMonth: number;
  getAbsoluteMonth: (year: number, mesName: string) => number;
  ots?: OT[];
  reports?: TechnicalReport[];
  clients?: Client[];
}

export default function TablaOrdenesTrabajo({
  lineas,
  onEditClick,
  onCommentsClick,
  onCancelClick,
  onAssignTechClick,
  pastMonths,
  currentAbsoluteMonth,
  getAbsoluteMonth,
  ots = [],
  reports = [],
  clients = []
}: TablaOrdenesTrabajoProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterComercial, setFilterComercial] = useState('');
  const [filterTipoVenta, setFilterTipoVenta] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPendiente, setFilterPendiente] = useState('');
  const [filterMesProgFact, setFilterMesProgFact] = useState('');

  // Selected client for history view
  const [selectedClientHistory, setSelectedClientHistory] = useState<string>('');

  // PDF Preview and Export states
  const [selectedPreviewOt, setSelectedPreviewOt] = useState<OT | null>(null);
  const [zoom, setZoom] = useState(90);
  const [pdfOt, setPdfOt] = useState<OT | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async (ot: OT) => {
    if (!ot) return;
    const report = reports?.find(r => r.otId === ot.id);
    if (!report) {
      alert("ATENCIÓN: El informe técnico aún no ha sido redactado.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("El navegador bloqueó la ventana emergente para exportar a PDF. Por favor, habilite los permisos de ventanas emergentes para descargar.");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfOt(ot);

    const client = clients?.find(c => c.id === ot.clientId) || { 
      razonSocial: lineas.find(l => String(l.ot) === String(ot.id).replace('OT-', ''))?.razon_social || 'Cliente General' 
    };

    setTimeout(() => {
      try {
        const element = document.getElementById('billing-pdf-download-element');
        if (!element) {
          printWindow.close();
          throw new Error('Elemento de impresión no encontrado en el DOM');
        }

        const htmlContent = element.innerHTML;

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map(el => el.outerHTML)
          .join('\n');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>SLA Mafort - Reporte ${ot.id} - ${client.razonSocial}</title>
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
                    }
                  });
                };
              </script>
            </head>
            <body>
              <div class="p-4 bg-yellow-50 text-yellow-800 text-xs text-center border-b border-yellow-200 mb-6 no-print rounded-lg">
                <strong>MODO IMPRESIÓN S.L.A:</strong> Presione Ctrl+P o CMD+P si el cuadro de diálogo de impresión no se abre automáticamente. Para guardar como PDF, seleccione <strong>"Guardar como PDF"</strong> en el destino de su impresora.
              </div>
              <div>
                ${htmlContent}
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
      } catch (err) {
        console.error("Print layout failed", err);
      } finally {
        setIsGeneratingPdf(false);
        setPdfOt(null);
      }
    }, 800);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Memoized filter calculation (CRITICAL OPTIMIZATION for +10,500 records)
  const filteredLines = useMemo(() => {
    return lineas.filter(l => {
      const matchesSearch = !searchQuery ? true : (
        l.ot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.comercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.ot_marco.toString().includes(searchQuery)
      );

      const matchingOt = ots?.find(o => o.otFinancieraId === l.id || o.id === `OT-${l.ot}` || String(o.id).replace('OT-', '') === String(l.ot));
      const statusInfo = getFinancialStatusInfo(l, matchingOt);

      const matchesCliente = !filterCliente || l.razon_social === filterCliente;
      const matchesComercial = !filterComercial || l.comercial === filterComercial;
      const matchesTipoVenta = !filterTipoVenta || l.tipo_venta === filterTipoVenta;
      const matchesEstado = !filterEstado || l.estado === filterEstado || statusInfo.key === filterEstado;
      const matchesPendiente = !filterPendiente || l.pendiente === filterPendiente;
      const matchesMesProgFact = !filterMesProgFact || l.mes_prog_facturacion === filterMesProgFact;

      return matchesSearch && matchesCliente && matchesComercial && matchesTipoVenta && matchesEstado && matchesPendiente && matchesMesProgFact;
    });
  }, [lineas, ots, searchQuery, filterCliente, filterComercial, filterTipoVenta, filterEstado, filterPendiente, filterMesProgFact]);

  // Reset page to 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCliente, filterComercial, filterTipoVenta, filterEstado, filterPendiente, filterMesProgFact]);

  // Calculate totals for quick indicators based on filtered list (Memoized!)
  const stats = useMemo(() => {
    const totalLines = filteredLines.length;
    const billedUsd = filteredLines
      .filter(l => l.estado === 'FACTURADO')
      .reduce((acc, curr) => acc + curr.total_usd, 0);
    const pendingUsd = filteredLines
      .filter(l => l.estado === 'POR FACTURAR')
      .reduce((acc, curr) => acc + curr.total_usd, 0);
    const pendingExecutionCount = filteredLines
      .filter(l => l.pendiente === 'POR EJECUTAR')
      .length;

    return { totalLines, billedUsd, pendingUsd, pendingExecutionCount };
  }, [filteredLines]);

  // Unique clients and commercials list for filter dropdowns (Memoized!)
  const uniqueRazonesSociales = useMemo(() => {
    return Array.from(new Set(lineas.map(l => l.razon_social))).sort();
  }, [lineas]);

  const uniqueComerciales = useMemo(() => {
    return Array.from(new Set(lineas.map(l => l.comercial).filter(Boolean))).sort();
  }, [lineas]);

  // Page Calculations
  const totalPages = Math.max(Math.ceil(filteredLines.length / pageSize), 1);
  const paginatedLines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLines.slice(start, start + pageSize);
  }, [filteredLines, currentPage, pageSize]);

  return (
    <div className="space-y-4" id="ot-tabla-main">
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono">Cuotas Totales</span>
            <div className="text-xl font-black text-slate-800 mt-1">{stats.totalLines.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
            <Layers size={18} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono">Billed (Facturado)</span>
            <div className="text-xl font-black text-[#00B594] mt-1">
              ${stats.billedUsd.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">USD</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center text-[#00B594] border border-emerald-100/50">
            <CheckCircle2 size={18} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono">Por Facturar</span>
            <div className="text-xl font-black text-amber-500 mt-1">
              ${stats.pendingUsd.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">USD</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 flex items-center justify-center text-amber-500 border border-amber-100/50">
            <AlertCircle size={18} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono">Por Ejecutar</span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {stats.pendingExecutionCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">visitas</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="col-span-1 md:col-span-3 relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por cliente, OT marco, comercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594]"
            />
          </div>
          
          <div>
            <select
              value={filterTipoVenta}
              onChange={(e) => setFilterTipoVenta(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#00B594]"
            >
              <option value="">Tipo de Venta...</option>
              {TIPO_VENTA_VALUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#00B594]"
            >
              <option value="">Estado Fact...</option>
              <option value="PENDIENTE_VISITA">Pendiente de Visita</option>
              <option value="PENDIENTE_INFORME">Pendiente de Informe</option>
              <option value="PENDIENTE_FACTURACION">Pendiente de Facturación</option>
              <option value="FACTURADO">Facturado</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterPendiente}
              onChange={(e) => setFilterPendiente(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#00B594]"
            >
              <option value="">Ejecución...</option>
              {PENDIENTE_VALUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-1 border-t border-slate-200/50">
          <div className="col-span-1 md:col-span-2">
            <select
              value={filterCliente}
              onChange={(e) => {
                setFilterCliente(e.target.value);
                setSelectedClientHistory(e.target.value);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
            >
              <option value="">Todos los Clientes...</option>
              {uniqueRazonesSociales.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-span-1 md:col-span-2">
            <select
              value={filterComercial}
              onChange={(e) => setFilterComercial(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
            >
              <option value="">Todos los Comerciales...</option>
              {uniqueComerciales.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterMesProgFact}
              onChange={(e) => setFilterMesProgFact(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none"
            >
              <option value="">Mes Programado...</option>
              {MESES_ESPANOL.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-end">
            {(searchQuery || filterCliente || filterComercial || filterTipoVenta || filterEstado || filterPendiente || filterMesProgFact) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCliente('');
                  setFilterComercial('');
                  setFilterTipoVenta('');
                  setFilterEstado('');
                  setFilterPendiente('');
                  setFilterMesProgFact('');
                  setSelectedClientHistory('');
                }}
                className="text-rose-600 hover:text-rose-800 text-[10px] font-black font-mono uppercase cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Client History Filter Drawer */}
      <div className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black font-mono bg-[#E6F7F4] text-[#00B594] px-2.5 py-1 rounded-md shrink-0">Vista de Historial</span>
          <p className="text-xs text-slate-500 font-semibold">Selecciona un cliente para aislar y auditar todas sus líneas de pago de forma secuencial:</p>
        </div>
        <select
          value={selectedClientHistory}
          onChange={(e) => {
            setSelectedClientHistory(e.target.value);
            setFilterCliente(e.target.value);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3.5 text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="">Todos los clientes...</option>
          {uniqueRazonesSociales.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">OT Line</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Razón Social / Empresa</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Tipo Venta</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Monto Línea</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Total (USD)</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Mes Prog Fact</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Factura Real</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Estado Fact.</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono">Ejecución</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 font-mono text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-450 font-bold text-xs">
                    No hay cuotas de OT registradas que coincidan con los filtros de búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedLines.map(line => {
                  const absoluteProgMonth = getAbsoluteMonth(line.anio_prog_facturacion, line.mes_prog_facturacion);
                  const isOverdue = line.estado === 'POR FACTURAR' && absoluteProgMonth < currentAbsoluteMonth;
                  
                  // Match with operational technical OT and report
                  const matchingOt = ots?.find(o => o.otFinancieraId === line.id || o.id === `OT-${line.ot}` || String(o.id).replace('OT-', '') === String(line.ot));
                  const report = matchingOt ? reports?.find(r => r.otId === matchingOt.id) : null;

                  // Gating: Only allow PDF/Report viewer if report is Approved by Supervisor
                  const isReportApproved = matchingOt && (
                    matchingOt.estado === 'Aprobada' || 
                    matchingOt.estado === 'Firmada' || 
                    matchingOt.estado === 'Facturada' || 
                    matchingOt.estado === 'Cerrada' ||
                    (matchingOt.estado as string) === 'APROBADA' ||
                    (matchingOt.estado as string) === 'FIRMADA' ||
                    (matchingOt.estado as string) === 'FACTURADA' ||
                    (matchingOt.estado as string) === 'CERRADA'
                  );

                  const isCompletada = line.estado === 'FACTURADO' || (line.estado as string) === 'COMPLETADO';

                  // Automatic Execution state calculation
                  const otStateUpper = matchingOt ? (matchingOt.estado as string).toUpperCase() : '';
                  const isEjecutado = Boolean(
                    report ||
                    line.pendiente === 'EJECUTADO' ||
                    (matchingOt && (
                      otStateUpper === 'INFORME_PENDIENTE' ||
                      otStateUpper === 'EN_REVISION' ||
                      otStateUpper === 'APROBADA' ||
                      otStateUpper === 'FIRMADA' ||
                      otStateUpper === 'FACTURADA' ||
                      otStateUpper === 'CERRADA' ||
                      otStateUpper === 'EN_CAMINO' ||
                      otStateUpper === 'EN_SITIO' ||
                      otStateUpper === 'TRABAJO_EN_EJECUCION' ||
                      otStateUpper === 'COMPLETADA'
                    ))
                  );
                  const executionText = line.pendiente === 'ANULADO' ? 'ANULADO' : isEjecutado ? 'EJECUTADO' : 'POR EJECUTAR';

                  const otTecnicaStateLabel = matchingOt ? (
                    otStateUpper === 'INFORME_PENDIENTE' ? 'Técnica: Pendiente de Informe' :
                    otStateUpper === 'EN_REVISION' ? 'Técnica: Informe en Revisión' :
                    otStateUpper === 'APROBADA' || otStateUpper === 'FIRMADA' ? 'Técnica: Informe Aprobado' :
                    otStateUpper === 'PROGRAMADA' || otStateUpper === 'ASIGNADA' ? 'Técnica: Visita Programada' :
                    otStateUpper === 'EN_CAMINO' || otStateUpper === 'EN_SITIO' || otStateUpper === 'TRABAJO_EN_EJECUCION' ? 'Técnica: En Ejecución' :
                    `Técnica: ${matchingOt.estado}`
                  ) : null;

                  return (
                    <tr key={line.id} className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? 'bg-rose-50/25' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black text-slate-800 font-mono">{line.ot}</span>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">Marco: #{line.ot_marco}</span>
                          {otTecnicaStateLabel && (
                            <span className="text-[8.5px] font-bold font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded w-max mt-0.5">
                              {otTecnicaStateLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="truncate text-xs font-black text-slate-800" title={line.razon_social}>{line.razon_social}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded font-bold">{line.empresa}</span>
                          <span>• {line.comercial || 'Sin comercial'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-sans">
                          {line.tipo_venta}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                        {line.simbolo_moneda} {line.sub_importe_sin_igv.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-black text-slate-900">
                        ${line.total_usd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                            {line.mes_prog_facturacion} {line.anio_prog_facturacion}
                          </span>
                          {isOverdue && <span className="text-[9px] font-black text-rose-600 font-mono tracking-tighter shrink-0 animate-pulse">VENCIDA</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {line.n_factura ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 font-mono">{line.n_factura}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{line.fecha_factura}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">— No emitida</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {(() => {
                          const statusInfo = getFinancialStatusInfo(line, matchingOt);
                          return (
                            <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center justify-center w-max ${statusInfo.badgeClass}`}>
                              <span>{statusInfo.label}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full uppercase ${
                          executionText === 'EJECUTADO'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : executionText === 'POR EJECUTAR'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {executionText}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Approved Report / PDF Viewer Button (Gated) */}
                          {report && isReportApproved ? (
                            <button
                              onClick={() => setSelectedPreviewOt(matchingOt || null)}
                              className="p-1 px-2 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Visualizar e imprimir informe técnico aprobado por supervisor"
                            >
                              <FileText size={13} />
                              <span className="text-[9px] font-extrabold font-mono uppercase">Informe PDF</span>
                            </button>
                          ) : report ? (
                            <span 
                              className="px-2 py-1 rounded-md text-[9px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 shrink-0 cursor-help"
                              title="El informe técnico aún no ha sido aprobado por el supervisor. El PDF estará disponible tras la aprobación."
                            >
                              ⏳ En Revisión
                            </span>
                          ) : null}

                          {/* Edit / View Detail Button */}
                          <button
                            onClick={() => onEditClick(line)}
                            className={`p-1 border rounded-md cursor-pointer text-[10px] font-extrabold font-mono uppercase px-2 py-1 transition-colors flex items-center gap-1 ${
                              isCompletada
                                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                                : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                            title={isCompletada ? "Ver detalles de cuota completada (Solo Lectura)" : "Editar cuota"}
                          >
                            {isCompletada ? <Eye size={12} /> : null}
                            <span>{isCompletada ? 'Ver' : 'Editar'}</span>
                          </button>

                          {onAssignTechClick && !isCompletada && (
                            <button
                              onClick={() => onAssignTechClick(line)}
                              className="p-1 bg-[#E6F7F4] border border-emerald-100 rounded-md hover:bg-emerald-100 text-[#00B594] cursor-pointer text-[10px] font-extrabold font-mono uppercase px-1.5 py-1 transition-colors"
                              title="Asignar Técnicos"
                            >
                              Asignar
                            </button>
                          )}
                          <button
                            onClick={() => onCommentsClick(line)}
                            className="p-1 bg-slate-50 border border-slate-150 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-800 cursor-pointer relative transition-colors"
                            title="Ver bitácora de estatus"
                          >
                            <MessageSquare size={13} />
                            {(line.estatus?.length ?? 0) > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00B594] text-white text-[7px] font-black rounded-full flex items-center justify-center">
                                {line.estatus?.length ?? 0}
                              </span>
                            )}
                          </button>
                          {line.estado !== 'ANULADO' && !isCompletada && (
                            <button
                              onClick={() => onCancelClick(line)}
                              className="p-1 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                              title="Anular lógicamente"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Controls */}
        <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Mostrando</span>
            <strong className="text-slate-800">
              {filteredLines.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            <span>al</span>
            <strong className="text-slate-800">
              {Math.min(currentPage * pageSize, filteredLines.length)}
            </strong>
            <span>de</span>
            <strong className="text-slate-800">{filteredLines.length.toLocaleString()}</strong>
            <span>registros</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all flex items-center justify-center shadow-sm"
              title="Página Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              <span>Página</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-white border border-slate-250 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs focus:outline-none"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span>de {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all flex items-center justify-center shadow-sm"
              title="Página Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Hidden PDF Container for high-resolution print generation */}
        {pdfOt && (() => {
          const client = (clients?.find(c => c.id === pdfOt.clientId) || {
            razonSocial: lineas.find(l => String(l.ot) === String(pdfOt.id).replace('OT-', ''))?.razon_social || 'Cliente General',
            ruc: 'N/A',
            direccion: 'N/A',
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'N/A'
          });
          const report = reports?.find(r => r.otId === pdfOt.id);
          return (
            <div className="hidden">
              <div id="billing-pdf-download-element" className="p-8">
                <DocumentFormat report={report} ot={pdfOt} client={client as Client} />
              </div>
            </div>
          );
        })()}

        {/* FULL-SCREEN DIGITAL S.L.A. PREVIEW MODAL FOR BILLING ROLE */}
        {selectedPreviewOt && (() => {
          const client = (clients?.find(c => c.id === selectedPreviewOt.clientId) || {
            razonSocial: lineas.find(l => String(l.ot) === String(selectedPreviewOt.id).replace('OT-', ''))?.razon_social || 'Cliente General',
            ruc: 'N/A',
            direccionSede: 'Sede Principal',
            distrito: 'Lima',
            contactoNombre: 'Encargado',
            contactoEmail: 'contacto@client.pe',
            contactoTelefono: '999999999'
          });
          const report = reports?.find(r => r.otId === selectedPreviewOt.id);
          if (!report) return null;

          return (
            <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex flex-col p-4 md:p-6 animate-fade-in text-slate-800 font-sans" id="fullscreen-preview-modal-billing">
              <div className="bg-slate-100 w-full h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-700/30">
                {/* Modal Header */}
                <div className="bg-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-950 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm font-sans text-white text-left">Facturación - Informe de Visita Aprobado</h3>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wide text-left">Orden: {selectedPreviewOt.id} | Cliente: {client.razonSocial}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedPreviewOt)}
                      disabled={isGeneratingPdf}
                      className="flex items-center gap-1.5 bg-emerald-600 disabled:bg-emerald-400 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all font-mono cursor-pointer disabled:cursor-not-allowed shadow shadow-emerald-600/20"
                      title="Exportar Reporte Completo a PDF"
                    >
                      {isGeneratingPdf && pdfOt?.id === selectedPreviewOt.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{isGeneratingPdf && pdfOt?.id === selectedPreviewOt.id ? 'Generando PDF...' : 'Exportar a PDF'}</span>
                    </button>

                    {/* Interactive Zoom UI */}
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/50" id="zoom-controls-billing-modal">
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
                      className="ml-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Scrollable layout centering DocumentFormat */}
                <div className="flex-1 overflow-auto p-6 md:p-10 bg-slate-900 flex justify-center items-start">
                  <div 
                    className="w-full max-w-[850px] shadow-2xl bg-white border border-slate-300 rounded-xl p-8 hover:shadow-emerald-500/5 transition-all origin-top duration-150 text-left"
                    style={{ 
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      margin: '0 auto'
                    }}
                    id="zoomable-preview-container-billing"
                  >
                    <DocumentFormat report={report} ot={selectedPreviewOt} client={client as Client} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
