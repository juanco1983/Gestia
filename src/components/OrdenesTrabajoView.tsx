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
  RefreshCw
} from 'lucide-react';
import { OrdenTrabajoLinea, Client, TargetVentas, ComentarioEstatus, OT, TechnicalReport, User } from '../types';
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

interface OrdenesTrabajoViewProps {
  lineas: OrdenTrabajoLinea[];
  clients: Client[];
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

  // 3. Memoized Macro Budget alignment warning
  const macroWarnings = useMemo(() => {
    const warnings: Array<{ ot_marco: number; expected: number; actual: number; simbolo_moneda: string }> = [];
    const uniqueMarcos = Array.from(new Set(lineas.map(l => l.ot_marco)));
    uniqueMarcos.forEach(m => {
      const mLines = lineas.filter(l => l.ot_marco === m && l.estado !== 'ANULADO');
      if (mLines.length > 0) {
        const expected = mLines[0].monto_marco_sin_igv;
        const actual = mLines.reduce((acc, curr) => acc + curr.sub_importe_sin_igv, 0);
        const simbolo_moneda = mLines[0].simbolo_moneda || '$';
        if (Math.abs(expected - actual) > 0.1) {
          warnings.push({ ot_marco: m, expected, actual, simbolo_moneda });
        }
      }
    });
    return warnings;
  }, [lineas]);

  // 4. Memoized Executive Portfolio Performance Selector
  const reportComercial = useMemo(() => {
    const comercials = Array.from(new Set(lineas.map(l => l.comercial).filter(Boolean)));
    return comercials.map(c => {
      const cLines = lineas.filter(l => l.comercial === c && l.estado !== 'ANULADO');
      const billedUsd = cLines.filter(l => l.estado === 'FACTURADO').reduce((acc, curr) => acc + curr.total_usd, 0);
      const pendingUsd = cLines.filter(l => l.estado === 'POR FACTURAR').reduce((acc, curr) => acc + curr.total_usd, 0);
      return {
        comercial: c,
        facturado: billedUsd,
        pendiente: pendingUsd,
        total: billedUsd + pendingUsd
      };
    }).sort((a, b) => b.total - a.total);
  }, [lineas]);

  // 5. Memoized Metas Mensuales compliance report
  const targetReport = useMemo(() => {
    return targetVentas.map(t => {
      const tLines = lineas.filter(l => 
        l.estado === 'FACTURADO' && 
        l.anio_prog_facturacion === t.anio && 
        l.mes_prog_facturacion === t.mes
      );
      const actualBilled = tLines.reduce((acc, curr) => acc + curr.total_usd, 0);
      const percent = t.target_ventas_usd > 0 ? (actualBilled / t.target_ventas_usd) * 100 : 0;
      return {
        ...t,
        actual: actualBilled,
        cumplimiento: percent
      };
    });
  }, [lineas, targetVentas]);

