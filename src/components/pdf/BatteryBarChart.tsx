import React from 'react';

interface BatteryBarChartProps {
  data: Array<{ numero: number; voltajeFlotacion: string; resistenciaInterna?: string; soh?: number }>;
  tipo: 'voltaje' | 'resistencia';
  maxBars?: number;
}

export default function BatteryBarChart({ data, tipo, maxBars = 16 }: BatteryBarChartProps) {
  const slice = data.slice(0, maxBars);
  const values = slice.map(d => {
    const v = tipo === 'voltaje' ? parseFloat(d.voltajeFlotacion) : parseFloat(d.resistenciaInterna || '0');
    return isNaN(v) ? 0 : v;
  });
  const maxVal = Math.max(...values, 1);
  const minVal = tipo === 'voltaje' ? 12 : 0;
  const range = maxVal - minVal || 1;
  const barWidth = Math.max(8, Math.min(20, 180 / slice.length));
  const gap = 4;
  const chartW = Math.max(200, slice.length * (barWidth + gap) + 40);
  const chartH = 100;
  const baseY = chartH - 10;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: chartH, maxHeight: chartH }}>
      <line x1="30" y1={baseY} x2={chartW - 10} y2={baseY} stroke="#cbd5e1" strokeWidth="0.5" />
      {[0, 25, 50, 75, 100].map(pct => {
        const y = baseY - (pct / 100) * (baseY - 10);
        return (
          <g key={pct}>
            <line x1="28" y1={y} x2="30" y2={y} stroke="#cbd5e1" strokeWidth="0.5" />
            <text x="27" y={y + 2} textAnchor="end" fontSize="5" fill="#94a3b8" fontFamily="IBM Plex Mono">
              {(minVal + (pct / 100) * range).toFixed(1)}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const barH = ((v - minVal) / range) * (baseY - 10);
        const x = 35 + i * (barWidth + gap);
        const color = tipo === 'voltaje' ? '#0F9E82' : '#0B3B34';
        return (
          <g key={i}>
            <rect x={x} y={baseY - barH} width={barWidth} height={Math.max(barH, 2)} fill={color} rx="1" />
            <text x={x + barWidth / 2} y={baseY + 8} textAnchor="middle" fontSize="4" fill="#94a3b8" fontFamily="IBM Plex Mono">
              {slice[i].numero}
            </text>
          </g>
        );
      })}
      <text x={chartW / 2} y={chartH - 1} textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="IBM Plex Mono">
        Baterias ({tipo === 'voltaje' ? 'VDC' : 'mOhm'})
      </text>
    </svg>
  );
}
