import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Layers, 
  Download, 
  TrendingUp, 
  Target, 
  UserCheck, 
  DollarSign, 
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { OrdenTrabajoLinea, Client, TargetVentas, ComentarioEstatus, OT, TechnicalReport, User, Contrato } from '../types';
import { MESES_ESPANOL } from '../utils/otDefaults';

// Modular Subcomponents Imports
import PanelAlertas from './ot/PanelAlertas';
import TablaOrdenesTrabajo from './ot/TablaOrdenesTrabajo';
import ReporteTarget from './ot/ReporteTarget';
import ReporteComercial from './ot/ReporteComercial';
import ModalComentarios from './ot/ModalComentarios';
import ModalCrearOtMarco from './ot/ModalCrearOtMarco';
import ModalAgregarLinea from './ot/ModalAgregarLinea';
import ModalEditarLinea from './ot/ModalEditarLinea';
import ModalAsignarTecnico from './ot/ModalAsignarTecnico';
import { useConfirm } from './shared/ConfirmModal';
import { useLocalToast } from './shared/ToastModal';

interface OrdenesTrabajoViewProps {
  lineas: OrdenTrabajoLinea[];
  clients: Client[];
  contratosComerciales?: Contrato[];
  targetVentas: TargetVentas[];
  currentUser: { email: string; username: string };
  onAddLinea: (linea: OrdenTrabajoLinea) => void;
  onUpdateLinea: (linea: OrdenTrabajoLinea) => void;
  tipoCambio: number;
  onUpdateTipoCambio: (val: number) => void;
  ots?: OT[];
  reports?: TechnicalReport[];
  users?: User[];
  onUpdateOT?: (ot: OT) => void;
}