  // Handle Logical Cancellation
  const handleCancelLine = (line: OrdenTrabajoLinea) => {
    if (window.confirm(`¿Está seguro de anular lógicamente la línea de OT #${line.ot}? Se marcará como ANULADO.`)) {
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
        ],
        modificadoPor: currentUser.email,
        modificadoEn: new Date().toISOString().split('T')[0]
      };
      onUpdateLinea(updated);
    }
  };

  // Submit Comments / Bitácora Form
  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLineForComments || !newCommentText.trim()) return;

    const newComment: ComentarioEstatus = {
      fecha: new Date().toISOString().split('T')[0],
      autor: currentUser.email,
      texto: newCommentText.trim()
    };

    const updatedLine: OrdenTrabajoLinea = {
      ...selectedLineForComments,
      estatus: [...selectedLineForComments.estatus, newComment],
      modificadoPor: currentUser.email,
      modificadoEn: new Date().toISOString().split('T')[0]
    };

    onUpdateLinea(updatedLine);
    setSelectedLineForComments(updatedLine);
    setNewCommentText('');
  };

  // CSV/Excel Exporter with absolute precision
  const handleExportCSV = () => {
    const headers = [
      'Año', 'OT Marco', 'OT', 'Mes', 'Fecha', 'Nombre Solicitante', 
      'Razón Social', 'Empresa', 'Descripción', 'N° Cotización', 
      'N° OC/OS', 'Moneda', 'Monto Marco Sin IGV', 'Monto Marco Con IGV', 
      'Sub Importe Sin IGV', 'Sub Importe Con IGV', 'Total USD', 
      'Año Prog Facturación', 'Mes Prog Servicio', 'Mes Prog Facturación', 
      'Tipo Venta', 'Pendiente', 'Estado', 'N° Factura', 
      'Año Factura', 'Mes Factura', 'Fecha Factura', 'Nro Guía/Informe', 
      'Observación', 'Seguimiento', 'Tipo Contratación', 'Comercial',
      'Creado Por', 'Creado En'
    ];

    const rows = lineas.map(line => [
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
      line.anio_factura || '',
      line.mes_factura || '',
      line.fecha_factura || '',
      `"${(line.nro_guia_informe || '').replace(/"/g, '""')}"`,
      `"${(line.observacion || '').replace(/"/g, '""')}"`,
      `"${(line.seguimiento || '').replace(/"/g, '""')}"`,
      line.tipo_contratacion,
      `"${line.comercial.replace(/"/g, '""')}"`,
      line.creadoPor,
      line.creadoEn
    ]);

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-[28px] text-white">
        <div>
          <span className="text-[9px] font-black tracking-wider uppercase bg-[#00B594] text-white px-2.5 py-1 rounded-md font-mono">
            Módulo Operacional
          </span>
          <h1 className="text-xl font-black tracking-tight mt-2 flex items-center gap-2">
            <FileText className="text-[#00B594]" size={22} />
            Gestión Integral de Órdenes de Trabajo (OT)
          </h1>
          <p className="text-xs text-slate-300 font-semibold mt-1">
            Planeamiento, control de cuotas, seguimiento de facturación multimoneda y rentabilidad comercial.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowCreateMarcoModal(true)}
            className="bg-[#00B594] hover:bg-[#00a385] text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus size={15} />
            Crear OT Marco (Padre)
          </button>
          <button
            onClick={() => setShowAddLineModal(true)}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Layers size={15} />
            Agregar Cuota/Línea
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download size={14} />
            Exportar Excel/CSV
          </button>
        </div>
      </div>

      {/* Dynamic Exchange Rate (Tipo Cambio) Configuration Panel */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E6F7F4] text-[#00B594] flex items-center justify-center border border-[#00B594]/20 shrink-0 font-bold font-mono">
            $
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Tipo de Cambio Soles a Dólares (SUNAT)</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Vigente para el cálculo de importes de soles convertidos a la cartera consolidada en dólares.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <span className="text-[10px] font-bold text-slate-400 font-mono">1 USD = S/</span>
          <input
            type="number"
            step="0.001"
            className="w-16 font-mono font-black text-xs text-slate-800 focus:outline-none focus:border-[#00B594] text-center"
            value={tipoCambio}
            onChange={(e) => onUpdateTipoCambio(parseFloat(e.target.value) || 3.75)}
          />
          <span className="text-[10px] font-black text-[#00B594] font-mono shrink-0 flex items-center gap-0.5">
            <RefreshCw size={10} className="animate-spin-slow" />
            ACTIVO
          </span>
        </div>
      </div>

      {/* Audit Warnings panel */}
      <PanelAlertas 
        macroWarnings={macroWarnings} 
        overdueFacturaLines={overdueFacturaLines}
        soonToExecuteLines={soonToExecuteLines}
      />

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-150 gap-4" id="ot-tabs">
        <button
          onClick={() => setSubTab('lista')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'lista' 
              ? 'border-[#00B594] text-[#00B594]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Lista de OTs y Cuotas
        </button>
        <button
          onClick={() => setSubTab('analytics')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
            subTab === 'analytics' 
              ? 'border-[#00B594] text-[#00B594]' 
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
              ? 'border-[#00B594] text-[#00B594]' 
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
              ? 'border-[#00B594] text-[#00B594]' 
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
          ots={ots}
          reports={reports}
        />
      )}

      {subTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150">
            <h3 className="text-base font-black text-slate-800">Alertas de Servicio y Facturación Pendiente</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Desviaciones temporales de MAFORT. Identifica qué cuotas no se facturaron en el mes programado y qué visitas están atrasadas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Facturaciones Vencidas */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  Facturas Pendientes Atrasadas ({overdueFacturaLines.length})
                </span>
                <span className="text-[10px] font-black text-rose-600 font-mono bg-rose-50 px-2.5 py-1 rounded-md">Pérdida de Liquidez</span>
              </div>
              
              <div className="space-y-3.5 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {overdueFacturaLines.length === 0 ? (
                  <p className="text-xs text-slate-450 font-medium py-12 text-center">¡Felicitaciones! No tienes facturación programada atrasada.</p>
                ) : (
                  overdueFacturaLines.map(line => (
                    <div key={line.id} className="pt-3.5 first:pt-0 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="font-black text-slate-800">{line.razon_social}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          Línea {line.ot} • Programado en: <strong className="font-mono text-rose-600 font-extrabold">{line.mes_prog_facturacion} {line.anio_prog_facturacion}</strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-slate-900">${line.total_usd.toLocaleString()}</div>
                        <span className="text-[8px] font-bold uppercase tracking-wider font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded mt-1 inline-block">SLA Atrasado</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Servicios Por Ejecutar Próximos o Vencidos */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B594] shrink-0"></span>
                  Servicios y Visitas Técnicas Próximas ({soonToExecuteLines.length})
                </span>
                <span className="text-[10px] font-black text-[#00B594] font-mono bg-[#E6F7F4] px-2.5 py-1 rounded-md">Ejecución en Campo</span>
              </div>
              
              <div className="space-y-3.5 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {soonToExecuteLines.length === 0 ? (
                  <p className="text-xs text-slate-450 font-medium py-12 text-center">No hay visitas técnicas pendientes registradas para este periodo.</p>
                ) : (
                  soonToExecuteLines.map(line => (
                    <div key={line.id} className="pt-3.5 first:pt-0 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="font-black text-slate-800">{line.razon_social}</div>
                        <div className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">
                          {line.descripcion}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Servicio Prog: <strong className="font-mono text-slate-700 font-extrabold">{line.mes_prog_servicio}</strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-500">Línea {line.ot}</div>
                        <span className="text-[8px] font-extrabold font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">Por Visitar</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {subTab === 'targets' && (
        <ReporteTarget 
          lineas={lineas} 
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
          onUpdateLinea={onUpdateLinea}
          onClose={() => { setShowEditLineModal(false); setEditingLine(null); }}
        />
      )}

      {selectedLineForAssign && (
        <ModalAsignarTecnico
          linea={selectedLineForAssign}
          ots={ots}
          users={users}
          onUpdateOT={(ot) => {
            if (onUpdateOT) onUpdateOT(ot);
            setSelectedLineForAssign(null);
          }}
          onClose={() => setSelectedLineForAssign(null)}
        />
      )}

    </div>
  );
}
