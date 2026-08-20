import React, { useState, useMemo } from 'react';
import { UserPlus, MapPin, Wrench, Calendar as CalendarIcon, 
  Bell, Smartphone, Info, ChevronLeft, ChevronRight, ChevronDown,
  Cpu, Plus, Zap, Search, Layers, CheckCircle2, FileText,
  ThumbsUp, ThumbsDown, AlertTriangle, X, ArrowUpDown, Filter,
  Clock, Eye, ArrowUp, ArrowDown
} from 'lucide-react';
import { OT, OTStatus, Client, TechnicalReport, User } from '../types';
import ModalAsignarTecnico from './ot/ModalAsignarTecnico';
import ModalProgramarVisita from './ot/ModalProgramarVisita';
import ModalDetalleEquipos from './ot/ModalDetalleEquipos';

interface TechMonitoringDashboardProps {
  ots: OT[];
  clients: Client[];
  reports: TechnicalReport[];
  users: User[];
  onUpdateOtStatus?: (otId: string, status: OTStatus) => void;
  onUpdateOt?: (ot: OT) => void;
  onUpdateReport?: (report: TechnicalReport) => void;
  contratosNuevos: any[];
  otEquipoAsignaciones: any[];
  onAddOT: (newOT: OT) => Promise<void>;
}

