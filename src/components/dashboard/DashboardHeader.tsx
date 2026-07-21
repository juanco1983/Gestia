import React from 'react';
import { User } from '../../types';

interface DashboardHeaderProps {
  currentUser?: User | null;
  selectedRoleFilter: string;
  onRoleFilterChange: (role: string) => void;
  activeCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUser,
  selectedRoleFilter,
  onRoleFilterChange,
  activeCount,
}) => {
  const currentDateStr = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 font-mono border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Centro de Comando Operativo
          </span>
          <span className="text-xs text-slate-400 font-medium font-mono hidden sm:inline">
            • {capitalize(currentDateStr)}
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Hola, {currentUser?.username || 'Equipo GESTIA'} 👋
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {selectedRoleFilter === 'Todos'
            ? `Monitoreando ${activeCount} operaciones activas en tiempo real`
            : `Vista optimizada para el rol de ${selectedRoleFilter}`}
        </p>
      </div>

      {/* Role Filter Selector */}
      <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100 self-start md:self-center">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase px-3 hidden sm:inline">
          Vista Rol:
        </span>
        {['Todos', 'Operaciones', 'Supervisor', 'Técnico', 'Ventas'].map((role) => {
          const isActive = selectedRoleFilter === role;
          return (
            <button
              key={role}
              onClick={() => onRoleFilterChange(role)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
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
  );
};

export default DashboardHeader;
