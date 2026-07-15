import React, { useState } from 'react';
import { X, UserPlus, Users, Trash2, Calendar, Clock } from 'lucide-react';
import { OrdenTrabajoLinea, OT, User, OTStatus } from '../../types';

interface ModalAsignarTecnicoProps {
  linea: OrdenTrabajoLinea;
  ots: OT[];
  users: User[];
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
  onUpdateOT,
  onClose,
  initialValues
}: ModalAsignarTecnicoProps) {
  const matchingOt = ots.find(o => o.otFinancieraId === linea.id || o.id === `OT-${linea.ot}` || String(o.id).replace('OT-', '') === String(linea.ot));
  
  const technicians = users.filter(u => u.role === 'Tecnico');
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [primaryTechId, setPrimaryTechId] = useState<string>(initialValues?.techId || matchingOt?.tecnicoTitularId || '');
  const [additionalTechIds, setAdditionalTechIds] = useState<string[]>(matchingOt?.tecnicosAdicionalesIds || []);
  
  // Nuevos estados para fecha y hora de programación
  const [fechaProg, setFechaProg] = useState<string>(initialValues?.fecha || matchingOt?.fechaProgramada || todayStr);
  const [horaProg, setHoraProg] = useState<string>(initialValues?.hora || matchingOt?.horaProgramada || '09:00');
  const [horaFinProg, setHoraFinProg] = useState<string>(matchingOt?.horaFinProgramada || (initialValues?.hora ? (parseInt(initialValues.hora.split(':')[0]) + 1).toString().padStart(2, '0') + ':' + initialValues.hora.split(':')[1] : '10:00'));

  const handleSave = () => {
    if (!matchingOt) {
      alert("No se encontró una OT técnica vinculada a esta línea financiera.");
      return;
    }

    const primaryTech = technicians.find(t => t.id === primaryTechId);
    const additionalTechs = technicians.filter(t => additionalTechIds.includes(t.id));

    const updatedOt: OT = {
      ...matchingOt,
      tecnicoTitularId: primaryTechId || undefined,
      tecnicoTitular: primaryTech?.username || matchingOt.tecnicoTitular,
      tecnicosAdicionalesIds: additionalTechIds,
      tecnicosAdicionalesNombres: additionalTechs.map(t => t.username),
      fechaProgramada: fechaProg,
      horaProgramada: horaProg,
      horaFinProgramada: horaFinProg,
      estado: matchingOt.estado === OTStatus.CREADA || matchingOt.estado === OTStatus.PENDIENTE_PROGRAMACION 
        ? OTStatus.ASIGNADA 
        : matchingOt.estado
    };

    onUpdateOT(updatedOt);
  };

  const addAdditionalTech = (id: string) => {
    if (id && !additionalTechIds.includes(id) && id !== primaryTechId) {
      setAdditionalTechIds([...additionalTechIds, id]);
    }
  };

  const removeAdditionalTech = (id: string) => {
    setAdditionalTechIds(additionalTechIds.filter(tid => tid !== id));
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <UserPlus size={16} className="text-[#00B594]" />
            Asignar Técnicos a OT {linea.ot}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!matchingOt && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-amber-700 text-xs">
              <Users size={14} className="shrink-0 mt-0.5" />
              <p>Esta cuota no tiene una OT técnica vinculada. La asignación se aplicará cuando se sincronice la operación.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Técnico Titular (Líder)</label>
            <select
              value={primaryTechId}
              onChange={(e) => setPrimaryTechId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
            >
              <option value="">Seleccione técnico titular...</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
              ))}
            </select>
          </div>

          {/* Fecha y Hora de Servicio */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 font-mono">
              <Calendar size={12} className="text-[#00B594]" />
              Programación del Servicio
            </h4>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Servicio</label>
              <input
                type="date"
                value={fechaProg}
                onChange={(e) => setFechaProg(e.target.value)}
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
                  value={horaProg}
                  onChange={(e) => setHoraProg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono flex items-center gap-1">
                  <Clock size={10} /> Fin
                </label>
                <input
                  type="time"
                  value={horaFinProg}
                  onChange={(e) => setHoraFinProg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block font-mono">Técnicos de Apoyo / Adicionales</label>
            
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
                  .filter(t => t.id !== primaryTechId && !additionalTechIds.includes(t.id))
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))
                }
              </select>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {additionalTechIds.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No hay técnicos adicionales asignados.</p>
              ) : (
                additionalTechIds.map(id => {
                  const tech = technicians.find(t => t.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-700">{tech?.username}</span>
                      <button 
                        onClick={() => removeAdditionalTech(id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-lg transition-all"
            >
              Guardar Asignación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
