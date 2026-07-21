import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Users, Trash2, Calendar, Clock, Cpu, AlertTriangle } from 'lucide-react';
import { OrdenTrabajoLinea, OT, User, OTStatus, Equipo, Client } from '../../types';
import { checkTechnicianConflicts } from '../../utils/conflictChecker';

interface ModalAsignarTecnicoProps {
  linea: OrdenTrabajoLinea;
  ots: OT[];
  users: User[];
  clients: Client[];
  onUpdateOT: (ot: OT) => void;
  onClose: () => void;
  initialValues?: {
    techId?: string;
    fecha?: string;
    hora?: string;
  };
}

export default function ModalAsignarTecnico({
  linea,
  ots,
  users,
  clients,
  onUpdateOT,
  onClose,
  initialValues
}: ModalAsignarTecnicoProps) {
  const matchingOt = ots.find(o => o.otFinancieraId === linea.id || o.id === `OT-${linea.ot}` || String(o.id).replace('OT-', '') === String(linea.ot));
  
  const technicians = users.filter(u => u.role === 'Tecnico');
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [additionalTechIds, setAdditionalTechIds] = useState<string[]>(matchingOt?.tecnicosAdicionalesIds || []);
  
  // Single-fallback values if there are no equipments
  const [fallbackTechId, setFallbackTechId] = useState<string>(initialValues?.techId || matchingOt?.tecnicoTitularId || '');
  const [fallbackFecha, setFallbackFecha] = useState<string>(initialValues?.fecha || matchingOt?.fechaProgramada || todayStr);
  const [fallbackHora, setFallbackHora] = useState<string>(initialValues?.hora || matchingOt?.horaProgramada || '09:00');
  const [fallbackHoraFin, setFallbackHoraFin] = useState<string>(matchingOt?.horaFinProgramada || '10:00');

  // Per-equipment assignments state
  const [assignmentsState, setAssignmentsState] = useState<Record<string, {
    tecnicoId: string;
    tecnicoApoyoId: string;
    fechaProgramada: string;
    horaInicioProgramada: string;
    horaFinProgramada: string;
  }>>({});

  const otEquipoIds = useMemo(() => {
    return matchingOt?.equipoId
      ? matchingOt.equipoId.split(',').map(x => x.trim()).filter(Boolean)
      : [];
  }, [matchingOt?.equipoId]);

  // Fetch client equipments
  useEffect(() => {
    if (matchingOt?.clientId) {
      fetch(`/api/clients/${matchingOt.clientId}/equipos`)
        .then(res => res.json())
        .then(data => setEquipos(data))
        .catch(err => console.error("Error fetching client equipments:", err));
    }
  }, [matchingOt?.clientId]);

  // Fetch existing assignments for this OT
  useEffect(() => {
    if (matchingOt?.id) {
      fetch(`/api/ot-equipo-asignaciones?otId=${matchingOt.id}`)
        .then(res => res.json())
        .then(data => setAsignaciones(data))
        .catch(err => console.error("Error fetching assignments:", err));
    }
  }, [matchingOt?.id]);

  // Initialize assignments state
  useEffect(() => {
    const initialState: Record<string, {
      tecnicoId: string;
      tecnicoApoyoId: string;
      fechaProgramada: string;
      horaInicioProgramada: string;
      horaFinProgramada: string;
    }> = {};

    asignaciones.forEach(asg => {
      initialState[asg.equipoId] = {
        tecnicoId: asg.tecnicoTitularId || '',
        tecnicoApoyoId: asg.tecnicoApoyoId || '',
        fechaProgramada: asg.fecha || todayStr,
        horaInicioProgramada: asg.hora || '09:00',
        horaFinProgramada: asg.horaFin || '10:00'
      };
    });

    otEquipoIds.forEach(eqId => {
      if (!initialState[eqId]) {
        initialState[eqId] = {
          tecnicoId: matchingOt?.tecnicoTitularId || '',
          tecnicoApoyoId: '',
          fechaProgramada: matchingOt?.fechaProgramada || todayStr,
          horaInicioProgramada: matchingOt?.horaProgramada || '09:00',
          horaFinProgramada: matchingOt?.horaFinProgramada || '10:00'
        };
      }
    });

    setAssignmentsState(initialState);
  }, [asignaciones, otEquipoIds, matchingOt, todayStr]);

  const conflicts = useMemo(() => {
    const list: Array<{ type: string; message: string; techName: string }> = [];
    if (!matchingOt) return list;

    const clientId = matchingOt.clientId;

    // Check fallback titular
    if (fallbackTechId) {
      const alerts = checkTechnicianConflicts(
        fallbackTechId,
        fallbackFecha,
        fallbackHora,
        fallbackHoraFin,
        matchingOt.id,
        ots,
        clients,
        clientId
      );
      list.push(...alerts.map(a => ({ ...a, techName: technicians.find(t => t.id === fallbackTechId)?.username || 'Titular' })));
    }

    // Check additional techs (if any)
    additionalTechIds.forEach(id => {
      const alerts = checkTechnicianConflicts(
        id,
        fallbackFecha,
        fallbackHora,
        fallbackHoraFin,
        matchingOt.id,
        ots,
        clients,
        clientId
      );
      list.push(...alerts.map(a => ({ ...a, techName: technicians.find(t => t.id === id)?.username || 'Adicional' })));
    });

    // Check per-equipment assignments (if any)
    Object.entries(assignmentsState).forEach(([eqId, state]) => {
      if (state.tecnicoId) {
        const alerts = checkTechnicianConflicts(
          state.tecnicoId,
          state.fechaProgramada,
          state.horaInicioProgramada,
          state.horaFinProgramada,
          matchingOt.id,
          ots,
          clients,
          clientId
        );
        const eqCode = equipos.find(e => e.id === eqId)?.codigo || eqId;
        list.push(...alerts.map(a => ({ ...a, techName: `${technicians.find(t => t.id === state.tecnicoId)?.username || 'Titular'} (${eqCode})` })));
      }
      if (state.tecnicoApoyoId) {
        const alerts = checkTechnicianConflicts(
          state.tecnicoApoyoId,
          state.fechaProgramada,
          state.horaInicioProgramada,
          state.horaFinProgramada,
          matchingOt.id,
          ots,
          clients,
          clientId
        );
        const eqCode = equipos.find(e => e.id === eqId)?.codigo || eqId;
        list.push(...alerts.map(a => ({ ...a, techName: `${technicians.find(t => t.id === state.tecnicoApoyoId)?.username || 'Apoyo'} (${eqCode})` })));
      }
    });

    return list;
  }, [matchingOt, fallbackTechId, fallbackFecha, fallbackHora, fallbackHoraFin, additionalTechIds, assignmentsState, ots, clients, technicians, equipos]);

  const handleSave = async () => {
    if (!matchingOt) {
      alert("No se encontró una OT técnica vinculada a esta línea financiera.");
      return;
    }

    const additionalTechs = technicians.filter(t => additionalTechIds.includes(t.id));

    try {
      if (otEquipoIds.length > 0) {
        // Save assignments per equipment
        const savePromises = otEquipoIds.map(eqId => {
          const state = assignmentsState[eqId] || {
            tecnicoId: '',
            tecnicoApoyoId: '',
            fechaProgramada: todayStr,
            horaInicioProgramada: '09:00',
            horaFinProgramada: '10:00'
          };
          return fetch('/api/ot-equipo-asignaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              otId: matchingOt.id,
              equipoId: eqId,
              tecnicoTitularId: state.tecnicoId || null,
              tecnicoTitular: state.tecnicoId ? (technicians.find(t => t.id === state.tecnicoId)?.username || null) : null,
              tecnicoApoyoId: state.tecnicoApoyoId || null,
              tecnicoApoyo: state.tecnicoApoyoId ? (technicians.find(t => t.id === state.tecnicoApoyoId)?.username || null) : null,
              fecha: state.fechaProgramada,
              hora: state.horaInicioProgramada,
              horaFin: state.horaFinProgramada
            })
          });
        });

        await Promise.all(savePromises);

        // Update the primary OT object with the first equipment's details for backward compatibility
        const firstEqId = otEquipoIds[0];
        const firstState = firstEqId ? assignmentsState[firstEqId] : null;
        const primaryTech = technicians.find(t => t.id === firstState?.tecnicoId);

        const updatedOt: OT = {
          ...matchingOt,
          tecnicoTitularId: firstState?.tecnicoId || undefined,
          tecnicoTitular: primaryTech?.username || matchingOt.tecnicoTitular,
          tecnicosAdicionalesIds: additionalTechIds,
          tecnicosAdicionalesNombres: additionalTechs.map(t => t.username),
          fechaProgramada: firstState?.fechaProgramada || matchingOt.fechaProgramada,
          horaProgramada: firstState?.horaInicioProgramada || matchingOt.horaProgramada,
          horaFinProgramada: firstState?.horaFinProgramada || matchingOt.horaFinProgramada,
          estado: OTStatus.PROGRAMADA
        };

        onUpdateOT(updatedOt);
        alert("✅ Asignaciones y programaciones de equipos guardadas con éxito.");
      } else {
        // Fallback: single assignment at OT level
        const primaryTech = technicians.find(t => t.id === fallbackTechId);
        const updatedOt: OT = {
          ...matchingOt,
          tecnicoTitularId: fallbackTechId || undefined,
          tecnicoTitular: primaryTech?.username || matchingOt.tecnicoTitular,
          tecnicosAdicionalesIds: additionalTechIds,
          tecnicosAdicionalesNombres: additionalTechs.map(t => t.username),
          fechaProgramada: fallbackFecha,
          horaProgramada: fallbackHora,
          horaFinProgramada: fallbackHoraFin,
          estado: matchingOt.estado === OTStatus.CREADA || matchingOt.estado === OTStatus.PENDIENTE_PROGRAMACION 
            ? OTStatus.ASIGNADA 
            : matchingOt.estado
        };

        onUpdateOT(updatedOt);
        alert("✅ Asignación general de OT guardada con éxito.");
      }
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Hubo un error al guardar las asignaciones.");
    }
  };

  const addAdditionalTech = (id: string) => {
    if (id && !additionalTechIds.includes(id) && !Object.values(assignmentsState).some(s => s.tecnicoId === id || s.tecnicoApoyoId === id) && id !== fallbackTechId) {
      setAdditionalTechIds([...additionalTechIds, id]);
    }
  };

  const removeAdditionalTech = (id: string) => {
    setAdditionalTechIds(additionalTechIds.filter(tid => tid !== id));
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <UserPlus size={16} className="text-[#00B594]" />
            Programar OT {linea.ot}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!matchingOt && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-amber-700 text-xs">
              <Users size={14} className="shrink-0 mt-0.5" />
              <p>Esta cuota no tiene una OT técnica vinculada. La asignación se aplicará cuando se sincronice la operación.</p>
            </div>
          )}

          {matchingOt && otEquipoIds.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-wide text-slate-500 font-mono flex items-center gap-1.5 border-b pb-1.5">
                <Cpu size={12} className="text-[#00B594]" />
                Asignación y Programación por Equipo ({otEquipoIds.length})
              </h4>

              <div className="space-y-4">
                {otEquipoIds.map(eqId => {
                  const equipo = equipos.find(e => e.id === eqId);
                  const state = assignmentsState[eqId] || {
                    tecnicoId: '',
                    tecnicoApoyoId: '',
                    fechaProgramada: todayStr,
                    horaInicioProgramada: '09:00',
                    horaFinProgramada: '10:00'
                  };

                  return (
                    <div key={eqId} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 hover:border-[#00B594]/45 transition-colors">
                      <div className="flex justify-between items-start border-b border-slate-150 pb-2">
                        <div>
                          <span className="text-xs font-black text-slate-800">
                            {equipo ? `${equipo.codigo} - ${equipo.tipo}` : `Equipo ID: ${eqId}`}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {equipo ? `Marca: ${equipo.marca || '-'} | Modelo: ${equipo.modelo || '-'} | Ubicac.: ${equipo.ubicacion || '-'}` : ''}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-200 text-slate-650 rounded-full font-bold uppercase">
                          {equipo?.especificaciones?.potenciaKva || equipo?.potenciaKva || '-'} KVA
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block font-mono">Técnico Titular (Líder)</label>
                          <select
                            value={state.tecnicoId}
                            onChange={(e) => setAssignmentsState({
                              ...assignmentsState,
                              [eqId]: { ...state, tecnicoId: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800"
                          >
                            <option value="">Seleccionar técnico...</option>
                            {technicians.map(t => (
                              <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block font-mono">Técnico de Apoyo</label>
                          <select
                            value={state.tecnicoApoyoId}
                            onChange={(e) => setAssignmentsState({
                              ...assignmentsState,
                              [eqId]: { ...state, tecnicoApoyoId: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800"
                          >
                            <option value="">Sin apoyo...</option>
                            {technicians
                              .filter(t => t.id !== state.tecnicoId)
                              .map(t => (
                              <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-0.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block font-mono">Fecha</label>
                          <input
                            type="date"
                            value={state.fechaProgramada}
                            onChange={(e) => setAssignmentsState({
                              ...assignmentsState,
                              [eqId]: { ...state, fechaProgramada: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block font-mono flex items-center gap-1">
                            <Clock size={10} /> Hora Inicio
                          </label>
                          <input
                            type="time"
                            value={state.horaInicioProgramada}
                            onChange={(e) => setAssignmentsState({
                              ...assignmentsState,
                              [eqId]: { ...state, horaInicioProgramada: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1 px-3 text-xs text-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-0.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block font-mono flex items-center gap-1">
                            <Clock size={10} /> Hora Fin
                          </label>
                          <input
                            type="time"
                            value={state.horaFinProgramada}
                            onChange={(e) => setAssignmentsState({
                              ...assignmentsState,
                              [eqId]: { ...state, horaFinProgramada: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1 px-3 text-xs text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Fallback UI: scheduling at OT level
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Técnico Titular (Líder)</label>
                <select
                  value={fallbackTechId}
                  onChange={(e) => setFallbackTechId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                >
                  <option value="">Seleccione técnico titular...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 font-mono">
                  <Calendar size={12} className="text-[#00B594]" />
                  Programación del Servicio
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Servicio</label>
                  <input
                    type="date"
                    value={fallbackFecha}
                    onChange={(e) => setFallbackFecha(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono flex items-center gap-1">
                      <Clock size={10} /> Inicio
                    </label>
                    <input
                      type="time"
                      value={fallbackHora}
                      onChange={(e) => setFallbackHora(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono flex items-center gap-1">
                      <Clock size={10} /> Fin
                    </label>
                    <input
                      type="time"
                      value={fallbackHoraFin}
                      onChange={(e) => setFallbackHoraFin(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Técnicos de Apoyo (Apply to the overall OT) */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Técnicos de Apoyo / Auxiliares para la OT</label>
            
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  addAdditionalTech(e.target.value);
                  e.target.value = '';
                }}
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
              >
                <option value="">Agregar técnico de apoyo...</option>
                {technicians
                  .filter(t => t.id !== fallbackTechId && !additionalTechIds.includes(t.id) && !Object.values(assignmentsState).some(s => s.tecnicoId === t.id || s.tecnicoApoyoId === t.id))
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))
                }
              </select>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {additionalTechIds.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic font-mono">No hay técnicos adicionales asignados.</p>
              ) : (
                additionalTechIds.map(id => {
                  const tech = technicians.find(t => t.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-700">{tech?.username}</span>
                      <button 
                        onClick={() => removeAdditionalTech(id)}
                        className="text-slate-450 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conflict Warnings Box */}
          {conflicts.length > 0 && (
            <div className="mx-6 mb-4 bg-amber-50 border border-amber-250/80 rounded-xl p-3.5 space-y-2 select-none text-left">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-[11px] uppercase tracking-wide">
                <AlertTriangle size={14} className="shrink-0 text-amber-600 animate-bounce" />
                <span>Advertencias de Asignación (Recomendador S.L.A)</span>
              </div>
              <div className="space-y-1.5 pl-5">
                {conflicts.map((c, idx) => (
                  <p key={idx} className="text-xs text-amber-700 leading-normal">
                    <span className="font-bold font-mono">[{c.techName}]:</span> {c.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 p-6 border-t border-slate-150 shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-md hover:shadow-lg transition-all"
          >
            Guardar Programación
          </button>
        </div>
      </div>
    </div>
  );
}
