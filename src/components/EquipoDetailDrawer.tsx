import React, { useEffect, useState } from 'react';
import { Equipo, EquipoEstado } from '../types';

interface EquipoDetailDrawerProps {
  equipoId: string | null;
  contratoId: string;
  onClose: () => void;
  onUnassign?: (equipoId: string) => Promise<void>;
  onUpdate?: (equipoId: string, data: Partial<Equipo>) => Promise<void>;
}

const ESTADOS_EQUIPO: { value: EquipoEstado; color: string; bg: string }[] = [
  { value: 'Operativo', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { value: 'En almacén', color: 'text-blue-700', bg: 'bg-blue-100' },
  { value: 'En reparación', color: 'text-amber-700', bg: 'bg-amber-100' },
  { value: 'En observación', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'Baja', color: 'text-red-700', bg: 'bg-red-100' },
];

export default function EquipoDetailDrawer({ equipoId, contratoId, onClose, onUnassign, onUpdate }: EquipoDetailDrawerProps) {
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Equipo>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (equipoId) {
      loadEquipo();
    }
  }, [equipoId]);

  async function loadEquipo() {
    if (!equipoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/equipos/${equipoId}`);
      const data = await res.json();
      setEquipo(data);
    } catch (err) {
      console.error('Error loading equipo:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    if (!equipo) return;
    setEditForm({
      codigo: equipo.codigo,
      tipo: equipo.tipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      serie: equipo.serie,
      potenciaKva: equipo.potenciaKva,
      ubicacion: equipo.ubicacion,
      estado: equipo.estado,
      especificaciones: equipo.especificaciones,
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!equipoId || !equipo) return;
    setSaveLoading(true);
    try {
      if (onUpdate) {
        await onUpdate(equipoId, editForm);
      } else {
        const res = await fetch(`/api/equipos/${equipoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (!res.ok) throw new Error('Error al actualizar');
      }
      await loadEquipo();
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleUnassign() {
    if (!equipoId || !onUnassign) return;
    try {
      await onUnassign(equipoId);
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  const estadoInfo = ESTADOS_EQUIPO.find(e => e.value === equipo?.estado);

  return (
    <>
      {/* Backdrop */}
      {equipoId && (
        <div className="fixed inset-0 z-[65] bg-slate-900/30 backdrop-blur-sm" onClick={onClose}></div>
      )}
      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-[66] h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ${equipoId ? 'translate-x-0' : 'translate-x-full'}`}>
        {equipoId && (
          <>
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B594" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                {loading ? 'Cargando...' : equipo?.codigo || 'Detalle de Equipo'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#00B594] border-t-transparent"></div>
              </div>
            ) : equipo ? (
              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)]">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full ${estadoInfo?.bg || 'bg-slate-100'} ${estadoInfo?.color || 'text-slate-600'}`}>
                    {equipo.estado}
                  </span>
                  {equipo.contratoId && onUnassign && (
                    <button
                      onClick={handleUnassign}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Liberar del contrato
                    </button>
                  )}
                </div>

                {editing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Código</label>
                        <input value={editForm.codigo || ''} onChange={e => setEditForm(p => ({ ...p, codigo: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#00B594] font-mono" />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo</label>
                        <select value={editForm.tipo || ''} onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#00B594]">
                          {['UPS', 'Transformador', 'Rectificador', 'Climatización', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Marca</label>
                        <input value={editForm.marca || ''} onChange={e => setEditForm(p => ({ ...p, marca: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Modelo</label>
                        <input value={editForm.modelo || ''} onChange={e => setEditForm(p => ({ ...p, modelo: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Serie</label>
                        <input value={editForm.serie || ''} onChange={e => setEditForm(p => ({ ...p, serie: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Potencia (KVA)</label>
                        <input type="number" step="0.1" value={editForm.potenciaKva ?? ''} onChange={e => setEditForm(p => ({ ...p, potenciaKva: e.target.value ? parseFloat(e.target.value) : undefined }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Estado</label>
                        <select value={editForm.estado || 'Operativo'} onChange={e => setEditForm(p => ({ ...p, estado: e.target.value as EquipoEstado }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none">
                          {ESTADOS_EQUIPO.map(e => <option key={e.value} value={e.value}>{e.value}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Ubicación</label>
                      <input value={editForm.ubicacion || ''} onChange={e => setEditForm(p => ({ ...p, ubicacion: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] cursor-pointer">Cancelar</button>
                      <button onClick={handleSave} disabled={saveLoading} className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] disabled:bg-teal-300 text-white font-black rounded-xl text-[10px] cursor-pointer shadow-sm flex items-center gap-1.5">
                        {saveLoading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Tipo</span>
                        <span className="text-xs font-bold text-slate-800">{equipo.tipo}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Código</span>
                        <span className="text-xs font-mono font-bold text-[#00B594]">{equipo.codigo}</span>
                      </div>
                    </div>

                    {(equipo.marca || equipo.modelo) && (
                      <div className="grid grid-cols-2 gap-4">
                        {equipo.marca && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Marca</span>
                            <span className="text-xs font-bold text-slate-800">{equipo.marca}</span>
                          </div>
                        )}
                        {equipo.modelo && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Modelo</span>
                            <span className="text-xs font-bold text-slate-800">{equipo.modelo}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {equipo.serie && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Número de Serie</span>
                        <span className="text-xs font-mono font-bold text-slate-800">{equipo.serie}</span>
                      </div>
                    )}

                    {(equipo.potenciaKva || equipo.ubicacion) && (
                      <div className="grid grid-cols-2 gap-4">
                        {equipo.potenciaKva && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Potencia</span>
                            <span className="text-xs font-bold text-slate-800">{equipo.potenciaKva} KVA</span>
                          </div>
                        )}
                        {equipo.ubicacion && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Ubicación</span>
                            <span className="text-xs font-bold text-slate-800">{equipo.ubicacion}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Especificaciones JSON */}
                    {equipo.especificaciones && Object.keys(equipo.especificaciones).length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Especificaciones Técnicas</span>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {Object.entries(equipo.especificaciones).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-[10px] py-1 border-b border-slate-100 last:border-0">
                              <span className="text-slate-500 font-medium uppercase font-mono">{key}</span>
                              <span className="text-slate-800 font-bold font-mono">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Origen */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Origen / Asignación</span>
                      <p className="text-[10px] text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {equipo.contratoId === contratoId
                          ? 'Asignado a este contrato'
                          : equipo.contratoId
                            ? `Asignado a otro contrato (${equipo.contratoId})`
                            : 'En almacén — sin asignar'
                        }
                      </p>
                    </div>

                    {/* Created/Updated */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      {equipo.creadoEn && (
                        <div className="space-y-1">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block font-mono">Registrado</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(equipo.creadoEn).toLocaleDateString('es-PE')}</span>
                        </div>
                      )}
                      {equipo.actualizadoEn && (
                        <div className="space-y-1">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block font-mono">Última actualización</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(equipo.actualizadoEn).toLocaleDateString('es-PE')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        onClick={startEditing}
                        className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-[10px] cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        Editar Equipo
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 font-mono text-xs">Equipo no encontrado</div>
            )}
          </>
        )}
      </div>
    </>
  );
}
