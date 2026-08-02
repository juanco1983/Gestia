import React from 'react';
import { Clock } from 'lucide-react';
import { Equipo, User, OtEquipoAsignacion } from '../../types';

interface EquipoAsignacionCardProps {
  equipo: Equipo;
  asignacion?: OtEquipoAsignacion;
  users: User[];
  onSave: (data: {
    tecnicoTitularId: string | null;
    tecnicoApoyoId: string | null;
    fecha: string | null;
    hora: string | null;
    horaFin: string | null;
  }) => void;
  readOnly?: boolean;
}

export default function EquipoAsignacionCard({
  equipo,
  asignacion,
  users,
  onSave,
  readOnly = false
}: EquipoAsignacionCardProps) {
  const technicians = users.filter(u => u.role === 'Tecnico');
  const todayStr = new Date().toISOString().split('T')[0];

  const [techId, setTechId] = React.useState(asignacion?.tecnicoTitularId || '');
  const [apoyoId, setApoyoId] = React.useState(asignacion?.tecnicoApoyoId || '');
  const [fecha, setFecha] = React.useState(asignacion?.fecha || todayStr);
  const [hora, setHora] = React.useState(asignacion?.hora || '09:00');
  const [horaFin, setHoraFin] = React.useState(asignacion?.horaFin || '10:00');

  const handleUpdate = (updatedFields: any) => {
    if (readOnly) return;
    const finalFields = {
      tecnicoTitularId: updatedFields.techId !== undefined ? updatedFields.techId : techId,
      tecnicoApoyoId: updatedFields.apoyoId !== undefined ? updatedFields.apoyoId : apoyoId,
      fecha: updatedFields.fecha !== undefined ? updatedFields.fecha : fecha,
      hora: updatedFields.hora !== undefined ? updatedFields.hora : hora,
      horaFin: updatedFields.horaFin !== undefined ? updatedFields.horaFin : horaFin,
    };
    onSave({
      tecnicoTitularId: finalFields.tecnicoTitularId || null,
      tecnicoApoyoId: finalFields.tecnicoApoyoId || null,
      fecha: finalFields.fecha || null,
      hora: finalFields.hora || null,
      horaFin: finalFields.horaFin || null,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 hover:border-teal-brand/45 transition-colors">
      <div className="flex justify-between items-start border-b border-slate-200 pb-2">
        <div>
          <span className="text-xs font-black text-slate-800">
            {equipo.codigo} - {equipo.tipo}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Marca: {equipo.marca || '-'} | Modelo: {equipo.modelo || '-'} | Ubicac.: {equipo.ubicacion || '-'}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full font-bold uppercase">
          {equipo.potenciaKva || '-'} KVA
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Técnico Titular</label>
          <select
            disabled={readOnly}
            value={techId}
            onChange={(e) => {
              const val = e.target.value;
              setTechId(val);
              handleUpdate({ techId: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Seleccionar técnico...</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Técnico Apoyo</label>
          <select
            disabled={readOnly}
            value={apoyoId}
            onChange={(e) => {
              const val = e.target.value;
              setApoyoId(val);
              handleUpdate({ apoyoId: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Sin apoyo...</option>
            {technicians.filter(t => t.id !== techId).map(t => (
              <option key={t.id} value={t.id}>{t.username} ({t.area})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-0.5">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Fecha</label>
          <input
            disabled={readOnly}
            type="date"
            value={fecha}
            onChange={(e) => {
              const val = e.target.value;
              setFecha(val);
              handleUpdate({ fecha: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs text-slate-800 font-mono disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono flex items-center gap-1">
            <Clock size={10} /> Inicio
          </label>
          <input
            disabled={readOnly}
            type="time"
            value={hora}
            onChange={(e) => {
              const val = e.target.value;
              setHora(val);
              handleUpdate({ hora: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs text-slate-800 font-mono disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono flex items-center gap-1">
            <Clock size={10} /> Fin
          </label>
          <input
            disabled={readOnly}
            type="time"
            value={horaFin}
            onChange={(e) => {
              const val = e.target.value;
              setHoraFin(val);
              handleUpdate({ horaFin: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs text-slate-800 font-mono disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