export default function OrdenesTrabajoView({
  lineas,
  clients,
  contratosComerciales = [],
  targetVentas,
  currentUser,
  onAddLinea,
  onUpdateLinea,
  tipoCambio,
  onUpdateTipoCambio,
  ots = [],
  reports = [],
  users = [],
  onUpdateOT
}: OrdenesTrabajoViewProps) {
  // Navigation tabs: 'lista' | 'analytics' | 'targets' | 'comercial'
  const [subTab, setSubTab] = useState<'lista' | 'analytics' | 'targets' | 'comercial'>('lista');

  const { confirm, confirmView } = useConfirm();
  const { notifyError, toastView } = useLocalToast();

  // Modals state
  const [showCreateMarcoModal, setShowCreateMarcoModal] = useState(false);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [showEditLineModal, setShowEditLineModal] = useState(false);
  const [selectedLineForComments, setSelectedLineForComments] = useState<OrdenTrabajoLinea | null>(null);
  const [selectedLineForAssign, setSelectedLineForAssign] = useState<OrdenTrabajoLinea | null>(null);
  const [editingLine, setEditingLine] = useState<OrdenTrabajoLinea | null>(null);

  // New Comment state inside bitácora modal
  const [newCommentText, setNewCommentText] = useState('');

  // Dynamic Date calculations to detect past months automatically based on real current date
  const { currentAbsoluteMonth, pastMonths, currentMonthName, currentYear } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const monthIdx = today.getMonth(); // 0 to 11
    const absMonth = year * 12 + monthIdx;
    
    // Generate abbreviated Spanish month names that are in the past for this year or previous years
    const past: string[] = [];
    for (let i = 0; i < monthIdx; i++) {
      past.push(MESES_ESPANOL[i]);
    }

    return {
      currentAbsoluteMonth: absMonth,
      pastMonths: past,
      currentMonthName: MESES_ESPANOL[monthIdx],
      currentYear: year
    };
  }, []);

  // Helper to convert year & Spanish month string to absolute month index for accurate comparisons
  const getAbsoluteMonth = (year: number, mesName: string): number => {
    const index = MESES_ESPANOL.indexOf(mesName);
    return year * 12 + (index >= 0 ? index : 0);
  };

  // 1. Memoized Overdue Lines Selector (Unbilled past scheduled items)
  const overdueFacturaLines = useMemo(() => {
    return lineas.filter(l => {
      if (l.estado !== 'POR FACTURAR') return false;
      const lineAbsMonth = getAbsoluteMonth(l.anio_prog_facturacion, l.mes_prog_facturacion);
      return lineAbsMonth < currentAbsoluteMonth;
    });
  }, [lineas, currentAbsoluteMonth]);

  // 2. Memoized Soon to Execute Services Selector (Field services to do in this or past months)
  const soonToExecuteLines = useMemo(() => {
    return lineas.filter(l => {
      if (l.pendiente !== 'POR EJECUTAR') return false;
      const lineAbsMonth = getAbsoluteMonth(l.anio, MESES_ESPANOL.indexOf(l.mes_prog_servicio) >= 0 ? l.mes_prog_servicio : 'ENE');
      return lineAbsMonth <= currentAbsoluteMonth;
    });
  }, [lineas, currentAbsoluteMonth]);

  // 3. Memoized Contract Budget & Adendas alignment audit
  const contractWarnings = useMemo(() => {
    return contratosComerciales.map(c => {
      const base = Number(c.monto_sin_igv) || Number(c.presupuesto_total_usd) || Number(c.monto_original) || 0;
      const adendasSum = (c.ampliaciones || []).reduce((acc, a) => acc + (Number(a.monto) || 0), 0);
      const totalContrato = base + adendasSum;
      const lines = lineas.filter(l => 
        (l.contratoId === c.id || l.clientId === c.clientId || (l.razon_social && c.cliente && l.razon_social.trim().toUpperCase() === c.cliente.trim().toUpperCase())) && 
        l.estado !== 'ANULADO'
      );
      const consumido = lines.reduce((acc, l) => acc + (Number(l.sub_importe_sin_igv) || 0), 0);
      const saldo = Math.max(0, totalContrato - consumido);
      const exceso = consumido > totalContrato ? Number((consumido - totalContrato).toFixed(2)) : 0;
      const isExceeded = exceso > 0.01;
      const moneda = c.moneda === 'USD' ? '$' : (lines[0]?.simbolo_moneda || '$');

      const pctConsumo = totalContrato > 0 ? (consumido / totalContrato) * 100 : 0;
      const isHighRisk = pctConsumo >= 85;

      return {
        contratoId: c.id,
        n_contrato: c.n_contrato || c.id,
        cliente: c.cliente || lines[0]?.razon_social || 'Cliente General',
        montoBase: base,
        sumaAdendas: adendasSum,
        adendasCount: c.ampliaciones?.length || 0,
        totalContrato,
        totalContratoConIgv: Number((totalContrato * 1.18).toFixed(2)),
        consumido,
        consumidoConIgv: Number((consumido * 1.18).toFixed(2)),
        saldo,
        exceso,
        isExceeded,
        isHighRisk,
        pctConsumo,
        cuotasCount: lines.length,
        simbolo_moneda: moneda
      };
    }).filter(c => c.isExceeded || (c.isHighRisk && c.saldo < 0.15 * c.totalContrato));
  }, [contratosComerciales, lineas]);

  // 4. Memoized Executive Portfolio Performance Selector
  const reportComercial = useMemo(() => {
    const comercials = Array.from(new Set(lineas.map(l => l.comercial).filter(Boolean)));
    return comercials.map(c => {
      const cLines = lineas.filter(l => l.comercial === c && l.estado !== 'ANULADO');
      const cartera = cLines.reduce((acc, curr) => acc + curr.sub_importe_sin_igv, 0);
      const billedUsd = cLines.filter(l => l.estado === 'FACTURADO').reduce((acc, curr) => acc + curr.total_usd, 0);
      const pendingUsd = cLines.filter(l => l.estado === 'POR FACTURAR').reduce((acc, curr) => acc + curr.total_usd, 0);
      const cuotas = cLines.length;
      const ots = new Set(cLines.map(l => l.ot_marco)).size;
      const ejecutadas = cLines.filter(l => l.pendiente === 'EJECUTADO' || l.estado === 'FACTURADO').length;
      const pctEjecucion = cuotas > 0 ? Math.round((ejecutadas / cuotas) * 100) : 0;
      return {
        comercial: c,
        facturado: billedUsd,
        pendiente: pendingUsd,
        total: billedUsd + pendingUsd,
        cartera,
        cuotas,
        ots,
        pctEjecucion
      };
    }).sort((a, b) => b.cartera - a.cartera);
  }, [lineas]);

  // 5. Memoized Metas Mensuales compliance report (avance comprometido)
  // Usa sub_importe_sin_igv de líneas no anuladas del mes programado como
  // avance REAL, aunque la cuota aún no esté FACTURADA. Así la pestaña Metas
  // muestra valor con los datos de la BD demo.
  const targetReport = useMemo(() => {
    return targetVentas.map(t => {
      const tLines = lineas.filter(l => 
        l.estado !== 'ANULADO' && 
        l.anio_prog_facturacion === t.anio && 
        l.mes_prog_facturacion === t.mes
      );
      const avanceComprometido = tLines.reduce((acc, curr) => acc + curr.sub_importe_sin_igv, 0);
      const metaAnual = targetVentas.reduce((acc, curr) => acc + curr.target_ventas_usd, 0);
      const percent = t.target_ventas_usd > 0 ? (avanceComprometido / t.target_ventas_usd) * 100 : 0;
      return {
        ...t,
        actual: avanceComprometido,
        cumplimiento: percent,
        metaAnual,
        programado: t.target_ventas_usd
      };
    });
  }, [lineas, targetVentas]);

  // 6. Memoized Pipeline / SLA metrics for Analíticas
  const pipelineMetrics = useMemo(() => {
    const noAnuladas = lineas.filter(l => l.estado !== 'ANULADO');
    const backlogFacturacion = noAnuladas.filter(l => l.estado === 'POR FACTURAR' && l.pendiente === 'EJECUTADO');
    const carteraComprometida = noAnuladas.reduce((acc, curr) => acc + curr.sub_importe_sin_igv, 0);
    const carteraFacturada = noAnuladas.filter(l => l.estado === 'FACTURADO').reduce((acc, curr) => acc + curr.total_usd, 0);
    const cuotasMesActivo = noAnuladas.filter(l =>
      l.anio_prog_facturacion === currentYear && l.mes_prog_facturacion === currentMonthName
    );
    const porEstado = [
      { label: 'EJECUTADO (pend. facturar)', estado: 'POR FACTURAR', count: backlogFacturacion.length },
      { label: 'POR EJECUTAR', estado: 'PENDIENTE', count: noAnuladas.filter(l => l.pendiente === 'POR EJECUTAR').length },
      { label: 'FACTURADO', estado: 'FACTURADO', count: noAnuladas.filter(l => l.estado === 'FACTURADO').length }
    ];
    return {
      backlogFacturacion: backlogFacturacion.length,
      atrasadas: overdueFacturaLines.length,
      carteraComprometida,
      carteraFacturada,
      cuotasMesActivo: cuotasMesActivo.length,
      otMarcos: new Set(lineas.map(l => l.ot_marco)).size,
      porEstado
    };
  }, [lineas, overdueFacturaLines, currentYear, currentMonthName]);

  // Handle Logical Cancellation
  const handleCancelLine = async (line: OrdenTrabajoLinea) => {
    const ok = await confirm({
      title: 'Anular Línea de OT',
      message: `¿Está seguro de anular lógicamente la línea de OT #${line.ot}? Se marcará como ANULADO.`,
      confirmLabel: 'Anular',
      tone: 'danger'
    });
    if (ok) {
      const updated: OrdenTrabajoLinea = {
        ...line,
        pendiente: 'ANULADO',
        estado: 'ANULADO',
        tipo_venta: 'ANULADO',
        estatus: [
          ...line.estatus,
          {
            fecha: new Date().toISOString().split('T')[0],
            autor: currentUser.email,
            texto: `Línea anulada lógicamente por ${currentUser.username}.`
          }
        ]
      };
      try {
        await onUpdateLinea(updated);
      } catch (err: any) {
        console.error("Error al anular línea OT:", err);
      }
    }
  };

  // Submit Comments / Bitácora Form
  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLineForComments || !newCommentText.trim()) return;

    const newComment: ComentarioEstatus = {
      fecha: new Date().toISOString().split('T')[0],
      autor: currentUser.email,
      texto: newCommentText.trim()
    };

    const updatedLine: OrdenTrabajoLinea = {
      ...selectedLineForComments,
      estatus: [...(selectedLineForComments.estatus || []), newComment]
    };

    try {
      await onUpdateLinea(updatedLine);
      setSelectedLineForComments(updatedLine);
      setNewCommentText('');
    } catch (err: any) {
      console.error("Error al guardar comentario en línea OT:", err);
    }
  };

  // CSV/Excel Exporter with absolute precision
  const handleExportCSV = () => {
    const headers = [
      'Año', 'OT Marco', 'OT', 'Mes', 'Fecha', 'Nombre Solicitante', 
      'Razón Social', 'Empresa', 'Descripción', 'N° Cotización', 
      'N° OC/OS', 'Moneda', 'Monto Marco Sin IGV', 'Monto Marco Con IGV', 
      'Sub Importe Sin IGV', 'Sub Importe Con IGV', 'Total USD', 
      'Año Prog Facturación', 'Mes Prog Servicio', 'Mes Prog Facturación', 
      'Tipo Venta', 'Pendiente', 'Estado', 'N° Factura', 'Fecha Factura',
      'Comercial'
    ];

    const rows = lineas.map(line => {
      const parts = (line.fecha_factura || '').split('-');
      return [
        line.anio,
        line.ot_marco,
        line.ot,
        line.mes,
        line.fecha,
        `"${line.nombre_solicitante.replace(/"/g, '""')}"`,
        `"${line.razon_social.replace(/"/g, '""')}"`,
        `"${line.empresa.replace(/"/g, '""')}"`,
        `"${(line.descripcion || '').replace(/"/g, '""')}"`,
        `"${(line.n_cotizacion || '').replace(/"/g, '""')}"`,
        `"${(line.n_oc_os || '').replace(/"/g, '""')}"`,
        line.simbolo_moneda,
        line.monto_marco_sin_igv,
        line.monto_marco_inc_igv,
        line.sub_importe_sin_igv,
        line.sub_importe_inc_igv,
        line.total_usd,
        line.anio_prog_facturacion,
        line.mes_prog_servicio,
        line.mes_prog_facturacion,
        line.tipo_venta,
        line.pendiente,
        line.estado,
        `"${(line.n_factura || '').replace(/"/g, '""')}"`,
        line.fecha_factura || '',
        `"${(line.comercial || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MAFORT_Ordenes_Trabajo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left" id="ot-marco-main-panel">
      
      {/* Top Level Module Header */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" data-tour="ot-crear">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase bg-teal-brand text-white px-2.5 py-1 rounded-md font-mono">
            Módulo Operacional
          </span>
          <h1 className="text-xl font-black tracking-tight mt-2 flex items-center gap-2 text-slate-900">
            <FileText className="text-teal-brand" size={22} />
            Gestión Integral de Órdenes de Trabajo (OT)
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Planeamiento, control de cuotas, seguimiento de facturación multimoneda y rentabilidad comercial.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            disabled
            aria-disabled="true"
            title="La OT y su línea financiera se crean automáticamente al programar una visita. No se requiere ingreso manual."
            className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed opacity-80"
          >
            <Plus size={15} />
            Crear OT Marco (Padre)
          </button>
          <button
            disabled
            aria-disabled="true"
            title="Las cuotas se generan automáticamente al crear la OT desde la programación de servicio. No se requiere cuota manual."
            className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed opacity-80"
          >
            <Layers size={15} />
            Agregar Cuota/Línea
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download size={14} />
            Exportar Excel/CSV
          </button>
        </div>
      </div>

      {/* Dynamic Exchange Rate (Tipo Cambio) Configuration Panel */}
      <div className="bg-white border border-slate-100 p-4 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-mist text-teal-brand flex items-center justify-center border border-teal-brand/20 shrink-0 font-bold font-mono">
            $
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Tipo de Cambio Soles a Dólares (SUNAT)</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Vigente para el cálculo de importes de soles convertidos a la cartera consolidada en dólares.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <span className="text-[10px] font-bold text-slate-400 font-mono">1 USD = S/</span>
          <input
            type="number"
            step="0.001"
            className="w-16 font-mono font-black text-xs text-slate-800 focus:outline-none focus:border-teal-brand text-center"
            value={tipoCambio}
            onChange={async (e) => {
              try {
                await onUpdateTipoCambio(parseFloat(e.target.value) || 3.75);
              } catch (err: any) {
                notifyError('Error de Conexión', err.message === "offline"
                  ? 'No se pudo guardar el tipo de cambio: sin conexión con el servidor. El valor NO fue guardado. Verifique e intente de nuevo.'
                  : `No se pudo guardar el tipo de cambio: ${err.message || 'Error desconocido'}`);
              }
            }}
          />
          <span className="text-[10px] font-black text-teal-brand font-mono shrink-0 flex items-center gap-0.5">
            <RefreshCw size={10} className="animate-spin" />
            ACTIVO
          </span>
        </div>
      </div>

      {/* Audit Warnings panel */}
      <PanelAlertas 
        contractWarnings={contractWarnings} 
        overdueFacturaLines={overdueFacturaLines}
        soonToExecuteLines={soonToExecuteLines}
      />

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-100 gap-4" id="ot-tabs">
        <button
          onClick={() => setSubTab('lista')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'lista' 
              ? 'border-teal-brand text-teal-brand' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Lista de OTs y Cuotas
        </button>
        <button
          onClick={() => setSubTab('analytics')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'analytics' 
              ? 'border-teal-brand text-teal-brand' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} />
            Desviación y Alertas ({overdueFacturaLines.length})
          </div>
        </button>
        <button
          onClick={() => setSubTab('targets')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'targets' 
              ? 'border-teal-brand text-teal-brand' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Target size={14} />
            Metas Anuales vs Real
          </div>
        </button>
        <button
          onClick={() => setSubTab('comercial')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'comercial' 
              ? 'border-teal-brand text-teal-brand' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <UserCheck size={14} />
            Rendimiento Vendedores
          </div>
        </button>
      </div>

      {/* Sub Tab views */}
      {subTab === 'lista' && (
        <TablaOrdenesTrabajo 
          lineas={lineas}
          onEditClick={(l) => { setEditingLine(l); setShowEditLineModal(true); }}
          onCommentsClick={(l) => setSelectedLineForComments(l)}
          onAssignTechClick={(l) => setSelectedLineForAssign(l)}
          onCancelClick={handleCancelLine}
          pastMonths={pastMonths}
          currentAbsoluteMonth={currentAbsoluteMonth}
          getAbsoluteMonth={getAbsoluteMonth}
          tipoCambio={tipoCambio}
          ots={ots}
          reports={reports}
          clients={clients}
          contratosComerciales={contratosComerciales}
        />
      )}

      {subTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <h3 className="text-base font-black text-slate-900">Panorama Operativo y Alertas</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              KPIs de pipeline, SLA y backlog que no dependen de la facturación en USD.
            </p>

            {/* Fila de KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <span className="text-slate-400 text-xs font-semibold">Backlog de facturación</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {pipelineMetrics.backlogFacturacion} <span className="text-xs font-bold text-slate-400 align-middle">líneas</span>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/20 mt-2 inline-block">EJECUTADO sin facturar</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <span className="text-slate-400 text-xs font-semibold">Líneas atrasadas</span>
                <div className={`text-2xl font-black font-mono mt-1 ${pipelineMetrics.atrasadas > 0 ? 'text-rose-600' : 'text-teal-brand'}`}>
                  {pipelineMetrics.atrasadas}
                </div>
                <span className="text-[10px] font-mono font-black text-slate-400">SLA de facturación</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <span className="text-slate-400 text-xs font-semibold">Cartera comprometida</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                  ${pipelineMetrics.carteraComprometida.toLocaleString()}
                </div>
                <span className="text-[10px] font-black text-slate-400">
                  ${pipelineMetrics.carteraFacturada.toLocaleString()} facturado
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <span className="text-slate-400 text-xs font-semibold">Cuotas {currentMonthName} {currentYear}</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">{pipelineMetrics.cuotasMesActivo}</div>
                <span className="text-[10px] font-black text-slate-400">
                  {pipelineMetrics.otMarcos} {pipelineMetrics.otMarcos === 1 ? 'OT marco' : 'OTs marco'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Distribución por estado */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h5 className="text-sm font-black text-slate-800">Distribución por estado</h5>
                <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{currentYear}</span>
              </div>
              <div className="p-5 space-y-4">
                {pipelineMetrics.porEstado.map((row) => {
                  const total = lineas.length || 1;
                  const pct = (row.count / total) * 100;
                  const barColor = row.label.startsWith('EJECUTADO') ? 'bg-teal-brand'
                    : row.label.startsWith('FACTURADO') ? 'bg-emerald-400'
                    : 'bg-slate-200';
                  return (
                    <div key={row.estado}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-bold text-slate-600">{row.label}</span>
                        <span className="font-mono font-black text-slate-900">{row.count} <span className="text-slate-400 font-semibold">/ {pct.toFixed(0)}%</span></span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel de alertas operativas */}
            <div className="lg:col-span-1 bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5">
              <h5 className="text-sm font-black text-slate-800 mb-4">Alertas operativas</h5>
              <div className="space-y-3">
                {pipelineMetrics.atrasadas === 0 ? (
                  <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <span className="text-emerald-600 shrink-0"><CheckCircle2 size={16} /></span>
                    <span className="text-xs text-slate-600 font-medium">Felicitaciones, no tienes atrasos de facturación.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-3">
                    <span className="text-rose-600 shrink-0"><AlertTriangle size={16} /></span>
                    <span className="text-xs text-slate-600 font-medium">
                      <strong className="font-black text-rose-700 font-mono">{pipelineMetrics.atrasadas}</strong> cuota(s) programada(s) atrasada(s) por facturar.
                    </span>
                  </div>
                )}
                {pipelineMetrics.backlogFacturacion > 0 && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                    <span className="text-amber-600 shrink-0"><AlertTriangle size={16} /></span>
                    <span className="text-xs text-slate-600 font-medium">
                      <strong className="font-black text-amber-700 font-mono">{pipelineMetrics.backlogFacturacion}</strong> línea(s) EJECUTADA(s) esperando facturación (backlog).
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {subTab === 'targets' && (
        <ReporteTarget 
          targetVentas={targetVentas} 
          targetReport={targetReport} 
        />
      )}

      {subTab === 'comercial' && (
        <ReporteComercial reportComercial={reportComercial} />
      )}

      {/* Modals & Popups rendering */}
      {selectedLineForComments && (
        <ModalComentarios 
          linea={selectedLineForComments}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          onAddComment={handleAddCommentSubmit}
          onClose={() => setSelectedLineForComments(null)}
        />
      )}

      {showCreateMarcoModal && (
        <ModalCrearOtMarco 
          clients={clients}
          contratosComerciales={contratosComerciales}
          lineas={lineas}
          currentUser={currentUser}
          tipoCambio={tipoCambio}
          onAddLinea={onAddLinea}
          onClose={() => setShowCreateMarcoModal(false)}
        />
      )}

      {showAddLineModal && (
        <ModalAgregarLinea 
          lineas={lineas}
          currentUser={currentUser}
          tipoCambio={tipoCambio}
          onAddLinea={onAddLinea}
          onClose={() => setShowAddLineModal(false)}
        />
      )}

      {showEditLineModal && editingLine && (
        <ModalEditarLinea 
          editingLine={editingLine}
          setEditingLine={setEditingLine}
          tipoCambio={tipoCambio}
          currentUser={currentUser}
          clients={clients}
          contratosComerciales={contratosComerciales}
          todasLasLineas={lineas}
          onUpdateLinea={onUpdateLinea}
          onClose={() => { setShowEditLineModal(false); setEditingLine(null); }}
        />
      )}

      {selectedLineForAssign && (
        <ModalAsignarTecnico
          linea={selectedLineForAssign}
          ots={ots}
          users={users}
          clients={clients}
          onUpdateOT={async (ot) => {
            try {
              if (onUpdateOT) await onUpdateOT(ot);
              setSelectedLineForAssign(null);
            } catch (err: any) {
              console.error("Error al guardar asignación:", err);
            }
          }}
          onClose={() => setSelectedLineForAssign(null)}
        />
      )}

      {confirmView}
      {toastView}
    </div>
  );
}
