import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Wrench, Plus, Trash2, Cpu, Check, ArrowRight, ArrowLeft } from 'lucide-react';
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

  // Wizard active step (1 to 5)
  const [step, setStep] = useState(1);

  // 1. Equipments list resolution
  const equipments: Equipo[] = useMemo(() => {
    if (adenda) {
      return adenda.equiposAdenda
        ? adenda.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean)
        : [];
    }
    return contract.equipos || [];
  }, [contract, adenda]);

  // Form states
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.PREVENTIVO);
  const [selectedEquips, setSelectedEquips] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(todayStr);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [primaryTechId, setPrimaryTechId] = useState('');
  const [supportTechId, setSupportTechId] = useState('');
  const [additionalTechIds, setAdditionalTechIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize service type based on contract details
  useEffect(() => {
    if (contract?.tipo_contrato?.toLowerCase().includes('correctivo')) {
      setServiceType(ServiceType.CORRECTIVO);
    } else {
      setServiceType(ServiceType.PREVENTIVO);
    }
  }, [contract]);

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

  // Compute next OTs codes to be created
  const otsPreview = useMemo(() => {
    const contractNum = contract.n_contrato || contract.id.replace('cont_', '');
    const count = ots.filter(o => 
      o.contratoId === contract.id && 
      (!adenda ? !o.adendaId : o.adendaId === adenda.id)
    ).length;
    const nextSeq = count + 1;

    return activeSelectedEquips.map((eq, index) => {
      const eqSeq = nextSeq + index;
      let code = '';
      if (adenda) {
        const adendaCode = adenda.codigo || adenda.id.replace('ad_', '');
        code = `OT-${contractNum}-${adendaCode}-${eqSeq}`;
      } else {
        code = `OT-${contractNum}-${eqSeq}`;
      }
      return { code, eq };
    });
  }, [contract, adenda, ots, activeSelectedEquips]);

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeSelectedEquips.length === 0) {
      alert("⚠️ Debes seleccionar al menos un equipo para programar el servicio.");
      setStep(2);
      return;
    }
    if (!primaryTechId) {
      alert("⚠️ Debes asignar un Técnico Titular.");
      setStep(4);
      return;
    }
    if (!fecha) {
      alert("⚠️ Por favor selecciona una fecha para la visita.");
      setStep(3);
      return;
    }

    setIsSaving(true);
    try {
      const primaryTech = technicians.find(t => t.id === primaryTechId);
      const supportTech = technicians.find(t => t.id === supportTechId);
      const additionalTechs = additionalTechIds.map(id => technicians.find(t => t.id === id)).filter(Boolean) as User[];

      const contractNum = contract.n_contrato || contract.id.replace('cont_', '');
      const count = ots.filter(o => 
        o.contratoId === contract.id && 
        (!adenda ? !o.adendaId : o.adendaId === adenda.id)
      ).length;
      const nextSeq = count + 1;

      // 1. Create N OTs (one per selected equipment)
      for (let i = 0; i < activeSelectedEquips.length; i++) {
        const eq = activeSelectedEquips[i];
        const eqSeq = nextSeq + i;
        
        let eqOtCode = '';
        if (adenda) {
          const adendaCode = adenda.codigo || adenda.id.replace('ad_', '');
          eqOtCode = `OT-${contractNum}-${adendaCode}-${eqSeq}`;
        } else {
          eqOtCode = `OT-${contractNum}-${eqSeq}`;
        }

        const newOT: OT = {
          id: eqOtCode,
          clientId: contract.clientId || '',
          tipoMantenimiento: serviceType,
          tipoEquipo: eq.tipo as EquipmentType || EquipmentType.UPS,
          potenciaKva: eq.potenciaKva || 0,
          equipoId: eq.id, // Exactly ONE equipment per OT
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

        // Save OT in Database
        await onSave(newOT);

        // Save equipment assignment in Database
        await fetch('/api/ot-equipo-asignaciones', {
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
      }

      alert(`✅ Servicio programado correctamente. Se crearon ${activeSelectedEquips.length} OTs de forma individual.`);
      onClose();
    } catch (err: any) {
      console.error("Error al programar visitas del servicio:", err);
      alert("❌ Ocurrió un error al guardar la programación.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 2 && activeSelectedEquips.length === 0) {
      alert("⚠️ Selecciona al menos un equipo antes de continuar.");
      return;
    }
    if (step === 3 && !fecha) {
      alert("⚠️ Debes indicar la fecha del servicio.");
      return;
    }
    if (step === 4 && !primaryTechId) {
      alert("⚠️ Asigna un Técnico Titular antes de continuar.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Stepper Wizard Progress Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Wrench size={16} className="text-[#00B594]" />
                Programación de Servicio Técnico
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {contract.cliente} — {adenda ? `Adenda ${adenda.codigo}` : 'Contrato Principal'}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
              <X size={18} />
            </button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    step === s 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : step > s 
                        ? 'bg-emerald-100 text-emerald-700 font-bold' 
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step > s ? <Check size={10} className="stroke-[3]" /> : s}
                  </span>
                  <span className={`text-[10px] font-bold hidden sm:inline ${
                    step === s ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {s === 1 && "Tipo"}
                    {s === 2 && "Equipos"}
                    {s === 3 && "Programación"}
                    {s === 4 && "Técnicos"}
                    {s === 5 && "Resumen"}
                  </span>
                </div>
                {s < 5 && <div className={`flex-1 h-0.5 border-t-2 ${step > s ? 'border-emerald-300' : 'border-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wizard step views */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          
          {/* STEP 1: TIPO DE SERVICIO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wide">Paso 1: Tipo de Servicio</h4>
              <p className="text-xs text-slate-500">Define el tipo de intervención que realizarás sobre los equipos del cliente.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceType(ServiceType.PREVENTIVO)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    serviceType === ServiceType.PREVENTIVO
                      ? 'border-teal-500 bg-teal-50/10 shadow-md shadow-teal-500/5'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${serviceType === ServiceType.PREVENTIVO ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Wrench size={16} />
                    </div>
                    <strong className="text-sm text-slate-800">Preventivo</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mantenimiento programado por contrato. Inspección, limpieza, mediciones eléctricas y calibración de celdas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType(ServiceType.CORRECTIVO)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    serviceType === ServiceType.CORRECTIVO
                      ? 'border-amber-500 bg-amber-50/10 shadow-md shadow-amber-500/5'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${serviceType === ServiceType.CORRECTIVO ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Cpu size={16} />
                    </div>
                    <strong className="text-sm text-slate-800">Correctivo / Emergencia</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Atención técnica correctiva ante fallas operativas reportadas, alarmas críticas activas o reparaciones de emergencia.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECCIÓN DE EQUIPOS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wide">Paso 2: Selección de Equipos</h4>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Seleccionados: {activeSelectedEquips.length} de {equipments.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Marca las máquinas a las que se les creará la OT técnica de forma individual.</p>

              <div className="border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {equipments.map(eq => (
                  <div 
                    key={eq.id}
                    onClick={() => handleToggleEquip(eq.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/30 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedEquips[eq.id]}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-800 block">{eq.codigo}</span>
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
                  <div className="p-8 text-center text-xs text-slate-400 italic bg-white">
                    No hay equipos configurados en este contrato o adenda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PROGRAMACIÓN */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wide">Paso 3: Fecha y Horario</h4>
              <p className="text-xs text-slate-500">Determina el día y el rango de horas para el inicio del servicio.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                    Hora Estimada de Fin
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
            </div>
          )}

          {/* STEP 4: ASIGNACIÓN DE PERSONAL */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wide">Paso 4: Asignación de Personal</h4>
              <p className="text-xs text-slate-500">Asigna los técnicos encargados de asistir y elaborar el informe.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
              <div className="pt-2">
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
          )}

          {/* STEP 5: RESUMEN Y GENERACIÓN */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wide">Paso 5: Resumen y Generación</h4>
              <p className="text-xs text-slate-500">Confirma los detalles del servicio. Al guardar se generará una OT por cada equipo.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                <div>
                  <span className="text-slate-400 uppercase font-mono text-[9px] font-bold">Tipo de Servicio:</span>
                  <span className="text-slate-800 font-bold block">{serviceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-mono text-[9px] font-bold">Programación:</span>
                  <span className="text-slate-800 font-bold block">{fecha} de {horaInicio} a {horaFin}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-mono text-[9px] font-bold">Personal Asignado:</span>
                  <span className="text-slate-800 block">
                    Titular: <strong>{technicians.find(t => t.id === primaryTechId)?.username || 'No especificado'}</strong>
                    {supportTechId && <span className="text-slate-500"> · Apoyo: <strong>{technicians.find(t => t.id === supportTechId)?.username}</strong></span>}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-2">
                  Órdenes de Trabajo a generar ({otsPreview.length})
                </label>
                <div className="border border-slate-200 bg-white rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {otsPreview.map((preview, index) => (
                    <div key={index} className="flex justify-between items-center px-4 py-2.5 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mr-2">
                          {preview.code}
                        </span>
                        <span className="text-slate-500 font-sans">
                          {preview.eq.tipo} ({preview.eq.codigo})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{preview.eq.potenciaKva} kVA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs font-black uppercase font-mono tracking-wider hover:bg-slate-50 transition-colors flex items-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft size={14} />
                <span>Atrás</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-500 rounded-lg text-xs font-black uppercase font-mono tracking-wider hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
              >
                <span>Siguiente</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSaving}
                className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white rounded-lg text-xs font-black uppercase font-mono tracking-wider flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
              >
                {isSaving ? 'Guardando...' : 'Confirmar y Generar'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
