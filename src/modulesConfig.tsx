import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Wrench, 
  ShieldCheck, 
  FileText, 
  Users, 
  Briefcase,
  TrendingUp,
  Boxes
} from 'lucide-react';

export interface AppModule {
  id: string;
  displayLabel: string;
  path: string;
  iconColor: string;
  icon: React.ReactNode;
  badge: (selected: boolean, dynamicValue?: string | number) => React.ReactNode;
}

export const APP_MODULES: AppModule[] = [
  { 
    id: 'Dashboard', 
    displayLabel: 'Dashboard', 
    path: '/dashboard',
    iconColor: 'text-[#00B594]', 
    icon: <LayoutDashboard size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-[#E6F7F4] text-[#00B594]'}`}>
        Principal
      </span>
    )
  },
  { 
    id: 'ClientesContratos', 
    displayLabel: 'Comercial', 
    path: '/comercial',
    iconColor: 'text-indigo-500', 
    icon: <Building2 size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
        CRM
      </span>
    )
  },
  { 
    id: 'GestionOTs', 
    displayLabel: 'Gestión de OT', 
    path: '/gestion-ots',
    iconColor: 'text-[#00B594]', 
    icon: <FileText size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#00B594]'}`}>
        SLA
      </span>
    )
  },
  { 
    id: 'Monitoreo', 
    displayLabel: 'Operaciones', 
    path: '/operaciones',
    iconColor: 'text-[#00B594]', 
    icon: <Calendar size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-[#E6F7F4] text-[#00B594]'}`}>
        Agenda
      </span>
    )
  },
  { 
    id: 'InventarioEquipos', 
    displayLabel: 'Inventario de Equipos', 
    path: '/inventario-equipos',
    iconColor: 'text-teal-brand', 
    icon: <Boxes size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-teal-mist text-teal-brand'}`}>
        Equipos
      </span>
    )
  },
  { 
    id: 'Tecnico', 
    displayLabel: 'Técnicos', 
    path: '/tecnicos',
    iconColor: 'text-[#F59E0B]', 
    icon: <Wrench size={15} />,
    badge: (selected: boolean, count?: string | number) => (
      <span className={`text-[10px] font-bold font-mono py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count !== undefined ? count : 3}
      </span>
    )
  },
  { 
    id: 'Supervisor', 
    displayLabel: 'Supervisión', 
    path: '/supervision',
    iconColor: 'text-[#3B82F6]', 
    icon: <ShieldCheck size={15} />,
    badge: (selected: boolean, count?: string | number) => (
      <span className={`text-[10px] font-bold font-mono py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count !== undefined ? count : 1}
      </span>
    )
  },
  { 
    id: 'Ventas', 
    displayLabel: 'Portal de Ventas', 
    path: '/ventas',
    iconColor: 'text-[#00B594]', 
    icon: <TrendingUp size={15} />,
    badge: (selected: boolean) => (
      <span className={`text-[9px] font-black font-mono uppercase tracking-tight py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-amber-100 text-[#D97706]'}`}>
        Ventas
      </span>
    )
  },
  { 
    id: 'Cliente', 
    displayLabel: 'Portal Cliente', 
    path: '/portal-cliente',
    iconColor: 'text-[#64748B]', 
    icon: <Briefcase size={15} />,
    badge: (selected: boolean, count?: string | number) => (
      <span className={`text-[10px] font-bold font-mono py-0.5 px-2 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count !== undefined ? count : 0}
      </span>
    )
  },
  { 
    id: 'Usuarios', 
    displayLabel: 'Administración', 
    path: '/administracion',
    iconColor: 'text-[#64748B]', 
    icon: <Users size={15} />,
    badge: (selected: boolean, count?: string | number) => (
      <span className={`text-[9px] font-bold font-mono py-0.5 px-1.5 rounded-full flex items-center gap-1 ${selected ? 'bg-white/20 text-white' : 'bg-[#F1F3F4] text-slate-500'}`}>
        <span>{count !== undefined ? count : 6}</span>
      </span>
    )
  }
];

export const getModulePath = (role: string): string => {
  const mod = APP_MODULES.find(m => m.id === role);
  return mod ? mod.path : '/dashboard';
};

export const getRoleFromPath = (path: string): string | null => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/dashboard';
  const mod = APP_MODULES.find(m => m.path.toLowerCase() === cleanPath);
  if (mod) return mod.id;
  if (cleanPath === '/' || cleanPath === '') return 'Dashboard';
  return null;
};
