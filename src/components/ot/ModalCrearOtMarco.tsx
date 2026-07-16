import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { OrdenTrabajoLinea, Client, Contrato, EquipmentType, ServiceType } from '../../types';
import { MESES_ESPANOL, TIPO_VENTA_VALUES, TIPO_CONTRATACION_VALUES } from '../../utils/otDefaults';

interface ModalCrearOtMarcoProps {
  clients: Client[];
  contratosComerciales: Contrato[];
  lineas: OrdenTrabajoLinea[];
  currentUser: { email: string; username: string };
  tipoCambio: number;
  onAddLinea: (linea: OrdenTrabajoLinea) => void;
  onClose: () => void;
}

export default function ModalCrearOtMarco({
  clients,
  contratosComerciales,
  lineas,
  currentUser,
  tipoCambio,
  onAddLinea,
  onClose
}: ModalCrearOtMarcoProps) {
  const [marcoForm, setMarcoForm] = useState({
    anio: new Date().getFullYear(),
    mes: MESES_ESPANOL[new Date().getMonth()],
    fecha: new Date().toISOString().split('T')[0],
    nombre_solicitante: '',
    razon_social: '',
    empresa: '',
    descripcion: '',
    n_cotizacion: '',
    n_oc_os: 'NO TIENE',
    simbolo_moneda: '$' as '$' | 'S/',
    monto_marco_sin_igv: 0,
    monto_marco_inc_igv: 0,
    sub_importe_sin_igv: 0,
    sub_importe_inc_igv: 0,
    anio_prog_facturacion: new Date().getFullYear(),
    mes_prog_servicio: MESES_ESPANOL[new Date().getMonth()],
    dia_prog_servicio: new Date().getDate(),
    mes_prog_facturacion: MESES_ESPANOL[new Date().getMonth()],
    dia_prog_facturacion: new Date().getDate(),
    tipo_venta: 'MANTENIMIENTO' as any,
    tipo_contratacion: 'CONTRATO' as any,
    comercial: '',
    observacion: '',
    seguimiento: '',
    contratoId: '',
    adendaId: '',
    equipoId: '',
    ot: '' // auto generated unique code
  });

  const [clientEquipos, setClientEquipos] = useState<any[]>([]);
  const [isLoadingEquipos, setIsLoadingEquipos] = useState(false);

  const getNextOtCode = (contratoId: string, adendaId: string | null) => {
    if (!contratoId) return `OT-S_N-${Math.floor(4000 + Math.random() * 999)}-001`;
    const contract = contratosComerciales.find(c => c.id === contratoId);
    if (!contract) return `OT-S_N-${Math.floor(4000 + Math.random() * 999)}-001`;
    
    let baseCode = contract.id;
    
    if (adendaId) {
      const adenda = contract.ampliaciones?.find(a => a.id === adendaId);
      if (adenda) {
        const adendaCode = adenda.codigo || 'A';
        if (adendaCode.includes(contract.id)) {
          baseCode = adendaCode;
        } else {
          baseCode = `${contract.id}-${adendaCode}`;
        }
      }
    }
    
    return `OT-${baseCode}-001`; // First line is always 001
  };

  const getFilteredEquipos = () => {
    if (!marcoForm.contratoId) {
      return clientEquipos;
    }
    if (marcoForm.adendaId) {
      return clientEquipos.filter(eq => 
        eq.adensasOrigen && eq.adensasOrigen.some((ao: any) => ao.adendaId === marcoForm.adendaId)
      );
    } else {
      return clientEquipos.filter(eq => eq.contratoId === marcoForm.contratoId);
    }
  };

  const handleLinkSelect = (val: string) => {
    let newContratoId = '';
    let newAdendaId = '';
    
    if (val.startsWith('contract_')) {
      newContratoId = val.replace('contract_', '');
    } else if (val.startsWith('adenda_')) {
      newAdendaId = val.replace('adenda_', '');
      const parent = contratosComerciales.find(c => 
        c.ampliaciones?.some(a => a.id === newAdendaId)
      );
      if (parent) {
        newContratoId = parent.id;
      }
    }
    
    const generatedId = getNextOtCode(newContratoId, newAdendaId || null);
    
    setMarcoForm(prev => ({
      ...prev,
      contratoId: newContratoId,
      adendaId: newAdendaId,
      ot: generatedId,
      equipoId: ''
    }));
  };

  const cleanString = (val: string) => val.trim().toUpperCase();

  const handleCreateMarcoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcoForm.razon_social) return;

    // Auto-generate ot_marco as next available unique integer
    const otMarcoNum = Math.max(...lineas.map(l => l.ot_marco), 0) + 1;

    // Auto-generate line correlative -1
    const subSinIgv = Number(marcoForm.sub_importe_sin_igv) || 0;
    const subIncIgv = Number(marcoForm.sub_importe_inc_igv) || 0;
    const isSoles = marcoForm.simbolo_moneda === 'S/';
    const totalUsd = isSoles ? (subSinIgv / tipoCambio) : subSinIgv;

    const clientObj = clients.find(cl => cl.razonSocial === marcoForm.razon_social);

    const firstLine: OrdenTrabajoLinea = {
      id: `otl_${Date.now()}_1`,
      anio: Number(marcoForm.anio) || new Date().getFullYear(),
      ot_marco: otMarcoNum,
      ot: marcoForm.ot || `OT-${otMarcoNum}-1`,
      mes: cleanString(marcoForm.mes),
      fecha: marcoForm.fecha,
      nombre_solicitante: marcoForm.nombre_solicitante.trim(),
      razon_social: marcoForm.razon_social,
      clientId: clientObj ? clientObj.id : undefined,
      empresa: marcoForm.empresa.trim() || marcoForm.razon_social.split(' ')[0],
      descripcion: marcoForm.descripcion.trim(),
      n_cotizacion: marcoForm.n_cotizacion.trim(),
      n_oc_os: marcoForm.n_oc_os.trim() || 'NO TIENE',
      simbolo_moneda: marcoForm.simbolo_moneda,
      monto_marco_sin_igv: Number(marcoForm.monto_marco_sin_igv) || 0,
      monto_marco_inc_igv: Number(marcoForm.monto_marco_inc_igv) || 0,
      sub_importe_sin_igv: subSinIgv,
      sub_importe_inc_igv: subIncIgv,
      total_usd: Number(totalUsd.toFixed(2)),
      anio_prog_facturacion: Number(marcoForm.anio_prog_facturacion) || new Date().getFullYear(),
      mes_prog_servicio: cleanString(marcoForm.mes_prog_servicio),
      dia_prog_servicio: Number(marcoForm.dia_prog_servicio) || undefined,
      mes_prog_facturacion: cleanString(marcoForm.mes_prog_facturacion),
      dia_prog_facturacion: Number(marcoForm.dia_prog_facturacion) || undefined,
      tipo_venta: marcoForm.tipo_venta,
      pendiente: 'POR EJECUTAR',
      estado: 'POR FACTURAR',
      n_factura: '',
      nro_guia_informe: '',
      observacion: marcoForm.observacion.trim(),
      seguimiento: marcoForm.seguimiento.trim(),
      tipo_contratacion: marcoForm.tipo_contratacion,
      estatus: [
        {
          fecha: new Date().toISOString().split('T')[0],
          autor: currentUser.email,
          texto: `OT Marco #${otMarcoNum} (${marcoForm.ot || `OT-${otMarcoNum}-1`}) e inicio de línea 1 registrado por ${currentUser.username}.`
        }
      ],
      comercial: marcoForm.comercial.trim(),
      creadoPor: currentUser.email,
      creadoEn: new Date().toISOString().split('T')[0],
      contratoId: marcoForm.contratoId || undefined,
      adendaId: marcoForm.adendaId || undefined,
      equipoId: marcoForm.equipoId || undefined
    };

    onAddLinea(firstLine);
    onClose();
  };

  useEffect(() => {
    const el = document.getElementById('main-workspace-content');
    if (el) el.style.overflow = 'hidden';
    return () => { if (el) el.style.overflow = ''; };
  }, []);

  return (
    <>
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto" id="ot-modal-crear-marco">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 my-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Plus size={16} className="text-[#00B594]" />
            Registrar Nueva OT Marco (Acuerdo Padre)
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleCreateMarcoSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs font-sans">
          
          {/* Bloque 1: Datos Generales */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-black uppercase tracking-wide text-[#00B594] font-mono border-b border-slate-100 pb-1">1. Datos Generales del Contrato</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Año de Creación</label>
                <input
                  type="number"
                  required
                  value={marcoForm.anio}
                  onChange={(e) => setMarcoForm({ ...marcoForm, anio: parseInt(e.target.value) || 2026 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Código OT (Autogenerado)</label>
                <input
                  type="text"
                  disabled
                  placeholder="Se autogenerará al vincular"
                  value={marcoForm.ot}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-slate-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Mes de Creación</label>
                <select
                  value={marcoForm.mes}
                  onChange={(e) => setMarcoForm({ ...marcoForm, mes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                >
                  {MESES_ESPANOL.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Cliente Legal <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={marcoForm.razon_social}
                  onChange={(e) => {
                    const s = e.target.value;
                    const clientObj = clients.find(cl => cl.razonSocial === s);
                    setMarcoForm({
                      ...marcoForm,
                      razon_social: s,
                      empresa: clientObj ? clientObj.razonSocial.split(' ')[0].toUpperCase() : '',
                      nombre_solicitante: clientObj ? clientObj.contactoNombre : '',
                      contratoId: '',
                      adendaId: '',
                      ot: '',
                      equipoId: ''
                    });
                    
                    setClientEquipos([]);
                    if (clientObj) {
                      setIsLoadingEquipos(true);
                      fetch(`/api/equipos?clienteId=${encodeURIComponent(clientObj.id)}`)
                        .then(r => r.ok ? r.json() : [])
                        .then(data => {
                          setClientEquipos(Array.isArray(data) ? data : []);
                          setIsLoadingEquipos(false);
                        })
                        .catch(err => {
                          console.error("Error loading client equipments:", err);
                          setIsLoadingEquipos(false);
                        });
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-[#00B594] transition-all"
                >
                  <option value="">Seleccione Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.razonSocial}>{c.razonSocial}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Empresa (Nombre Corto)</label>
                <input
                  type="text"
                  placeholder="Ej: REPSOL"
                  value={marcoForm.empresa}
                  onChange={(e) => setMarcoForm({ ...marcoForm, empresa: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Vincular Contrato / Adenda</label>
                <select
                  value={marcoForm.adendaId ? `adenda_${marcoForm.adendaId}` : marcoForm.contratoId ? `contract_${marcoForm.contratoId}` : ''}
                  onChange={(e) => handleLinkSelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-[#00B594] transition-all font-bold"
                >
                  <option value="">-- Sin Vincular --</option>
                  {contratosComerciales.filter(c => {
                    const clientObj = clients.find(cl => cl.razonSocial === marcoForm.razon_social);
                    return c.clientId === clientObj?.id;
                  }).map(c => (
                    <React.Fragment key={c.id}>
                      <option value={`contract_${c.id}`}>Contrato: {c.id} ({c.tipo_contrato})</option>
                      {(c.ampliaciones || []).map(a => (
                        <option key={a.id} value={`adenda_${a.id}`}>
                          &nbsp;&nbsp;↳ Adenda: {a.codigo || 'S/N'} (Monto: ${a.monto})
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Equipo Asignado</label>
                {isLoadingEquipos ? (
                  <div className="text-[10px] text-slate-400 font-mono animate-pulse mt-2">Cargando equipos...</div>
                ) : (
                  <select
                    required={!!marcoForm.contratoId}
                    value={marcoForm.equipoId}
                    onChange={(e) => setMarcoForm({ ...marcoForm, equipoId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-[#00B594] transition-all font-bold"
                  >
                    <option value="">-- Seleccione un Equipo --</option>
                    {getFilteredEquipos().map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.codigo} - {eq.tipo} {eq.marca} ({eq.potenciaKva} KVA)
                      </option>
                    ))}
                  </select>
                )}
                {marcoForm.contratoId && getFilteredEquipos().length === 0 && !isLoadingEquipos && (
                  <span className="text-[9px] text-amber-600 block mt-0.5 font-bold">
                    ⚠️ Sin equipos registrados en contrato/adenda.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Nro Cotización</label>
                <input
                  type="text"
                  placeholder="COT-2026-001"
                  value={marcoForm.n_cotizacion}
                  onChange={(e) => setMarcoForm({ ...marcoForm, n_cotizacion: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Nro OC / OS</label>
                <input
                  type="text"
                  placeholder="OS-8841"
                  value={marcoForm.n_oc_os}
                  onChange={(e) => setMarcoForm({ ...marcoForm, n_oc_os: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Responsable Comercial</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={marcoForm.comercial}
                  onChange={(e) => setMarcoForm({ ...marcoForm, comercial: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Descripción del Servicio <span className="text-rose-500">*</span></label>
              <textarea
                required
                placeholder="Escriba el alcance detallado del servicio..."
                rows={2}
                value={marcoForm.descripcion}
                onChange={(e) => setMarcoForm({ ...marcoForm, descripcion: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
              />
            </div>
          </div>

          {/* Bloque 2: Importe Marco y Moneda */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-wide text-[#00B594] font-mono border-b border-slate-100 pb-1">2. Presupuesto General Acordado</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Moneda</label>
                <select
                  value={marcoForm.simbolo_moneda}
                  onChange={(e) => setMarcoForm({ ...marcoForm, simbolo_moneda: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-bold"
                >
                  <option value="$">Dólares ($)</option>
                  <option value="S/">Soles (S/)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto Marco (Sin IGV)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={marcoForm.monto_marco_sin_igv}
                  onChange={(e) => {
                    const sin = Number(e.target.value) || 0;
                    setMarcoForm({
                      ...marcoForm,
                      monto_marco_sin_igv: sin,
                      monto_marco_inc_igv: Number((sin * 1.18).toFixed(2))
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto Marco (Con IGV)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={marcoForm.monto_marco_inc_igv}
                  onChange={(e) => setMarcoForm({ ...marcoForm, monto_marco_inc_igv: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Datos de la Primera Línea / Cuota auto-generada */}
          <div className="space-y-3.5 pt-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
            <h4 className="text-[10px] font-black uppercase tracking-wide text-[#00B594] font-mono border-b border-[#00B594]/20 pb-1">
              3. Datos de Primera Cuota Auto-generada ({marcoForm.ot_marco ? `${marcoForm.ot_marco}-1` : 'X-1'})
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1 font-mono">Sub Importe (Sin IGV)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={marcoForm.sub_importe_sin_igv}
                  onChange={(e) => {
                    const sin = Number(e.target.value) || 0;
                    setMarcoForm({
                      ...marcoForm,
                      sub_importe_sin_igv: sin,
                      sub_importe_inc_igv: Number((sin * 1.18).toFixed(2))
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1 font-mono">Sub Importe (Con IGV)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={marcoForm.sub_importe_inc_igv}
                  onChange={(e) => setMarcoForm({ ...marcoForm, sub_importe_inc_igv: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1 font-mono">Tipo Venta</label>
                <select
                  value={marcoForm.tipo_venta}
                  onChange={(e) => setMarcoForm({ ...marcoForm, tipo_venta: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                >
                  {TIPO_VENTA_VALUES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1 font-mono">Fecha Prog Servicio</label>
                <input
                  type="date"
                  value={`${new Date().getFullYear()}-${String(MESES_ESPANOL.indexOf(marcoForm.mes_prog_servicio) + 1).padStart(2, '0')}-${String(marcoForm.dia_prog_servicio || 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const date = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(date.getTime())) {
                      setMarcoForm({
                        ...marcoForm,
                        mes_prog_servicio: MESES_ESPANOL[date.getMonth()],
                        dia_prog_servicio: date.getDate()
                      });
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1 font-mono">Fecha Prog Facturación</label>
                <input
                  type="date"
                  value={`${marcoForm.anio_prog_facturacion}-${String(MESES_ESPANOL.indexOf(marcoForm.mes_prog_facturacion) + 1).padStart(2, '0')}-${String(marcoForm.dia_prog_facturacion || 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const date = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(date.getTime())) {
                      setMarcoForm({
                        ...marcoForm,
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
          </div>

          {/* Botonera */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-lg transition-all"
            >
              Registrar Marco e Iniciar Línea
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
}
