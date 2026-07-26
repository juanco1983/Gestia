import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Layers, 
  Sliders, 
  Camera, 
  Trash2, 
  WifiOff, 
  Zap, 
  AlertOctagon, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  UploadCloud,
  FileCheck,
  Table,
  Heart,
  ChevronRight,
  ChevronDown,
  Building2,
  Settings2,
  Sparkles,
  Plus,
  Save,
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Cpu
} from 'lucide-react';
import { OT, OTStatus, EquipmentType, ServiceType, TechnicalReport, Client, User, Equipo, OtEquipoAsignacion } from '../types';
import { useLocalToast } from './shared/ToastModal';
import { useConfirm } from './shared/ConfirmModal';
import { 
  ALL_ACCIONES, 
  DEFAULT_RECOMENDACIONES, 
  getPhotoSlotsForKva, 
  generateDefaultReport,
  getTechnicalSvg
} from '../utils/reportDefaults';
import { getTemplate, getPhotoSlotsForTipo } from '../utils/serviceTemplates';
import WizardInforme from './WizardInforme';
import ErrorBoundary from './shared/ErrorBoundary';

interface TecnicoViewProps {
  ots: OT[];
  clients: Client[];
  reports?: TechnicalReport[];
  isOnline: boolean;
  onSaveReportOffline: (report: TechnicalReport) => void;
  onUpdateOtStatus: (otId: string, status: OTStatus) => void;
  onUpdateOt: (ot: OT) => void;
  onAddOT: (ot: OT) => void;
  currentUser?: User;
  equipos: Equipo[];
  otEquipoAsignaciones: OtEquipoAsignacion[];
}

