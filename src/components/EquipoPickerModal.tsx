import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Equipo, EquipoEstado } from '../types';

interface EquipoPickerModalProps {
  contratoId: string;
  onClose: () => void;
  onAssign: (equipoId: string) => Promise<void>;
  onCreate: (data: Partial<Equipo>) => Promise<Equipo>;
  onAssignToAdenda?: (equipoId: string) => Promise<void>;
  mode?: 'contrato' | 'adenda';
  existingIds?: string[];
}

const TIPOS_EQUIPO = ['UPS', 'Transformador', 'Rectificador', 'Climatización', 'Otro'];
const ESTADOS_EQUIPO: EquipoEstado[] = ['Operativo', 'En almacén', 'En reparación', 'En observación', 'Baja'];

export default function EquipoPickerModal({
  contratoId,
  onClose,
  onAssign,
  onCreate,
  onAssignToAdenda,
  mode = 'contrato',
  existingIds = []
}: EquipoPickerModalProps) {
  const [tab, setTab] = useState<'buscar' | 'crear'>('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [equiposLibres, setEquiposLibres] = useState<Equipo[]>([]);
  const [equiposAsignados, setEquiposAsignados] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [nextCodigo, setNextCodigo] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New equipment form
  const [newEquipo, setNewEquipo] = useState({
    tipo: 'UPS',
    marca: '',
    modelo: '',
    serie: '',
    potenciaKva: '' as string,
    ubicacion: '',
    estado: 'Operativo' as EquipoEstado,
    especificaciones: ''
  });

  useEffect(() => {
    if (tab === 'buscar') {
      loadEquipos();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'crear') {
      computeNextCodigo();
    }
  }, [tab]);

  useEffect(() => {
    const el = document.getElementById('main-workspace-content');
    if (el) el.style.overflow = 'hidden';
    return () => { if (el) el.style.overflow = ''; };
  }, []);

  async function computeNextCodigo() {
    try {
      const res = await fetch(`/api/equipos?contratoId=${encodeURIComponent(contratoId)}`);
      const equipos = await res.json();
      let maxSeq = 0;
      for (const eq of equipos) {
        const m = eq.codigo?.match(/-E(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSeq) maxSeq = n;
        }
      }
      setNextCodigo(`${contratoId}-E${maxSeq + 1}`);
    } catch {
      setNextCodigo(`${contratoId}-E1`);
    }
  }

  async function loadEquipos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      const res = await fetch(`/api/equipos?${params.toString()}`);
      const all = await res.json();
      setEquiposLibres(all.filter((e: Equipo) => !e.contratoId && !existingIds.includes(e.id)));
      setEquiposAsignados(all.filter((e: Equipo) => e.contratoId === contratoId && !existingIds.includes(e.id)));
    } catch (err) {
      console.error('Error loading equipos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(equipoId: string) {
    setActionLoading(equipoId);
    setErrorMsg('');
    try {
      await onAssign(equipoId);
      setEquiposLibres(prev => prev.filter(e => e.id !== equipoId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al asignar equipo');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading('new');
    setErrorMsg('');
    try {
      let especificacionesParsed: Record<string, any> | undefined;
      if (newEquipo.especificaciones) {
        try { especificacionesParsed = JSON.parse(newEquipo.especificaciones); } catch { }
      }
      const created = await onCreate({
        contratoId,
        tipo: newEquipo.tipo,
        marca: newEquipo.marca || undefined,
        modelo: newEquipo.modelo || undefined,
        serie: newEquipo.serie || undefined,
        potenciaKva: newEquipo.potenciaKva ? parseFloat(newEquipo.potenciaKva) : undefined,
        ubicacion: newEquipo.ubicacion || undefined,
        estado: newEquipo.estado,
        especificaciones: especificacionesParsed
      });
      await onAssign(created.id);
      setNewEquipo({ tipo: 'UPS', marca: '', modelo: '', serie: '', potenciaKva: '', ubicacion: '', estado: 'Operativo', especificaciones: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear o asignar equipo');
    } finally {
      setActionLoading(null);
    }
  }

  return createPortal(
    <>
    <div className="fixed inset-0 z-[69] bg-slate-900/50 backdrop-blur-sm" />
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-teal-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B594" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            {mode === 'adenda' ? 'Asignar Equipo a Adenda' : 'Asignar Equipo al Contrato'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3">
          <button
            onClick={() => setTab('buscar')}
            className={`text-[10px] font-extrabold uppercase font-mono px-4 py-2 border-b-2 transition-colors ${tab === 'buscar' ? 'border-[#00B594] text-[#00B594]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Buscar Existente
          </button>
          <button
            onClick={() => setTab('crear')}
            className={`text-[10px] font-extrabold uppercase font-mono px-4 py-2 border-b-2 transition-colors ${tab === 'crear' ? 'border-[#00B594] text-[#00B594]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Crear Nuevo
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-[10px] text-rose-700 font-bold font-mono">{errorMsg}</span>
          </div>
        )}

        {tab === 'buscar' ? (
          <div className="p-6 space-y-3">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por código, serie, marca..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') loadEquipos(); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#00B594] font-mono"
              />
              <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00B594] border-t-transparent"></div>
              </div>
            ) : (
              <>
                {equiposAsignados.length > 0 && (
                  <div>
                    <p className="text-[9px] font-extrabold uppercase text-slate-400 font-mono mb-2">En este contrato</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {equiposAsignados.map(eq => (
                        <div key={eq.id} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-[10px] font-bold text-teal-700 font-mono">{eq.codigo}</span>
                            <span className="text-[9px] text-slate-500 ml-2">{eq.tipo}{eq.marca ? ` • ${eq.marca}` : ''}</span>
                          </div>
                          <span className="text-[9px] text-teal-500 font-semibold">Asignado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[9px] font-extrabold uppercase text-slate-400 font-mono">
                  Equipos disponibles ({equiposLibres.length})
                </p>
                {equiposLibres.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic font-mono text-center py-4">No se encontraron equipos disponibles. Cambia a "Crear Nuevo".</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {equiposLibres.map(eq => (
                      <div key={eq.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 hover:bg-slate-100/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-700 font-mono truncate">{eq.codigo}</span>
                            <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded-full ${
                              eq.estado === 'Operativo' ? 'bg-emerald-100 text-emerald-700' 
                              : eq.estado === 'En almacén' ? 'bg-blue-100 text-blue-700'
                              : eq.estado === 'En reparación' ? 'bg-amber-100 text-amber-700'
                              : eq.estado === 'En observación' ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                            }`}>{eq.estado}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{eq.tipo}{eq.marca ? ` • ${eq.marca}` : ''}{eq.modelo ? ` • ${eq.modelo}` : ''}{eq.serie ? ` • S/N: ${eq.serie}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          disabled={actionLoading === eq.id}
                          onClick={() => handleAssign(eq.id)}
                          className="ml-2 px-2.5 py-1.5 bg-[#00B594] hover:bg-[#009b7e] disabled:bg-teal-300 text-white font-bold rounded-lg text-[9px] cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          {actionLoading === eq.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          )}
                          Asignar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Crear Nuevo Equipo */
          <form onSubmit={handleCreate} className="p-6 space-y-3">
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-extrabold uppercase text-teal-500 font-mono">Código autogenerado</span>
                <p className="text-xs font-mono font-bold text-teal-700">{nextCodigo}</p>
                {mode === 'adenda' && <p className="text-[7px] text-teal-400 font-mono mt-0.5">Se actualizará con el nº de adenda al guardar</p>}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00B594" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo *</label>
                <select
                  required
                  value={newEquipo.tipo}
                  onChange={(e) => setNewEquipo(p => ({ ...p, tipo: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none focus:border-[#00B594]"
                >
                  {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Marca</label>
                <input
                  placeholder="Ej: APC"
                  value={newEquipo.marca}
                  onChange={(e) => setNewEquipo(p => ({ ...p, marca: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Modelo</label>
                <input
                  placeholder="Ej: SURT6000"
                  value={newEquipo.modelo}
                  onChange={(e) => setNewEquipo(p => ({ ...p, modelo: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Serie</label>
                <input
                  placeholder="S/N"
                  value={newEquipo.serie}
                  onChange={(e) => setNewEquipo(p => ({ ...p, serie: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Potencia (KVA)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ej: 60"
                  value={newEquipo.potenciaKva}
                  onChange={(e) => setNewEquipo(p => ({ ...p, potenciaKva: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Ubicación</label>
                <input
                  placeholder="Ej: Sala de servidores"
                  value={newEquipo.ubicacion}
                  onChange={(e) => setNewEquipo(p => ({ ...p, ubicacion: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Especificaciones (JSON opcional)</label>
              <textarea
                rows={2}
                placeholder='{"baterias": 4, "bypass": "interno"}'
                value={newEquipo.especificaciones}
                onChange={(e) => setNewEquipo(p => ({ ...p, especificaciones: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none font-mono resize-none"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'new'}
                className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] disabled:bg-teal-300 text-white font-black rounded-xl text-[10px] cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {actionLoading === 'new' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Crear y Asignar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </>,
    document.body
  );
}
