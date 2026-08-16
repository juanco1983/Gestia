import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Boxes, ShieldCheck, Wrench, CalendarClock, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { InventarioEquiposResponse, InventarioEquipoDTO, User } from '../types';
import InventarioEquipoDrawer from './InventarioEquipoDrawer';

interface InventarioEquiposViewProps {
  currentUser: User;
}

const ESTADOS_EQUIPO = ['Operativo', 'En reparación', 'En observación', 'Baja', 'En almacén'];

function estadoBadgeColor(estado: string): string {
  switch (estado) {
    case 'Operativo': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'En almacén': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'En reparación': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'En observación': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Baja': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export default function InventarioEquiposView({ currentUser }: InventarioEquiposViewProps) {
  const [data, setData] = useState<InventarioEquiposResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [estado, setEstado] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState<InventarioEquipoDTO | null>(null);
  const [empresas, setEmpresas] = useState<{ id: string; razonSocial: string }[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  const isSoloLectura = currentUser.role === 'Tecnico';
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (estado) params.set('estado', estado);
    if (clienteId) params.set('clienteId', clienteId);
    if (tipo) params.set('tipo', tipo);
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    try {
      const res = await fetch(`/api/inventario-equipos?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar el inventario');
      const json = await res.json();
      setData(json);
      if (json.items?.length) {
        setEmpresas(prev => {
          const merged = new Map(prev.map(e => [e.id, e]));
          json.items.forEach((it: any) => {
            if (it.empresa) merged.set(it.empresa.id, it.empresa);
          });
          return Array.from(merged.values());
        });
        setTipos(prev => Array.from(new Set([...prev, ...json.items.map((it: any) => it.tipo).filter(Boolean)])));
      }
      return json;
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, estado, clienteId, tipo, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [debouncedQ, estado, clienteId, tipo]);

  const totalPages = data?.totalPages || 1;

  const refresh = useCallback(async () => {
    const json = await load();
    if (!selected) return;
    const updated = json?.items?.find((it: any) => it.id === selected.id);
    if (updated) {
      setSelected(updated as InventarioEquipoDTO);
    } else {
      setSelected(null);
    }
  }, [load, selected]);

  return (
    <div className="space-y-5">
      {/* Header canónico */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h1 className="text-2xl font-black text-slate-900 font-display">Inventario de Equipos</h1>
        <p className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
          Vista consolidada de equipos, modelos, series, estado e historial de servicio
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Boxes size={14} className="text-slate-400" /></div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Total Equipos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{data?.kpis.total ?? '–'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center"><ShieldCheck size={14} className="text-emerald-500" /></div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Operativos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {data ? `${data.kpis.operativos} ` : '–'}
            {data ? <span className="text-xs text-slate-400">· {data.kpis.operativosPct}%</span> : null}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center"><Wrench size={14} className="text-amber-500" /></div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">En Obs. / Repar.</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{data?.kpis.enMantenimiento ?? '–'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><CalendarClock size={14} className="text-blue-500" /></div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Próximas Visitas</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{data?.kpis.proximasVisitas ?? '–'}</div>
        </div>
      </div>

      {/* Tabla + toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por código, serie, marca o modelo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-[10px] font-bold font-mono overflow-x-auto">
              <button
                onClick={() => setEstado('')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${estado === '' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-white'}`}
              >Todos</button>
              {ESTADOS_EQUIPO.slice(0, 3).map(e => (
                <button
                  key={e}
                  onClick={() => setEstado(prev => prev === e ? '' : e)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${estado === e ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-white'}`}
                >{e}</button>
              ))}
            </div>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Empresa: Todas</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>)}
            </select>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Tipo: Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 text-xs font-mono text-rose-600 bg-rose-50 border-b border-rose-100">
            Error: {error}
          </div>
        )}

        {loading && !data && (
          <div className="py-16 text-center text-xs font-mono text-slate-400">
            Cargando inventario...
          </div>
        )}

        {!loading && data && data.total === 0 && (
          <div className="py-16 px-6 text-center">
            <Boxes size={64} className="text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700 font-display mt-4">Aún no hay equipos registrados</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">Cuando registres tu primer equipo con contrato, aparecerá aquí.</p>
          </div>
        )}

        {!loading && data && data.total > 0 && (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-[10px] font-black font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Marca</th>
                <th className="text-left px-4 py-3">Modelo</th>
                <th className="text-left px-4 py-3">Serie</th>
                <th className="text-left px-4 py-3">Voltaje Últ. Info.</th>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Informes</th>
                <th className="text-right px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map(eq => (
                <tr key={eq.id} className="hover:bg-slate-50/60 cursor-pointer">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{eq.codigo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{eq.marca || '–'}</td>
                  <td className="px-4 py-3 text-slate-600">{eq.modelo || '–'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{eq.serie || 'S/D'}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {eq.ultimoInforme ? `${eq.ultimoInforme.voltajeEntrada}V` : '–'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{eq.empresa?.razonSocial || '–'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center font-mono font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${estadoBadgeColor(eq.estado)}`}>
                      {eq.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{eq.countInformes}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(eq)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Ver detalle e histórico"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && data && data.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Mostrando {Math.min(pageSize, data.total)} de {data.total}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-300 flex items-center gap-1"
              ><ChevronLeft size={12} /> Anterior</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-300 flex items-center gap-1"
              >Siguiente <ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <InventarioEquipoDrawer
          equipo={selected}
          currentUser={currentUser}
          onClose={() => setSelected(null)}
          onChanged={() => refresh()}
        />
      )}
      {data && (
        <p className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">
          Panel: {page} / {totalPages}
        </p>
      )}
    </div>
  );
}