export default function TechMonitoringDashboard({
  ots,
  clients,
  reports,
  users,
  onUpdateOtStatus,
  onUpdateOt,
  onUpdateReport,
  contratosNuevos = [],
  otEquipoAsignaciones = [],
  onAddOT
}: TechMonitoringDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'contratos' | 'operaciones'>('contratos');
  const [operationsSubTab, setOperationsSubTab] = useState<'resumen' | 'equipos' | 'asignaciones' | 'agenda' | 'informes' | 'historial'>('resumen');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [draggedOt, setDraggedOt] = useState<OT | null>(null);
  const [selectedOtInfo, setSelectedOtInfo] = useState<OT | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [selectedOtForAssign, setSelectedOtForAssign] = useState<OT | null>(null);
  const [dropInitialValues, setDropInitialValues] = useState<{ techId?: string; fecha?: string; hora?: string } | null>(null);
  const [selectedReportForAudit, setSelectedReportForAudit] = useState<TechnicalReport | null>(null);
  const [previewAuditPhoto, setPreviewAuditPhoto] = useState<{ url: string; title: string } | null>(null);
  const [reportFilterStatus, setReportFilterStatus] = useState<'todos' | 'pendientes' | 'observados' | 'aprobados'>('todos');
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());

  const getAuditPhotoSrc = (pic: any, otId: string, idx: number): string => {
    if (typeof pic === 'string' && pic.trim().length > 0) return pic;
    if (pic?.base64 && typeof pic.base64 === 'string' && pic.base64.trim().length > 0) return pic.base64;
    if (pic?.url && typeof pic.url === 'string' && pic.url.trim().length > 0) return pic.url;
    const cleanOt = (otId || '').replace(/^OT-/, '').replace(/[^a-zA-Z0-9_-]/g, "");
    return `/api/photos/${cleanOt}/${idx + 1}`;
  };
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [contractFilterChip, setContractFilterChip] = useState<'todos' | 'atencion' | 'por_vencer' | 'sin_visitas'>('todos');
  const [contractSortCol, setContractSortCol] = useState<'default' | 'vigencia' | 'estado'>('default');
  const [contractSortDir, setContractSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredReportsForDashboard = useMemo(() => {
    return reports.filter(r => {
      const otStatus = ots.find(o => o.id === r.otId)?.estado;
      if (reportFilterStatus === 'pendientes') {
        return otStatus === OTStatus.EN_REVISION;
      }
      if (reportFilterStatus === 'observados') {
        return otStatus === OTStatus.OBSERVADA;
      }
      if (reportFilterStatus === 'aprobados') {
        return otStatus === OTStatus.APROBADA || otStatus === OTStatus.FIRMADA;
      }
      return true;
    });
  }, [reports, ots, reportFilterStatus]);

  const toggleContract = (id: string) => {
    setExpandedContracts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTotalKva = (equipos: any[]) =>
    equipos.reduce((sum: number, eq: any) => sum + (Number(eq.potenciaKva) || 0), 0);

  // ---- Computed contract stats for KPIs, chips, sorting ----
  const contractStats = useMemo(() => {
    return contratosNuevos.map((contract: any) => {
      const primaryEquipments = contract.equipos || [];
      const adendas = contract.ampliaciones || [];
      const allEquipments = [...primaryEquipments];
      adendas.forEach((adenda: any) => {
        const adendaEquips = adenda.equiposAdenda
          ? adenda.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean)
          : [];
        adendaEquips.forEach((eq: any) => {
          if (!allEquipments.some((e: any) => e.id === eq.id)) {
            allEquipments.push(eq);
          }
        });
      });

      let programadosCount = 0;
      let pendientesCount = 0;
      allEquipments.forEach((eq: any) => {
        const isScheduled = ots.some((ot: any) => {
          if (ot.estado === OTStatus.CERRADA) return false;
          const isAssigned = otEquipoAsignaciones.some((a: any) => a.otId === ot.id && a.equipoId === eq.id);
          if (isAssigned) return true;
          if (ot.equipoId) {
            const ids = ot.equipoId.split(',').map((id: string) => id.trim());
            if (ids.includes(eq.id)) return true;
          }
          return false;
        });
        if (isScheduled) programadosCount++; else pendientesCount++;
      });

      const hasDates = contract.fecha_inicio && contract.fecha_fin && contract.fecha_inicio !== 'S/D' && contract.fecha_fin !== 'S/D';
      let daysLeft = Infinity;
      let totalDays = 1;
      let elapsedDays = 0;
      let nearExpiry = false;
      if (hasDates) {
        const startDate = new Date(contract.fecha_inicio.split('/').reverse().join('-'));
        const endDate = new Date(contract.fecha_fin.split('/').reverse().join('-'));
        daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        elapsedDays = Math.max(0, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        nearExpiry = daysLeft <= 30 && daysLeft >= 0;
      }
      const progressPct = hasDates ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : -1;

      return {
        id: contract.id,
        pendientesCount,
        programadosCount,
        totalEquipos: allEquipments.length,
        allEquipments,
        adendas,
        hasDates,
        daysLeft,
        nearExpiry,
        progressPct,
        needsAttention: pendientesCount > 0,
        sinVisitas: programadosCount === 0 && allEquipments.length > 0,
      };
    });
  }, [contratosNuevos, ots, otEquipoAsignaciones]);

  // Aggregate KPIs
  const contractKpis = useMemo(() => {
    const total = contractStats.length;
    const needAttention = contractStats.filter(s => s.needsAttention).length;
    const nearExpiry = contractStats.filter(s => s.nearExpiry).length;
    const totalEquipos = contractStats.reduce((sum, s) => sum + s.totalEquipos, 0);
    return { total, needAttention, nearExpiry, totalEquipos };
  }, [contractStats]);

  const toggleContractSort = (col: 'vigencia' | 'estado') => {
    if (contractSortCol === col) {
      setContractSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setContractSortCol(col);
      setContractSortDir('asc');
    }
  };

  const resetContractSort = () => {
    setContractSortCol('default');
    setContractSortDir('desc');
  };

  const [selectedContractForSchedule, setSelectedContractForSchedule] = useState<any | null>(null);
  const [selectedAdendaForSchedule, setSelectedAdendaForSchedule] = useState<any | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // States for viewing detailed equipments and histories
  const [selectedContractForEquipments, setSelectedContractForEquipments] = useState<any | null>(null);
  const [isEquipmentsModalOpen, setIsEquipmentsModalOpen] = useState(false);
  
  // States used by the technical dashboard (dynamically loaded from users)
  const techniciansList = useMemo(() => {
    const techsFromDb = users.filter(u => u.role === 'Tecnico' && u.estado === 'Activo');
    if (techsFromDb.length > 0) {
      return techsFromDb.map(u => ({
        id: u.id,
        name: u.username || 'Técnico',
        area: u.area || 'Mantenimiento',
        avatar: (u.username || 'TK').substring(0, 2).toUpperCase(),
        location: 'Base'
      }));
    }
    return [
      { id: 'user_2', name: 'Carlos Ocsa', area: 'Sistemas de Potencia', avatar: 'CO', location: 'Cerca a San Isidro' },
      { id: 'tech_2', name: 'Gino Murillo', area: 'Climatización', avatar: 'GM', location: 'Base Surco' },
      { id: 'user_5', name: 'Juan Córdova', area: 'Seguridad Eléctrica', avatar: 'JC', location: 'Ruta a Miraflores' },
      { id: 'tech_4', name: 'Josué Ale', area: 'Mecatrónica', avatar: 'JA', location: 'Base Surco' }
    ];
  }, [users]);

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  // Assigned OTs for calendar
  const assignedOts = ots.filter(ot => ot.estado !== OTStatus.PENDIENTE_PROGRAMACION && ot.estado !== OTStatus.CREADA);

  const isTechAssignedToOt = (ot: OT, techId: string, techName: string) => {
    // 1. Primary technician check
    if (ot.tecnicoTitularId === techId || (ot.tecnicoTitular && normalizeName(ot.tecnicoTitular) === normalizeName(techName))) {
      return true;
    }
    // 2. Additional technicians check
    if (ot.tecnicosAdicionalesIds?.includes(techId) || ot.tecnicosAdicionalesNombres?.some(name => normalizeName(name) === normalizeName(techName))) {
      return true;
    }
    // 3. Equipment-specific assignments check
    const assignmentsForOt = otEquipoAsignaciones.filter(a => a.otId === ot.id);
    if (assignmentsForOt.length > 0) {
      return assignmentsForOt.some(a => a.tecnicoTitularId === techId || a.tecnicoApoyoId === techId);
    }
    return false;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i; // adjust when day is sunday
    d.setDate(diff);
    return d;
  });

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startingDay = firstDay.getDay(); // 0 is Sunday
    if (startingDay === 0) startingDay = 7;
    
    const days = [];
    // Previous month padding
    for (let i = 1; i < startingDay; i++) {
      const d = new Date(year, month, 1 - (startingDay - i));
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }
    // Next month padding to complete grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - (calendarView === 'week' ? 7 : 1));
    }
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + (calendarView === 'week' ? 7 : 1));
    }
    setCurrentDate(newDate);
  };

  const getOtColorCode = (estado: string) => {
    switch (estado) {
      case OTStatus.PROGRAMADA: return 'bg-blue-100 text-blue-700 border-blue-300 border-l-4 border-l-blue-500'; // Azul = En ruta/Programado
      case OTStatus.TRABAJO_EN_EJECUCION: return 'bg-emerald-100 text-emerald-800 border-emerald-300 border-l-4 border-l-emerald-500'; // Verde = En proceso
      case OTStatus.EN_REVISION:
      case OTStatus.OBSERVADA: return 'bg-amber-100 text-amber-800 border-amber-300 border-l-4 border-l-amber-500'; // Amarillo/Naranja = Revision
      case OTStatus.FIRMADA:
      case OTStatus.APROBADA: return 'bg-slate-100 text-slate-600 border-slate-300 border-l-4 border-l-slate-400'; // Gris = Finalizado
      default: return 'bg-red-50 text-red-700 border-red-200 border-l-4 border-l-red-500'; // Rojo = Pendiente/Urgente
    }
  };

  const isOTFinalizada = (estado: string) => {
    return estado === OTStatus.FIRMADA || estado === OTStatus.APROBADA || estado === OTStatus.FACTURADA || estado === OTStatus.EN_REVISION;
  };

  const normalizeName = (name?: string) => {
    if (!name) return "";
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const getClientName = (clientId?: string, ot?: any) => {
    if (!clientId && !ot) return 'Cliente General';

    // 1. Direct lookup by client.id
    if (clientId) {
      const directClient = clients.find(c => c.id === clientId);
      if (directClient) return directClient.razonSocial;
    }

    // 2. Lookup by ot.contratoId
    const targetContratoId = ot?.contratoId;
    if (targetContratoId) {
      const contract = (contratosNuevos || []).find((ct: any) => ct.id === targetContratoId);
      if (contract) {
        if (contract.cliente) return contract.cliente;
        if (contract.clientId) {
          const contractClient = clients.find(c => c.id === contract.clientId);
          if (contractClient) return contractClient.razonSocial;
        }
      }
    }

    // 3. Partial match or fallback
    if (clientId) {
      const nameMatch = clients.find(c => 
        c.id.toLowerCase() === clientId.toLowerCase() || 
        c.razonSocial.toLowerCase().includes(clientId.toLowerCase())
      );
      if (nameMatch) return nameMatch.razonSocial;
    }

    return clientId || 'Cliente General';
  };

  const getTechWorkload = (techName: string) => {
    return assignedOts.filter(ot => normalizeName(ot.tecnicoTitular) === normalizeName(techName)).length;
  };

  const getOneHourLater = (timeStr: string): string => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const nextHour = (h + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getOtsInTimeSlot = (techName: string, dateStr: string, slotTime: string): OT[] => {
    const [slotH, slotM] = slotTime.split(':').map(Number);
    const slotMinStart = slotH * 60 + slotM;
    const slotMinEnd = slotMinStart + 60;

    return assignedOts.filter(ot => {
      if (normalizeName(ot.tecnicoTitular) !== normalizeName(techName)) return false;
      if (ot.fechaProgramada !== dateStr) return false;

      const startStr = ot.horaProgramada || '09:00';
      const [startH, startM] = startStr.split(':').map(Number);
      const startMin = startH * 60 + startM;

      let endMin = startMin + 60;
      if (ot.horaFinProgramada) {
        const [endH, endM] = ot.horaFinProgramada.split(':').map(Number);
        endMin = endH * 60 + endM;
      }

      return startMin < slotMinEnd && endMin > slotMinStart;
    });
  };

  const getOtDurationInHours = (ot: OT): number => {
    const startStr = ot.horaProgramada || '09:00';
    const endStr = ot.horaFinProgramada;
    if (!endStr) return 1.0;
    
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    
    const diffMin = endMin - startMin;
    if (diffMin <= 0) return 1.0;
    
    return diffMin / 60;
  };

  const doesOtStartInSlot = (ot: OT, slotTime: string): boolean => {
    const startStr = ot.horaProgramada || '09:00';
    const [startH] = startStr.split(':');
    const [slotH] = slotTime.split(':');
    return parseInt(startH) === parseInt(slotH);
  };

  const handleDragStart = (e: React.DragEvent, ot: OT) => {
    if (isOTFinalizada(ot.estado)) {
      e.preventDefault();
      return;
    }
    setDraggedOt(ot);
    e.dataTransfer.setData('text/plain', ot.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, techName: string, time: string, dateStr?: string) => {
    e.preventDefault();
    if (draggedOt) {
      const tech = users.find(u => normalizeName(u.username) === normalizeName(techName));
      setDropInitialValues({
        techId: tech?.id,
        fecha: dateStr || currentDate.toISOString().split('T')[0],
        hora: time
      });
      setSelectedOtForAssign(draggedOt);
    }
  };

  // Formateador dinámico para el encabezado del calendario
  const getCalendarHeaderTitle = () => {
    if (calendarView === 'day') {
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const formattedDate = currentDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      if (isToday) {
        return `Hoy, ${formattedDate}`;
      } else {
        const dayName = currentDate.toLocaleDateString('es-PE', { weekday: 'long' });
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${capitalizedDayName}, ${formattedDate}`;
      }
    } else if (calendarView === 'week') {
      return `Semana ${currentDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`;
    } else {
      return currentDate.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans rounded-2xl overflow-hidden">
      {/* Barra de Alertas y Notificaciones */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-200/80 shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold tracking-wider text-emerald-600 uppercase">Monitoreo Activo</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
            <Bell size={12} className="text-amber-500" />
            <span className="text-slate-600">Última alerta: <strong className="text-slate-900">Nueva OT creada hace 5 min</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-slate-200 bg-white px-2 py-1 rounded-md shadow-sm">
            <Smartphone size={12} className="text-[#33337A]" />
            <span className="font-mono text-[10px] text-slate-600">Sincronización Móvil: <strong className="text-emerald-600">100% (4/4 Online)</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel de Programación (Vista Principal) */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Main Module Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shrink-0" data-tour="programar-visita">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
                <button 
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'contratos' ? 'bg-white shadow text-teal-650' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('contratos')}
                >
                  <Wrench size={14} />
                  <span>Contratos y Adendas</span>
                </button>
                <button 
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'operaciones' ? 'bg-white shadow text-blue-650' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('operaciones')}
                >
                  <Layers size={14} />
                  <span>Centro de Operaciones</span>
                </button>
              </div>

              {/* Calendar controls only when on operations tab and agenda sub-tab */}
              {activeTab === 'operaciones' && operationsSubTab === 'agenda' && (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${calendarView === 'day' ? 'bg-white shadow text-blue-650' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('day')}>Día</button>
                    <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${calendarView === 'week' ? 'bg-white shadow text-blue-650' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('week')}>Semana</button>
                    <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${calendarView === 'month' ? 'bg-white shadow text-blue-650' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('month')}>Mes</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevDay} className="p-1 hover:bg-slate-100 rounded-full text-slate-650 cursor-pointer"><ChevronLeft size={16} /></button>
                    <span className="font-mono font-bold text-xs text-slate-700 min-w-[150px] text-center">
                      {getCalendarHeaderTitle()}
                    </span>
                    <button onClick={handleNextDay} className="p-1 hover:bg-slate-100 rounded-full text-slate-650 cursor-pointer"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-tabs bar under Operations tab */}
            {activeTab === 'operaciones' && (
              <div className="flex gap-2 border-t border-slate-100 pt-3 overflow-x-auto text-[11px] font-black uppercase tracking-wider font-mono">
                {(['resumen', 'equipos', 'asignaciones', 'agenda', 'informes', 'historial'] as const).map((tab) => {
                  const isActive = operationsSubTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setOperationsSubTab(tab)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {tab === 'resumen' && "Resumen"}
                      {tab === 'equipos' && "Equipos"}
                      {tab === 'asignaciones' && "Asignaciones"}
                      {tab === 'agenda' && "Agenda (Calendario)"}
                      {tab === 'informes' && "Informes"}
                      {tab === 'historial' && "Historial"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeTab === 'contratos' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 text-left">
              <div className="max-w-6xl mx-auto">
                {/* 1. Header & Quick Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-lg uppercase tracking-wider">
                      Contratos y Adendas Activas
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {contractKpis.total} contratos registrados · <span className={contractKpis.needAttention > 0 ? "text-amber-600 font-bold" : "text-slate-500"}>{contractKpis.needAttention} requieren atención</span>
                    </p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, contrato o tipo..."
                      value={contractSearchQuery}
                      onChange={e => { setContractSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:border-[#00B594] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 2. KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Contratos</span>
                      <strong className="text-lg font-mono font-bold text-slate-800">{contractKpis.total}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Con Pendientes</span>
                      <strong className="text-lg font-mono font-bold text-amber-700">{contractKpis.needAttention}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Por Vencer (30d)</span>
                      <strong className="text-lg font-mono font-bold text-slate-800">{contractKpis.nearExpiry}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Zap size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Equipos Totales</span>
                      <strong className="text-lg font-mono font-bold text-slate-800">{contractKpis.totalEquipos}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Filter Chips Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold mr-1 shrink-0">
                    <Filter size={12} /> Filtrar:
                  </span>

                  <button
                    onClick={() => { setContractFilterChip('todos'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 cursor-pointer ${
                      contractFilterChip === 'todos'
                        ? 'bg-[#00B594] text-white border-[#00B594] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Todos <span className="ml-1 px-1.5 py-0.2 bg-black/10 rounded-full text-[10px]">{contractKpis.total}</span>
                  </button>

                  <button
                    onClick={() => { setContractFilterChip('atencion'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 cursor-pointer ${
                      contractFilterChip === 'atencion'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Requieren atención <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">{contractKpis.needAttention}</span>
                  </button>

                  <button
                    onClick={() => { setContractFilterChip('por_vencer'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 cursor-pointer ${
                      contractFilterChip === 'por_vencer'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Por vencer (30 días) <span className="ml-1 px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px]">{contractKpis.nearExpiry}</span>
                  </button>

                  <button
                    onClick={() => { setContractFilterChip('sin_visitas'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 cursor-pointer ${
                      contractFilterChip === 'sin_visitas'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Sin visitas programadas <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px]">{contractStats.filter(s => s.sinVisitas).length}</span>
                  </button>
                </div>

                {/* 4. Processing Dataset (Filter & Sort) */}
                {(() => {
                  const filtered = contratosNuevos.filter((c: any) => {
                    const stats = contractStats.find(s => s.id === c.id);
                    if (!stats) return true;

                    // Chip filter
                    if (contractFilterChip === 'atencion' && !stats.needsAttention) return false;
                    if (contractFilterChip === 'por_vencer' && !stats.nearExpiry) return false;
                    if (contractFilterChip === 'sin_visitas' && !stats.sinVisitas) return false;

                    // Search query
                    const q = contractSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    const num = (c.n_contrato || c.id.replace('cont_', '')).toLowerCase();
                    const cliente = (c.cliente || '').toLowerCase();
                    const tipo = (c.tipo_contrato || '').toLowerCase();
                    return num.includes(q) || cliente.includes(q) || tipo.includes(q);
                  });

                  // Sorting logic
                  const sorted = [...filtered].sort((a: any, b: any) => {
                    const statsA = contractStats.find(s => s.id === a.id);
                    const statsB = contractStats.find(s => s.id === b.id);
                    if (!statsA || !statsB) return 0;

                    if (contractSortCol === 'vigencia') {
                      const daysA = statsA.daysLeft === Infinity ? -99999 : statsA.daysLeft;
                      const daysB = statsB.daysLeft === Infinity ? -99999 : statsB.daysLeft;
                      return contractSortDir === 'asc' ? daysA - daysB : daysB - daysA;
                    }

                    if (contractSortCol === 'estado') {
                      const pendA = statsA.pendientesCount;
                      const pendB = statsB.pendientesCount;
                      return contractSortDir === 'asc' ? pendA - pendB : pendB - pendA;
                    }

                    // Default order: Attention required first (highest pendientes first), then client A-Z
                    if (statsA.needsAttention !== statsB.needsAttention) {
                      return statsA.needsAttention ? -1 : 1;
                    }
                    if (statsA.pendientesCount !== statsB.pendientesCount) {
                      return statsB.pendientesCount - statsA.pendientesCount;
                    }
                    return (a.cliente || '').localeCompare(b.cliente || '');
                  });

                  const totalItems = sorted.length;
                  const usePagination = totalItems > ITEMS_PER_PAGE;
                  const totalPages = usePagination ? Math.ceil(totalItems / ITEMS_PER_PAGE) : 1;
                  const safePage = Math.min(currentPage, totalPages);
                  const displayList = usePagination
                    ? sorted.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
                    : sorted;

                  return (
                    <div className="space-y-4">
                      {/* Desktop Table View */}
                      <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase tracking-wider select-none">
                              <th className="py-3 px-4 font-bold">Cliente / Contrato</th>
                              <th className="py-3 px-3 font-bold">Tipo de Servicio</th>
                              <th 
                                className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-200/60 transition-colors"
                                onClick={() => toggleContractSort('vigencia')}
                              >
                                <div className="flex items-center gap-1">
                                  <span>Vigencia</span>
                                  {contractSortCol === 'vigencia' ? (
                                    contractSortDir === 'asc' ? <ArrowUp size={12} className="text-[#00B594]" /> : <ArrowDown size={12} className="text-[#00B594]" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-slate-400" />
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-3 font-bold text-center">Equipos</th>
                              <th className="py-3 px-3 font-bold text-center">Adendas</th>
                              <th 
                                className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-200/60 transition-colors"
                                onClick={() => toggleContractSort('estado')}
                              >
                                <div className="flex items-center gap-1">
                                  <span>Estado</span>
                                  {contractSortCol === 'estado' ? (
                                    contractSortDir === 'asc' ? <ArrowUp size={12} className="text-[#00B594]" /> : <ArrowDown size={12} className="text-[#00B594]" />
                                  ) : (
                                    <ArrowUpDown size={12} className="text-slate-400" />
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4 font-bold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {displayList.map((contract: any) => {
                              const stats = contractStats.find(s => s.id === contract.id)!;
                              const isExpanded = expandedContracts.has(contract.id);
                              const contractNum = contract.n_contrato || contract.id.replace('cont_', '');

                              return (
                                <React.Fragment key={contract.id}>
                                  <tr 
                                    className={`transition-colors cursor-pointer hover:bg-slate-50/80 ${
                                      stats.needsAttention ? 'bg-amber-50/30' : ''
                                    } ${isExpanded ? 'bg-slate-50' : ''}`}
                                    onClick={() => toggleContract(contract.id)}
                                  >
                                    {/* Cliente / Contrato */}
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <ChevronDown
                                          size={14}
                                          className={`text-slate-400 transition-transform duration-150 shrink-0 ${isExpanded ? 'rotate-180 text-teal-600' : ''}`}
                                        />
                                        <div>
                                          <div className="font-bold text-slate-800 text-xs hover:text-[#00B594] transition-colors">
                                            {contract.cliente}
                                          </div>
                                          <div className="font-mono text-[10px] text-slate-500 font-bold">
                                            Contrato #{contractNum}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Tipo de servicio */}
                                    <td className="py-3 px-3">
                                      <span className="inline-block max-w-[140px] truncate text-[10px] font-bold font-mono text-[#00B594] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded" title={contract.tipo_contrato || 'Mantenimiento'}>
                                        {contract.tipo_contrato || 'Mantenimiento'}
                                      </span>
                                    </td>

                                    {/* Vigencia + Mini Progress Bar */}
                                    <td className="py-3 px-3">
                                      {stats.hasDates ? (
                                        <div className="w-36">
                                          <div className="text-[10px] font-mono text-slate-700 font-bold">
                                            {contract.fecha_inicio} - {contract.fecha_fin}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full ${
                                                  stats.daysLeft <= 30 ? 'bg-rose-500' :
                                                  stats.daysLeft <= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${stats.progressPct}%` }}
                                              />
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold shrink-0 ${
                                              stats.nearExpiry ? 'text-rose-600' : 'text-slate-400'
                                            }`}>
                                              {stats.daysLeft > 0 ? `${stats.daysLeft}d` : 'Vencido'}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-mono text-slate-400 italic">S/D</span>
                                      )}
                                    </td>

                                    {/* Equipos */}
                                    <td className="py-3 px-3 text-center">
                                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                        {stats.totalEquipos} eq.
                                      </span>
                                    </td>

                                    {/* Adendas */}
                                    <td className="py-3 px-3 text-center">
                                      {stats.adendas.length > 0 ? (
                                        <span className="inline-flex items-center gap-1 font-mono font-black text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[10px]">
                                          <Plus size={10} /> {stats.adendas.length} adenda{stats.adendas.length > 1 ? 's' : ''}
                                        </span>
                                      ) : (
                                        <span className="font-mono text-[10px] text-slate-400">-</span>
                                      )}
                                    </td>

                                    {/* Estado */}
                                    <td className="py-3 px-3">
                                      {stats.needsAttention ? (
                                        <span className="inline-flex items-center gap-1 font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px]">
                                          <AlertTriangle size={10} /> {stats.pendientesCount} pendiente{stats.pendientesCount !== 1 ? 's' : ''}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px]">
                                          <CheckCircle2 size={10} /> Al día
                                        </span>
                                      )}
                                    </td>

                                    {/* Acciones */}
                                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => { setSelectedContractForEquipments(contract); setIsEquipmentsModalOpen(true); }}
                                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                          title="Ver detalle e historial"
                                        >
                                          <Eye size={14} />
                                        </button>
                                        <button
                                          onClick={() => { setSelectedContractForSchedule(contract); setSelectedAdendaForSchedule(null); setIsScheduleModalOpen(true); }}
                                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00B594] hover:bg-[#009b7e] text-white rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-emerald-500/10"
                                        >
                                          <CalendarIcon size={12} />
                                          <span>Programar</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Row Expansion (Accordion inline) */}
                                  {isExpanded && (
                                    <tr className="bg-slate-50/90 border-b border-slate-200">
                                      <td colSpan={7} className="p-4">
                                        <div className="space-y-4 max-w-5xl mx-auto">
                                          {/* Equipos del contrato principal */}
                                          <div>
                                            <h5 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                              <Cpu size={12} className="text-slate-400" />
                                              <span>Equipos Contrato Principal ({(contract.equipos || []).length})</span>
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {(contract.equipos || []).map((eq: any) => (
                                                <div key={eq.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-[11px] shadow-xs">
                                                  <div className="min-w-0">
                                                    <span className="font-mono font-bold text-slate-800 block">{eq.codigo}</span>
                                                    <span className="text-slate-500 truncate block">{eq.tipo} · {eq.marca} {eq.modelo}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Ubicación: {eq.ubicacion || 'No especificada'}</span>
                                                  </div>
                                                  <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">
                                                    {eq.potenciaKva} kVA
                                                  </span>
                                                </div>
                                              ))}
                                              {(contract.equipos || []).length === 0 && (
                                                <p className="text-[11px] text-slate-400 italic col-span-full">No hay equipos asignados directamente al contrato principal.</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Adendas / Ampliaciones */}
                                          {stats.adendas.length > 0 && (
                                            <div className="border-t border-slate-200 pt-3 space-y-2">
                                              <h5 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Plus size={12} className="text-teal-600" />
                                                <span>Adendas / Ampliaciones ({stats.adendas.length})</span>
                                              </h5>
                                              <div className="space-y-2">
                                                {stats.adendas.map((adenda: any) => {
                                                  const adendaEquips = adenda.equiposAdenda
                                                    ? adenda.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean)
                                                    : [];
                                                  return (
                                                    <div key={adenda.id} className="p-3 bg-teal-50/40 border border-teal-100 rounded-xl text-[11px] space-y-2">
                                                      <div className="flex justify-between items-center">
                                                        <div>
                                                          <span className="font-mono font-black text-slate-800 bg-teal-100/80 px-2 py-0.5 rounded mr-2 border border-teal-200 text-[10px]">
                                                            Adenda {adenda.codigo || adenda.id.replace('ad_', '')}
                                                          </span>
                                                          <span className="text-[9px] text-slate-500 font-mono">
                                                            Vigencia: {adenda.fecha_inicio} al {adenda.fecha_fin}
                                                          </span>
                                                        </div>
                                                        <button
                                                          onClick={() => { setSelectedContractForSchedule(contract); setSelectedAdendaForSchedule(adenda); setIsScheduleModalOpen(true); }}
                                                          className="flex items-center gap-1 px-2.5 py-1 bg-[#00B594] hover:bg-[#009b7e] text-white rounded-md text-[9px] font-black uppercase font-mono tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                                                        >
                                                          <CalendarIcon size={10} />
                                                          <span>Programar Adenda</span>
                                                        </button>
                                                      </div>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {adendaEquips.map((eq: any) => (
                                                          <div key={eq.id} className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-[11px]">
                                                            <div className="min-w-0">
                                                              <span className="font-mono font-bold text-slate-700 block">{eq.codigo}</span>
                                                              <span className="text-slate-500 truncate block">{eq.tipo} · {eq.marca} {eq.modelo}</span>
                                                            </div>
                                                            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">
                                                              {eq.potenciaKva} kVA
                                                            </span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex justify-end pt-1">
                                            <button
                                              onClick={() => { setSelectedContractForEquipments(contract); setIsEquipmentsModalOpen(true); }}
                                              className="text-[10px] font-black text-teal-600 hover:text-teal-700 font-mono uppercase tracking-wider underline cursor-pointer"
                                            >
                                              Ver Historial Completo de Servicios
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Compact Cards View (<1024px) */}
                      <div className="lg:hidden space-y-3">
                        {displayList.map((contract: any) => {
                          const stats = contractStats.find(s => s.id === contract.id)!;
                          const isExpanded = expandedContracts.has(contract.id);

                          return (
                            <div 
                              key={contract.id}
                              className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 ${
                                stats.needsAttention ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                              }`}
                            >
                              {/* Header row */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{contract.cliente}</h4>
                                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                                    Contrato #{contract.n_contrato || contract.id.replace('cont_', '')}
                                  </span>
                                </div>
                                {stats.needsAttention ? (
                                  <span className="font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                                    {stats.pendientesCount} pend.
                                  </span>
                                ) : (
                                  <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                                    Al día
                                  </span>
                                )}
                              </div>

                              {/* Info line */}
                              <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 font-mono">
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                                  {contract.tipo_contrato || 'Mantenimiento'}
                                </span>
                                <span className="text-[10px] text-slate-600 font-bold">
                                  {stats.totalEquipos} eq. {stats.adendas.length > 0 && `· ${stats.adendas.length} adendas`}
                                </span>
                              </div>

                              {/* Vigencia */}
                              {stats.hasDates && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                    <span>Vigencia</span>
                                    <span className="font-bold text-slate-700">{contract.fecha_inicio} - {contract.fecha_fin}</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full ${stats.daysLeft <= 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                      style={{ width: `${stats.progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-1 gap-2">
                                <button
                                  onClick={() => toggleContract(contract.id)}
                                  className="text-[11px] text-slate-500 font-mono underline"
                                >
                                  {isExpanded ? 'Ocultar equipos' : 'Ver equipos'}
                                </button>
                                <button
                                  onClick={() => { setSelectedContractForSchedule(contract); setSelectedAdendaForSchedule(null); setIsScheduleModalOpen(true); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#00B594] text-white rounded-lg text-[10px] font-black uppercase font-mono tracking-wider"
                                >
                                  <CalendarIcon size={12} />
                                  <span>Programar</span>
                                </button>
                              </div>

                              {/* Mobile expanded details */}
                              {isExpanded && (
                                <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                                  <h5 className="font-mono text-[10px] text-slate-400 uppercase font-bold">Equipos ({(contract.equipos || []).length}):</h5>
                                  <div className="space-y-1">
                                    {(contract.equipos || []).map((eq: any) => (
                                      <div key={eq.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between font-mono text-[11px]">
                                        <span>{eq.codigo} ({eq.tipo})</span>
                                        <span className="font-bold">{eq.potenciaKva} kVA</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Empty State */}
                      {totalItems === 0 && (
                        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                          <Wrench size={32} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 text-sm font-medium">
                            {contractSearchQuery || contractFilterChip !== 'todos'
                              ? 'No se encontraron contratos con los filtros aplicados.'
                              : 'No hay contratos o adendas registradas.'}
                          </p>
                          {(contractSearchQuery || contractFilterChip !== 'todos') && (
                            <button
                              onClick={() => { setContractSearchQuery(''); setContractFilterChip('todos'); }}
                              className="mt-3 text-xs font-mono font-bold text-[#00B594] underline cursor-pointer"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      )}

                      {/* Footer & Pagination */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-500">
                        <div>
                          Showing {displayList.length} of {totalItems} contracts
                          {contractSortCol !== 'default' && (
                            <span className="ml-2 text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                              Orden: {contractSortCol} ({contractSortDir})
                              <button onClick={resetContractSort} className="ml-1 text-slate-400 hover:text-slate-600 font-bold">×</button>
                            </span>
                          )}
                        </div>

                        {usePagination && totalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={safePage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="px-2 font-bold text-slate-700">
                              {safePage} / {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={safePage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              
              {/* SUB-TAB 1: RESUMEN */}
              {operationsSubTab === 'resumen' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  <div className="max-w-6xl mx-auto space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Metric 1 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Layers size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Servicios Activos</span>
                          <strong className="text-xl font-mono font-bold text-slate-800">{ots.filter(o => o.estado !== OTStatus.CERRADA).length}</strong>
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                          <Wrench size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Por Asignar</span>
                          <strong className="text-xl font-mono font-bold text-slate-800">
                            {ots.filter(o => o.estado === OTStatus.PENDIENTE_PROGRAMACION || !o.tecnicoTitularId).length}
                          </strong>
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                          <Zap size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">En Ejecución</span>
                          <strong className="text-xl font-mono font-bold text-slate-800">
                            {ots.filter(o => [OTStatus.EN_SITIO, OTStatus.TRABAJO_EN_EJECUCION].includes(o.estado)).length}
                          </strong>
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Finalizados</span>
                          <strong className="text-xl font-mono font-bold text-slate-800">{ots.filter(o => o.estado === OTStatus.CERRADA).length}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Active/Scheduled Services list */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon size={16} className="text-[#00B594]" />
                        <span>Próximos Servicios Programados</span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2.5">Código OT</th>
                              <th className="py-2.5">Cliente</th>
                              <th className="py-2.5">Equipo</th>
                              <th className="py-2.5">Fecha</th>
                              <th className="py-2.5">Técnico Líder</th>
                              <th className="py-2.5">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ots.filter(o => o.estado !== OTStatus.CERRADA).slice(0, 8).map(ot => (
                              <tr key={ot.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-slate-800">{ot.id}</td>
                                <td className="py-3 font-bold text-slate-700">{getClientName(ot.clientId)}</td>
                                <td className="py-3">{ot.tipoEquipo} ({ot.potenciaKva} kVA)</td>
                                <td className="py-3 font-mono">{ot.fechaProgramada} {ot.horaProgramada || ''}</td>
                                <td className="py-3 font-bold text-slate-600">{ot.tecnicoTitular}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    ot.estado === OTStatus.PROGRAMADA ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    ot.estado === OTStatus.TRABAJO_EN_EJECUCION ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {ot.estado}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {ots.filter(o => o.estado !== OTStatus.CERRADA).length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">No hay servicios programados activos.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: EQUIPOS */}
              {operationsSubTab === 'equipos' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={16} className="text-[#00B594]" />
                      <span>Control de Equipos y Vigencias de Servicio</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5">Código Equipo</th>
                            <th className="py-2.5">Cliente</th>
                            <th className="py-2.5">Especificaciones</th>
                            <th className="py-2.5">Ubicación</th>
                            <th className="py-2.5">Última Visita</th>
                            <th className="py-2.5">Estado Técnico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {contratosNuevos.flatMap((c: any) => {
                            const primary = c.equipos || [];
                            const adendas = c.ampliaciones || [];
                            const list = [...primary];
                            adendas.forEach((ad: any) => {
                              const adEquips = ad.equiposAdenda ? ad.equiposAdenda.map((ea: any) => ea.equipo).filter(Boolean) : [];
                              adEquips.forEach((eq: any) => {
                                if (!list.some(e => e.id === eq.id)) list.push(eq);
                              });
                            });
                            return list.map(eq => ({ eq, contract: c }));
                          }).slice(0, 15).map(({ eq, contract }) => {
                            const lastService = reports.filter(r => r.equipoId === eq.id).sort((a,b) => b.creadoEn.localeCompare(a.creadoEn))[0];
                            return (
                              <tr key={eq.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-mono font-bold text-slate-800">{eq.codigo}</td>
                                <td className="py-3 font-bold text-slate-700">{contract.cliente}</td>
                                <td className="py-3">{eq.tipo} · {eq.marca} {eq.modelo} ({eq.potenciaKva} kVA)</td>
                                <td className="py-3 text-slate-500 font-mono text-[10px]">{eq.ubicacion || 'No especificada'}</td>
                                <td className="py-3 font-mono">{lastService?.fechaServicio || lastService?.creadoEn?.split('T')[0] || 'Sin registro'}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    eq.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    eq.estado === 'En observación' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                    {eq.estado}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: ASIGNACIONES (TECNICOS) */}
              {operationsSubTab === 'asignaciones' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench size={16} className="text-[#00B594]" />
                      <span>Carga de Trabajo y Asignaciones de Técnicos</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {users.filter(u => u.role === 'Tecnico' && u.estado === 'Activo').map(tech => {
                        const assigned = ots.filter(o => o.tecnicoTitularId === tech.id && o.estado !== OTStatus.CERRADA);
                        const support = ots.filter(o => o.tecnicoApoyoId === tech.id && o.estado !== OTStatus.CERRADA);
                        return (
                          <div key={tech.id} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/30">
                            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                              <div>
                                <strong className="text-slate-800 text-sm">{tech.username}</strong>
                                <span className="text-[10px] text-slate-400 block font-mono">{tech.email}</span>
                              </div>
                              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                                {assigned.length + support.length} Visitas Activas
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              {assigned.map(ot => (
                                <div key={ot.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                                  <div>
                                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[10px] mr-1">{ot.id}</span>
                                    <span>{getClientName(ot.clientId)}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">{ot.fechaProgramada}</span>
                                </div>
                              ))}
                              {assigned.length === 0 && (
                                <p className="text-slate-400 italic text-[11px] py-2 text-center">Sin servicios asignados como titular.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: AGENDA (CALENDARIO) */}
              {operationsSubTab === 'agenda' && (
                <>
                  {/* Color Codes Legend */}
                  <div className="bg-white px-6 py-2 border-b border-slate-200 flex gap-4 text-[10px] font-mono font-bold shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Pendiente / Urgente</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Asignado / En ruta</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> En Proceso</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Finalizado</div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="flex-1 overflow-auto bg-white p-4">
                    <div className="min-w-[800px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm">
                      
                      {calendarView === 'day' ? (
                    <>
                      {/* Grid Header (Day Title) */}
                      <div className="grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: `80px 1fr` }}>
                        <div className="p-3 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                          Hora
                        </div>
                        <div className="p-3 text-center relative bg-slate-50/50">
                          <span className="font-bold text-sm text-slate-800 block truncate">
                            {currentDate.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Grid Body (Time Slots) */}
                      <div className="relative bg-white">
                        {timeSlots.map((time) => {
                          const dateStr = currentDate.toISOString().split('T')[0];
                          const otsInSlot = assignedOts.filter(ot => 
                            ot.fechaProgramada === dateStr && doesOtStartInSlot(ot, time)
                          );
                          const hasOverlapping = assignedOts.some(ot => 
                            ot.fechaProgramada === dateStr && !doesOtStartInSlot(ot, time) && getOtsInTimeSlot('', dateStr, time).some(o => o.id === ot.id)
                          );

                          return (
                            <div key={time} className="grid border-b border-slate-100 last:border-0" style={{ gridTemplateColumns: `80px 1fr` }}>
                              <div className="p-2 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-xs font-bold text-slate-500">
                                {time}
                              </div>
                              <div className="min-h-[80px] p-2 relative transition-colors hover:bg-indigo-50/50 flex flex-wrap gap-2"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, '', time)}
                              >
                                {otsInSlot.length > 0 ? otsInSlot.map(ot => (
                                  <div
                                    key={ot.id}
                                    draggable
                                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, ot); }}
                                    onClick={() => setSelectedOtInfo(ot)}
                                    className={`p-2 rounded shadow-sm text-left flex flex-col ${isOTFinalizada(ot.estado) ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} transition-shadow ${getOtColorCode(ot.estado)} min-w-[180px] max-w-[220px]`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-mono text-[10px] font-bold">{ot.id}</span>
                                      {ot.tecnicoTitular && <span className="text-[8px] font-bold opacity-75 truncate max-w-[80px]">{ot.tecnicoTitular.split(' ')[0]}</span>}
                                    </div>
                                    <span className="font-bold text-[11px] leading-tight line-clamp-2">{getClientName(ot.clientId)}</span>
                                    <span className="text-[9px] mt-1 font-mono opacity-90 block">
                                      {ot.horaProgramada || '09:00'}{ot.horaFinProgramada ? ` - ${ot.horaFinProgramada}` : ''}
                                    </span>
                                  </div>
                                )) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-mono italic">Sin programación</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : calendarView === 'week' ? (
                    <>
                      {/* Grid Header (Days of week) */}
                      <div className="grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                        <div className="p-3 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                          Hora
                        </div>
                        {weekDays.map(date => (
                          <div key={date.toISOString()} className="p-3 border-r border-slate-200 text-center relative">
                            <span className="font-bold text-sm text-slate-800 block truncate">{getDayName(date)}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">{date.toLocaleDateString('es-PE')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Grid Body (Time Slots x Days) */}
                      <div className="relative bg-white">
                        {timeSlots.map((time) => (
                          <div key={time} className="grid border-b border-slate-100 last:border-0" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                            <div className="p-2 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-xs font-bold text-slate-500">
                              {time}
                            </div>
                            {weekDays.map(date => {
                              const dateStr = date.toISOString().split('T')[0];
                              const otsInSlot = assignedOts.filter(ot => 
                                ot.fechaProgramada === dateStr && doesOtStartInSlot(ot, time)
                              );

                              return (
                                <div 
                                  key={`${dateStr}-${time}`} 
                                  className="border-r border-slate-100 min-h-[70px] p-1 relative transition-colors hover:bg-indigo-50/50 space-y-1"
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, '', time, dateStr)}
                                >
                                  {otsInSlot.length > 0 ? otsInSlot.map(ot => (
                                    <div 
                                      key={ot.id}
                                      draggable
                                      onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, ot); }}
                                      onClick={() => setSelectedOtInfo(ot)}
                                      className={`p-1.5 rounded shadow-sm text-left flex flex-col ${isOTFinalizada(ot.estado) ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} transition-shadow ${getOtColorCode(ot.estado)}`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className="font-mono text-[9px] font-bold">{ot.id}</span>
                                        {ot.tecnicoTitular && <span className="text-[7px] font-bold opacity-75 truncate max-w-[50px]">{ot.tecnicoTitular.split(' ')[0]}</span>}
                                      </div>
                                      <span className="font-bold text-[9px] leading-tight line-clamp-1">{getClientName(ot.clientId)}</span>
                                    </div>
                                  )) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300 font-mono italic">—</div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Grid Header (Days of week) */}
                      <div className="grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dayName => (
                          <div key={dayName} className="p-3 border-r border-slate-200 text-center relative bg-slate-50">
                            <span className="font-bold text-sm text-slate-800 block truncate">{dayName}</span>
                          </div>
                        ))}
                      </div>

                      {/* Grid Body (Month Days) */}
                      <div className="grid bg-white" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                        {getMonthDays().map((dayObj, idx) => {
                          const dateStr = dayObj.date.toISOString().split('T')[0];
                          const otsInSlot = assignedOts.filter(ot => ot.fechaProgramada === dateStr);
                          const isToday = dateStr === new Date().toISOString().split('T')[0];

                          return (
                            <div 
                              key={idx} 
                              className={`min-h-[120px] p-1.5 border-r border-b border-slate-100 relative transition-colors hover:bg-indigo-50/50 ${!dayObj.isCurrentMonth ? 'bg-slate-50/50 opacity-60' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, techniciansList[0].name, '09:00', dateStr)}
                            >
                              <div className={`text-right mb-1 ${isToday ? 'font-black text-blue-600' : 'font-bold text-slate-400'} text-xs p-1`}>
                                {dayObj.date.getDate()}
                              </div>
                              <div className="space-y-1 max-h-[90px] overflow-y-auto custom-scrollbar">
                                {otsInSlot.map(otInSlot => (
                                    <div 
                                      key={otInSlot.id}
                                      draggable
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, otInSlot);
                                      }}
                                      onClick={() => setSelectedOtInfo(otInSlot)}
                                      className={`p-1.5 rounded shadow-sm text-left flex flex-col ${isOTFinalizada(otInSlot.estado) ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} transition-shadow relative ${getOtColorCode(otInSlot.estado)}`}
                                    >
                                      <div className="flex justify-between items-start mb-0.5">
                                        <span className="font-mono text-[9px] font-bold">{otInSlot.id}</span>
                                        <span className="text-[8px] font-bold opacity-75 truncate max-w-[40px]" title={otInSlot.tecnicoTitular}>{otInSlot.tecnicoTitular?.split(' ')[0]}</span>
                                      </div>
                                      <span className="font-bold text-[9px] leading-tight line-clamp-1">{getClientName(otInSlot.clientId, otInSlot)}</span>
                                    </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SUB-TAB 5: INFORMES */}
          {operationsSubTab === 'informes' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {/* Tab Filters */}
              <div className="max-w-6xl mx-auto flex flex-wrap gap-2 select-none">
                {(['todos', 'pendientes', 'observados', 'aprobados'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setReportFilterStatus(filter);
                      setSelectedReportForAudit(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      reportFilterStatus === filter
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter === 'todos' && 'Todos los Informes'}
                    {filter === 'pendientes' && 'Pendientes de Aprobación'}
                    {filter === 'observados' && 'Observados / Con Observación'}
                    {filter === 'aprobados' && 'Aprobados / Firmados'}
                  </button>
                ))}
              </div>

              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Reports Table Card */}
                <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 ${selectedReportForAudit ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={16} className="text-[#00B594]" />
                    <span>Bandeja de Informes Técnicos de Campo ({filteredReportsForDashboard.length})</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5">Informe N°</th>
                          <th className="py-2.5">OT Técnica</th>
                          <th className="py-2.5">Cliente</th>
                          <th className="py-2.5">Fecha</th>
                          <th className="py-2.5">Estado OT</th>
                          <th className="py-2.5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportsForDashboard.map((report) => {
                          const ot = ots.find(o => o.id === report.otId);
                          const otStatus = ot?.estado || 'DESCONOCIDO';
                          
                          return (
                            <tr 
                              key={report.id} 
                              className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selectedReportForAudit?.id === report.id ? 'bg-slate-50' : ''}`}
                              onClick={() => {
                                setSelectedReportForAudit(report);
                              }}
                            >
                              <td className="py-3 font-mono font-bold text-slate-800">
                                {report.informeN || `INF-${report.id.slice(0, 6)}`}
                              </td>
                              <td className="py-3 font-mono">{report.otId}</td>
                              <td className="py-3 font-bold text-slate-700 truncate max-w-[120px]">
                                {getClientName(ot?.clientId || '')}
                              </td>
                              <td className="py-3 font-mono">{report.fechaServicio || 'S/D'}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide font-mono ${
                                  otStatus === OTStatus.EN_REVISION ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  otStatus === OTStatus.OBSERVADA ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  otStatus === OTStatus.APROBADA || otStatus === OTStatus.FIRMADA ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  {otStatus}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReportForAudit(report);
                                  }}
                                  className="text-xs font-bold text-[#00B594] hover:text-[#009b7e] underline cursor-pointer"
                                >
                                  Auditar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredReportsForDashboard.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">No hay informes registrados para esta categoría.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Action Panel (Sidebar) */}
                {selectedReportForAudit && (() => {
                  const matchingOt = ots.find(o => o.id === selectedReportForAudit.otId);
                  
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-in slide-in-from-right duration-200 text-left">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wide">Panel de Auditoría</h4>
                          <p className="font-mono text-[10px] text-slate-500">{selectedReportForAudit.informeN || `INF-${selectedReportForAudit.id.slice(0, 6)}`}</p>
                        </div>
                        <button
                          onClick={() => setSelectedReportForAudit(null)}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Summary Data */}
                      <div className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-black font-mono block">Cliente / Sede:</span>
                          <span className="text-slate-800 font-bold block">{getClientName(matchingOt?.clientId || '')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-black font-mono block">Equipo & Potencia:</span>
                          <span className="text-slate-800 font-bold block">{matchingOt?.tipoEquipo} {matchingOt?.potenciaKva ? `(${matchingOt.potenciaKva} KVA)` : ''}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 mt-2">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-black font-mono block">Técnico Líder:</span>
                            <span className="text-slate-800 font-semibold block truncate">{matchingOt?.tecnicoTitular}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-black font-mono block">Fecha Visita:</span>
                            <span className="text-slate-800 font-mono block">{selectedReportForAudit.fechaServicio || 'S/D'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Readings */}
                      <div className="space-y-2.5">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Lecturas y Diagnóstico</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold block font-mono uppercase">Voltaje Ent.</span>
                            <strong className="text-slate-800 font-mono text-xs">{selectedReportForAudit.voltajeEntrada || '---'} V</strong>
                          </div>
                          <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold block font-mono uppercase">Voltaje Sal.</span>
                            <strong className="text-slate-800 font-mono text-xs">{selectedReportForAudit.voltajeSalida || '---'} V</strong>
                          </div>
                        </div>
                        
                        <div className="text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-bold font-mono uppercase">¿Bypass Activo?</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono ${
                            selectedReportForAudit.indicadoresBateria?.bypassActivo ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {selectedReportForAudit.indicadoresBateria?.bypassActivo ? 'SÍ (BYPASS)' : 'NO (INVERSOR)'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block font-mono uppercase">Observaciones/Diagnóstico:</span>
                          <p className="bg-slate-50/40 border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 italic max-h-24 overflow-y-auto leading-relaxed">
                            {selectedReportForAudit.observacionesDiagnostico || 'No se registraron anomalías.'}
                          </p>
                        </div>
                      </div>

                      {/* Photo Attachments Preview */}
                      {(() => {
                        const rawPhotos = (selectedReportForAudit.fotosLabeled && selectedReportForAudit.fotosLabeled.length > 0)
                          ? selectedReportForAudit.fotosLabeled
                          : (selectedReportForAudit.fotos || []).map((f: string, i: number) => ({ base64: f, label: `Foto ${i + 1}` }));

                        if (rawPhotos.length === 0) return null;

                        return (
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">
                              Evidencias Fotográficas ({rawPhotos.length})
                            </h5>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                              {rawPhotos.map((pic: any, idx: number) => {
                                const photoSrc = getAuditPhotoSrc(pic, selectedReportForAudit.otId, idx);
                                const photoLabel = pic?.label || pic?.slotName || `Foto ${idx + 1}`;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setPreviewAuditPhoto({
                                      url: photoSrc,
                                      title: `${selectedReportForAudit.informeN || 'Informe'} · ${photoLabel}`
                                    })}
                                    className="relative group aspect-square bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs cursor-pointer"
                                    title="Haz clic para agrandar la evidencia fotográfica"
                                  >
                                    <img
                                      src={photoSrc}
                                      alt={photoLabel}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Eye className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/75 text-white text-[8px] py-0.5 px-1 truncate font-mono text-center">
                                      {photoLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Supervisor Observations (Read-Only) */}
                      {selectedReportForAudit.correccionesSupervisor && (
                        <div className="space-y-1.5 bg-rose-50 border border-rose-100 rounded-xl p-3 text-left select-none">
                          <label className="text-[10px] font-black uppercase text-rose-700 font-mono tracking-wider block">Observaciones del Supervisor</label>
                          <p className="text-xs text-rose-800 leading-normal italic">
                            "{selectedReportForAudit.correccionesSupervisor}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* SUB-TAB 6: HISTORIAL */}
          {operationsSubTab === 'historial' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#00B594]" />
                  <span>Bitácora Histórica de Servicios Cerrados</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Código OT</th>
                        <th className="py-2.5">Cliente</th>
                        <th className="py-2.5">Tipo Servicio</th>
                        <th className="py-2.5">Fecha Fin</th>
                        <th className="py-2.5">Técnico Líder</th>
                        <th className="py-2.5">Estado Financiero</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ots.filter(o => o.estado === OTStatus.CERRADA).map((ot) => (
                        <tr key={ot.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-slate-800">{ot.id}</td>
                          <td className="py-3 font-bold text-slate-700">{getClientName(ot.clientId)}</td>
                          <td className="py-3">{ot.tipoMantenimiento}</td>
                          <td className="py-3 font-mono">{ot.fechaProgramada}</td>
                          <td className="py-3">{ot.tecnicoTitular}</td>
                          <td className="py-3 text-emerald-600 font-bold">EJECUTADO / CERRADO</td>
                        </tr>
                      ))}
                      {ots.filter(o => o.estado === OTStatus.CERRADA).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">No hay servicios finalizados en el historial.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            </div>
          )}
        </div>
      </div>
      

      {/* OT Detail Modal (Floating) */}
      {selectedOtInfo && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Detalle de Asignación
              </h3>
              <button onClick={() => setSelectedOtInfo(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">Orden de Trabajo</span>
                <p className="text-lg font-black text-slate-900 font-mono">{selectedOtInfo.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">Técnico Asignado</span>
                  <p className="text-sm font-bold text-slate-800">{selectedOtInfo.tecnicoTitular}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">Estado Actual</span>
                  <p className="text-sm font-bold text-slate-800">{selectedOtInfo.estado}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider block mb-1">Datos del Servicio</span>
                <p className="text-sm font-bold text-slate-800 mb-1">{getClientName(selectedOtInfo.clientId)}</p>
                <p className="text-xs text-slate-600 mb-1"><MapPin size={12} className="inline mr-1 text-slate-400" /> {clients.find(c => c.id === selectedOtInfo.clientId)?.distrito || 'Sede Principal'}</p>
                <p className="text-xs text-slate-600"><strong>Equipo:</strong> {selectedOtInfo.tipoEquipo} ({selectedOtInfo.potenciaKva}KVA)</p>
                <p className="text-xs text-slate-600"><strong>Tipo:</strong> {selectedOtInfo.tipoMantenimiento}</p>
              </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedOtForAssign(selectedOtInfo);
                      setSelectedOtInfo(null);
                    }}
                    data-tour="asignar-tecnico"
                    className="w-full flex items-center justify-center gap-2 bg-[#00B594] text-white text-sm font-black py-2.5 rounded-lg hover:bg-[#009b7e] transition-all shadow-md shadow-emerald-500/10"
                  >
                    <UserPlus size={16} />
                    <span>Asignar Técnicos Responsables</span>
                  </button>

                  {!isOTFinalizada(selectedOtInfo.estado) ? (
                    <button
                      onClick={() => {
                        setSelectedOtForAssign(selectedOtInfo);
                        setSelectedOtInfo(null);
                      }}
                      className="w-full bg-blue-50 text-blue-700 text-sm font-bold py-2.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      Reprogramar Horario
                    </button>
                  ) : (
                    <div className="w-full bg-slate-50 text-slate-500 text-sm font-bold py-2.5 rounded-lg border border-slate-200 text-center cursor-not-allowed">
                      OT Finalizada (No se puede reprogramar)
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
       {selectedOtForAssign && (
        <ModalAsignarTecnico
          linea={{ 
            id: selectedOtForAssign.otFinancieraId || '', 
            ot: parseInt(selectedOtForAssign.id.replace('OT-', '')) || 0,
            cliente: getClientName(selectedOtForAssign.clientId)
          } as any}
          ots={ots}
          users={users}
          clients={clients}
          initialValues={dropInitialValues || undefined}
          onUpdateOT={async (ot) => {
            try {
              if (onUpdateOt) await onUpdateOt(ot);
              setSelectedOtForAssign(null);
              setDropInitialValues(null);
              setDraggedOt(null);
            } catch (err: any) {
              console.error("Error al guardar asignación:", err);
            }
          }}
          onClose={() => {
            setSelectedOtForAssign(null);
            setDropInitialValues(null);
            setDraggedOt(null);
          }}
        />
      )}

      {isScheduleModalOpen && selectedContractForSchedule && (
        <ModalProgramarVisita
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedContractForSchedule(null);
            setSelectedAdendaForSchedule(null);
          }}
          contract={selectedContractForSchedule}
          adenda={selectedAdendaForSchedule}
          ots={ots}
          users={users}
          clients={clients}
          otEquipoAsignaciones={otEquipoAsignaciones}
          onSave={onAddOT}
        />
      )}

      {isEquipmentsModalOpen && selectedContractForEquipments && (
        <ModalDetalleEquipos
          isOpen={isEquipmentsModalOpen}
          onClose={() => {
            setIsEquipmentsModalOpen(false);
            setSelectedContractForEquipments(null);
          }}
          contract={selectedContractForEquipments}
          ots={ots}
          otEquipoAsignaciones={otEquipoAsignaciones}
          reports={reports}
          clients={clients}
        />
      )}

      {/* Lightbox Modal para Evidencia Fotográfica Ampliada */}
      {previewAuditPhoto && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Eye className="text-[#00B594]" size={16} />
                <span className="font-bold">{previewAuditPhoto.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAuditPhoto(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-black p-4 flex items-center justify-center overflow-hidden">
              <img
                src={previewAuditPhoto.url}
                alt="Evidencia fotográfica ampliada"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
