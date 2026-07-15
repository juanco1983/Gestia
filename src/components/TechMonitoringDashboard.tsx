import React, { useState } from 'react';
import { UserPlus, Users, Clock, MapPin, Wrench, Search, Calendar as CalendarIcon, 
  Bell, Smartphone, Move, Info, ChevronLeft, ChevronRight, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OT, OTStatus, Client, TechnicalReport, User } from '../types';
import ModalAsignarTecnico from './ot/ModalAsignarTecnico';

interface TechMonitoringDashboardProps {
  ots: OT[];
  clients: Client[];
  reports: TechnicalReport[];
  users: User[];
  onUpdateOtStatus?: (otId: string, status: OTStatus) => void;
  onUpdateOt?: (ot: OT) => void;
}

export default function TechMonitoringDashboard({
  ots,
  clients,
  reports,
  users,
  onUpdateOtStatus,
  onUpdateOt
}: TechMonitoringDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'programacion' | 'disponibilidad'>('programacion');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [draggedOt, setDraggedOt] = useState<OT | null>(null);
  const [selectedOtInfo, setSelectedOtInfo] = useState<OT | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [selectedOtForAssign, setSelectedOtForAssign] = useState<OT | null>(null);
  const [dropInitialValues, setDropInitialValues] = useState<{ techId?: string; fecha?: string; hora?: string } | null>(null);
  
  // States used by the technical dashboard
  const techniciansList = [
    { id: 'user_2', name: 'Carlos Ocsa', area: 'Sistemas de Potencia', avatar: 'CO', location: 'Cerca a San Isidro' },
    { id: 'tech_2', name: 'Gino Murillo', area: 'Climatización', avatar: 'GM', location: 'Base Surco' },
    { id: 'user_5', name: 'Juan Córdova', area: 'Seguridad Eléctrica', avatar: 'JC', location: 'Ruta a Miraflores' },
    { id: 'tech_4', name: 'Josué Ale', area: 'Mecatrónica', avatar: 'JA', location: 'Base Surco' }
  ];

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  // Unassigned OTs (Mesa de Entrada)
  const unassignedOts = ots.filter(ot => ot.estado === OTStatus.PENDIENTE_PROGRAMACION || ot.estado === OTStatus.CREADA);
  
  // Assigned OTs for calendar
  const assignedOts = ots.filter(ot => ot.estado !== OTStatus.PENDIENTE_PROGRAMACION && ot.estado !== OTStatus.CREADA && ot.tecnicoTitular);

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

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.razonSocial || 'Cliente no encontrado';
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

  const getDisponibilidadCols = () => {
    if (calendarView === 'day') {
      return timeSlots.map(time => ({ type: 'time' as const, time, date: currentDate, isCurrentMonth: true }));
    }
    if (calendarView === 'week') {
      return weekDays.map(date => ({ type: 'date' as const, date, isCurrentMonth: true }));
    }
    return getMonthDays().map(d => ({ type: 'date' as const, date: d.date, isCurrentMonth: d.isCurrentMonth }));
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
    <div className="flex flex-col h-full bg-slate-50 font-sans -m-6 md:-m-8">
      {/* 4. Barra de Alertas y Notificaciones */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold tracking-wider text-emerald-400 uppercase">Monitoreo Activo</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <Bell size={12} className="text-amber-400" />
            <span>Última alerta: <strong className="text-white">Nueva OT creada hace 5 min</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-slate-700 bg-slate-800 px-2 py-1 rounded">
            <Smartphone size={12} className="text-blue-400" />
            <span className="font-mono text-[10px]">Sincronización Móvil: <strong className="text-emerald-400">100% (4/4 Online)</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 2 & 3. Panel Lateral: Cola de Trabajo */}
        {activeTab !== 'disponibilidad' && (
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Fila de Tickets / Cola de Trabajo */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-slate-50/50"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedOt && onUpdateOt) {
                  onUpdateOt({
                    ...draggedOt,
                    tecnicoTitular: '',
                    tecnicoTitularId: undefined,
                    horaProgramada: undefined,
                    estado: OTStatus.PENDIENTE_PROGRAMACION
                  });
                  setDraggedOt(null);
                }
              }}
            >
              <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500" />
                Mesa de Entrada ({unassignedOts.length})
              </h3>
              <p className="text-[10px] text-slate-500 mb-3 font-mono leading-tight">
                Arrastra un ticket al calendario para asignar a un técnico.
              </p>
              <div className="space-y-2">
                {unassignedOts.map(ot => (
                  <div
                    key={ot.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ot)}
                    className="bg-white border-l-4 border-l-red-500 border border-slate-200 p-2.5 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs font-black text-slate-900">{ot.id}</span>
                      <Move size={12} className="text-slate-400 group-hover:text-slate-600" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{getClientName(ot.clientId)}</p>
                    <p className="text-[10px] text-slate-500 truncate mb-2">{ot.tipoEquipo}</p>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOtForAssign(ot);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#E6F7F4] border border-emerald-100 rounded-md text-[#00B594] hover:bg-emerald-100 transition-all text-[10px] font-black uppercase font-mono"
                    >
                      <UserPlus size={12} />
                      <span>Asignar a Técnico</span>
                    </button>
                    
                    {/* Floating Detail Window on Hover */}
                    <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-64 bg-slate-900 text-slate-100 p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-left-2">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                          <span className="font-mono font-bold text-amber-400">{ot.id}</span>
                          <span className="text-[10px] bg-rose-500 text-white px-1.5 rounded font-bold uppercase">Alta</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p><span className="text-slate-400">Cliente:</span> {getClientName(ot.clientId)}</p>
                          <p><span className="text-slate-400">Equipo:</span> {ot.tipoEquipo} ({ot.potenciaKva}KVA)</p>
                          <p><span className="text-slate-400">Detalle:</span> {ot.tipoMantenimiento || 'Mantenimiento requerido'}</p>
                          <p><span className="text-slate-400">F. Límite:</span> {ot.fechaProgramada || 'Sin programar'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {unassignedOts.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                    No hay tickets pendientes en cola.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. Panel de Programación (Vista Principal) */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'programacion' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('programacion')}
                >
                  <CalendarIcon size={16} />
                  Programación
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'disponibilidad' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('disponibilidad')}
                >
                  <Clock size={16} />
                  Disponibilidad
                </button>
              </div>
              
              <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 ml-4">
                <button className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${calendarView === 'day' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('day')}>Día</button>
                <button className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${calendarView === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('week')}>Semana</button>
                <button className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${calendarView === 'month' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setCalendarView('month')}>Mes</button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={handlePrevDay} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 cursor-pointer transition-colors"><ChevronLeft size={18} /></button>
                <span className="font-mono font-bold text-sm text-slate-700 min-w-[190px] px-2 text-center">
                  {getCalendarHeaderTitle()}
                </span>
                <button onClick={handleNextDay} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 cursor-pointer transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          {activeTab === 'programacion' ? (
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
                  {/* Grid Header (Technicians) */}
                  <div className="grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: `80px repeat(${techniciansList.length}, minmax(0, 1fr))` }}>
                    <div className="p-3 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                      Hora
                    </div>
                    {techniciansList.map(tech => (
                      <div key={tech.id} className="p-3 border-r border-slate-200 text-center relative">
                        <span className="font-bold text-sm text-slate-800 block truncate">{tech.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{tech.area}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid Body (Time Slots) */}
                  <div className="relative bg-white">
                    {timeSlots.map((time, idx) => (
                      <div key={time} className="grid border-b border-slate-100 last:border-0" style={{ gridTemplateColumns: `80px repeat(${techniciansList.length}, minmax(0, 1fr))` }}>
                        
                        {/* Time Label */}
                        <div className="p-2 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-xs font-bold text-slate-500">
                          {time}
                        </div>
                        
                        {/* Tech Drop Zones */}
                        {techniciansList.map(tech => {
                          const dateStr = currentDate.toISOString().split('T')[0];
                          const startingOt = assignedOts.find(ot => 
                            normalizeName(ot.tecnicoTitular) === normalizeName(tech.name) && 
                            ot.fechaProgramada === dateStr && 
                            doesOtStartInSlot(ot, time)
                          );

                          return (
                            <div 
                              key={`${tech.id}-${time}`} 
                              className="border-r border-slate-100 min-h-[80px] p-1.5 relative transition-colors hover:bg-indigo-50/50"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, tech.name, time)}
                            >
                              {startingOt && (
                                <div 
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStart(e, startingOt);
                                  }}
                                  onClick={() => setSelectedOtInfo(startingOt)}
                                  className={`absolute left-1.5 right-1.5 p-2 rounded shadow-sm text-left flex flex-col ${isOTFinalizada(startingOt.estado) ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} transition-shadow z-20 ${getOtColorCode(startingOt.estado)}`}
                                  style={{
                                    top: '6px',
                                    height: `calc(${getOtDurationInHours(startingOt)} * 100% + ${(getOtDurationInHours(startingOt) - 1) * 1}px - 12px)`
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-[10px] font-bold">{startingOt.id}</span>
                                    {startingOt.estado === OTStatus.TRABAJO_EN_EJECUCION && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-[11px] leading-tight line-clamp-2">{getClientName(startingOt.clientId)}</span>
                                  <span className="text-[9px] mt-1 font-mono opacity-90 block">
                                    {startingOt.horaProgramada || '09:00'}{startingOt.horaFinProgramada ? ` - ${startingOt.horaFinProgramada}` : ''}
                                  </span>
                                  <span className="text-[9px] mt-auto pt-1 font-mono opacity-80 truncate">{startingOt.tipoEquipo}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </>
              ) : calendarView === 'week' ? (
                <>
                  {/* Grid Header (Days of week) */}
                  <div className="grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: `120px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                    <div className="p-3 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                      Técnico
                    </div>
                    {weekDays.map(date => (
                      <div key={date.toISOString()} className="p-3 border-r border-slate-200 text-center relative">
                        <span className="font-bold text-sm text-slate-800 block truncate">{getDayName(date)}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{date.toLocaleDateString('es-PE')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid Body (Technicians) */}
                  <div className="relative bg-white">
                    {techniciansList.map((tech) => (
                      <div key={tech.id} className="grid border-b border-slate-100 last:border-0" style={{ gridTemplateColumns: `120px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                        
                        {/* Tech Label */}
                        <div className="p-3 border-r border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                          <span className="font-bold text-xs text-slate-800 block">{tech.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{tech.area}</span>
                        </div>
                        
                        {/* Day Drop Zones */}
                        {weekDays.map(date => {
                          const dateStr = date.toISOString().split('T')[0];
                          // Find all OTs for this tech on this day
                          const otsInSlot = assignedOts.filter(ot => 
                            normalizeName(ot.tecnicoTitular) === normalizeName(tech.name) && 
                            ot.fechaProgramada === dateStr
                          );

                          return (
                            <div 
                              key={`${tech.id}-${dateStr}`} 
                              className="border-r border-slate-100 min-h-[100px] p-1.5 relative transition-colors hover:bg-indigo-50/50 space-y-1.5"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, tech.name, '09:00', dateStr)}
                            >
                              {otsInSlot.map(otInSlot => (
                                <div 
                                  key={otInSlot.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStart(e, otInSlot);
                                  }}
                                  onClick={() => setSelectedOtInfo(otInSlot)}
                                  className={`p-2 rounded shadow-sm text-left flex flex-col ${isOTFinalizada(otInSlot.estado) ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} transition-shadow relative ${getOtColorCode(otInSlot.estado)}`}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-[10px] font-bold">{otInSlot.id}</span>
                                    {otInSlot.estado === OTStatus.TRABAJO_EN_EJECUCION && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-[10px] leading-tight line-clamp-1">{getClientName(otInSlot.clientId)}</span>
                                  <span className="text-[9px] mt-0.5 font-mono opacity-80">
                                    {otInSlot.horaProgramada || '09:00'}{otInSlot.horaFinProgramada ? ` - ${otInSlot.horaFinProgramada}` : ''}
                                  </span>
                                </div>
                              ))}
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
                                  <span className="font-bold text-[9px] leading-tight line-clamp-1">{getClientName(otInSlot.clientId)}</span>
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
          ) : (
            <div className="flex-1 flex bg-slate-50 overflow-hidden">
              {/* Left Sidebar: Tech Search & List */}
              <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-4 border-b border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar técnico..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                      value={techSearchQuery}
                      onChange={(e) => setTechSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {techniciansList.filter(t => t.name.toLowerCase().includes(techSearchQuery.toLowerCase())).map(tech => (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedTechId === tech.id || (!selectedTechId && tech.id === techniciansList[0].id) ? 'bg-emerald-50 border border-emerald-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${selectedTechId === tech.id || (!selectedTechId && tech.id === techniciansList[0].id) ? 'bg-emerald-200 text-emerald-800 border-2 border-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {tech.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm truncate ${selectedTechId === tech.id || (!selectedTechId && tech.id === techniciansList[0].id) ? 'text-emerald-900' : 'text-slate-800'}`}>{tech.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{tech.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side: Calendar for Selected Tech */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="bg-white px-6 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                      {(techniciansList.find(t => t.id === selectedTechId) || techniciansList[0]).avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">
                        {(techniciansList.find(t => t.id === selectedTechId) || techniciansList[0]).name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">Disponibilidad Actual</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono font-bold">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 text-white flex items-center justify-center"><CheckCircle2 size={8} /></span> Disponible</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 text-white flex items-center justify-center"><CalendarIcon size={8} /></span> Ocupado</div>
                  </div>
                </div>

                {calendarView === 'day' && (
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="max-w-3xl mx-auto border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="bg-slate-50 p-4 border-b border-slate-200 text-center flex flex-col items-center justify-center">
                        <h3 className="font-bold text-lg text-slate-800 capitalize">{currentDate.toLocaleDateString('es-PE', { weekday: 'long' })}</h3>
                        <p className="text-sm text-slate-500">{currentDate.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {timeSlots.map(time => {
                          const dateStr = currentDate.toISOString().split('T')[0];
                          const selectedTechName = (techniciansList.find(t => t.id === selectedTechId) || techniciansList[0]).name;
                          
                          const startingOt = assignedOts.find(ot => 
                            normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                            ot.fechaProgramada === dateStr && 
                            doesOtStartInSlot(ot, time)
                          );
                          
                          const overlappingOt = assignedOts.find(ot => 
                            normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                            ot.fechaProgramada === dateStr && 
                            !doesOtStartInSlot(ot, time) && 
                            getOtsInTimeSlot(selectedTechName, dateStr, time).some(o => o.id === ot.id)
                          );

                          const isPast = currentDate < new Date(new Date().setHours(0,0,0,0)) || (dateStr === new Date().toISOString().split('T')[0] && parseInt(time.split(':')[0]) < new Date().getHours());

                          return (
                            <div key={time} className={`flex transition-colors h-20 ${isPast ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50'}`}>
                              <div className="w-24 p-4 border-r border-slate-100 text-center flex flex-col justify-center font-mono text-sm font-bold text-slate-500">
                                {time}
                              </div>
                              <div className="flex-1 p-3 relative">
                                {startingOt ? (
                                  <div 
                                    onClick={() => setSelectedOtInfo(startingOt)} 
                                    className={`absolute left-3 right-3 bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all flex items-center justify-between z-20 ${getOtColorCode(startingOt.estado)}`}
                                    style={{
                                      top: '12px',
                                      height: `calc(${getOtDurationInHours(startingOt)} * 80px - 24px)`
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                        <Wrench size={16} />
                                      </div>
                                      <div>
                                        <span className="text-red-700 font-bold text-sm block">OT-{startingOt.id}</span>
                                        <span className="text-red-600 text-xs truncate max-w-[200px] block">{getClientName(startingOt.clientId)}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[11px] font-mono font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                        {startingOt.horaProgramada || '09:00'}{startingOt.horaFinProgramada ? ` - ${startingOt.horaFinProgramada}` : ''}
                                      </span>
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold font-mono shadow-sm">{startingOt.estado}</span>
                                    </div>
                                  </div>
                                ) : overlappingOt ? (
                                  null
                                ) : (
                                  <div className="h-full flex items-center justify-between p-3 text-emerald-600 opacity-80 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-500 flex items-center justify-center mr-3 shrink-0">
                                        <CheckCircle2 size={16} />
                                      </div>
                                      <span className="text-sm font-bold">Disponible para asignación</span>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{time} - {`${parseInt(time.split(':')[0]) + 1}:00`}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {calendarView === 'week' && (
                  <div className="flex-1 overflow-auto p-6 bg-slate-50">
                    <div className="min-w-[800px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
                      <div className="grid border-b border-slate-200 bg-slate-50 shrink-0" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                        <div className="p-3 border-r border-slate-200 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 uppercase">Hora</div>
                        {weekDays.map(date => {
                          const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                          return (
                            <div key={date.toISOString()} className={`p-3 border-r border-slate-200 text-center flex flex-col items-center justify-center ${isToday ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'}`}>
                              <span className="text-[10px] font-mono uppercase block font-bold mb-0.5">{date.toLocaleDateString('es-PE', { weekday: 'short' })}</span>
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${isToday ? 'bg-emerald-500 text-white shadow-sm' : ''}`}>{date.getDate()}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {timeSlots.map(time => (
                          <div key={time} className="grid border-b border-slate-100 last:border-0 hover:bg-slate-50/50" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                            <div className="p-2 border-r border-slate-100 font-mono text-[10px] font-bold text-slate-500 flex items-center justify-center bg-slate-50">
                              {time}
                            </div>
                            {weekDays.map(date => {
                              const dateStr = date.toISOString().split('T')[0];
                              const selectedTechName = (techniciansList.find(t => t.id === selectedTechId) || techniciansList[0]).name;
                              
                              const startingOt = assignedOts.find(ot => 
                                normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                                ot.fechaProgramada === dateStr && 
                                doesOtStartInSlot(ot, time)
                              );
                              
                              const overlappingOt = assignedOts.find(ot => 
                                normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                                ot.fechaProgramada === dateStr && 
                                !doesOtStartInSlot(ot, time) && 
                                getOtsInTimeSlot(selectedTechName, dateStr, time).some(o => o.id === ot.id)
                              );

                              const isPast = date < new Date(new Date().setHours(0,0,0,0)) || (dateStr === new Date().toISOString().split('T')[0] && parseInt(time.split(':')[0]) < new Date().getHours());

                              return (
                                <div key={dateStr} className={`border-r border-slate-100 p-1.5 relative min-h-[48px] flex items-center justify-center ${isPast ? 'bg-slate-50/50' : ''}`}>
                                  {startingOt ? (
                                    <div 
                                      onClick={() => setSelectedOtInfo(startingOt)}
                                      className="absolute left-1 right-1 bg-red-100 border border-red-300 rounded-md overflow-hidden p-1 cursor-pointer hover:shadow-md hover:border-red-400 z-20 flex flex-col items-center justify-center transition-all"
                                      style={{
                                        top: '4px',
                                        height: `calc(${getOtDurationInHours(startingOt)} * 100% + ${(getOtDurationInHours(startingOt) - 1) * 1}px - 8px)`
                                      }}
                                    >
                                      <span className="text-[10px] font-bold text-red-800 block truncate w-full text-center">OT-{startingOt.id}</span>
                                      <span className="text-[9px] font-mono text-red-600 block">
                                        {startingOt.horaProgramada || '09:00'}{startingOt.horaFinProgramada ? ` - ${startingOt.horaFinProgramada}` : ''}
                                      </span>
                                    </div>
                                  ) : overlappingOt ? (
                                    null
                                  ) : (
                                    <div className="absolute inset-1 bg-emerald-50 border border-emerald-200 rounded-md p-1 flex flex-col items-center justify-center">
                                      <span className="text-[9px] font-bold text-emerald-600">Disponible</span>
                                      <span className="text-[8px] font-mono text-emerald-500">{time} - {`${parseInt(time.split(':')[0]) + 1}:00`}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {calendarView === 'month' && (
                  <div className="flex-1 overflow-auto p-6 bg-slate-50">
                    <div className="min-w-[800px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden h-full flex flex-col min-h-[600px]">
                      <div className="grid border-b border-slate-200 bg-slate-50 shrink-0" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dayName => (
                          <div key={dayName} className="p-3 border-r border-slate-200 text-center font-bold text-xs text-slate-600 uppercase tracking-wider font-mono">
                            {dayName}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(getMonthDays().length / 7)}, minmax(100px, 1fr))` }}>
                        {getMonthDays().map((dayObj, idx) => {
                          const dateStr = dayObj.date.toISOString().split('T')[0];
                          const selectedTechName = (techniciansList.find(t => t.id === selectedTechId) || techniciansList[0]).name;
                          const otsInDay = assignedOts.filter(ot => normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && ot.fechaProgramada === dateStr);
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          const isPast = dayObj.date < new Date(new Date().setHours(0,0,0,0));
                          
                          return (
                            <div key={idx} className={`border-r border-b border-slate-100 p-2 relative flex flex-col gap-1.5 transition-colors hover:bg-slate-50/50 ${!dayObj.isCurrentMonth || isPast ? 'bg-slate-50/40' : 'bg-white'}`}>
                              <div className={`text-right ${isToday ? 'font-black text-emerald-600' : 'font-bold text-slate-400'} text-xs mb-1 p-1`}>
                                <span className={isToday ? 'w-6 h-6 inline-flex items-center justify-center bg-emerald-100 rounded-full' : ''}>{dayObj.date.getDate()}</span>
                              </div>
                              <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pb-1">
                                {timeSlots.map(time => {
                                  const startingOt = assignedOts.find(ot => 
                                    normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                                    ot.fechaProgramada === dateStr && 
                                    doesOtStartInSlot(ot, time)
                                  );
                                  
                                  const overlappingOt = assignedOts.find(ot => 
                                    normalizeName(ot.tecnicoTitular) === normalizeName(selectedTechName) && 
                                    ot.fechaProgramada === dateStr && 
                                    !doesOtStartInSlot(ot, time) && 
                                    getOtsInTimeSlot(selectedTechName, dateStr, time).some(o => o.id === ot.id)
                                  );

                                  if (startingOt) {
                                    return (
                                      <div 
                                        key={time}
                                        onClick={() => setSelectedOtInfo(startingOt)}
                                        className={`border rounded-md px-2 py-1 cursor-pointer hover:shadow-sm transition-all group flex flex-col gap-1 ${getOtColorCode(startingOt.estado)}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-[9px]">OT-{startingOt.id}</span>
                                          <span className="text-[8px] font-mono opacity-80 bg-white/50 px-1 rounded">
                                            {startingOt.horaProgramada || '09:00'}{startingOt.horaFinProgramada ? ` - ${startingOt.horaFinProgramada}` : ''}
                                          </span>
                                        </div>
                                        <span className="text-[9px] truncate block opacity-80 group-hover:opacity-100">{getClientName(startingOt.clientId)}</span>
                                      </div>
                                    );
                                  } else if (overlappingOt) {
                                    return null;
                                  } else {
                                    return (
                                      <div key={time} className="bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1 flex justify-between items-center opacity-80">
                                        <span className="font-bold text-emerald-600 text-[9px]">Disponible</span>
                                        <span className="text-[8px] font-mono text-emerald-500">{time}</span>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
          initialValues={dropInitialValues || undefined}
          onUpdateOT={(ot) => {
            if (onUpdateOt) onUpdateOt(ot);
            setSelectedOtForAssign(null);
            setDropInitialValues(null);
            setDraggedOt(null);
          }}
          onClose={() => {
            setSelectedOtForAssign(null);
            setDropInitialValues(null);
            setDraggedOt(null);
          }}
        />
      )}
    </div>
  );
}