export default function TecnicoView({
  ots,
  clients,
  reports = [],
  isOnline,
  onSaveReportOffline,
  onUpdateOtStatus,
  onUpdateOt,
  onAddOT,
  currentUser,
  equipos,
  otEquipoAsignaciones
}: TecnicoViewProps) {
  const isTechUser = currentUser?.role === 'Tecnico';

  const { notifySuccess, notifyError, notifyOffline, toastView } = useLocalToast();
  const { confirm, confirmView } = useConfirm();

  const mockTechName = currentUser?.username || "Carlos Ocsa";
  
  const normalizeName = (name?: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const normalizedCurrentUser = normalizeName(mockTechName);
  
  // If user is Admin, Ventas or Supervisor, show all OTs assigned or let them see the full board
  const myOts = ots.filter(o => {
    if (isTechUser) {
      const isTitular = normalizeName(o.tecnicoTitular) === normalizedCurrentUser || o.tecnicoTitularId === currentUser?.id;
      const isApoyoArr = (o.tecnicosAdicionalesIds || []).includes(currentUser?.id || '') || 
                         (o.tecnicosAdicionalesNombres || []).map(n => normalizeName(n)).includes(normalizedCurrentUser);
      const isApoyoLegacy = normalizeName(o.tecnicoApoyo) === normalizedCurrentUser;
      const hasEquipmentAsg = (otEquipoAsignaciones || []).some(a => a.otId === o.id && (a.tecnicoTitularId === currentUser?.id || a.tecnicoApoyoId === currentUser?.id));
      
      return isTitular || isApoyoArr || isApoyoLegacy || hasEquipmentAsg;
    }
    // Para roles administrativos, mostrar todas las OTs programadas o en proceso para pruebas
    return o.estado !== OTStatus.CREADA && o.estado !== OTStatus.PENDIENTE_PROGRAMACION;
  });

  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [showOtSalesInfo, setShowOtSalesInfo] = useState<boolean>(true);
  const [draftLoadedMessage, setDraftLoadedMessage] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState<boolean>(true);

  const [selectedEquipoId, setSelectedEquipoId] = useState<string>('');
  const [clientEquipos, setClientEquipos] = useState<Equipo[]>([]);

  const otEquipoIds = useMemo(() => {
    return selectedOt?.equipoId
      ? selectedOt.equipoId.split(',').map(x => x.trim()).filter(Boolean)
      : [];
  }, [selectedOt?.equipoId]);

  // Fetch client equipments for display and auto-select first
  useEffect(() => {
    if (selectedOt?.clientId) {
      fetch(`/api/clients/${selectedOt.clientId}/equipos`)
        .then(res => res.json())
        .then(data => setClientEquipos(data))
        .catch(err => console.error("Error fetching client equipments:", err));
    }
  }, [selectedOt?.clientId]);

  // Auto-select first equipo when OT changes
  useEffect(() => {
    if (otEquipoIds.length > 0) {
      setSelectedEquipoId(otEquipoIds[0]);
    } else {
      setSelectedEquipoId('');
    }
  }, [otEquipoIds]);

  // Form states matching high-fidelity PDF
  const [informeN, setInformeN] = useState<string>('');
  const [hojaServicioN, setHojaServicioN] = useState<string>('');
  const [asunto, setAsunto] = useState<string>('');
  const [fechaServicio, setFechaServicio] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('09:00 AM');
  const [horaFin, setHoraFin] = useState<string>('');
  const [tipoServicio, setTipoServicio] = useState<ServiceType>(ServiceType.PREVENTIVO);
  const [tecnico1, setTecnico1] = useState<string>(mockTechName);
  const [tecnico2, setTecnico2] = useState<string>('Ninguno');
  const [antecedentes, setAntecedentes] = useState<string>('');
  const [accionesRealizadas, setAccionesRealizadas] = useState<string[]>([]);
  const [paso1, setPaso1] = useState<string>('');
  const [paso1_si_no, setPaso1_si_no] = useState<'si' | 'no'>('si');
  const [paso1_funcionamiento, setPaso1_funcionamiento] = useState<'modo inversor' | 'bypass' | 'apagado'>('modo inversor');
  const [paso1_bypass, setPaso1_bypass] = useState<'interno' | 'externo' | 'no'>('no');
  const [paso2, setPaso2] = useState<string>('');
  const [paso3, setPaso3] = useState<string>('');
  const [paso4, setPaso4] = useState<string>('');
  const [paso5, setPaso5] = useState<string>('');
  const [paso6, setPaso6] = useState<string>('');
  const [paso6_concluido, setPaso6_concluido] = useState<'si' | 'no'>('si');
  const [paso6_observaciones, setPaso6_observaciones] = useState<string>('');

  // Tables
  const [caracteristicas, setCaracteristicas] = useState<Record<string, string>>({});
  const [medicionesEntrada, setMedicionesEntrada] = useState<{
    lnVoltaje: [string, string, string];
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  }>({
    lnVoltaje: ["220", "220", "220"],
    lnIntensidad: ["0", "0", "0"],
    frecuencia: ["60.0", "60.0", "60.0"],
    llVoltaje: ["380", "380", "380"]
  });
  const [medicionesSalida, setMedicionesSalida] = useState<{
    lnVoltaje: [string, string, string];
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  }>({
    lnVoltaje: ["220", "220", "220"],
    lnIntensidad: ["0", "0", "0"],
    frecuencia: ["60.0", "60.0", "60.0"],
    llVoltaje: ["380", "380", "380"]
  });

  // Diagnostic checklist cards
  const [cuentaConGabinete, setCuentaConGabinete] = useState<'si' | 'no'>('si');
  const [tipoEstructura, setTipoEstructura] = useState<'modo Rack' | 'Torre' | 'no'>('modo Rack');
  const [equipoEnBypass, setEquipoEnBypass] = useState<'si' | 'no' | 'apagado'>('no');

  const [anioBaterias, setAnioBaterias] = useState<number>(2022);
  const [temperaturaSala, setTemperaturaSala] = useState<number>(21);
  const [estadoOperativo, setEstadoOperativo] = useState<boolean>(true);
  const [inversorOperandoPorcentaje, setInversorOperandoPorcentaje] = useState<number>(30);

  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);

  // Photo slots - keyed layout
  const [fotosLabeled, setFotosLabeled] = useState<Array<{ slotName: string; base64: string; description?: string }>>([]);

  // Photo dynamic dimension states
  const [photoWidth, setPhotoWidth] = useState<number>(800);
  const [photoHeight, setPhotoHeight] = useState<number>(600);
  const [sizePreset, setSizePreset] = useState<string>('800x600');

  const handlePresetChange = (preset: string) => {
    setSizePreset(preset);
    if (preset === '800x600') {
      setPhotoWidth(800);
      setPhotoHeight(600);
    } else if (preset === '1024x768') {
      setPhotoWidth(1024);
      setPhotoHeight(768);
    } else if (preset === '640x480') {
      setPhotoWidth(640);
      setPhotoHeight(480);
    }
  };

  const saveActiveDraft = (showNotification = false) => {
    if (!selectedOt) return;

    const draft = {
      informeN,
      hojaServicioN,
      asunto,
      fechaServicio,
      horaInicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasos: {
        paso1,
        paso1_si_no,
        paso1_funcionamiento,
        paso1_bypass,
        paso2,
        paso3,
        paso4,
        paso5,
        paso6,
        paso6_concluido,
        paso6_observaciones
      },
      caracteristicas,
      fotosLabeled,
      medicionesEntrada,
      medicionesSalida,
      diagnosticoGabinete: {
        cuentaConGabinete,
        tipoEstructura,
        equipoEnBypass
      },
      revisionNormas: {
        mantenimientoRealizado: true,
        anioBaterias,
        ambienteHermetico: true,
        temperaturaSala,
        estadoOperativo,
        inversorOperandoPorcentaje
      },
      recomendaciones
    };

    localStorage.setItem(`mafort_draft_${selectedOt.id}_${selectedEquipoId}`, JSON.stringify(draft));
    if (showNotification) {
      notifySuccess('Borrador Guardado', 'Los cambios se guardaron de forma segura en este navegador. Puede salir o perder la conexión, y al volver a seleccionar esta Orden de Trabajo, retomará exactamente desde donde se quedó.');
    }
  };

  // Auto-save draft effect
  useEffect(() => {
    if (!selectedOt) return;
    
    const timer = setTimeout(() => {
      const draft = {
        informeN,
        hojaServicioN,
        asunto,
      fechaServicio,
      horaInicio,
      horaFin,
      tipoServicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasosLista: (() => {
        const template = getTemplate(tipoServicio);
        const pasoTexts = [paso1, paso2, paso3, paso4, paso5, paso6];
        return template.pasos.map((desc, i) => ({
          numero: i + 1,
          titulo: desc,
          descripcion: pasoTexts[i]?.trim() || desc
        }));
      })(),
      pasos: {
          paso1,
          paso1_si_no,
          paso1_funcionamiento,
          paso1_bypass,
          paso2,
          paso3,
          paso4,
          paso5,
          paso6,
          paso6_concluido,
          paso6_observaciones
        },
        caracteristicas,
        fotosLabeled,
        medicionesEntrada,
        medicionesSalida,
        diagnosticoGabinete: {
          cuentaConGabinete,
          tipoEstructura,
          equipoEnBypass
        },
        revisionNormas: {
          mantenimientoRealizado: true,
          anioBaterias,
          ambienteHermetico: true,
          temperaturaSala,
          estadoOperativo,
          inversorOperandoPorcentaje
        },
        recomendaciones
      };
    localStorage.setItem(`mafort_draft_${selectedOt.id}_${selectedEquipoId}`, JSON.stringify(draft));
    }, 1500); // 1.5s debounce to avoid spamming localStorage
    
    return () => clearTimeout(timer);
  }, [
    selectedOt, informeN, hojaServicioN, asunto, fechaServicio, horaInicio, horaFin, tipoServicio,
    tecnico1, tecnico2, antecedentes, accionesRealizadas,
    paso1, paso1_si_no, paso1_funcionamiento, paso1_bypass,
    paso2, paso3, paso4, paso5, paso6, paso6_concluido, paso6_observaciones,
    caracteristicas, fotosLabeled, medicionesEntrada, medicionesSalida,
    cuentaConGabinete, tipoEstructura, equipoEnBypass,
    anioBaterias, temperaturaSala, estadoOperativo, inversorOperandoPorcentaje,
    recomendaciones
  ]);

  // Sync photo slots when tipoServicio changes
  useEffect(() => {
    if (!selectedOt) return;
    const targetCount = getPhotoSlotsForTipo(tipoServicio, selectedOt.potenciaKva);
    const baseSlots = getPhotoSlotsForKva(selectedOt.potenciaKva);
    const currentCount = fotosLabeled.length;
    const hasRealPhotos = fotosLabeled.some(f => f.base64);
    if (currentCount === targetCount && hasRealPhotos) return;
    setFotosLabeled(
      Array.from({ length: targetCount }).map((_, i) => {
        const existing = fotosLabeled[i];
        const slotName = baseSlots[i] || `Foto S.L.A Slot #${i + 1}`;
        return {
          slotName,
          base64: existing?.base64 || '',
          description: existing?.description || `Verificación: ${slotName}`
        };
      })
    );
  }, [tipoServicio, selectedOt]);

  const handleSelectOt = (ot: OT) => {
    setSelectedOt(ot);
    setIsEditingReport(false);
    const equiposIds = ot.equipoId ? ot.equipoId.split(',').map(x => x.trim()).filter(Boolean) : [];
    const currentEquipoId = equiposIds[0] || '';
    setSelectedEquipoId(currentEquipoId);
    const client = clients.find(c => c.id === ot.clientId) || {
      razonSocial: 'Cliente S.A.',
      direccionSede: 'Sede Central',
      distrito: 'Surco'
    };

    // Check if there is an existing local draft
    const savedDraftStr = localStorage.getItem(`mafort_draft_${ot.id}_${currentEquipoId}`);
    if (savedDraftStr) {
      try {
        const draft = JSON.parse(savedDraftStr);
        setInformeN(draft.informeN || '');
        setHojaServicioN(draft.hojaServicioN || '');
        setAsunto(draft.asunto || '');
        setFechaServicio(draft.fechaServicio || '');
        setHoraInicio(draft.horaInicio || '09:00 AM');
        setHoraFin(draft.horaFin || '');
        setTipoServicio(draft.tipoServicio || ot.tipoMantenimiento || ServiceType.PREVENTIVO);
        setTecnico1(draft.tecnico1 || mockTechName);
        setTecnico2(draft.tecnico2 || 'Ninguno');
        setAntecedentes(draft.antecedentes || '');
        setAccionesRealizadas(draft.accionesRealizadas || []);
        
        setPaso1(draft.pasos?.paso1 || draft.paso1 || '');
        setPaso1_si_no(draft.pasos?.paso1_si_no || draft.paso1_si_no || 'si');
        setPaso1_funcionamiento(draft.pasos?.paso1_funcionamiento || draft.paso1_funcionamiento || 'modo inversor');
        setPaso1_bypass(draft.pasos?.paso1_bypass || draft.paso1_bypass || 'interno');
        
        setPaso2(draft.pasos?.paso2 || draft.paso2 || '');
        setPaso3(draft.pasos?.paso3 || draft.paso3 || '');
        setPaso4(draft.pasos?.paso4 || draft.paso4 || '');
        setPaso5(draft.pasos?.paso5 || draft.paso5 || '');
        setPaso6(draft.pasos?.paso6 || draft.paso6 || '');
        setPaso6_concluido(draft.pasos?.paso6_concluido || draft.paso6_concluido || 'si');
        setPaso6_observaciones(draft.pasos?.paso6_observaciones || draft.paso6_observaciones || '');

        setCaracteristicas(draft.caracteristicas || {});
        setMedicionesEntrada(draft.medicionesEntrada || {
          lnVoltaje: ["220", "220", "220"],
          lnIntensidad: ["0", "0", "0"],
          frecuencia: ["60.0", "60.0", "60.0"],
          llVoltaje: ["380", "380", "380"]
        });
        setMedicionesSalida(draft.medicionesSalida || {
          lnVoltaje: ["220", "220", "220"],
          lnIntensidad: ["0", "0", "0"],
          frecuencia: ["60.0", "60.0", "60.0"],
          llVoltaje: ["380", "380", "380"]
        });

        setCuentaConGabinete(draft.diagnosticoGabinete?.cuentaConGabinete || draft.cuentaConGabinete || 'si');
        setTipoEstructura(draft.diagnosticoGabinete?.tipoEstructura || draft.tipoEstructura || 'modo Rack');
        setEquipoEnBypass(draft.diagnosticoGabinete?.equipoEnBypass || draft.equipoEnBypass || 'no');

        setAnioBaterias(draft.revisionNormas?.anioBaterias || draft.anioBaterias || 2022);
        setTemperaturaSala(draft.revisionNormas?.temperaturaSala || draft.temperaturaSala || 21);
        setEstadoOperativo(draft.revisionNormas?.estadoOperativo !== undefined ? draft.revisionNormas.estadoOperativo : (draft.estadoOperativo !== undefined ? draft.estadoOperativo : true));
        setInversorOperandoPorcentaje(draft.revisionNormas?.inversorOperandoPorcentaje || draft.inversorOperandoPorcentaje || 30);

        setRecomendaciones(draft.recomendaciones || []);
        setFotosLabeled(draft.fotosLabeled || []);
        
        if (ot.estado === OTStatus.PROGRAMADA || ot.estado === OTStatus.OBSERVADA) {
          onUpdateOtStatus(ot.id, OTStatus.TRABAJO_EN_EJECUCION);
        }
        setDraftLoadedMessage("📂 Se recuperó un borrador guardado en este dispositivo para esta OT. Puede continuar editando y completándolo.");
        return;
      } catch (e) {
        console.error("Error loading draft, falling back to default pre-population", e);
      }
    }

    setDraftLoadedMessage(null);
    
    // Check if there is an existing report in the global state (submitted before)
    const existingReport = reports.find(r => r.otId === ot.id && (!currentEquipoId || r.equipoId === currentEquipoId));
    if (existingReport) {
      setInformeN(existingReport.informeN || '');
      setHojaServicioN(existingReport.hojaServicioN || '');
      setAsunto(existingReport.asunto || '');
      setFechaServicio(existingReport.fechaServicio || '');
      setHoraInicio(existingReport.horaInicio || '09:00 AM');
      setHoraFin(existingReport.horaFin || '');
      setTipoServicio(existingReport.tipoServicio || ot.tipoMantenimiento || ServiceType.PREVENTIVO);
      setTecnico1(existingReport.tecnico1 || mockTechName);
      setTecnico2(existingReport.tecnico2 || 'Ninguno');
      setAntecedentes(existingReport.antecedentes || '');
      setAccionesRealizadas(existingReport.accionesRealizadas || []);
      
      setPaso1(existingReport.pasos?.paso1 || '');
      setPaso1_si_no(existingReport.pasos?.paso1_si_no || 'si');
      setPaso1_funcionamiento(existingReport.pasos?.paso1_funcionamiento || 'modo inversor');
      setPaso1_bypass(existingReport.pasos?.paso1_bypass || 'interno');
      
      setPaso2(existingReport.pasos?.paso2 || '');
      setPaso3(existingReport.pasos?.paso3 || '');
      setPaso4(existingReport.pasos?.paso4 || '');
      setPaso5(existingReport.pasos?.paso5 || '');
      setPaso6(existingReport.pasos?.paso6 || '');
      setPaso6_concluido(existingReport.pasos?.paso6_concluido || 'si');
      setPaso6_observaciones(existingReport.pasos?.paso6_observaciones || '');

      setCaracteristicas(existingReport.caracteristicas || {});
      setMedicionesEntrada(existingReport.medicionesEntrada || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });
      setMedicionesSalida(existingReport.medicionesSalida || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });

      setCuentaConGabinete(existingReport.diagnosticoGabinete?.cuentaConGabinete || 'si');
      setTipoEstructura(existingReport.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
      setEquipoEnBypass(existingReport.diagnosticoGabinete?.equipoEnBypass || 'no');

      setAnioBaterias(existingReport.revisionNormas?.anioBaterias || 2022);
      setTemperaturaSala(existingReport.revisionNormas?.temperaturaSala || 21);
      setEstadoOperativo(existingReport.revisionNormas?.estadoOperativo !== undefined ? existingReport.revisionNormas.estadoOperativo : true);
      setInversorOperandoPorcentaje(existingReport.revisionNormas?.inversorOperandoPorcentaje || 30);

      setRecomendaciones(existingReport.recomendaciones || []);
      setFotosLabeled(existingReport.fotosLabeled || []);
      
      // If it's already under review or approved, keep the state, don't change to EN_PROCESO
      if (ot.estado === OTStatus.PROGRAMADA || ot.estado === OTStatus.OBSERVADA) {
        onUpdateOtStatus(ot.id, OTStatus.TRABAJO_EN_EJECUCION);
      }
      return;
    }

    // Instant reset to default pre-populated structural states so the form is 50% written for them
    const def = generateDefaultReport(ot, client as Client);
    setInformeN(def.informeN || '');
    setHojaServicioN(def.hojaServicioN || '');
    setAsunto(def.asunto || '');
    setFechaServicio(def.fechaServicio || '');
    setHoraInicio(def.horaInicio || '09:00 AM');
    setHoraFin(def.horaFin || '');
    setTipoServicio(def.tipoServicio || ot.tipoMantenimiento || ServiceType.PREVENTIVO);
    setTecnico1(def.tecnico1 || mockTechName);
    setTecnico2(def.tecnico2 || 'Ninguno');
    setAntecedentes(def.antecedentes || '');
    setAccionesRealizadas(def.accionesRealizadas || []);
    setPaso1(def.pasos?.paso1 || '');
    setPaso1_si_no(def.pasos?.paso1_si_no || 'si');
    setPaso1_funcionamiento(def.pasos?.paso1_funcionamiento || 'modo inversor');
    setPaso1_bypass(def.pasos?.paso1_bypass || 'interno');
    setPaso2(def.pasos?.paso2 || '');
    setPaso3(def.pasos?.paso3 || '');
    setPaso4(def.pasos?.paso4 || '');
    setPaso5(def.pasos?.paso5 || '');
    setPaso6(def.pasos?.paso6 || '');
    setPaso6_concluido(def.pasos?.paso6_concluido || 'si');
    setPaso6_observaciones(def.pasos?.paso6_observaciones || '');

    setCaracteristicas(def.caracteristicas || {});
    setMedicionesEntrada(def.medicionesEntrada || {
      lnVoltaje: ["220", "220", "220"],
      lnIntensidad: ["0", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: ["380", "380", "380"]
    });
    setMedicionesSalida(def.medicionesSalida || {
      lnVoltaje: ["220", "220", "220"],
      lnIntensidad: ["0", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: ["380", "380", "380"]
    });

    setCuentaConGabinete(def.diagnosticoGabinete?.cuentaConGabinete || 'si');
    setTipoEstructura(def.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
    setEquipoEnBypass(def.diagnosticoGabinete?.equipoEnBypass || 'no');

    setAnioBaterias(def.revisionNormas?.anioBaterias || 2022);
    setTemperaturaSala(def.revisionNormas?.temperaturaSala || 21);
    setEstadoOperativo(def.revisionNormas?.estadoOperativo || true);
    setInversorOperandoPorcentaje(def.revisionNormas?.inversorOperandoPorcentaje || 30);

    setRecomendaciones(def.recomendaciones || []);

    // Set up photo inputs matching exact required list of capacity + tipo
    const targetCount = getPhotoSlotsForTipo(tipoServicio, ot.potenciaKva);
    const baseSlots = getPhotoSlotsForKva(ot.potenciaKva);
    setFotosLabeled(
      Array.from({ length: targetCount }).map((_, i) => {
        const slotName = baseSlots[i] || `Foto S.L.A Slot #${i + 1}`;
        return { slotName, base64: '', description: `Verificación: ${slotName}` };
      })
    );

    if (ot.estado === OTStatus.PROGRAMADA || ot.estado === OTStatus.OBSERVADA) {
      onUpdateOtStatus(ot.id, OTStatus.TRABAJO_EN_EJECUCION);
    }
  };

  const handlePrefillAllWithMafortDefaults = () => {
    if (!selectedOt) return;
    const client = clients.find(c => c.id === selectedOt.clientId);
    if (!client) return;

    const def = generateDefaultReport(selectedOt, client);
    
    setInformeN(def.informeN || '');
    setHojaServicioN(def.hojaServicioN || '');
    setAsunto(def.asunto || '');
    setFechaServicio(def.fechaServicio || '');
    setHoraInicio(def.horaInicio || '09:00 AM');
    setHoraFin(def.horaFin || '');
    setTipoServicio(def.tipoServicio || selectedOt.tipoMantenimiento || ServiceType.PREVENTIVO);
    setAntecedentes(def.antecedentes || '');
    setAccionesRealizadas(def.accionesRealizadas || []);
    setPaso1(def.pasos?.paso1 || '');
    setPaso1_si_no(def.pasos?.paso1_si_no || 'si');
    setPaso1_funcionamiento(def.pasos?.paso1_funcionamiento || 'modo inversor');
    setPaso1_bypass(def.pasos?.paso1_bypass || 'interno');
    setPaso2(def.pasos?.paso2 || '');
    setPaso3(def.pasos?.paso3 || '');
    setPaso4(def.pasos?.paso4 || '');
    setPaso5(def.pasos?.paso5 || '');
    setPaso6(def.pasos?.paso6 || '');
    setPaso6_concluido(def.pasos?.paso6_concluido || 'si');
    setPaso6_observaciones(def.pasos?.paso6_observaciones || '');

    setCaracteristicas(def.caracteristicas || {});
    setMedicionesEntrada(def.medicionesEntrada || {
      lnVoltaje: ["220", "220", "220"],
      lnIntensidad: ["0", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: ["380", "380", "380"]
    });
    setMedicionesSalida(def.medicionesSalida || {
      lnVoltaje: ["220", "220", "220"],
      lnIntensidad: ["0", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: ["380", "380", "380"]
    });

    setCuentaConGabinete(def.diagnosticoGabinete?.cuentaConGabinete || 'si');
    setTipoEstructura(def.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
    setEquipoEnBypass(def.diagnosticoGabinete?.equipoEnBypass || 'no');

    setAnioBaterias(def.revisionNormas?.anioBaterias || 2022);
    setTemperaturaSala(def.revisionNormas?.temperaturaSala || 21);
    setEstadoOperativo(def.revisionNormas?.estadoOperativo || true);
    setInversorOperandoPorcentaje(def.revisionNormas?.inversorOperandoPorcentaje || 30);

    setRecomendaciones(def.recomendaciones || []);

    // Prefill the mockup photos so they don't have to upload one by one either!
    if (def.fotosLabeled) {
      setFotosLabeled(def.fotosLabeled);
    }

    notifySuccess('Autocompletado Exitoso', 'El informe de campo ha sido rellenado con datos predeterminados consistentes y el set completo de fotografías de alineación correspondientes a la potencia. Revise y apruebe.');
  };

  const handlePhotoUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      notifyError('Archivo no Válido', 'Seleccione un archivo de imagen válido (JPG, PNG, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = photoWidth;
        const targetHeight = photoHeight;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill background for transparency
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Cover crop calculation
          const imgRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          let srcWidth = img.width;
          let srcHeight = img.height;
          let srcX = 0;
          let srcY = 0;

          if (imgRatio > targetRatio) {
            // Image is wider than target
            srcWidth = img.height * targetRatio;
            srcX = (img.width - srcWidth) / 2;
          } else {
            // Image is taller than target
            srcHeight = img.width / targetRatio;
            srcY = (img.height - srcHeight) / 2;
          }

          ctx.drawImage(
            img,
            srcX, srcY, srcWidth, srcHeight, // Source crop
            0, 0, targetWidth, targetHeight   // Destination fit
          );

          const base64Resized = canvas.toDataURL('image/jpeg', 0.85);

          const slot = fotosLabeled[index];
          const updated = [...fotosLabeled];
          updated[index] = {
            ...slot,
            base64: base64Resized
          };
          setFotosLabeled(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCapturePhotoForSlot = (index: number) => {
    const slot = fotosLabeled[index];
    const mockUrl = getTechnicalSvg(slot.slotName, index, selectedOt?.id || 'OT');
    const updated = [...fotosLabeled];
    updated[index] = {
      ...slot,
      base64: mockUrl
    };
    setFotosLabeled(updated);
  };

  const handleClearPhotoForSlot = (index: number) => {
    const slot = fotosLabeled[index];
    const updated = [...fotosLabeled];
    updated[index] = {
      ...slot,
      base64: ''
    };
    setFotosLabeled(updated);
  };

  const handleToggleAccion = (accion: string) => {
    if (accionesRealizadas.includes(accion)) {
      setAccionesRealizadas(accionesRealizadas.filter(a => a !== accion));
    } else {
      setAccionesRealizadas([...accionesRealizadas, accion]);
    }
  };

  const handleToggleRecomendacion = (rec: string) => {
    if (recomendaciones.includes(rec)) {
      setRecomendaciones(recomendaciones.filter(r => r !== rec));
    } else {
      setRecomendaciones([...recomendaciones, rec]);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOt) return;

    // Check if there are empty photo slots
    const missingPhotos = fotosLabeled.filter(f => !f.base64);
    if (missingPhotos.length > 0) {
      notifyError('Error de Cobertura S.L.A', `Según la orden de trabajo para un equipo de potencia de ${selectedOt.potenciaKva} KVA, se requieren exactamente ${fotosLabeled.length} fotografías con la alineación y encuadre correspondientes. Aún le faltan ingresar ${missingPhotos.length} fotos. Use el botón 'Autocompletar' o cargue fotos manuales en todas las cajas.`);
      return;
    }

    const compiledReport: TechnicalReport = {
      id: `rep_${Date.now()}`,
      otId: selectedOt.id,
      tipoServicio: tipoServicio,
      horaFin: horaFin || undefined,
      equipoId: selectedEquipoId || undefined,
      voltajeEntrada: parseFloat(medicionesEntrada.lnVoltaje[0]) || 220,
      voltajeSalida: parseFloat(medicionesSalida.lnVoltaje[0]) || 220,
      indicadoresBateria: {
        nivelCarga: inversorOperandoPorcentaje,
        temperaturaC: temperaturaSala,
        estadoCeldas: estadoOperativo ? 'Optimo' : 'Critico',
        bypassActivo: equipoEnBypass === 'si'
      },
      observacionesDiagnostico: paso6_concluido === 'si' ? 'Mantenimiento preventivo S.L.A concluido en modo inversor.' : paso6_observaciones,
      comentariosAdicionales: antecedentes.substring(0, 200),
      fotos: fotosLabeled.map(f => f.base64),
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),

      informeN,
      hojaServicioN,
      asunto,
      fechaServicio,
      horaInicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasos: {
        paso1,
        paso1_si_no,
        paso1_funcionamiento,
        paso1_bypass,
        paso2,
        paso3,
        paso4,
        paso5,
        paso6,
        paso6_concluido,
        paso6_observaciones
      },
      caracteristicas,
      fotosLabeled,
      medicionesEntrada,
      medicionesSalida,
      diagnosticoGabinete: {
        cuentaConGabinete,
        tipoEstructura,
        equipoEnBypass
      },
      revisionNormas: {
        mantenimientoRealizado: true,
        anioBaterias,
        ambienteHermetico: true,
        temperaturaSala,
        estadoOperativo,
        inversorOperandoPorcentaje
      },
      recomendaciones
    };

    if (!isOnline) {
      compiledReport.offlineDirty = true;
      onSaveReportOffline(compiledReport);
      onUpdateOtStatus(selectedOt.id, OTStatus.TRABAJO_EN_EJECUCION);
      notifyOffline('Reporte Cacheado Localmente', `El sistema de sincronización offline de Mafort ha encolado este reporte de ${fotosLabeled.length} fotografías de manera segura. Al reconectarse a internet, subirá inmediatamente.`);
    } else {
      onSaveReportOffline(compiledReport);
      onUpdateOtStatus(selectedOt.id, OTStatus.EN_REVISION);
      notifySuccess('Informe Procesado Exitosamente', 'Se ha estructurado y subido el informe técnico con la numeración oficial en formato doble marco a la nube para aprobación.');
    }

    localStorage.removeItem(`mafort_draft_${selectedOt.id}_${selectedEquipoId}`);
    setSelectedOt(null);
  };

  const handleWizardComplete = (report: TechnicalReport) => {
    try {
      if (!selectedOt) return;
      if (!isOnline) {
        report.offlineDirty = true;
        onSaveReportOffline(report);
        onUpdateOtStatus(selectedOt.id, OTStatus.TRABAJO_EN_EJECUCION);
        notifyOffline('Reporte Cacheado Localmente', 'El wizard ha encolado este reporte. Al reconectarse, subirá automáticamente.');
      } else {
        onSaveReportOffline(report);
        onUpdateOtStatus(selectedOt.id, OTStatus.EN_REVISION);
        notifySuccess('Informe Enviado Exitosamente', 'El informe técnico se ha enviado para revisión.');
      }
      localStorage.removeItem(`mafort_draft_${selectedOt.id}_${selectedEquipoId}`);
      setSelectedOt(null);
      setIsEditingReport(false);
    } catch (err) {
      console.error('handleWizardComplete error:', err);
      notifyError('Error al Enviar', `Ocurrió un error: ${err instanceof Error ? err.message : 'Desconocido'}`);
    }
  };

  const clientForWizard = useMemo(() => {
    if (!selectedOt) return null;
    return clients.find(c => c.id === selectedOt.clientId) || null;
  }, [selectedOt, clients]);

  return (
    <ErrorBoundary>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800" id="tecnico-portal-container">
      
      {/* List of Scheduled Tasks/OTs */}
      {!isEditingReport && (
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden self-start animate-fade-in">
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white text-sm font-bold uppercase font-mono tracking-tight flex items-center gap-2">
            <Zap size={15} className="text-amber-400" />
            <span>Mis Órdenes de Trabajo</span>
          </h2>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono font-bold">{myOts.length} asignadas</span>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>Técnico Activo: <strong>{mockTechName}</strong></span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-[11px] text-slate-600 leading-relaxed">
            <p className="font-semibold text-blue-800 flex items-center gap-1.5 mb-1">
              <Layers size={13} />
              Bandeja de Órdenes Programadas
            </p>
            Las Órdenes de Trabajo son emitidas únicamente por el departamento de Ventas. Seleccione una para activar la ficha de informe técnico.
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {myOts.map(ot => {
            const isSelected = selectedOt?.id === ot.id;
            const isEmergency = ot.tipoMantenimiento === 'Emergencia';
            const client = clients.find(c => c.id === ot.clientId);
            return (
              <div 
                key={ot.id}
                onClick={() => handleSelectOt(ot)}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                  isSelected ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 font-mono">{ot.id}</span>
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono ${
                    isEmergency ? 'bg-red-500/10 text-red-650' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ot.tipoMantenimiento}
                  </span>
                </div>
                
                <h3 className="text-xs font-extrabold text-slate-800 uppercase block font-sans truncate">
                  {client?.razonSocial || 'Cliente General S.A.'}
                </h3>
                
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-550 font-medium">
                  <span className="flex items-center gap-1">
                    <Sliders size={12} className="text-slate-400" />
                    <span>{ot.potenciaKva} kVA ({ot.tipoEquipo})</span>
                  </span>
                  <span className="text-blue-620 bg-blue-50/70 border border-blue-100 px-1.5 py-0.2 rounded font-mono">
                    {ot.estado}
                  </span>
                  {ot.equipoId && (
                    <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono flex items-center gap-1" title={ot.equipoId}>
                      <Cpu size={10} />
                      <span>{ot.equipoId.split(',').length} eq.</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {myOts.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs py-12">
              <CheckCircle className="mx-auto text-slate-350 mb-2" size={24} />
              <span>No tienes órdenes de trabajo pendientes de llenado.</span>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Editor Main Board */}
      <div className={`${isEditingReport ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden`}>
        {isEditingReport && selectedOt ? (
          showWizard && clientForWizard ? (
            <div className="p-5">
              <WizardInforme
                ot={selectedOt}
                client={clientForWizard}
                initialReport={undefined}
                onComplete={handleWizardComplete}
                onCancel={() => setIsEditingReport(false)}
                onDraftChange={() => notifySuccess('Borrador Guardado', 'Puedes continuar después. El progreso se guardó en este navegador.')}
              />
            </div>
          ) : (
          <form onSubmit={handleSubmitReport} className="flex flex-col h-full">
            
            {/* Context bar with prefill help */}
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingReport(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-700/50 shadow-xs"
                  title="Volver a la lista de órdenes"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-white text-sm font-bold uppercase font-mono flex items-center gap-1.5">
                    <FileCheck size={16} className="text-amber-400 animate-pulse" />
                    <span>Editor de Campo Oficial S.L.A — {selectedOt.id}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">Estructurando un informe paralelo compatible con PDF Mafort</p>
                </div>

                {otEquipoIds.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {otEquipoIds.map(eqId => {
                      const eq = equipos.find(e => e.id === eqId);
                      return (
                        <button
                          key={eqId}
                          type="button"
                          onClick={() => {
                            saveActiveDraft();
                            setSelectedEquipoId(eqId);
                            setDraftLoadedMessage(`📂 Borrador guardado. Ahora editando: ${eq?.codigo || `Equipo ${eqId.slice(0, 6)}`}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase tracking-wide transition-all cursor-pointer ${
                            selectedEquipoId === eqId
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70'
                          }`}
                        >
                          {eq?.codigo || eqId.slice(0, 6)}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
              {/* AUTOMATION TRIGGERS */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWizard(prev => !prev)}
                  className={`px-3 py-2 rounded-lg text-[9px] font-bold font-mono transition-all cursor-pointer border ${
                    showWizard ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/70'
                  }`}
                >
                  {showWizard ? 'Wizard Activo' : 'Formulario Clásico'}
                </button>
                <button
                  type="button"
                  onClick={handlePrefillAllWithMafortDefaults}
                  disabled={selectedOt.estado === OTStatus.EN_REVISION || selectedOt.estado === OTStatus.APROBADA || selectedOt.estado === OTStatus.FIRMADA}
                  className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 text-white font-sans font-extrabold px-4 py-2 rounded-xl text-[11px] flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 border border-white/10"
                  title="Sincroniza y rellena con el estándar de la reunión Mafort"
                >
                  <Sparkles size={14} className="text-amber-300 animate-spin-slow drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="tracking-tight">¿Autocompletar con Datos Oficiales?</span>
                </button>
              </div>
            </div>

            {draftLoadedMessage && (
              <div className="bg-blue-50 border-b border-blue-200 px-5 py-3 flex items-center justify-between text-xs text-blue-800 shrink-0 font-sans">
                <div className="flex items-center gap-2">
                  <span className="font-bold">📂 BORRADOR DETECTADO:</span>
                  <span>{draftLoadedMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Restablecer Formulario',
                      message: '¿Seguro que desea restablecer el formulario? Se borrará el borrador local y se volverán a cargar los valores por defecto.',
                      confirmLabel: 'Restablecer',
                      tone: 'warning'
                    });
                    if (ok) {
                      localStorage.removeItem(`mafort_draft_${selectedOt.id}_${selectedEquipoId}`);
                      setDraftLoadedMessage(null);
                      // Reload defaults
                      const client = clients.find(c => c.id === selectedOt.clientId);
                      if (client) {
                        const def = generateDefaultReport(selectedOt, client);
                        setInformeN(def.informeN || '');
                        setHojaServicioN(def.hojaServicioN || '');
                        setAsunto(def.asunto || '');
                        setFechaServicio(def.fechaServicio || '');
                        setHoraInicio(def.horaInicio || '09:00 AM');
                        setHoraFin(def.horaFin || '');
                        setTipoServicio(def.tipoServicio || selectedOt.tipoMantenimiento || ServiceType.PREVENTIVO);
                        setTecnico1(def.tecnico1 || mockTechName);
                        setTecnico2(def.tecnico2 || 'Ninguno');
                        setAntecedentes(def.antecedentes || '');
                        setAccionesRealizadas(def.accionesRealizadas || []);
                        setPaso1(def.pasos?.paso1 || '');
                        setPaso1_si_no(def.pasos?.paso1_si_no || 'si');
                        setPaso1_funcionamiento(def.pasos?.paso1_funcionamiento || 'modo inversor');
                        setPaso1_bypass(def.pasos?.paso1_bypass || 'interno');
                        setPaso2(def.pasos?.paso2 || '');
                        setPaso3(def.pasos?.paso3 || '');
                        setPaso4(def.pasos?.paso4 || '');
                        setPaso5(def.pasos?.paso5 || '');
                        setPaso6(def.pasos?.paso6 || '');
                        setPaso6_concluido(def.pasos?.paso6_concluido || 'si');
                        setPaso6_observaciones(def.pasos?.paso6_observaciones || '');

                        setCaracteristicas(def.caracteristicas || {});
                        setMedicionesEntrada(def.medicionesEntrada || {
                          lnVoltaje: ["220", "220", "220"],
                          lnIntensidad: ["0", "0", "0"],
                          frecuencia: ["60.0", "60.0", "60.0"],
                          llVoltaje: ["380", "380", "380"]
                        });
                        setMedicionesSalida(def.medicionesSalida || {
                          lnVoltaje: ["220", "220", "220"],
                          lnIntensidad: ["0", "0", "0"],
                          frecuencia: ["60.0", "60.0", "60.0"],
                          llVoltaje: ["380", "380", "380"]
                        });

                        setCuentaConGabinete(def.diagnosticoGabinete?.cuentaConGabinete || 'si');
                        setTipoEstructura(def.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
                        setEquipoEnBypass(def.diagnosticoGabinete?.equipoEnBypass || 'no');

                        setAnioBaterias(def.revisionNormas?.anioBaterias || 2022);
                        setTemperaturaSala(def.revisionNormas?.temperaturaSala || 21);
                        setEstadoOperativo(def.revisionNormas?.estadoOperativo || true);
                        setInversorOperandoPorcentaje(def.revisionNormas?.inversorOperandoPorcentaje || 30);

                        setRecomendaciones(def.recomendaciones || []);
                        const targetCount = getPhotoSlotsForTipo(tipoServicio, selectedOt.potenciaKva);
                        const baseSlots = getPhotoSlotsForKva(selectedOt.potenciaKva);
                        setFotosLabeled(
                          Array.from({ length: targetCount }).map((_, i) => {
                            const slotName = baseSlots[i] || `Foto S.L.A Slot #${i + 1}`;
                            return { slotName, base64: '', description: `Verificación: ${slotName}` };
                          })
                        );
                      }
                    }
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-850 font-bold px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* Form scroll blocks */}
            <div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">
              
              {/* COLLAPSIBLE SALES OT DATA BAR */}
              {(() => {
                const otClient = clients.find(c => c.id === selectedOt.clientId);
                return (
                  <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl overflow-hidden font-sans">
                    <button
                      type="button"
                      onClick={() => setShowOtSalesInfo(!showOtSalesInfo)}
                      className="w-full px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 flex items-center justify-between transition-colors text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-indigo-600" />
                        <span className="text-xs font-extrabold text-indigo-900 uppercase font-mono tracking-wide">
                          🔍 Información Original de Ventas ({selectedOt.id})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-mono font-bold">
                        <span>{showOtSalesInfo ? "Ocultar" : "Mostrar detalles"}</span>
                        <ChevronDown size={14} className={`transform transition-transform duration-200 ${showOtSalesInfo ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {showOtSalesInfo && (
                      <div className="p-4 bg-white border-t border-indigo-100/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fade-in">
                        <div className="space-y-2 border-r border-slate-100 pr-4">
                          <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider font-mono">Datos del Cliente</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Razón Social</span>
                              <strong className="text-slate-800 uppercase block leading-tight">{otClient?.razonSocial || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">RUC</span>
                              <strong className="text-slate-700 block font-mono">{otClient?.ruc || 'N/A'}</strong>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-mono block">Sede de Servicio / Distrito</span>
                            <span className="text-slate-600 block">{otClient?.direccionSede || 'N/A'}, {otClient?.distrito || 'N/A'}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-50 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Contacto Sede</span>
                              <span className="text-slate-700 block font-bold">{otClient?.contactoNombre || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Teléfono</span>
                              <span className="text-slate-600 block font-mono text-[10px]">{otClient?.contactoTelefono || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-mono block">Correo Electrónico</span>
                            <span className="text-slate-600 block font-mono text-[10px] truncate">{otClient?.contactoEmail || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider font-mono">Especificaciones de OT</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Tipo de Equipo</span>
                              <strong className="text-slate-800 block">{selectedOt.tipoEquipo}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Potencia de Equipo</span>
                              <strong className="text-slate-800 block font-mono">{selectedOt.potenciaKva} KVA</strong>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Mantenimiento</span>
                              <strong className="text-indigo-650 block font-mono">{selectedOt.tipoMantenimiento}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-mono block">Fecha Planificada</span>
                              <span className="text-slate-600 block font-mono">{selectedOt.fechaProgramada}</span>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-slate-50">
                            <span className="text-[9px] text-slate-400 font-mono block">Asignación de Personal</span>
                            <span className="text-slate-700 block text-[11px]">
                              👤 Titular: <strong>{selectedOt.tecnicoTitular}</strong>
                              {selectedOt.tecnicoApoyo && (
                                <span className="text-slate-500 ml-2 block sm:inline">| Apoyo: <strong>{selectedOt.tecnicoApoyo}</strong></span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* SECTION 0: TIPO DE SERVICIO + HORA FIN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <span className="w-5 h-5 rounded bg-teal-500 text-white font-bold text-xs flex items-center justify-center font-mono">0</span>
                  <h3 className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wide">Tipo de Servicio</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Seleccione el tipo de servicio ejecutado</label>
                    <select
                      value={tipoServicio}
                      onChange={(e) => setTipoServicio(e.target.value as ServiceType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono font-bold"
                    >
                      {Object.values(ServiceType).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Hora de Finalización</label>
                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-full text-[9px] font-bold font-mono text-teal-700">
                    {getTemplate(tipoServicio).pasos.length} pasos
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-bold font-mono text-slate-600">
                    {getTemplate(tipoServicio).tieneBaterias ? 'Baterias: Si' : 'Baterias: No'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-bold font-mono text-slate-600">
                    Fotos: {getTemplate(tipoServicio).fotosMin}+
                  </span>
                </div>
              </div>

              {/* SECTION 1: REPORT NUMBERS AND ASUNTO */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold font-mono">1</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Datos de Cabecera</h3>
                    <p className="text-[10px] text-slate-400">Autocompletado desde OT + Cliente. Todos editables.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">CÓDIGO DE INFORME OFICIAL (Ref. de Portada)</label>
                    <input 
                      type="text" 
                      value={informeN}
                      onChange={(e) => setInformeN(e.target.value)}
                      placeholder="Ej. INF-2026-4101"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">N° HOJA DE SERVICIO EN CAMPO</label>
                    <input 
                      type="text" 
                      value={hojaServicioN}
                      onChange={(e) => setHojaServicioN(e.target.value)}
                      placeholder="Ej. HJ-544-4101"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">ASUNTO DE SERVICIO</label>
                    <input 
                      type="text" 
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Ej. MANTENIMIENTO PREVENTIVO DE UPS"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">FECHA DE EMISIÓN DE REPORTE</label>
                    <input 
                      type="date" 
                      value={fechaServicio}
                      onChange={(e) => setFechaServicio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">HORA DE INICIO SERVICIO</label>
                    <input 
                      type="time" 
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">DESCRIPCIÓN DE ANTECEDENTES (Pág 2)</label>
                  <textarea 
                    rows={3}
                    value={antecedentes}
                    onChange={(e) => setAntecedentes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
                    placeholder="Mención de la coordinación inicial con los ingenieros a cargo en la sala crítica..."
                  />
                </div>
              </div>


              {/* SECTION 2: ACTIONS REALIZADAS CHECKLIST */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold font-mono">2</span>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Acciones Realizadas</h3>
                      <p className="text-[10px] text-slate-400">24 checkboxes con presets por tipo de servicio.</p>
                    </div>
                    <div className="space-x-2">
                      <button 
                        type="button" 
                        onClick={() => setAccionesRealizadas(ALL_ACCIONES)}
                        className="text-[9px] text-blue-600 font-bold uppercase hover:underline"
                      >
                        Marcar todas
                      </button>
                      <span className="text-[9px] text-slate-350">|</span>
                      <button 
                        type="button" 
                        onClick={() => setAccionesRealizadas([])}
                        className="text-[9px] text-slate-500 font-bold uppercase hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 max-h-[180px] overflow-y-auto border border-slate-150 p-3 rounded-lg bg-slate-50">
                  {ALL_ACCIONES.map((accion, idx) => {
                    const isChecked = accionesRealizadas.includes(accion);
                    return (
                      <label key={idx} className="flex items-center gap-2 text-[10px] text-slate-705 p-1 rounded hover:bg-white select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAccion(accion)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                        />
                        <span className={isChecked ? 'font-semibold text-slate-900' : 'text-slate-600'}>{accion}</span>
                      </label>
                    );
                  })}
                </div>
              </div>


              {/* SECTION 3: PROCEDIMIENTOS CRONOGRAMA */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold font-mono">3</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Pasos del Procedimiento</h3>
                    <p className="text-[10px] text-slate-400">Lista dinámica según tipo de servicio.</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-blue-800 font-mono block">Paso 1: Visualización y estado inicial de transferencia</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[8px] text-slate-400 font-semibold block uppercase">¿Se encontró operativo?</label>
                        <select 
                          value={paso1_si_no} 
                          onChange={(e) => setPaso1_si_no(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full"
                        >
                          <option value="si">SI</option>
                          <option value="no">NO</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-semibold block uppercase">Modo de Operación</label>
                        <select 
                          value={paso1_funcionamiento} 
                          onChange={(e) => setPaso1_funcionamiento(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full"
                        >
                          <option value="modo inversor">Modo Inversor</option>
                          <option value="bypass">Modo Bypass</option>
                          <option value="apagado">Apagado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-semibold block uppercase">Derivación Bypass</label>
                        <select 
                          value={paso1_bypass} 
                          onChange={(e) => setPaso1_bypass(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full"
                        >
                          <option value="interno">Bypass Interno</option>
                          <option value="externo">Bypass de Tablero Externo</option>
                          <option value="no">Ninguno</option>
                        </select>
                      </div>
                    </div>
                    <textarea 
                      rows={2}
                      value={paso1}
                      onChange={(e) => setPaso1(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] mt-2 font-sans"
                      placeholder="Descripción del paso 1..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Paso 2: Apertura y seguridad</span>
                      <textarea 
                        rows={2}
                        value={paso2}
                        onChange={(e) => setPaso2(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Paso 3: Limpieza de tarjetas y bornes</span>
                      <textarea 
                        rows={2}
                        value={paso3}
                        onChange={(e) => setPaso3(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Paso 4: Mediciones físicas del banco</span>
                      <textarea 
                        rows={2}
                        value={paso4}
                        onChange={(e) => setPaso4(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Paso 5: Pruebas con carga y simulacro</span>
                      <textarea 
                        rows={2}
                        value={paso5}
                        onChange={(e) => setPaso5(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-blue-800 font-mono block">Paso 6: Concluido y Estado Final</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                      <div>
                        <label className="text-[8px] text-slate-400 font-semibold block uppercase">¿Operatividad Concluida con éxito?</label>
                        <select 
                          value={paso6_concluido} 
                          onChange={(e) => setPaso6_concluido(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full font-bold text-emerald-650"
                        >
                          <option value="si">SI - El UPS queda operativo en modo Inversor</option>
                          <option value="no">NO - El equipo queda inoperativo o requiere corrección</option>
                        </select>
                      </div>
                      {paso6_concluido === 'no' && (
                        <div>
                          <label className="text-[8px] text-slate-400 font-semibold block uppercase">Observaciones Críticas Detectadas</label>
                          <input 
                            type="text"
                            value={paso6_observaciones}
                            onChange={(e) => setPaso6_observaciones(e.target.value)}
                            className="bg-white border border-slate-200 rounded p-1 text-xs w-full text-red-600 font-bold"
                            placeholder="Anote el repuesto o causa de falla..."
                          />
                        </div>
                      )}
                    </div>
                    <textarea 
                      rows={2}
                      value={paso6}
                      onChange={(e) => setPaso6(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] font-sans"
                    />
                  </div>
                </div>
              </div>


              {/* SECTION 4: ELECTRICAL MEASUREMENTS PARAMS PÁG 8 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold font-mono">4</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Mediciones Eléctricas</h3>
                    <p className="text-[10px] text-slate-400">Condicional por tipo. Trifásico R/S/T vs Monofásico.</p>
                  </div>
                </div>

                {/* Grid layout for Entrada parameters */}
                <div className="space-y-3.5">
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <span className="text-[10px] text-blue-900 font-bold uppercase font-mono block mb-2">A. MEDICIONES DE ENTRADA (VOLTS & AMPS)</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono font-bold text-slate-400">
                      <div>PARÁMETRO</div>
                      <div>FASE R (RS)</div>
                      <div>FASE S (ST)</div>
                      <div>FASE T (TR)</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center mt-2.5">
                      <div className="text-[10px] text-slate-650 font-sans font-bold">L - N Voltaje (V)</div>
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnVoltaje[0]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnVoltaje];
                          updated[0] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnVoltaje[1]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnVoltaje];
                          updated[1] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnVoltaje[2]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnVoltaje];
                          updated[2] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center mt-2">
                      <div className="text-[10px] text-slate-650 font-sans font-bold">L - N Intensidad (A)</div>
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnIntensidad[0]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnIntensidad];
                          updated[0] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnIntensidad[1]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnIntensidad];
                          updated[1] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.lnIntensidad[2]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.lnIntensidad];
                          updated[2] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center mt-2 border-t border-slate-150 pt-2">
                      <div className="text-[10px] text-slate-650 font-sans font-bold">L - L Voltaje (V)</div>
                      <input 
                        type="text" 
                        value={medicionesEntrada.llVoltaje[0]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.llVoltaje];
                          updated[0] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, llVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.llVoltaje[1]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.llVoltaje];
                          updated[1] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, llVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesEntrada.llVoltaje[2]} 
                        onChange={(e) => {
                          const updated = [...medicionesEntrada.llVoltaje];
                          updated[2] = e.target.value;
                          setMedicionesEntrada({...medicionesEntrada, llVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <span className="text-[10px] text-indigo-900 font-bold uppercase font-mono block mb-2">B. MEDICIONES DE SALIDA (CARGA APLICADA)</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono font-bold text-slate-400">
                      <div>PARÁMETRO</div>
                      <div>FASE R (RS)</div>
                      <div>FASE S (ST)</div>
                      <div>FASE T (TR)</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center mt-2.5">
                      <div className="text-[10px] text-slate-650 font-sans font-bold">L - N Voltaje (V)</div>
                      <input 
                        type="text" 
                        value={medicionesSalida.lnVoltaje[0]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnVoltaje];
                          updated[0] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesSalida.lnVoltaje[1]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnVoltaje];
                          updated[1] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesSalida.lnVoltaje[2]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnVoltaje];
                          updated[2] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnVoltaje: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center mt-2">
                      <div className="text-[10px] text-slate-650 font-sans font-bold">L - N Intensidad (A)</div>
                      <input 
                        type="text" 
                        value={medicionesSalida.lnIntensidad[0]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnIntensidad];
                          updated[0] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesSalida.lnIntensidad[1]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnIntensidad];
                          updated[1] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                      <input 
                        type="text" 
                        value={medicionesSalida.lnIntensidad[2]} 
                        onChange={(e) => {
                          const updated = [...medicionesSalida.lnIntensidad];
                          updated[2] = e.target.value;
                          setMedicionesSalida({...medicionesSalida, lnIntensidad: updated as any});
                        }}
                        className="bg-white border border-slate-250 p-1 rounded text-center text-xs font-semibold font-mono" 
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 5: ALIGNED PHYSICAL PHOTO SLOTS (Pág 5/6/7) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold font-mono">5</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Fotografías del Servicio
                      </h3>
                      <p className="text-[10px] text-slate-400">Slots según tipo + potencia. Cámara o galería.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded font-bold">
                    Requiere {fotosLabeled.length} Fotos
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 select-none">
                  <AlertOctagon size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    <strong>REGLA DE CAPACIDAD S.L.A:</strong> Para este equipo de <strong>{selectedOt.potenciaKva} KVA</strong>, es obligatorio cargar fotografías específicas con encuadres numerados para posibilitar la posterior aprobación y descarga de informes oficiales.
                  </p>
                </div>

                {/* Dynamic photo dimension configurations panel */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">
                      Dimensiones Asignadas en Formulario
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans">
                      Cambie las dimensiones límite de exportación. Las fotos cargadas se recortarán y escalarán al tamaño exacto definido en tiempo real.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Preestablecer Relación</label>
                      <select
                        value={sizePreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="800x600">800 x 600 px (4:3 Estándar)</option>
                        <option value="1024x768">1024 x 768 px (4:3 HQ)</option>
                        <option value="640x480">640 x 480 px (4:3 Compacto)</option>
                        <option value="custom">Personalizado (Asignar manual)</option>
                      </select>
                    </div>

                    {sizePreset === 'custom' && (
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Ancho (px)</label>
                          <input
                            type="number"
                            value={photoWidth}
                            onChange={(e) => setPhotoWidth(Math.max(10, parseInt(e.target.value) || 800))}
                            className="bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-mono font-bold text-center w-20 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <span className="text-slate-400 text-xs mt-3">×</span>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Alto (px)</label>
                          <input
                            type="number"
                            value={photoHeight}
                            onChange={(e) => setPhotoHeight(Math.max(10, parseInt(e.target.value) || 600))}
                            className="bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-mono font-bold text-center w-20 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Highly aligned photo grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fotosLabeled.map((slot, idx) => (
                    <div 
                      key={idx} 
                      className={`border p-3.5 rounded-lg flex flex-col justify-between space-y-3 transition-all ${
                        slot.base64 ? 'border-emerald-250 bg-emerald-50/10' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-[8px] font-bold text-slate-400 font-mono uppercase tracking-wider block">FOTO S.L.A SLOT #{idx+1}</span>
                        <strong className="text-[10px] text-slate-800 uppercase block font-sans truncate">{slot.slotName}</strong>
                      </div>

                      {slot.base64 ? (
                        <div className="relative aspect-[4/3] rounded border border-slate-300 overflow-hidden group">
                          <img 
                            src={slot.base64} 
                            alt={slot.slotName} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <span className="text-[10px] text-white font-mono bg-slate-900/60 p-1 px-2 rounded-full border border-white/10 mb-2 select-none">
                              {photoWidth} × {photoHeight} px (Ajustada)
                            </span>
                            <div className="flex items-center gap-2">
                              {/* Re-load or replace file */}
                              <label
                                className="bg-white/90 hover:bg-white text-slate-900 rounded p-1.5 shadow cursor-pointer text-xs font-bold font-mono transition-transform"
                                title="Cambiar fotografía"
                              >
                                <Camera size={13} className="inline mr-1" />
                                <span>Cargar archivo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(idx, file);
                                  }}
                                />
                              </label>
                              
                              <button
                                type="button"
                                onClick={() => handleClearPhotoForSlot(idx)}
                                className="bg-red-500/90 hover:bg-red-600 text-white rounded p-1.5 shadow cursor-pointer"
                                title="Borrar foto"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <span className="absolute top-2 left-2 bg-slate-950/70 text-emerald-400 font-mono text-[8px] rounded px-1.5 py-0.5 border border-emerald-500/20 select-none">
                            AJUSTADA: {photoWidth}×{photoHeight} px
                          </span>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-amber-400', 'bg-amber-50/10');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/10');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/10');
                            const file = e.dataTransfer.files?.[0];
                            if (file) handlePhotoUpload(idx, file);
                          }}
                          className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded hover:border-amber-400 hover:bg-white flex flex-col items-center justify-center p-4 text-slate-400 transition-all select-none space-y-1 text-center"
                        >
                          <UploadCloud size={20} className="text-slate-350 animate-pulse" />
                          <div className="text-[10px] font-sans font-bold text-slate-700">
                            Arrastre una imagen aquí
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">
                            o
                          </span>
                          
                          {/* File input button trigger */}
                          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer font-sans transition-colors block border border-slate-250 hover:border-slate-350 shadow-xs">
                            <span>Seleccionar archivo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(idx, file);
                              }}
                            />
                          </label>

                          <div className="text-[8px] text-slate-400 font-mono leading-none pt-1">
                            Ajuste automático a {photoWidth}×{photoHeight} px
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCapturePhotoForSlot(idx)}
                            className="text-[8px] text-indigo-500 hover:underline font-mono"
                          >
                            [Simular instantánea]
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>


              {/* SECTION 6: COMPLIANCE, SYSTEM AND PREDEFINED RECOMMENDATIONS */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold font-mono">6</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Diagnóstico + Recomendaciones</h3>
                    <p className="text-[10px] text-slate-400">Bullets editables con presets por tipo de servicio.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Especificaciones Generales Gabinete</span>
                    
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">¿Cuenta con Gabinete?</label>
                        <select 
                          value={cuentaConGabinete} 
                          onChange={(e) => setCuentaConGabinete(e.target.value as any)}
                          className="bg-white border border-slate-200 p-1 rounded text-xs w-full"
                        >
                          <option value="si">SI - En Gabinete corporativo</option>
                          <option value="no">NO - Sin gabinete adosado</option>
                        </select>
                      </div>

                      {cuentaConGabinete === 'si' && (
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">Tipo Estructura</label>
                          <select 
                            value={tipoEstructura} 
                            onChange={(e) => setTipoEstructura(e.target.value as any)}
                            className="bg-white border border-slate-200 p-1 rounded text-xs w-full"
                          >
                            <option value="modo Rack">Modo Rack</option>
                            <option value="Torre">Torre</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Historial Baterías e Infraestructura S.L.A</span>
                    
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Año Fab. Baterías</label>
                        <input 
                          type="number" 
                          value={anioBaterias}
                          onChange={(e) => setAnioBaterias(parseInt(e.target.value) || 2022)}
                          className="bg-white border border-slate-200 p-1 rounded text-xs w-full font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">Temperatura Promedio (°C)</label>
                        <input 
                          type="number" 
                          value={temperaturaSala}
                          onChange={(e) => setTemperaturaSala(parseInt(e.target.value) || 21)}
                          className="bg-white border border-slate-200 p-1 rounded text-xs w-full font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Predefined recommendations */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-450 uppercase font-mono block">Seleccione Recomendaciones Corporativas Predefinidas</span>
                  
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto border border-slate-200 p-3 rounded-lg bg-slate-50">
                    {DEFAULT_RECOMENDACIONES.map((rec, idx) => {
                      const isChecked = recomendaciones.includes(rec);
                      return (
                        <label key={idx} className="flex items-start gap-2 text-[9px] text-slate-700 p-1 hover:bg-white select-none cursor-pointer rounded">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRecomendacion(rec)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 mt-0.5 shrink-0"
                          />
                          <span>{rec}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 10: REVISION FINAL */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm space-y-3 border-l-4 border-l-emerald-400">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">7</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Revisión Final y Envío</h3>
                  <p className="text-[10px] text-slate-400">Resumen del informe antes de enviar.</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Tipo Servicio:</span><span className="font-bold text-slate-700">{tipoServicio}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Informe N:</span><span className="text-slate-700">{informeN || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Pasos:</span><span className="text-slate-700">{getTemplate(tipoServicio).pasos.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fotos:</span><span className="text-slate-700">{fotosLabeled.filter(f => f.base64).length}/{fotosLabeled.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Online:</span>
                  <span className={isOnline ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{isOnline ? 'Conectado' : 'Offline'}</span>
                </div>
                <hr className="border-slate-200 my-1" />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingReport(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => saveActiveDraft(true)}
                    disabled={selectedOt?.estado === OTStatus.EN_REVISION || selectedOt?.estado === OTStatus.APROBADA || selectedOt?.estado === OTStatus.FIRMADA}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Guardar Borrador
                  </button>
                  <button
                    type="submit"
                    disabled={selectedOt?.estado === OTStatus.EN_REVISION || selectedOt?.estado === OTStatus.APROBADA || selectedOt?.estado === OTStatus.FIRMADA}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Enviar Informe
                  </button>
                </div>
              </div>
            </div>

          </form>
          )
        ) : (
          /* When isEditingReport is false */
          selectedOt ? (
            /* Show beautiful selected OT overview dashboard with active Create Report button */
            <div className="p-6 md:p-8 space-y-6 font-sans animate-fade-in text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-slate-900 font-extrabold text-base uppercase font-mono tracking-tight">{selectedOt.id}</h2>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono">Asignada</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Orden de Trabajo Oficial de Campo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Estado actual:</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                    selectedOt.estado === OTStatus.PROGRAMADA ? 'bg-slate-50 text-slate-650 border-slate-200' :
                    selectedOt.estado === OTStatus.EN_CAMINO ? 'bg-sky-50 text-sky-600 border-sky-200 animate-pulse' :
                    selectedOt.estado === OTStatus.EN_SITIO ? 'bg-teal-50 text-teal-600 border-teal-200' :
                    selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' :
                    selectedOt.estado === OTStatus.INFORME_PENDIENTE ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                    selectedOt.estado === OTStatus.EN_REVISION ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    selectedOt.estado === OTStatus.OBSERVADA ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedOt.estado}
                  </span>
                </div>
              </div>

              {/* Progress Stepper tracker */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150/80">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3 text-left">Flujo de Trabajo S.L.A</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 text-center text-[8px] font-mono font-bold text-slate-400">
                  <div className={`p-1.5 rounded ${selectedOt.estado === OTStatus.PROGRAMADA ? 'bg-slate-200 text-slate-700 font-black' : 'bg-slate-100 text-slate-400'}`}>1. PROGRAMADA</div>
                  <div className={`p-1.5 rounded ${selectedOt.estado === OTStatus.EN_CAMINO ? 'bg-sky-100 text-sky-700 font-black' : 'bg-slate-100 text-slate-400'}`}>2. EN CAMINO</div>
                  <div className={`p-1.5 rounded ${selectedOt.estado === OTStatus.EN_SITIO ? 'bg-teal-100 text-teal-700 font-black' : 'bg-slate-100 text-slate-400'}`}>3. EN SITIO</div>
                  <div className={`p-1.5 rounded ${selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION ? 'bg-blue-100 text-blue-700 font-black animate-pulse' : 'bg-slate-100 text-slate-400'}`}>4. EJECUCIÓN</div>
                  <div className={`p-1.5 rounded ${[OTStatus.INFORME_PENDIENTE, OTStatus.EN_REVISION, OTStatus.OBSERVADA].includes(selectedOt.estado) ? 'bg-amber-100 text-amber-700 font-black' : 'bg-slate-100 text-slate-400'}`}>5. INFORME</div>
                  <div className={`p-1.5 rounded ${[OTStatus.APROBADA, OTStatus.FIRMADA, OTStatus.CERRADA].includes(selectedOt.estado) ? 'bg-emerald-100 text-emerald-700 font-black' : 'bg-slate-100 text-slate-400'}`}>6. REALIZADO</div>
                </div>
              </div>

              {/* Metadata Grid */}
              {(() => {
                const otClient = clients.find(c => c.id === selectedOt.clientId);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-4">
                      <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-white">
                        <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 size={13} className="text-indigo-600" />
                          <span>Datos del Cliente (Registrados por Ventas)</span>
                        </h3>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">Razón Social</span>
                          <span className="text-xs font-extrabold text-slate-800 uppercase">
                            {otClient?.razonSocial || 'Cliente General S.A.'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">RUC</span>
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            {otClient?.ruc || '20100200300'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">Sede de Servicio / Distrito</span>
                          <span className="text-xs font-medium text-slate-600">
                            {otClient?.direccionSede || 'Sede Principal'}, {otClient?.distrito || 'Lima'}
                          </span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5 space-y-2">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">Información de Contacto</span>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-400 block">Nombre Contacto</span>
                              <strong className="text-slate-700 block">{otClient?.contactoNombre || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-400 block">Teléfono</span>
                              <strong className="text-slate-700 block font-mono">{otClient?.contactoTelefono || 'N/A'}</strong>
                            </div>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono text-slate-400 block">Correo Electrónico</span>
                            <strong className="text-slate-700 block font-mono text-[10px] break-all">{otClient?.contactoEmail || 'N/A'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-white">
                        <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                          <Settings2 size={13} className="text-indigo-600" />
                          <span>Especificaciones Técnicas (Registrados por Ventas)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Tipo de Equipo</span>
                            <span className="text-xs font-extrabold text-slate-800">{selectedOt.tipoEquipo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Potencia Requerida</span>
                            <span className="text-xs font-extrabold text-slate-800 font-mono">{selectedOt.potenciaKva} KVA</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Grupo Mantenimiento</span>
                            <span className="text-xs font-bold text-indigo-650 font-mono">{selectedOt.tipoMantenimiento}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Fecha Programada</span>
                            <span className="text-xs font-medium text-slate-600 font-mono">{selectedOt.fechaProgramada}</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">Personal Técnico</span>
                          <span className="text-xs text-slate-700 block mt-0.5 font-sans">
                            👤 Titular: <strong>{selectedOt.tecnicoTitular}</strong>
                          </span>
                          {(selectedOt.tecnicosAdicionalesNombres && selectedOt.tecnicosAdicionalesNombres.length > 0) ? (
                            <span className="text-xs text-slate-500 block mt-0.5 font-sans">
                              👥 Apoyo: <strong>{selectedOt.tecnicosAdicionalesNombres.join(', ')}</strong>
                            </span>
                          ) : selectedOt.tecnicoApoyo ? (
                            <span className="text-xs text-slate-500 block mt-0.5 font-sans">
                              👥 Apoyo: <strong>{selectedOt.tecnicoApoyo}</strong>
                            </span>
                          ) : null}
                          {selectedOt.horaInicioServicio && (
                            <span className="text-[10px] text-emerald-600 block mt-1.5 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                              ⏱️ INICIO REAL: {selectedOt.horaInicioServicio}
                            </span>
                          )}
                          {selectedOt.horaFinServicio && (
                            <span className="text-[10px] text-red-600 block mt-1 font-mono font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block">
                              🏁 FIN REAL: {selectedOt.horaFinServicio}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ACTION CARD */}
              <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-2 max-w-xl z-10 text-left">
                  <h3 className="text-white text-sm font-bold uppercase font-mono flex items-center gap-2">
                    <FileCheck className="text-amber-400 animate-pulse" size={16} />
                    <span>Emisión de Informe Técnico Oficial</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Al activar el botón inferior, se iniciará el cuestionario estructurado dinámico Mafort de doble marco. 
                    El número de mediciones, estado de celdas y capturas fotográficas obligatorias se configurarán automáticamente según la potencia de <strong>{selectedOt.potenciaKva} KVA</strong> de la OT seleccionada.
                  </p>
                </div>

                <div className="shrink-0 z-10 w-full md:w-auto flex flex-col md:flex-row gap-3">
                  {(() => {
                    const isTitular = normalizeName(selectedOt.tecnicoTitular) === normalizedCurrentUser || selectedOt.tecnicoTitularId === currentUser?.id;
                    
                    if (!isTitular) {
                      return (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-3 flex items-center gap-3 text-slate-400">
                          <Users size={20} className="text-blue-400" />
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase font-mono block text-blue-400">Personal de Apoyo</span>
                            <span className="text-xs font-medium">Solo el titular puede gestionar el informe.</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {selectedOt.estado === OTStatus.PROGRAMADA ? (
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                              onUpdateOt({
                                ...selectedOt,
                                estado: OTStatus.EN_CAMINO,
                                horaSalida: now
                              });
                            }}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                          >
                            <MapPin size={18} />
                            <span>Iniciar Ruta (En Camino)</span>
                          </button>
                        ) : selectedOt.estado === OTStatus.EN_CAMINO ? (
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                              onUpdateOt({
                                ...selectedOt,
                                estado: OTStatus.EN_SITIO,
                                horaLlegadaSitio: now
                              });
                            }}
                            className="w-full md:w-auto bg-teal-600 hover:bg-teal-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                          >
                            <MapPin size={18} />
                            <span>Llegada al Sitio (Registrar Entrada)</span>
                          </button>
                        ) : selectedOt.estado === OTStatus.EN_SITIO ? (
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                              onUpdateOt({
                                ...selectedOt,
                                estado: OTStatus.TRABAJO_EN_EJECUCION,
                                horaInicioServicio: now
                              });
                            }}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95 animate-pulse"
                          >
                            <Clock size={18} />
                            <span>Iniciar Trabajo (En Ejecución)</span>
                          </button>
                        ) : selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION ? (
                          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => setIsEditingReport(true)}
                              className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                            >
                              <FileCheck size={18} />
                              <span>Llenar Informe Técnico</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: 'Finalizar Servicio',
                                  message: '¿Está seguro de finalizar el servicio? Se registrará la hora de término de los trabajos.',
                                  confirmLabel: 'Finalizar',
                                  tone: 'warning'
                                });
                                if (ok) {
                                  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                  onUpdateOt({
                                    ...selectedOt,
                                    estado: OTStatus.INFORME_PENDIENTE,
                                    horaFinServicio: now
                                  });
                                }
                              }}
                              className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                            >
                              <Clock size={18} />
                              <span>Finalizar Trabajo (Concluir Visita)</span>
                            </button>
                          </div>
                        ) : (
                          // For states like INFORME_PENDIENTE, OBSERVADA, etc.
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReport(true);
                              if (selectedOt.estado === OTStatus.OBSERVADA) {
                                onUpdateOtStatus(selectedOt.id, OTStatus.TRABAJO_EN_EJECUCION);
                              }
                            }}
                            className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                          >
                            <FileCheck size={18} />
                            <span>
                              {selectedOt.estado === OTStatus.OBSERVADA 
                                ? 'Corregir Informe Técnico' 
                                : 'Crear / Editar Informe Técnico'}
                            </span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Default fallback when no OT is selected at all */
            <div className="p-16 text-center text-slate-400 space-y-4 py-24 select-none animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
                <BookOpen className="text-slate-350" size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-slate-800 font-bold text-sm">Ficha Técnica y Fotografías Alineadas Mafort</h3>
                <p className="text-xs text-slate-400">
                  Seleccione una de sus Órdenes de Trabajo programadas del lateral izquierdo para abrir los detalles y activar la creación del informe técnico de campo.
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {toastView}
      {confirmView}
    </div>
    </ErrorBoundary>
  );
}
