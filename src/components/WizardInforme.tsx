import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { OT, Client, ServiceType, TechnicalReport, EquipmentType } from '../types';
import { getTemplate, getPhotoSlotsForTipo } from '../utils/serviceTemplates';
import { ALL_ACCIONES, generateDefaultReport, getTechnicalSvg, getPhotoSlotsForKva, DEFAULT_RECOMENDACIONES } from '../utils/reportDefaults';
import DocumentFormat from './DocumentFormat';
import { compressBase64Image } from '../utils/imageCompressor';

interface WizardInformeProps {
  ot: OT;
  client: Client;
  equipoId?: string;
  initialReport?: TechnicalReport;
  onComplete: (report: TechnicalReport) => void;
  onDraftChange?: (report: Partial<TechnicalReport>) => void;
  onCancel: () => void;
}

interface WizardStep {
  num: number;
  label: string;
}

const STEPS: WizardStep[] = [
  { num: 1, label: 'Tipo de Servicio' },
  { num: 2, label: 'Datos de Cabecera' },
  { num: 3, label: 'Antecedentes' },
  { num: 4, label: 'Acciones Realizadas' },
  { num: 5, label: 'Pasos del Procedimiento' },
  { num: 6, label: 'Características del Equipo' },
  { num: 7, label: 'Fotografías' },
  { num: 8, label: 'Mediciones Eléctricas' },
  { num: 9, label: 'Diagnóstico y Recomendaciones' },
  { num: 10, label: 'Revisión Final y Vista Previa PDF' },
];

