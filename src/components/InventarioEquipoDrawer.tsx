import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Cpu, History, FileText, Download, RefreshCw, Trash2, AlertTriangle, CalendarClock, MapPin } from 'lucide-react';
import { InventarioEquipoDTO, InformeEquipoDTO, User, OT, TechnicalReport, Client } from '../types';
import { useLocalToast } from './shared/ToastModal';
import { useConfirm } from './shared/ConfirmModal';
import DocumentFormat from './DocumentFormat';

interface InventarioEquipoDrawerProps {
  equipo: InventarioEquipoDTO;
  currentUser: User;
  onClose: () => void;
  onChanged: () => void;
}

const ESTADOS_OT_COLOR: Record<string, string> = {
  'Creada': 'bg-slate-50 text-slate-600 border-slate-200',
  'Pendiente de Programación': 'bg-slate-50 text-slate-600 border-slate-200',
  'Asignada': 'bg-blue-50 text-blue-700 border-blue-200',
  'Programada': 'bg-blue-50 text-blue-700 border-blue-200',
  'En Camino': 'bg-sky-50 text-sky-700 border-sky-200',
  'En Sitio': 'bg-sky-50 text-sky-700 border-sky-200',
  'Trabajo en Ejecución': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'No Ejecutada': 'bg-slate-50 text-slate-600 border-slate-200',
  'Informe Pendiente': 'bg-amber-50 text-amber-700 border-amber-200',
  'Informe Enviado': 'bg-blue-50 text-blue-700 border-blue-200',
  'En Revisión': 'bg-amber-50 text-amber-700 border-amber-200',
  'Observada': 'bg-rose-50 text-rose-700 border-rose-200',
  'Corregida': 'bg-teal-50 text-teal-700 border-teal-200',
  'Aprobada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Firmada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Facturada': 'bg-violet-50 text-violet-700 border-violet-200',
  'Cerrada': 'bg-slate-100 text-slate-600 border-slate-300',
};

