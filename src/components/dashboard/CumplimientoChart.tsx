import React, { useMemo } from 'react';
import { OT, OTStatus } from '../../types';
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CumplimientoChartProps {
  ots: OT[];
}

export const CumplimientoChart: React.FC<CumplimientoChartProps> = ({ ots }) => {
  // Compute daily completion vs scheduled for a window centered on today (last 7 + next 7 days)
  const dailyData = useMemo(() => {
    const days: Array<{ dayName: string; Completadas: number; Programadas: number; Cumplimiento: number }> = [];
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const localDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    for (let i = -7; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = localDateStr(d);
      const dayName = `${dayNames[d.getDay()]} ${d.getDate()}`;

      // Filter OTs for this exact date
      const otDay = ots.filter(o => o.fechaProgramada === dateStr);
      const programadasCount = otDay.length;
      const completadasCount = otDay.filter(
        o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA || o.estado === OTStatus.FIRMADA
      ).length;

      const cumplimientoPct = programadasCount > 0 ? Math.min(100, Math.round((completadasCount / programadasCount) * 100)) : 0;

      days.push({
        dayName,
        Completadas: completadasCount,
        Programadas: programadasCount,
        Cumplimiento: cumplimientoPct
      });
    }

    const totalScheduledOverall = ots.length;
    const totalCompletedOverall = ots.filter(
      o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA || o.estado === OTStatus.FIRMADA
    ).length;
    const avgCumplimiento = totalScheduledOverall > 0 ? Math.round((totalCompletedOverall / totalScheduledOverall) * 100) : 0;

    return { days, avgCumplimiento };
  }, [ots]);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] h-full flex flex-col justify-between text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={16} className="text-[#00B594]" />
            <span>Cumplimiento de OT por Día</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Ventana de 15 días (7 antes · hoy · 7 después) • Ratios de atención en campo
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60 self-start sm:self-center font-mono">
          <span className={`w-2 h-2 rounded-full ${dailyData.avgCumplimiento > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
          Promedio: {dailyData.avgCumplimiento}%
        </span>
      </div>

      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailyData.days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#00B594' }} unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 600 }}
            />
            <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
            <Bar yAxisId="left" dataKey="Completadas" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={16} name="Completadas" />
            <Bar yAxisId="left" dataKey="Programadas" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={16} name="Programadas" />
            <Line yAxisId="right" type="monotone" dataKey="Cumplimiento" stroke="#00B594" strokeWidth={3} dot={{ r: 4, fill: '#00B594' }} name="% Cumplimiento" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CumplimientoChart;
