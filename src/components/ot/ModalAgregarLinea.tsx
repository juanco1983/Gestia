import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { OrdenTrabajoLinea } from '../../types';
import { MESES_ESPANOL, TIPO_VENTA_VALUES } from '../../utils/otDefaults';

interface ModalAgregarLineaProps {
  lineas: OrdenTrabajoLinea[];
  currentUser: { email: string; username: string };
  tipoCambio: number;
  onAddLinea: (linea: OrdenTrabajoLinea) => void;
  onClose: () => void;
}

export default function ModalAgregarLinea({
  lineas,
  currentUser,
  tipoCambio,
  onAddLinea,
  onClose
}: ModalAgregarLineaProps) {
  const [addLineForm, setAddLineForm] = useState({
    ot_marco: 0,
    sub_importe_sin_igv: 0,
    sub_importe_inc_igv: 0,
    anio_prog_facturacion: new Date().getFullYear(),
    mes_prog_servicio: MESES_ESPANOL[new Date().getMonth()],
    dia_prog_servicio: new Date().getDate(),
    mes_prog_facturacion: MESES_ESPANOL[new Date().getMonth()],
    dia_prog_facturacion: new Date().getDate(),
    tipo_venta: 'MANTENIMIENTO' as any,
    observacion: '',
    seguimiento: ''
  });

  const cleanString = (val: string) => val.trim().toUpperCase();

  const handleAddLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLineForm.ot_marco) return;

    const otMarcoNum = addLineForm.ot_marco;
    const parentLines = lineas.filter(l => l.ot_marco === otMarcoNum);
    if (parentLines.length === 0) {
      alert(`La OT Marco #${otMarcoNum} no existe en el sistema. Primero regístrela.`);
      return;
    }

    // Determine the next correlative (incrementing suffix)
    const suffixes = parentLines.map(l => {
      const parts = l.ot.split('-');
      return parts.length > 1 ? parseInt(parts[1]) : 0;
    });
    const nextCorrelative = Math.max(...suffixes, 0) + 1;
    const parentTemplate = parentLines[0];

    const subSinIgv = Number(addLineForm.sub_importe_sin_igv) || 0;
    const subIncIgv = Number(addLineForm.sub_importe_inc_igv) || 0;
    const isSoles = parentTemplate.simbolo_moneda === 'S/';
    const totalUsd = isSoles ? (subSinIgv / tipoCambio) : subSinIgv;

    const newLine: OrdenTrabajoLinea = {
      id: `otl_${Date.now()}_${nextCorrelative}`,
      anio: parentTemplate.anio,
      ot_marco: otMarcoNum,
      ot: `${otMarcoNum}-${nextCorrelative}`,
      mes: parentTemplate.mes,
      fecha: parentTemplate.fecha,
      nombre_solicitante: parentTemplate.nombre_solicitante,
      razon_social: parentTemplate.razon_social,
      clientId: parentTemplate.clientId,
      empresa: parentTemplate.empresa,
      descripcion: `Adicional cuota ${nextCorrelative}: ` + (parentTemplate.descripcion || ''),
      n_cotizacion: parentTemplate.n_cotizacion,
      n_oc_os: parentTemplate.n_oc_os,
      simbolo_moneda: parentTemplate.simbolo_moneda,
      monto_marco_sin_igv: parentTemplate.monto_marco_sin_igv,
      monto_marco_inc_igv: parentTemplate.monto_marco_inc_igv,
      sub_importe_sin_igv: subSinIgv,
      sub_importe_inc_igv: subIncIgv,
      total_usd: Number(totalUsd.toFixed(2)),
      anio_prog_facturacion: Number(addLineForm.anio_prog_facturacion) || new Date().getFullYear(),
      mes_prog_servicio: cleanString(addLineForm.mes_prog_servicio),
      dia_prog_servicio: Number(addLineForm.dia_prog_servicio) || undefined,
      mes_prog_facturacion: cleanString(addLineForm.mes_prog_facturacion),
      dia_prog_facturacion: Number(addLineForm.dia_prog_facturacion) || undefined,
      tipo_venta: addLineForm.tipo_venta || parentTemplate.tipo_venta,
      pendiente: 'POR EJECUTAR',
      estado: 'POR FACTURAR',
      n_factura: '',
      nro_guia_informe: '',
      observacion: addLineForm.observacion.trim(),
      seguimiento: addLineForm.seguimiento.trim(),
      tipo_contratacion: parentTemplate.tipo_contratacion,
      estatus: [
        {
          fecha: new Date().toISOString().split('T')[0],
          autor: currentUser.email,
          texto: `Línea #${nextCorrelative} agregada al Marco #${otMarcoNum} por ${currentUser.username}.`
        }
      ],
      comercial: parentTemplate.comercial,
      creadoPor: currentUser.email,
      creadoEn: new Date().toISOString().split('T')[0]
    };

    onAddLinea(newLine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" id="ot-modal-agregar-linea">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-fade-in">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Plus size={16} className="text-[#00B594]" />
            Agregar Cuota a Acuerdo Existente
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleAddLineSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Seleccione OT Marco Padre <span className="text-rose-500">*</span></label>
            <select
              required
              value={addLineForm.ot_marco || ''}
              onChange={(e) => setAddLineForm({ ...addLineForm, ot_marco: parseInt(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
            >
              <option value="">Seleccione un acuerdo marco...</option>
              {Array.from(new Set(lineas.map(l => l.ot_marco))).sort((a,b)=>a-b).map(m => {
                const line = lineas.find(l => l.ot_marco === m);
                return <option key={m} value={m}>OT Marco #{m} ({line?.empresa})</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Sub Importe (Sin IGV) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={addLineForm.sub_importe_sin_igv || ''}
                onChange={(e) => {
                  const sin = Number(e.target.value) || 0;
                  setAddLineForm({
                    ...addLineForm,
                    sub_importe_sin_igv: sin,
                    sub_importe_inc_igv: Number((sin * 1.18).toFixed(2))
                  });
                }}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Sub Importe (Con IGV)</label>
              <input
                type="number"
                placeholder="0.00"
                value={addLineForm.sub_importe_inc_igv || ''}
                onChange={(e) => setAddLineForm({ ...addLineForm, sub_importe_inc_igv: Number(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Prog Servicio</label>
              <input
                type="date"
                value={`${new Date().getFullYear()}-${String(MESES_ESPANOL.indexOf(addLineForm.mes_prog_servicio) + 1).padStart(2, '0')}-${String(addLineForm.dia_prog_servicio || 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const date = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(date.getTime())) {
                    setAddLineForm({
                      ...addLineForm,
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
                value={`${addLineForm.anio_prog_facturacion}-${String(MESES_ESPANOL.indexOf(addLineForm.mes_prog_facturacion) + 1).padStart(2, '0')}-${String(addLineForm.dia_prog_facturacion || 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const date = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(date.getTime())) {
                    setAddLineForm({
                      ...addLineForm,
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

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Tipo de Venta</label>
            <select
              value={addLineForm.tipo_venta}
              onChange={(e) => setAddLineForm({ ...addLineForm, tipo_venta: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
            >
              {TIPO_VENTA_VALUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Observación Operacional</label>
            <input
              type="text"
              placeholder="Ej. Visita programada fin de mes"
              value={addLineForm.observacion}
              onChange={(e) => setAddLineForm({ ...addLineForm, observacion: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
            />
          </div>

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
              Agregar Cuota
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