function otBadge(estado: string | null): string {
  if (!estado) return 'bg-slate-50 text-slate-500 border-slate-200';
  return ESTADOS_OT_COLOR[estado] || 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function InventarioEquipoDrawer({ equipo, currentUser, onClose, onChanged }: InventarioEquipoDrawerProps) {
  const [isChanged, setIsChanged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pdfReport, setPdfReport] = useState<{ report: TechnicalReport; ot: OT; client: Client } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { notifySuccess, notifyError, toastView } = useLocalToast();
  const { confirm, confirmView } = useConfirm();

  const isSoloLectura = currentUser.role === 'Tecnico';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, []);

  const loadFullData = async (inf: InformeEquipoDTO) => {
    const [reportsRes, otsRes] = await Promise.all([
      fetch(`/api/reports?otId=${encodeURIComponent(inf.otId)}`),
      fetch(`/api/ots`),
    ]);
    const reports = await reportsRes.json();
    const ots = await otsRes.json();
    const report = reports.find((r: TechnicalReport) => r.id === inf.id) || reports.find((r: TechnicalReport) => r.otId === inf.otId);
    const ot = ots.find((o: OT) => o.id === inf.otId);
    if (!report || !ot) throw new Error('Informe o orden de trabajo no disponible');
    const client: Client = equipo.empresa ? {
      id: equipo.empresa.id,
      razonSocial: equipo.empresa.razonSocial,
      ruc: equipo.empresa.ruc || 'S/D',
      direccionSede: 'Sede Principal',
      distrito: '',
      contactoNombre: 'Contacto',
      contactoEmail: '',
      contactoTelefono: '',
    } : {
      id: 'client-desconocido',
      razonSocial: 'Cliente General',
      ruc: 'S/D',
      direccionSede: 'S/D',
      distrito: '',
      contactoNombre: '',
      contactoEmail: '',
      contactoTelefono: '',
    };
    return { report, ot, client };
  };

  async function handleDownloadPDF(inf: InformeEquipoDTO) {
    if (!inf) return;
    setIsGeneratingPdf(true);
    try {
      const data = await loadFullData(inf);
      setPdfReport(data);
      setTimeout(() => {
        const element = document.getElementById('inventario-pdf-download-element');
        if (!element) {
          setIsGeneratingPdf(false);
          notifyError('PDF no disponible', 'No se pudo construir el contenido imprimible.');
          return;
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          setIsGeneratingPdf(false);
          notifyError('Pop-up Bloqueado', 'El navegador bloqueó la ventana emergente para exportar a PDF. Habilite los permisos de ventanas emergentes.');
          return;
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
              <title>SLA Mafort - Reporte ${inf.informeN}</title>
              ${styles}
              <style>
                @media print {
                  body { background: #ffffff !important; color: #000000 !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  .no-print { display: none !important; }
                  @page { size: A4 portrait; margin: 12mm 10mm 12mm 10mm; }
                  .mafort-pdf-page { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 0 25px 0 !important; page-break-after: always !important; page-break-inside: avoid !important; min-height: auto !important; }
                  .mafort-pdf-page:last-child { page-break-after: avoid !important; margin-bottom: 0 !important; }
                }
                body { background-color: #f1f5f9; margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; }
                .mafort-pdf-page { background: #ffffff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin: 0 auto 30px auto; padding: 32px; max-width: 820px; min-height: 1050px; box-sizing: border-box; }
              </style>
              <script>
                window.onload = function() {
                  var images = Array.from(document.getElementsByTagName('img'));
                  var total = images.length;
                  var loaded = 0;
                  function doPrint() { setTimeout(function() { window.print(); }, 500); }
                  if (total === 0) { doPrint(); return; }
                  var fallback = setTimeout(function() { window.print(); }, 4000);
                  images.forEach(function(img) {
                    if (img.complete && img.naturalWidth > 0) {
                      loaded++;
                      if (loaded === total) { clearTimeout(fallback); doPrint(); }
                    } else {
                      img.onload = function() {
                        loaded++;
                        if (loaded === total) { clearTimeout(fallback); doPrint(); }
                      };
                    }
                  });
                };
              </script>
            </head>
            <body>
              <div class="p-4 bg-yellow-50 text-yellow-800 text-xs text-center border-b border-yellow-200 mb-6 no-print rounded-lg">
                <strong>MODO IMPRESIÓN S.L.A:</strong> Presione Ctrl+P o CMD+P si el cuadro de diálogo de impresión no se abre automáticamente. Para guardar como PDF seleccione "Guardar como PDF".
              </div>
              <div>${htmlContent}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setIsGeneratingPdf(false);
        setPdfReport(null);
      }, 500);
    } catch (err: any) {
      console.error('Print layout failed', err);
      setIsGeneratingPdf(false);
      notifyError('Informe no Redactado', 'El informe técnico aún no ha sido redactado por el personal técnico.');
    }
  }

  async function handleCambiarEstado() {
    const ok = await confirm({
      title: 'Cambiar Estado del Equipo',
      message: `¿Deseas cambiar el estado de "${equipo.codigo}"?\n\nEstado actual: ${equipo.estado}`,
      confirmLabel: 'Cambiar Estado',
      tone: 'warning',
    });
    if (!ok) return;
    setIsChanged(true);
    try {
      const next = equipo.estado === 'Operativo' ? 'En reparación' : 'Operativo';
      const res = await fetch(`/api/equipos/${equipo.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: next }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado');
      notifySuccess('Estado Actualizado', `El equipo ${equipo.codigo} ahora está: ${next}`);
      onChanged();
    } catch (err: any) {
      notifyError('Error', err.message || 'No se pudo actualizar el estado');
    } finally {
      setIsChanged(false);
    }
  }

  async function handleEliminar() {
    const ok = await confirm({
      title: 'Eliminar Equipo',
      message: `¿Eliminar definitivamente el equipo "${equipo.codigo}"?\n\nEsta acción no se puede deshacer y borrará su historial de servicios asociado.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipos/${equipo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el equipo');
      notifySuccess('Equipo Eliminado', `El equipo ${equipo.codigo} fue eliminado correctamente.`);
      onChanged();
    } catch (err: any) {
      notifyError('Error', err.message || 'No se pudo eliminar el equipo');
    } finally {
      setIsDeleting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex justify-end bg-slate-900/50 backdrop-blur-sm text-slate-800 font-sans"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="inventario-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] h-full bg-gray-50 border-l border-slate-100 shadow-2xl overflow-y-auto focus:outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="inventario-drawer-title" className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <span className="bg-slate-100 text-slate-700 font-mono font-black px-2 py-0.5 rounded text-xs">{equipo.codigo}</span>
              <Cpu size={14} className="text-slate-400" />
            </h2>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              {equipo.marca} {equipo.modelo} · S/N {equipo.serie || 'S/D'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ficha Técnica */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider mb-3">Ficha Técnica</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-[10px] text-slate-400 font-mono uppercase">Tipo</div><div className="text-slate-700 font-semibold">{equipo.tipo}</div></div>
              <div><div className="text-[10px] text-slate-400 font-mono uppercase">Potencia</div><div className="text-slate-700 font-mono font-bold">{equipo.potenciaKva ? `${equipo.potenciaKva} kVA` : 'S/D'}</div></div>
              <div><div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1"><MapPin size={10} /> Ubicación</div><div className="text-slate-700 font-semibold">{equipo.ubicacion || 'No especificada'}</div></div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Estado</div>
                <span className={`inline-flex items-center font-mono font-bold px-2.5 py-0.5 rounded-full text-[10px] border mt-0.5 ${estadoBadge(equipo.estado)}`}>{equipo.estado}</span>
              </div>
            </div>
            {!isSoloLectura && (
              <button
                onClick={handleCambiarEstado}
                disabled={isChanged}
                className="mt-4 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} /> {isChanged ? 'Actualizando...' : 'Cambiar Estado'}
              </button>
            )}
          </div>

          {/* Empresa y Contrato */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider mb-3">Empresa y Contrato</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Razón Social</span><span className="text-slate-700 font-semibold">{equipo.empresa?.razonSocial || 'Sin empresa'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">RUC</span><span className="text-slate-700 font-mono">{equipo.empresa?.ruc || 'S/D'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Contrato</span><span className="text-slate-700 font-mono">{equipo.contrato?.codigo || 'Sin contrato'}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vigencia</span>
                <span className="text-slate-700 font-mono">
                  {equipo.contrato?.fechaInicio && equipo.contrato?.fechaFin
                    ? `${equipo.contrato.fechaInicio} — ${equipo.contrato.fechaFin}`
                    : 'S/D'}
                </span>
              </div>
            </div>
          </div>

          {/* Voltaje último informe */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider mb-3">Voltaje Último Informe</h3>
            {equipo.ultimoInforme ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-[10px] text-slate-400 font-mono uppercase">Entrada</div><div className="text-slate-900 font-mono font-bold text-lg">{equipo.ultimoInforme.voltajeEntrada}V</div></div>
                <div><div className="text-[10px] text-slate-400 font-mono uppercase">Salida</div><div className="text-slate-900 font-mono font-bold text-lg">{equipo.ultimoInforme.voltajeSalida}V</div></div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin informes registrados.</p>
            )}
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-3">Voltaje es atributo del último informe técnico, no del equipo</p>
          </div>

          {/* Visitas Históricas y Futuras */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider mb-3">Visitas Históricas ({equipo.visitasHistoricasCount})</h3>
            <div className="space-y-2">
              {equipo.visitasFuturas.length === 0 && equipo.visitasHistoricasCount === 0 && (
                <p className="text-xs text-slate-400">Sin visitas registradas.</p>
              )}
              {equipo.visitasHistoricasCount > 0 && (
                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                  <History size={11} className="text-slate-400" /> {equipo.visitasHistoricasCount} servicio(s) realizado(s)
                </p>
              )}
            </div>
            {equipo.visitasFuturas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarClock size={11} className="text-slate-400" /> Visitas Futuras ({equipo.visitasFuturas.length})
                </h4>
                <div className="space-y-2">
                  {equipo.visitasFuturas.map(v => (
                    <div key={v.otId} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-700 font-semibold">{v.fechaProgramada || 'Sin fecha'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{v.tipoMantenimiento} · {v.codigo}</div>
                      </div>
                      <span className={`inline-flex items-center font-mono font-bold px-2 py-0.5 rounded-full text-[9px] border ${otBadge(v.estado)}`}>{v.estado}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HISTÓRICO DE INFORMES TÉCNICOS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider">Informes Técnicos ({equipo.countInformes})</h3>
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400"><History size={11} /> Histórico completo</span>
            </div>
            {equipo.informes.length === 0 && (
              <p className="text-xs text-slate-400">Este equipo aún no tiene informes técnicos.</p>
            )}
            <div className="space-y-2">
              {equipo.informes.map(inf => (
                <div key={inf.id} className="border border-slate-200 rounded-xl p-3 hover:border-teal-500/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <FileText size={11} className="text-slate-400" /> {inf.informeN}
                    </span>
                    <span className={`inline-flex items-center font-mono font-bold px-2 py-0.5 rounded-full text-[9px] border ${otBadge(inf.otEstado)}`}>
                      {inf.otEstado || 'Sin estado'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] font-mono text-slate-500">
                    <span><span className="text-slate-400">Fecha:</span> {inf.fechaServicio || 'S/D'}</span>
                    <span><span className="text-slate-400">Tipo:</span> {inf.tipoServicio || 'Preventivo'}</span>
                    <span className="col-span-2"><span className="text-slate-400">Técnico:</span> {inf.tecnicoTitular || 'S/D'}</span>
                    <span><span className="text-slate-400">V. Entrada:</span> <span className="text-slate-700 font-bold">{inf.voltajeEntrada}V</span></span>
                    <span><span className="text-slate-400">V. Salida:</span> <span className="text-slate-700 font-bold">{inf.voltajeSalida}V</span></span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleDownloadPDF(inf)}
                      disabled={isGeneratingPdf}
                      className="flex items-center gap-1.5 bg-teal-brand hover:bg-teal-deep text-white px-2.5 py-1 rounded-lg text-[10px] font-black font-mono uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPdf ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download size={11} />
                      )}
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer acciones */}
          {!isSoloLectura && (
            <div className="flex gap-2 pt-2 pb-6">
              <button
                onClick={handleEliminar}
                disabled={isDeleting}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={12} /> {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfReport && (
        <div className="hidden">
          <div id="inventario-pdf-download-element" className="p-8">
            <DocumentFormat report={pdfReport.report} ot={pdfReport.ot} client={pdfReport.client} />
          </div>
        </div>
      )}
      {toastView}
      {confirmView}
    </div>,
    document.body
  );
}

function estadoBadge(estado: string): string {
  switch (estado) {
    case 'Operativo': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'En almacén': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'En reparación': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'En observación': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Baja': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}