export default function WizardInforme({ ot, client, equipoId, initialReport, onComplete, onDraftChange, onCancel }: WizardInformeProps) {
  const defaults = useMemo(() => {
    if (initialReport) return initialReport;
    return generateDefaultReport(ot, client);
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());

  const [tipoServicio, setTipoServicio] = useState<ServiceType>(defaults.tipoServicio ?? ot.tipoMantenimiento ?? ServiceType.PREVENTIVO);
  const [informeN, setInformeN] = useState(defaults.informeN || '');
  const [hojaServicioN, setHojaServicioN] = useState(defaults.hojaServicioN || '');
  const [fechaServicio, setFechaServicio] = useState(defaults.fechaServicio || new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState(defaults.horaInicio || '09:00');
  const [horaFin, setHoraFin] = useState(defaults.horaFin || '');
  const [tecnico1, setTecnico1] = useState(defaults.tecnico1 || ot.tecnicoTitular || '');
  const [tecnico2, setTecnico2] = useState(defaults.tecnico2 || ot.tecnicoApoyo || '');
  const [antecedentes, setAntecedentes] = useState(defaults.antecedentes || '');
  const [accionesRealizadas, setAccionesRealizadas] = useState<string[]>(defaults.accionesRealizadas ?? ALL_ACCIONES);
  const [pasosLista, setPasosLista] = useState<{ numero: number; descripcion: string }[]>(defaults.pasosLista ?? []);
  const [caracteristicas, setCaracteristicas] = useState<Record<string, string>>(defaults.caracteristicas ?? {});
  const [medicionesEntrada, setMedicionesEntrada] = useState(defaults.medicionesEntrada || { lnVoltaje: ['220','220','220'] as [string,string,string], lnIntensidad: ['0','0','0'] as [string,string,string], frecuencia: ['60.0','60.0','60.0'] as [string,string,string], llVoltaje: ['380','380','380'] as [string,string,string] });
  const [medicionesSalida, setMedicionesSalida] = useState(defaults.medicionesSalida || { lnVoltaje: ['220','220','220'] as [string,string,string], lnIntensidad: ['0','0','0'] as [string,string,string], frecuencia: ['60.0','60.0','60.0'] as [string,string,string], llVoltaje: ['380','380','380'] as [string,string,string] });
  const [diagnostico, setDiagnostico] = useState(defaults.observacionesDiagnostico || '');
  const [recomendaciones, setRecomendaciones] = useState<string[]>(defaults.recomendaciones ?? DEFAULT_RECOMENDACIONES);
  const [fotosLabeled, setFotosLabeled] = useState<{ slotName: string; base64: string; description?: string }[]>(defaults.fotosLabeled ?? []);
  const [panoramaFoto, setPanoramaFoto] = useState(defaults.panoramaFoto || '');
  const [observaciones, setObservaciones] = useState(defaults.comentariosAdicionales || '');

  const [photoPreviewStep, setPhotoPreviewStep] = useState<'capture' | 'label'>('capture');
  const [capturedPhotos, setCapturedPhotos] = useState<{ dataUrl: string; assigned: boolean }[]>([]);
  const [pdfPreviewPage, setPdfPreviewPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftMsg, setDraftMsg] = useState('');

  const DRAFT_KEY = `mafort_wizard_draft_${ot.id}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setCurrentStep(draft.currentStep || 1);
        setCompletedSteps(new Set(draft.completedSteps || []));
        setSkippedSteps(new Set(draft.skippedSteps || []));
        if (draft.tipoServicio) setTipoServicio(draft.tipoServicio);
        if (draft.informeN) setInformeN(draft.informeN);
        if (draft.hojaServicioN) setHojaServicioN(draft.hojaServicioN);
        if (draft.fechaServicio) setFechaServicio(draft.fechaServicio);
        if (draft.horaInicio) setHoraInicio(draft.horaInicio);
        if (draft.horaFin) setHoraFin(draft.horaFin);
        if (draft.tecnico1) setTecnico1(draft.tecnico1);
        if (draft.tecnico2) setTecnico2(draft.tecnico2);
        if (draft.antecedentes) setAntecedentes(draft.antecedentes);
        if (draft.accionesRealizadas) setAccionesRealizadas(draft.accionesRealizadas);
        if (draft.pasosLista) setPasosLista(draft.pasosLista);
        if (draft.caracteristicas) setCaracteristicas(draft.caracteristicas);
        if (draft.medicionesEntrada) setMedicionesEntrada(draft.medicionesEntrada);
        if (draft.medicionesSalida) setMedicionesSalida(draft.medicionesSalida);
        if (draft.diagnostico) setDiagnostico(draft.diagnostico);
        if (draft.recomendaciones) setRecomendaciones(draft.recomendaciones);
        if (draft.fotosLabeled) setFotosLabeled(draft.fotosLabeled);
        if (draft.panoramaFoto) setPanoramaFoto(draft.panoramaFoto);
        if (draft.observaciones) setObservaciones(draft.observaciones);
        if (draft.capturedPhotos) setCapturedPhotos(draft.capturedPhotos);
        setDraftMsg('Borrador restaurado correctamente');
      }
    } catch (e) {
      console.warn('Error loading wizard draft:', e);
    }
  }, []);

  const handleSaveDraft = useCallback(() => {
    try {
      const draft = {
        currentStep,
        completedSteps: [...completedSteps],
        skippedSteps: [...skippedSteps],
        tipoServicio,
        informeN, hojaServicioN, fechaServicio, horaInicio, horaFin,
        tecnico1, tecnico2, antecedentes, accionesRealizadas, pasosLista,
        caracteristicas, medicionesEntrada, medicionesSalida,
        diagnostico, recomendaciones, fotosLabeled, panoramaFoto, observaciones,
        photoPreviewStep, capturedPhotos,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftMsg('Borrador guardado');
      if (onDraftChange) {
        const partial: Partial<TechnicalReport> = { informeN, hojaServicioN, fechaServicio, horaInicio, horaFin, tecnico1, tecnico2, antecedentes, accionesRealizadas, pasosLista, caracteristicas, medicionesEntrada, medicionesSalida, observacionesDiagnostico: diagnostico, recomendaciones, fotosLabeled, panoramaFoto, comentariosAdicionales: observaciones };
        onDraftChange(partial);
      }
    } catch (e) {
      console.warn('Error saving wizard draft:', e);
      setDraftMsg('Error al guardar borrador');
    }
  }, [currentStep, completedSteps, skippedSteps, tipoServicio, informeN, hojaServicioN, fechaServicio, horaInicio, horaFin, tecnico1, tecnico2, antecedentes, accionesRealizadas, pasosLista, caracteristicas, medicionesEntrada, medicionesSalida, diagnostico, recomendaciones, fotosLabeled, panoramaFoto, observaciones, photoPreviewStep, capturedPhotos, onDraftChange]);

  const template = getTemplate(tipoServicio);
  const totalFotos = getPhotoSlotsForTipo(tipoServicio, ot.potenciaKva);

  useEffect(() => {
    if (pasosLista.length === 0) {
      setPasosLista(template.pasos.map((desc, i) => ({ numero: i + 1, descripcion: desc })));
    }
  }, [tipoServicio]);

  useEffect(() => {
    if (fotosLabeled.length !== totalFotos) {
      const slots = getPhotoSlotsForKva(ot.potenciaKva);
      const newFotos = Array.from({ length: totalFotos }, (_, i) => ({
        slotName: slots[i] || `Slot #${i + 1}`,
        base64: fotosLabeled[i]?.base64 || '',
        description: fotosLabeled[i]?.description
      }));
      setFotosLabeled(newFotos);
    }
  }, [tipoServicio]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 10) setCurrentStep(step);
  }, []);

  const handleNext = useCallback(() => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < 10) setCurrentStep(s => s + 1);
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }, []);

  const handleSkip = useCallback(() => {
    setSkippedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < 10) setCurrentStep(s => s + 1);
  }, [currentStep]);

  const buildCompiledReport = useCallback((): TechnicalReport => {
    const template = getTemplate(tipoServicio);
    return {
      id: `rep_${Date.now()}`,
      otId: ot.id,
      tipoServicio,
      horaFin: horaFin || undefined,
      equipoId: equipoId || ot.equipoId || undefined,
      voltajeEntrada: parseFloat(medicionesEntrada.lnVoltaje[0]) || 220,
      voltajeSalida: parseFloat(medicionesSalida.lnVoltaje[0]) || 220,
      indicadoresBateria: {
        nivelCarga: 30,
        temperaturaC: 21,
        estadoCeldas: 'Optimo',
        bypassActivo: false
      },
      observacionesDiagnostico: diagnostico,
      comentariosAdicionales: observaciones,
      fotos: fotosLabeled.map(f => f.base64),
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      informeN,
      hojaServicioN,
      fechaServicio,
      horaInicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasosLista: pasosLista.length > 0 ? pasosLista : template.pasos.map((desc, i) => ({ numero: i + 1, descripcion: desc })),
      caracteristicas,
      medicionesEntrada,
      medicionesSalida,
      fotosLabeled,
      panoramaFoto,
      recomendaciones
    };
  }, [tipoServicio, horaFin, medicionesEntrada, medicionesSalida, diagnostico, observaciones, fotosLabeled, informeN, hojaServicioN, fechaServicio, horaInicio, tecnico1, tecnico2, antecedentes, accionesRealizadas, pasosLista, caracteristicas, panoramaFoto, recomendaciones]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }, [DRAFT_KEY]);

  const handleSubmit = useCallback(() => {
    try {
      const report = buildCompiledReport();
      clearDraft();
      onComplete(report);
    } catch (err) {
      console.error('handleSubmit error:', err);
    }
  }, [buildCompiledReport, onComplete, clearDraft]);

  const totalPhotoSlots = totalFotos;
  const filledPhotos = fotosLabeled.filter(f => f.base64).length;

  const stepStatus = (num: number): 'completed' | 'current' | 'skipped' | 'pending' => {
    if (completedSteps.has(num)) return 'completed';
    if (skippedSteps.has(num)) return 'skipped';
    if (num === currentStep) return 'current';
    return 'pending';
  };

  const renderStepIndicator = (num: number) => {
    const s = stepStatus(num);
    if (s === 'completed') return <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></span>;
    if (s === 'skipped') return <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[9px] font-bold shrink-0 font-mono">--</span>;
    return <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 font-mono ${s === 'current' ? 'bg-teal-400 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>{num}</span>;
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all';
  const labelCls = 'text-[10px] text-slate-400 font-mono uppercase mb-1 block tracking-wider';
  const selectCls = 'w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono';

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPaso1();
      case 2: return renderPaso2();
      case 3: return renderPaso3();
      case 4: return renderPaso4();
      case 5: return renderPaso5();
      case 6: return renderPaso6();
      case 7: return renderPaso7();
      case 8: return renderPaso8();
      case 9: return renderPaso9();
      case 10: return renderPaso10();
      default: return null;
    }
  };

  const tipoCards = [
    { key: ServiceType.PREVENTIVO, display: 'Preventivo', desc: '4-6 pasos · 8-16 fotos' },
    { key: ServiceType.PREDICTIVO, display: 'Predictivo', desc: '11-14 pasos · 12-24 fotos' },
    { key: ServiceType.CORRECTIVO, display: 'Correctivo', desc: '3-5 pasos · 4-12 fotos' },
    { key: ServiceType.INSTALACION, display: 'Instalación', desc: '4-5 pasos · 12-24 fotos' },
    { key: ServiceType.VISITA_TECNICA, display: 'Visita Técnica', desc: '3 pasos · 6-12 fotos' },
    { key: ServiceType.CAMBIO_BATERIAS, display: 'Cambio Baterías', desc: '4 pasos · 12-24 fotos' },
    { key: ServiceType.PRUEBAS_FAULT_OVER, display: 'Pruebas Fault Over', desc: '5 pasos · 8-16 fotos' },
    { key: ServiceType.APAGADO_ENCENDIDO, display: 'Apagado/Encendido', desc: '5 pasos · 6-12 fotos' },
    { key: ServiceType.REVISION_DIAGNOSTICO, display: 'Rev. Diagnóstico', desc: '3 pasos · 4-10 fotos' },
  ];

  const renderPaso1 = () => (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Selecciona el tipo de servicio que ejecutaste hoy.</p>
      {ot.tipoMantenimiento && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 font-bold font-mono">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9E82" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          Auto-seleccionado desde OT: {ot.tipoMantenimiento}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {tipoCards.map(tc => (
          <button
            key={tc.key}
            type="button"
            onClick={() => setTipoServicio(tc.key)}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
              tipoServicio === tc.key
                ? 'border-teal-400 bg-teal-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className={`text-[11px] font-bold block font-mono ${
              tipoServicio === tc.key ? 'text-teal-800' : 'text-slate-700'
            }`}>{tc.display}</span>
            <span className="text-[8px] text-slate-400">{tc.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-full text-[9px] font-bold font-mono text-teal-700">
          {template.pasos.length} pasos
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-bold font-mono text-slate-600">
          {template.tieneBaterias ? 'Baterias: Si' : 'Baterias: No'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-bold font-mono text-slate-600">
          Fotos: {totalFotos}
        </span>
      </div>
    </div>
  );

  const renderPaso2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9E82" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
        <span className="text-[10px] font-bold text-emerald-800 font-mono">Datos cargados desde OT + Cliente. Todos editables.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Informe N°</label>
          <input type="text" value={informeN} onChange={e => setInformeN(e.target.value)} className={inputCls} placeholder="INF-2026-XXXX" />
        </div>
        <div>
          <label className={labelCls}>Hoja Servicio N°</label>
          <input type="text" value={hojaServicioN} onChange={e => setHojaServicioN(e.target.value)} className={inputCls} placeholder="HS-2026-XXXX" />
        </div>
        <div>
          <label className={labelCls}>Fecha del Servicio</label>
          <input type="date" value={fechaServicio} onChange={e => setFechaServicio(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hora Inicio</label>
          <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hora Fin</label>
          <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Técnico Responsable</label>
          <input type="text" value={tecnico1} onChange={e => setTecnico1(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Técnico 2 (Apoyo)</label>
          <input type="text" value={tecnico2} onChange={e => setTecnico2(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tipo de Servicio</label>
          <input type="text" value={template.display} disabled className={`${inputCls} bg-slate-100 text-slate-500`} />
        </div>
      </div>
    </div>
  );

  const renderPaso3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9E82" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
        <span className="text-[10px] font-bold text-emerald-800 font-mono">Texto autogenerado según tipo de servicio. Editable.</span>
      </div>
      <textarea
        value={antecedentes}
        onChange={e => setAntecedentes(e.target.value)}
        rows={8}
        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y leading-relaxed"
        placeholder="Describe los antecedentes del servicio..."
      />
    </div>
  );

  const renderPaso4 = () => {
    const checkAll = () => setAccionesRealizadas([...ALL_ACCIONES]);
    const clearAll = () => setAccionesRealizadas([]);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{accionesRealizadas.length} de {ALL_ACCIONES.length} seleccionadas</p>
          <div className="flex gap-2">
            <button type="button" onClick={checkAll} className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-bold rounded-lg cursor-pointer hover:bg-teal-100">Marcar todas</button>
            <button type="button" onClick={clearAll} className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-bold rounded-lg cursor-pointer hover:bg-rose-100">Limpiar</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[400px] overflow-y-auto">
          {ALL_ACCIONES.map(action => (
            <label key={action} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700 border border-transparent hover:border-slate-200 transition-all">
              <input
                type="checkbox"
                checked={accionesRealizadas.includes(action)}
                onChange={() => {
                  if (accionesRealizadas.includes(action)) {
                    setAccionesRealizadas(accionesRealizadas.filter(a => a !== action));
                  } else {
                    setAccionesRealizadas([...accionesRealizadas, action]);
                  }
                }}
                className="accent-teal-600 w-3.5 h-3.5"
              />
              <span>{action}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderPaso5 = () => {
    const currentPasos = pasosLista.length > 0 ? pasosLista : template.pasos.map((desc, i) => ({ numero: i + 1, descripcion: desc }));
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Lista de pasos según tipo de servicio. Puedes editar las descripciones.</p>
        {currentPasos.map((paso, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-mono font-bold text-teal-700 text-[10px] shrink-0 mt-1.5 bg-teal-50 px-2 py-0.5 rounded">PASO {idx + 1}</span>
            <textarea
              value={paso.descripcion}
              onChange={e => {
                const updated = [...currentPasos];
                updated[idx] = { ...updated[idx], descripcion: e.target.value };
                setPasosLista(updated);
              }}
              rows={2}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white resize-none"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderPaso6 = () => {
    const entries = Object.entries(caracteristicas);
    const carrKeys = Object.keys(caracteristicas);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9E82" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          <span className="text-[10px] font-bold text-emerald-800 font-mono">Datos precargados desde Equipo registrado.</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto">
          {entries.slice(0, 24).map(([key, val]) => (
            <div key={key}>
              <label className="text-[8px] text-slate-400 font-mono uppercase block truncate">{key}</label>
              <input
                type="text"
                value={val}
                onChange={e => setCaracteristicas(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-xs text-slate-400 col-span-3">No hay características cargadas. Usa "Autocompletar" desde la pantalla principal.</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Vista Panorámica del Equipo</label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center gap-2">
            {panoramaFoto ? (
              <img src={panoramaFoto} alt="Panorámica" className="max-h-[120px] object-contain rounded" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            )}
            <span className="text-[9px] text-slate-400">Foto panorámica del equipo</span>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setPanoramaFoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-all"
            >
              Subir foto panorámica
            </button>
            {panoramaFoto && (
              <button type="button" onClick={() => setPanoramaFoto('')} className="text-[8px] text-rose-500 font-bold cursor-pointer">Eliminar</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPaso7 = () => {
    const slots = fotosLabeled;

    const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const rawDataUrl = ev.target?.result as string;
          const compressed = await compressBase64Image(rawDataUrl, 800, 600, 0.75);
          setCapturedPhotos(prev => [...prev, { dataUrl: compressed, assigned: false }]);
        };
        reader.readAsDataURL(file);
      });
    };

    const assignPhotoToSlot = async (photoIdx: number, slotIdx: number) => {
      const photo = capturedPhotos[photoIdx];
      if (!photo || photo.assigned) return;
      const compressed = await compressBase64Image(photo.dataUrl, 800, 600, 0.75);
      const updated = [...fotosLabeled];
      updated[slotIdx] = { ...updated[slotIdx], base64: compressed };
      setFotosLabeled(updated);
      const newCaptured = [...capturedPhotos];
      newCaptured[photoIdx] = { ...newCaptured[photoIdx], assigned: true };
      setCapturedPhotos(newCaptured);
    };

    const unassignSlot = (slotIdx: number) => {
      const updated = [...fotosLabeled];
      updated[slotIdx] = { ...updated[slotIdx], base64: '' };
      setFotosLabeled(updated);
    };

    if (photoPreviewStep === 'capture') {
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Toma todas las fotos primero con la cámara, luego asígnalas a los slots.
            <span className="ml-2 font-bold text-teal-600 font-mono">{filledPhotos}/{totalPhotoSlots} asignadas</span>
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`rounded-lg border-2 flex flex-col items-center justify-center min-h-[90px] text-center relative overflow-hidden ${
                  slot.base64 ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-slate-50'
                }`}
              >
                {slot.base64 ? (
                  <>
                    <img src={slot.base64} alt="" className="w-full h-full object-cover absolute inset-0" />
                    <span className="absolute bottom-1 left-1 text-[5px] bg-black/50 text-white px-1 rounded font-mono">{idx + 1}</span>
                  </>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                )}
                <span className="text-[6px] text-slate-400 font-mono mt-0.5 relative z-10">{idx + 1}. {slot.slotName.slice(0, 18)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xs py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Tomar foto
              <span className="text-teal-200 text-xs font-mono">({capturedPhotos.filter(p => !p.assigned).length} sin asignar)</span>
            </button>
            <p className="text-[9px] text-slate-400">Toca para abrir la cámara y toma todas las fotos. Luego asígnalas a los slots.</p>
          </div>
          {capturedPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setPhotoPreviewStep('label')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Ya tomé todas ({capturedPhotos.length}) → Etiquetar y asignar
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Asigna cada foto a un slot. Toca la foto, luego toca el slot.</p>
          <button type="button" onClick={() => setPhotoPreviewStep('capture')} className="text-[10px] text-teal-600 font-bold cursor-pointer hover:underline">← Volver a capturar</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/2">
            <h4 className="text-[9px] font-bold text-slate-500 font-mono uppercase mb-2">Fotos capturadas ({capturedPhotos.filter(p => !p.assigned).length} disponibles)</h4>
            <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
              {capturedPhotos.map((photo, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    if (photo.assigned) return;
                    const firstEmpty = fotosLabeled.findIndex(s => !s.base64);
                    if (firstEmpty >= 0) assignPhotoToSlot(pIdx, firstEmpty);
                  }}
                  disabled={photo.assigned}
                  className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                    photo.assigned ? 'border-emerald-400 opacity-50' : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="h-16 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[7px] font-mono text-center block py-0.5 text-slate-500">
                    {photo.assigned ? 'Asignada' : `#${pIdx + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="sm:w-1/2">
            <h4 className="text-[9px] font-bold text-slate-500 font-mono uppercase mb-2">
              Slots <span className={filledPhotos < totalPhotoSlots ? 'text-rose-500' : 'text-emerald-500'}>({filledPhotos}/{totalPhotoSlots})</span>
            </h4>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => slot.base64 ? unassignSlot(idx) : undefined}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[9px] text-left transition-all cursor-pointer ${
                    slot.base64
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-slate-50 border border-slate-200 hover:border-teal-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${slot.base64 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`font-bold flex-1 ${slot.base64 ? 'text-emerald-800' : 'text-slate-500'}`}>
                    {String(idx + 1).padStart(2, '0')}. {slot.slotName}
                  </span>
                  {slot.base64 && (
                    <span className="text-[7px] text-rose-500 font-mono">quitar</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaso8 = () => {
    const renderMedField = (
      label: string,
      getter: (med: typeof medicionesEntrada) => [string, string, string],
      setter: (vals: [string, string, string]) => void,
      isMedEntrada: boolean
    ) => {
      const med = isMedEntrada ? medicionesEntrada : medicionesSalida;
      const setMed = isMedEntrada ? setMedicionesEntrada : setMedicionesSalida;
      const vals = getter(med);
      const isTrifasico = ot.tipoEquipo === EquipmentType.UPS;
      return (
        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono items-center">
          <span className="text-slate-400 font-bold">{label}</span>
          {isTrifasico ? (
            ['R', 'S', 'T'].map((phase, i) => (
              <input
                key={phase}
                type="text"
                value={vals[i]}
                onChange={e => {
                  const newVals: [string, string, string] = [...vals] as [string, string, string];
                  newVals[i] = e.target.value;
                  setMed(prev => {
                    const updated = { ...prev };
                    const keys = ['lnVoltaje', 'lnIntensidad', 'frecuencia', 'llVoltaje'] as const;
                    for (const k of keys) {
                      if (getter(prev as any) === (prev as any)[k]) {
                        (updated as any)[k] = newVals;
                      }
                    }
                    return updated;
                  });
                }}
                className="w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            ))
          ) : (
            <input
              type="text"
              value={vals[0]}
              onChange={e => {
                const newVals: [string, string, string] = [e.target.value, e.target.value, e.target.value];
                setter(newVals);
              }}
              className="col-span-3 w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          )}
        </div>
      );
    };

    const MedTable = ({ title, isEntrada }: { title: string; isEntrada: boolean }) => {
      const med = isEntrada ? medicionesEntrada : medicionesSalida;
      const setMed = isEntrada ? setMedicionesEntrada : setMedicionesSalida;
      return (
        <div className="border border-slate-200 rounded-xl p-3">
          <h4 className="text-[10px] font-bold text-slate-700 font-mono uppercase mb-2">{title}</h4>
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
            <span className="text-slate-400 font-bold">Param</span>
            {['R', 'S', 'T'].map(p => <span key={p} className="font-bold text-slate-600 text-center">{p}</span>)}
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono items-center mt-1">
            <span className="text-slate-400">L-N V</span>
            {med.lnVoltaje.map((v, i) => (
              <input key={i} type="text" value={v} onChange={e => {
                const nv = [...med.lnVoltaje] as [string, string, string];
                nv[i] = e.target.value;
                setMed(prev => ({ ...prev, lnVoltaje: nv }));
              }} className="w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono items-center mt-0.5">
            <span className="text-slate-400">L-N A</span>
            {med.lnIntensidad.map((v, i) => (
              <input key={i} type="text" value={v} onChange={e => {
                const nv = [...med.lnIntensidad] as [string, string, string];
                nv[i] = e.target.value;
                setMed(prev => ({ ...prev, lnIntensidad: nv }));
              }} className="w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono items-center mt-0.5">
            <span className="text-slate-400">Frec Hz</span>
            <input type="text" value={med.frecuencia[0]} onChange={e => {
              const nv = [e.target.value, e.target.value, e.target.value] as [string, string, string];
              setMed(prev => ({ ...prev, frecuencia: nv }));
            }} className="col-span-3 w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono items-center mt-0.5">
            <span className="text-slate-400">L-L V</span>
            {med.llVoltaje.map((v, i) => (
              <input key={i} type="text" value={v} onChange={e => {
                const nv = [...med.llVoltaje] as [string, string, string];
                nv[i] = e.target.value;
                setMed(prev => ({ ...prev, llVoltaje: nv }));
              }} className="w-full border border-slate-200 rounded text-center p-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Mediciones eléctricas de entrada y salida del UPS.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <MedTable title="Entrada del UPS" isEntrada={true} />
          <MedTable title="Salida del UPS" isEntrada={false} />
        </div>
      </div>
    );
  };

  const renderPaso9 = () => {
    const defaultRecs = DEFAULT_RECOMENDACIONES;
    const recs = recomendaciones.length > 0 ? recomendaciones : defaultRecs;
    return (
      <div className="space-y-4">
        <div>
          <h4 className={labelCls}>Diagnóstico del Equipo UPS</h4>
          <textarea
            value={diagnostico}
            onChange={e => setDiagnostico(e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
            placeholder="Describe el diagnóstico del equipo..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className={labelCls}>Recomendaciones</h4>
            <button
              type="button"
              onClick={() => setRecomendaciones([...defaultRecs])}
              className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-bold rounded cursor-pointer hover:bg-slate-200"
            >
              Restaurar defaults
            </button>
          </div>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
            {recs.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0 mt-1">{idx + 1}.</span>
                <textarea
                  value={rec}
                  onChange={e => {
                    const updated = [...recs];
                    updated[idx] = e.target.value;
                    setRecomendaciones(updated);
                  }}
                  rows={2}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white resize-none"
                />
                <button
                  type="button"
                  onClick={() => setRecomendaciones(recs.filter((_, i) => i !== idx))}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer shrink-0 mt-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRecomendaciones([...recs, ''])}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold hover:border-teal-300 hover:text-teal-500 transition-all cursor-pointer"
            >
              + Agregar recomendación
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaso10 = () => {
    const compiledReport = buildCompiledReport();
    const pdfPages = [
      { label: 'Portada', id: 0 },
      { label: 'Informe Técnico', id: 1 },
      { label: 'Características', id: 2 },
      { label: 'Mediciones', id: 3 },
      { label: 'Fotos', id: 4 },
      { label: 'Diagnóstico', id: 5 },
    ];
    const totalMissingPhotos = totalPhotoSlots - filledPhotos;

    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-72 shrink-0 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Estado del Informe</h4>
            {[
              { label: 'Tipo de Servicio', ok: true, detail: template.display },
              { label: 'Cabecera completa', ok: !!informeN && !!hojaServicioN },
              { label: 'Antecedentes', ok: antecedentes.length > 10 },
              { label: `Acciones: ${accionesRealizadas.length}/24`, ok: accionesRealizadas.length > 0 },
              { label: `Pasos: ${pasosLista.length}`, ok: pasosLista.length > 0 },
              { label: 'Características', ok: Object.keys(caracteristicas).length > 5 },
              { label: `Fotos: ${filledPhotos}/${totalPhotoSlots}`, ok: filledPhotos >= totalPhotoSlots },
              { label: 'Mediciones', ok: true },
              { label: 'Diagnóstico + Reco.', ok: diagnostico.length > 5 || recomendaciones.length > 0 },
            ].map((item, idx) => (
              <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] ${
                item.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold shrink-0 ${
                  item.ok ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'
                }`}>
                  {item.ok ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : '!'}
                </span>
                <span className="font-bold flex-1">{item.label}</span>
              </div>
            ))}
            {totalMissingPhotos > 0 && (
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[9px] text-amber-800">
                Faltan {totalMissingPhotos} fotos. Puedes enviar igual o regresar al paso 7.
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 18 8"/></svg>
                <span className="text-[8px] font-bold text-slate-500 font-mono uppercase">Vista Previa</span>
                <div className="ml-auto flex gap-1">
                  {pdfPages.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPdfPreviewPage(p.id)}
                      className={`px-2 py-1 text-[8px] font-bold rounded-lg transition-all cursor-pointer ${
                        pdfPreviewPage === p.id ? 'bg-teal-50 border border-teal-200 text-teal-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100 p-3 flex justify-center overflow-auto max-h-[600px]">
                <DocumentFormat report={compiledReport} ot={ot} client={client} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-[750px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="w-full sm:w-56 bg-slate-900 text-white p-4 flex flex-col gap-0.5 shrink-0">
        <div className="pb-3 mb-3 border-b border-slate-700 space-y-1">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">{ot.id}</span>
          <h3 className="font-bold text-xs font-display leading-tight">{client.razonSocial}</h3>
          <p className="text-[9px] text-slate-400 font-mono leading-tight">{ot.tipoEquipo} · {ot.potenciaKva} KVA</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[7px] font-bold font-mono rounded-full">{template.display}</span>
        </div>
        <div className="space-y-0.5 flex-1 overflow-y-auto">
          {STEPS.map(step => {
            const s = stepStatus(step.num);
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => goToStep(step.num)}
                className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer ${
                  s === 'current' ? 'bg-teal-500/20 text-teal-200' : s === 'completed' ? 'text-emerald-300 hover:bg-slate-800' : s === 'skipped' ? 'text-amber-300/60 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
                }`}
              >
                {renderStepIndicator(step.num)}
                <div className="leading-tight min-w-0">
                  <span className={`block text-[9px] truncate ${s === 'current' ? 'font-bold' : ''}`}>{step.label}</span>
                  <span className="text-[7px] text-slate-600 block">{s === 'completed' ? 'Completado' : s === 'skipped' ? 'Saltado' : s === 'current' ? 'En curso' : 'Pendiente'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-5 sm:p-6 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-slate-200"
            title="Volver a la Orden de Trabajo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-bold font-mono">{currentStep}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-base font-display">{STEPS[currentStep - 1]?.label}</h2>
            <p className="text-[11px] text-slate-400">Paso {currentStep} de 10</p>
            {draftMsg && <p className="text-[9px] text-emerald-600 font-medium mt-0.5">{draftMsg}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={currentStep > 1 ? handlePrev : onCancel}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              title={currentStep > 1 ? 'Paso anterior' : 'Salir del editor'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              {currentStep > 1 ? 'Anterior' : 'Atrás'}
            </button>
            {currentStep < 10 && currentStep !== 7 && (
              <button type="button" onClick={handleSkip} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 text-[11px] font-bold rounded-lg transition-all cursor-pointer">
                Saltar paso
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveDraft} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardar Borrador
            </button>
            <button type="button" onClick={onCancel} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg transition-all cursor-pointer">
              Cancelar
            </button>
            {currentStep < 10 ? (
              <button type="button" onClick={handleNext} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5">
                Siguiente
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={handleSubmit} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Enviar Informe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
