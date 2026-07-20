import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Wrench, Plus, Trash2, Cpu } from 'lucide-react';
import { User, OT, OTStatus, ServiceType, EquipmentType, Equipo } from '../../types';

interface ModalProgramarVisitaProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  adenda: any | null;
  ots: OT[];
  users: User[];
  onSave: (newOT: OT) => Promise<void>;
}

export default function ModalProgramarVisita({
  isOpen,
  onClose,
  contract,
  adenda,
  ots,
  users,
  onSave
}: ModalProgramarVisitaProps) {
  const technicians = useMemo(() => users.filter(u => u.role === 'Tecnico' && u.estado === 'Activo'), [users]);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Equipments list resolution
  const equipments: Equipo[] = useMemo(() => {
    if (adenda) {
      // Resolve from adenda.equiposAdenda
      return adenda.equiposAdenda
        ? adenda.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean)
        : [];
    }
    // Resolve from contract.equipos
    return contract.equipos || [];
  }, [contract, adenda]);

  // Form states
  const [selectedEquips, setSelectedEquips] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(todayStr);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [primaryTechId, setPrimaryTechId] = useState('');
  const [supportTechId, setSupportTechId] = useState('');
  const [additionalTechIds, setAdditionalTechIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate suggested OT code
  const suggestedOtCode = useMemo(() => {
    const contractNum = contract.n_contrato || contract.id.replace('cont_', '');
    
    // Count OTs matching this contract/adenda
    const count = ots.filter(o => 
      o.contratoId === contract.id && 
      (!adenda ? !o.adendaId : o.adendaId === adenda.id)
    ).length;
    const nextSeq = count + 1;

    if (adenda) {
      const adendaCode = adenda.codigo || adenda.id.replace('ad_', '');
      return `OT-${contractNum}-${adendaCode}-${nextSeq}`;
    }
    return `OT-${contractNum}-${nextSeq}`;
  }, [contract, adenda, ots]);

  const [otCode, setOtCode] = useState(suggestedOtCode);

  useEffect(() => {
    setOtCode(suggestedOtCode);
  }, [suggestedOtCode]);

  // Select all equipments by default
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    equipments.forEach(eq => {
      initial[eq.id] = true;
    });
    setSelectedEquips(initial);
  }, [equipments]);

  if (!isOpen) return null;

  const handleToggleEquip = (id: string) => {
    setSelectedEquips(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddAdditionalTech = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id && !additionalTechIds.includes(id)) {
      setAdditionalTechIds(prev => [...prev, id]);
    }
    e.target.value = '';
  };

  const handleRemoveAdditionalTech = (id: string) => {
    setAdditionalTechIds(prev => prev.filter(x => x !== id));
  };

  const activeSelectedEquips = equipments.filter(eq => selectedEquips[eq.id]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeSelectedEquips.length === 0) {
      alert("⚠️ Debes seleccionar al menos un equipo para programar la visita.");
      return;
    }
    if (!primaryTechId) {
      alert("⚠️ Debes asignar un Técnico Titular.");
      return;
    }
    if (!fecha) {
      alert("⚠️ Por favor selecciona una fecha para la visita.");
      return;
    }

    setIsSaving(true);
    try {
      const primaryTech = technicians.find(t => t.id === primaryTechId);
      const supportTech = technicians.find(t => t.id === supportTechId);
      const additionalTechs = additionalTechIds.map(id => technicians.find(t => t.id === id)).filter(Boolean) as User[];

      const serviceType = contract.tipo_contrato?.toLowerCase().includes('correctivo') 
        ? ServiceType.CORRECTIVO 
        : ServiceType.PREVENTIVO;

      // 1. Create main OT
      const newOT: OT = {
        id: otCode.trim(),
        clientId: contract.clientId || '',
        tipoMantenimiento: serviceType,
        tipoEquipo: activeSelectedEquips[0]?.tipo as EquipmentType || EquipmentType.UPS,
        potenciaKva: activeSelectedEquips[0]?.potenciaKva || 0,
        equipoId: activeSelectedEquips.map(e => e.id).join(', '),
        fechaProgramada: fecha,
        horaProgramada: horaInicio,
        horaFinProgramada: horaFin,
        tecnicoTitularId: primaryTechId,
        tecnicoTitular: primaryTech?.username || '',
        tecnicoApoyoId: supportTechId || undefined,
        tecnicoApoyo: supportTech?.username || undefined,
        tecnicosAdicionalesIds: additionalTechIds.length > 0 ? additionalTechIds : undefined,
        tecnicosAdicionalesNombres: additionalTechs.length > 0 ? additionalTechs.map(t => t.username) : undefined,
        estado: OTStatus.PROGRAMADA,
        origen: 'Contrato',
        contratoId: contract.id,
        adendaId: adenda?.id || undefined
      };

      // 2. Call save callback (App.tsx handleAddOT)
      await onSave(newOT);

      // 3. Save equipment assignments in backend
      const assignmentPromises = activeSelectedEquips.map(eq => {
        return fetch('/api/ot-equipo-asignaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            otId: newOT.id,
            equipoId: eq.id,
            tecnicoTitularId: primaryTechId || null,
            tecnicoTitular: primaryTech?.username || null,
            tecnicoApoyoId: supportTechId || null,
            tecnicoApoyo: supportTech?.username || null,
            fecha: fecha,
            hora: horaInicio,
            horaFin: horaFin
          })
        });
      });

      await Promise.all(assignmentPromises);

      alert("✅ Visita programada y técnicos asignados correctamente.");
      onClose();
    } catch (err: any) {
      console.error("Error al programar visita:", err);
      alert("❌ Ocurrió un error al guardar la programación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-[#00B594]" />
              Programar Visita Técnica
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {contract.cliente} — {adenda ? `Adenda ${adenda.codigo}` : 'Contrato Principal'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
          {/* OT Code, Date and Time Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Código de Orden de Trabajo (OT)
              </label>
              <input
                type="text"
                required
                value={otCode}
                onChange={e => setOtCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Fecha Programada
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={fecha}
                  min={todayStr}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Hora de Inicio
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Hora de Fin
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={e => setHoraFin(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Equipments Checklist */}
          <div>
            <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-2">
              Equipos a incluir en la Visita ({activeSelectedEquips.length} de {equipments.length})
            </label>
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
              {equipments.map(eq => (
                <div 
                  key={eq.id}
                  onClick={() => handleToggleEquip(eq.id)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/30 cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedEquips[eq.id]}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-700 block">{eq.codigo}</span>
                    <span className="text-[10px] text-slate-500 font-sans block truncate">
                      {eq.tipo} · {eq.marca} {eq.modelo} ({eq.serie})
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono shrink-0">
                    {eq.potenciaKva} kVA
                  </span>
                </div>
              ))}
              {equipments.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No hay equipos configurados en este contrato o adenda.
                </div>
              )}
            </div>
          </div>

          {/* Technician Assignment */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Wrench size={14} className="text-[#00B594]" />
              <span>Asignación de Personal de Campo</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                  Técnico Titular (Líder)
                </label>
                <select
                  required
                  value={primaryTechId}
                  onChange={e => {
                    setPrimaryTechId(e.target.value);
                    if (e.target.value === supportTechId) setSupportTechId('');
                    setAdditionalTechIds(prev => prev.filter(x => x !== e.target.value));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="">-- Seleccionar Técnico Titular --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                  Técnico de Apoyo (Opcional)
                </label>
                <select
                  value={supportTechId}
                  onChange={e => {
                    setSupportTechId(e.target.value);
                    setAdditionalTechIds(prev => prev.filter(x => x !== e.target.value));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="">-- Sin Técnico de Apoyo --</option>
                  {technicians.filter(t => t.id !== primaryTechId).map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Technicians */}
            <div>
              <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Técnicos Adicionales (Soporte Multi-Técnico)
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  onChange={handleAddAdditionalTech}
                  value=""
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="">+ Añadir Técnico Adicional</option>
                  {technicians
                    .filter(t => t.id !== primaryTechId && t.id !== supportTechId && !additionalTechIds.includes(t.id))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.username}</option>
                    ))
                  }
                </select>
                
                {additionalTechIds.map(id => {
                  const tech = technicians.find(t => t.id === id);
                  return (
                    <div key={id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full pl-3 pr-1 py-1 text-emerald-700 font-mono text-[10px]">
                      <span>{tech?.username}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalTech(id)}
                        className="p-0.5 rounded-full hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase font-mono tracking-wider hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {isSaving ? 'Guardando...' : 'Programar Visita'}
          </button>
        </div>

      </div>
    </div>
  );
}
