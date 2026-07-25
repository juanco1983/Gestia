import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Activity, Bell, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface DashboardHeaderProps {
  currentUser?: User | null;
  selectedRoleFilter: string;
  onRoleFilterChange: (role: string) => void;
  activeCount: number;
  onNavigateToTab?: (tabId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUser,
  selectedRoleFilter,
  onRoleFilterChange,
  activeCount,
  onNavigateToTab,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDateStr = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* User Greeting & Subtitle */}
        <div className="text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hola, {currentUser?.username || 'Juan Córdova'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5 font-mono uppercase tracking-wider">
            Centro de Comando Operativo
          </p>
        </div>

        {/* Right Status Indicators & Direct Navigation Button */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center lg:justify-end min-w-0">
          {/* Date Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
            <span className="truncate">{currentDateStr}</span>
          </div>

          {/* Real-time Clock Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono whitespace-nowrap">
            <Clock size={13} className="text-slate-500 shrink-0" />
            <span>{timeStr || '11:42 AM'}</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-extrabold font-mono whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Conexión estable</span>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            aria-label="Notificaciones operativas"
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer shrink-0"
            title="Notificaciones operativas"
          >
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Direct CTA to Operations */}
          <button
            type="button"
            onClick={() => onNavigateToTab?.('Monitoreo')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <span>Ir a Operaciones</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Role Filter Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={14} className="text-[#00B594] shrink-0" />
          <span className="text-xs font-semibold text-slate-500 truncate">
            {selectedRoleFilter === 'Todos'
              ? `Monitoreando ${activeCount} operaciones activas en tiempo real`
              : `Vista de consola filtrada por rol: ${selectedRoleFilter}`}
          </span>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto min-w-0">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase px-2.5 hidden md:inline shrink-0">
            Rol:
          </span>
          {['Todos', 'Operaciones', 'Supervisor', 'Técnico', 'Ventas'].map((role) => {
            const isActive = selectedRoleFilter === role;
            return (
              <button
                key={role}
                onClick={() => onRoleFilterChange(role)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
