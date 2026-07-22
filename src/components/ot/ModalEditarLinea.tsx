import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { OrdenTrabajoLinea, Client } from '../../types';
import { MESES_ESPANOL, ESTADO_VALUES, PENDIENTE_VALUES } from '../../utils/otDefaults';

interface ModalEditarLineaProps {
  editingLine: OrdenTrabajoLinea;
  setEditingLine: React.Dispatch<React.SetStateAction<OrdenTrabajoLinea | null>>;
  tipoCambio: number;
  currentUser: { email: string; username: string };
  clients: Client[];
  onUpdateLinea: (linea: OrdenTrabajoLinea) => void;
  onClose: () => void;
}

export default function ModalEditarLinea({
  editingLine,
  setEditingLine,
  tipoCambio,
  currentUser,
  clients,
  onUpdateLinea,
  onClose
}: ModalEditarLineaProps) {

  const [showParentFields, setShowParentFields] = useState(false);

  const handleEditLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Rule: Cannot mark as FACTURADO without invoice number & invoice date
    if (editingLine.estado === 'FACTURADO' && (!editingLine.n_factura.trim() || !editingLine.fecha_factura)) {
      alert('REGLA DE NEGOCIO: No se puede marcar como "FACTURADO" si no se introduce un número de factura y su fecha de emisión.');
      return;
    }

    // Auto calculate Total USD for this specific line
    const subSinIgv = Number(editingLine.sub_importe_sin_igv) || 0;
    const isSoles = editingLine.simbolo_moneda === 'S/';
    const totalUsd = isSoles ? (subSinIgv / tipoCambio) : subSinIgv;

    const updatedLine: OrdenTrabajoLinea = {
      ...editingLine,
      total_usd: Number(totalUsd.toFixed(2)),
      modificadoPor: currentUser.email,
      modificadoEn: new Date().toISOString().split('T')[0]
    };

    onUpdateLinea(updatedLine);
    onClose();
  };

  useEffect(() => {
    const el = document.getElementById('main-workspace-content');
    if (el) el.style.overflow = 'hidden';
    return () => { if (el) el.style.overflow = ''; };
  }, []);

  const isReadOnly = editingLine.estado === 'FACTURADO' || (editingLine.estado as string) === 'COMPLETADO';

  return (
    <>
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto" id="ot-modal-editar-linea">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <span>Editar Línea de OT {editingLine.ot}</span>
              {isReadOnly && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  🔒 Completada (Solo Lectura)
                </span>
              )}
            </h3>
            <span className="text-[10px] font-bold text-slate-450 font-mono">Cliente: {editingLine.razon_social}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleEditLineSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-left text-xs font-sans">
          
          {isReadOnly && (
            <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 size={18} className="text-[#00B594] shrink-0" />
              <span>
                <strong>Línea Completada y Facturada:</strong> Esta orden de trabajo ha cerrado su ciclo operativo-financiero y se encuentra bloqueada para modificaciones.
              </span>
            </div>
          )}

          {/* SECCIÓN 1: DATOS ESPECÍFICOS DE LA CUOTA / LÍNEA */}
          <fieldset disabled={isReadOnly} className="space-y-3 disabled:opacity-80">
            <h4 className="text-[10px] font-black uppercase tracking-wide text-slate-450 font-mono border-b border-slate-100 pb-1">
              Datos de la Línea / Cuota
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Sub Importe (Sin IGV)</label>
                <input
                  type="number"
                  value={editingLine.sub_importe_sin_igv}
                  onChange={(e) => {
                    const sin = Number(e.target.value) || 0;
                    setEditingLine({
                      ...editingLine,
                      sub_importe_sin_igv: sin,
                      sub_importe_inc_igv: Number((sin * 1.18).toFixed(2))
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Sub Importe (Con IGV)</label>
                <input
                  type="number"
                  value={editingLine.sub_importe_inc_igv}
                  onChange={(e) => setEditingLine({ ...editingLine, sub_importe_inc_igv: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Prog Servicio</label>
                <input
                  type="date"
                  value={`${new Date().getFullYear()}-${String(MESES_ESPANOL.indexOf(editingLine.mes_prog_servicio) + 1).padStart(2, '0')}-${String(editingLine.dia_prog_servicio || 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const date = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(date.getTime())) {
                      setEditingLine({
                        ...editingLine,
                        mes_prog_servicio: MESES_ESPANOL[date.getMonth()],
                        dia_prog_servicio: date.getDate()
                      });
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Prog Facturación</label>
                <input
                  type="date"
                  value={`${editingLine.anio_prog_facturacion}-${String(MESES_ESPANOL.indexOf(editingLine.mes_prog_facturacion) + 1).padStart(2, '0')}-${String(editingLine.dia_prog_facturacion || 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const date = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(date.getTime())) {
                      setEditingLine({
                        ...editingLine,
                        anio_prog_facturacion: date.getFullYear(),
                        mes_prog_facturacion: MESES_ESPANOL[date.getMonth()],
                        dia_prog_facturacion: date.getDate()
                      });
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Estado Facturación</label>
                <select
                  value={editingLine.estado}
                  onChange={(e) => {
                    const st = e.target.value as any;
                    setEditingLine({
                      ...editingLine,
                      estado: st,
                      n_factura: st === 'FACTURADO' ? editingLine.n_factura : '',
                      fecha_factura: st === 'FACTURADO' ? editingLine.fecha_factura : ''
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold"
                >
                  {ESTADO_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Estado Ejecución</label>
                <select
                  value={editingLine.pendiente}
                  onChange={(e) => setEditingLine({ ...editingLine, pendiente: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold"
                >
                  {PENDIENTE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {editingLine.estado === 'FACTURADO' && (
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-150 space-y-3">
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wide font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-amber-600" />
                  Introducir Datos Reales de Factura
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1 font-mono">Nro de Factura <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: F001-2294"
                      value={editingLine.n_factura}
                      onChange={(e) => setEditingLine({ ...editingLine, n_factura: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-amber-200 rounded-xl py-1.5 px-3 font-mono font-bold text-slate-850 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1 font-mono">Fecha Emisión <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={editingLine.fecha_factura || ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const parts = date.split('-');
                        const y = parts.length > 0 ? parseInt(parts[0]) : undefined;
                        const mIndex = parts.length > 1 ? parseInt(parts[1]) - 1 : 0;
                        setEditingLine({
                          ...editingLine,
                          fecha_factura: date,
                          anio_factura: y,
                          mes_factura: MESES_ESPANOL[mIndex]
                        });
                      }}
                      className="w-full bg-white border border-amber-200 rounded-xl py-1.5 px-3 font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Nro Guía / Informe</label>
                <input
                  type="text"
                  placeholder="Ej: GR-1204"
                  value={editingLine.nro_guia_informe}
                  onChange={(e) => setEditingLine({ ...editingLine, nro_guia_informe: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 font-mono text-slate-850"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Vendedor / Comercial</label>
                <input
                  type="text"
                  value={editingLine.comercial}
                  onChange={(e) => setEditingLine({ ...editingLine, comercial: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-850"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Observaciones Operacionales</label>
              <input
                type="text"
                value={editingLine.observacion}
                onChange={(e) => setEditingLine({ ...editingLine, observacion: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-850"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Notas Seguimiento Comercial</label>
              <input
                type="text"
                value={editingLine.seguimiento}
                onChange={(e) => setEditingLine({ ...editingLine, seguimiento: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-850"
              />
            </div>
          </fieldset>

          {/* SECCIÓN 2: DATOS DEL ACUERDO MARCO PADRE (ACORDEÓN EXTENSIBLE) */}
          <div className="border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setShowParentFields(!showParentFields)}
              className="w-full flex items-center justify-between py-2 px-1 text-[#00B594] hover:text-[#009b7e] transition-colors font-extrabold text-xs"
            >
              <span className="flex items-center gap-1.5 font-black uppercase tracking-wide font-mono text-[10px]">
                {showParentFields ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Editar Datos del Acuerdo Padre (OT Marco #{editingLine.ot_marco})
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full font-mono">
                {showParentFields ? 'Ocultar' : 'Expandir para editar'}
              </span>
            </button>
            
            {showParentFields && (
              <div className="mt-2.5 space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 animate-fade-in text-left">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Cliente Legal</label>
                    <select
                      value={editingLine.razon_social}
                      onChange={(e) => {
                        const s = e.target.value;
                        const clientObj = clients.find(cl => cl.razonSocial === s);
                        setEditingLine({
                          ...editingLine,
                          razon_social: s,
                          empresa: clientObj ? clientObj.razonSocial.split(' ')[0].toUpperCase() : editingLine.empresa,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                    >
                      <option value="">Seleccione Cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.razonSocial}>{c.razonSocial}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Empresa (Nombre Corto)</label>
                    <input
                      type="text"
                      value={editingLine.empresa || ''}
                      onChange={(e) => setEditingLine({ ...editingLine, empresa: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono font-mono">Nro Cotización</label>
                    <input
                      type="text"
                      value={editingLine.n_cotizacion || ''}
                      onChange={(e) => setEditingLine({ ...editingLine, n_cotizacion: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono font-mono">Nro OC / OS</label>
                    <input
                      type="text"
                      value={editingLine.n_oc_os || ''}
                      onChange={(e) => setEditingLine({ ...editingLine, n_oc_os: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Descripción del Servicio (Parent Scope)</label>
                  <textarea
                    rows={2}
                    value={editingLine.descripcion || ''}
                    onChange={(e) => setEditingLine({ ...editingLine, descripcion: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-850"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Moneda</label>
                    <select
                      value={editingLine.simbolo_moneda}
                      onChange={(e) => setEditingLine({ ...editingLine, simbolo_moneda: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-bold"
                    >
                      <option value="$">($) USD</option>
                      <option value="S/">S/ Soles</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto Marco (Sin IGV)</label>
                    <input
                      type="number"
                      value={editingLine.monto_marco_sin_igv || 0}
                      onChange={(e) => {
                        const sin = Number(e.target.value) || 0;
                        setEditingLine({
                          ...editingLine,
                          monto_marco_sin_igv: sin,
                          monto_marco_inc_igv: Number((sin * 1.18).toFixed(2))
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono font-mono">Monto Marco (Con IGV)</label>
                    <input
                      type="number"
                      value={editingLine.monto_marco_inc_igv || 0}
                      onChange={(e) => setEditingLine({ ...editingLine, monto_marco_inc_igv: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="p-2 bg-blue-50 text-blue-800 rounded-xl text-[10px] leading-relaxed">
                  💡 <strong>Nota del Sistema:</strong> Cualquier cambio realizado en esta sección del Acuerdo Padre se aplicará automáticamente a <strong>todas</strong> las cuotas/líneas que pertenezcan a la OT Marco #{editingLine.ot_marco}.
                </div>

              </div>
            )}
          </div>

          {/* ACCIONES DEL FORMULARIO */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-lg transition-colors"
              >
                Guardar Cambios
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
    </>
  );
}
