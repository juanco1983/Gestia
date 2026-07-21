import React, { useState, useMemo } from 'react';
import {
  OT,
  Client,
  TechnicalReport,
  User,
  Contrato,
  OtEquipoAsignacion,
  OTStatus
} from '../../types';
import DashboardHeader from './DashboardHeader';
import KpiCardsGrid, { KpiCardData } from './KpiCardsGrid';
import PipelineOTs from './PipelineOTs';
import AlertasRiesgoPanel from './AlertasRiesgoPanel';
import CargaTecnicos from './CargaTecnicos';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardViewProps {
  currentUser?: User | null;
  ots: OT[];
  clients: Client[];
  reports: TechnicalReport[];
  users: User[];
  contratosNuevos: Contrato[];
  otEquipoAsignaciones?: OtEquipoAsignacion[];
  onNavigateToTab: (tabId: string, filter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  ots,
  clients,
  reports,
  users,
  contratosNuevos,
  otEquipoAsignaciones = [],
  onNavigateToTab
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('Todos');
  const [dashboardRange, setDashboardRange] = useState<'trimestral' | 'semestral'>('semestral');

  // Compute Active OTs
  const otsActivas = useMemo(() => {
    return ots.filter(
      o => o.estado !== OTStatus.APROBADA && o.estado !== OTStatus.CERRADA && o.estado !== OTStatus.FACTURADA
    );
  }, [ots]);

  // Compute Reports with active Bypass
  const bypassActivos = useMemo(() => {
    return reports.filter(
      r =>
        r.indicadoresBateria?.bypassActivo === true ||
        r.pasos?.paso1_funcionamiento === 'bypass' ||
        r.diagnosticoGabinete?.equipoEnBypass === 'si'
    );
  }, [reports]);

  // Compute Pending Reports
  const informesPendientes = useMemo(() => {
    return ots.filter(
      o => o.estado === OTStatus.INFORME_PENDIENTE || o.estado === OTStatus.EN_REVISION
    );
  }, [ots]);

  // Compute Completed OTs this month
  const ejecutadasDelMes = useMemo(() => {
    return ots.filter(
      o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA
    );
  }, [ots]);

  // Build role-specific KPI cards
  const kpiCards: KpiCardData[] = useMemo(() => {
    const totalOts = ots.length || 1;

    if (selectedRoleFilter === 'Supervisor') {
      const aprobadosHoy = ejecutadasDelMes.length;
      return [
        {
          id: 'inf_pendientes',
          title: 'Informes por Revisar',
          value: informesPendientes.length,
          subtext: 'Esperando validación de supervisor',
          badge: informesPendientes.length > 5 ? { text: 'Urgente', color: 'rose' } : { text: 'En cola', color: 'amber' },
          targetTab: 'Supervisor',
          progressValue: informesPendientes.length,
          progressTotal: totalOts,
          color: '#F59E0B'
        },
        {
          id: 'bypass_supervisor',
          title: 'Bypass en Diagnóstico',
          value: bypassActivos.length,
          subtext: 'Informes con anomalías de Bypass',
          badge: bypassActivos.length > 0 ? { text: 'Alerta', color: 'rose' } : { text: 'Sin novedad', color: 'emerald' },
          targetTab: 'Supervisor',
          progressValue: bypassActivos.length,
          progressTotal: reports.length || 1,
          color: bypassActivos.length > 0 ? '#F43F5E' : '#00B594'
        },
        {
          id: 'aprobados_hoy',
          title: 'Informes Aprobados',
          value: aprobadosHoy,
          subtext: 'Servicios cerrados satisfactoriamente',
          badge: { text: 'Hoy', color: 'emerald' },
          targetTab: 'Supervisor',
          progressValue: aprobadosHoy,
          progressTotal: totalOts,
          color: '#00B594'
        },
        {
          id: 'tiempo_rev',
          title: 'Tiempo Promedio Revisión',
          value: '1.8 hrs',
          subtext: 'SLA de atención de supervisor',
          badge: { text: 'Óptimo', color: 'emerald' },
          targetTab: 'Supervisor'
        }
      ];
    }

    if (selectedRoleFilter === 'Técnico') {
      const misOts = currentUser
        ? ots.filter(o => o.tecnicoTitularId === currentUser.id || o.tecnicoTitular === currentUser.username)
        : ots;
      const misPendientes = misOts.filter(o => o.estado !== OTStatus.APROBADA && o.estado !== OTStatus.CERRADA);
      return [
        {
          id: 'mis_ots_hoy',
          title: 'Mi Agenda del Día',
          value: misPendientes.length,
          subtext: 'Servicios programados para hoy',
          badge: { text: 'Asignado', color: 'emerald' },
          targetTab: 'Tecnico',
          progressValue: misPendientes.length,
          progressTotal: misOts.length || 1,
          color: '#00B594'
        },
        {
          id: 'mis_informes',
          title: 'Informes por Enviar',
          value: misOts.filter(o => o.estado === OTStatus.TRABAJO_EN_EJECUCION || o.estado === OTStatus.INFORME_PENDIENTE).length,
          subtext: 'Requieren registro de mediciones',
          badge: { text: 'Acción', color: 'amber' },
          targetTab: 'Tecnico'
        },
        {
          id: 'proximo_servicio',
          title: 'Próximo Cliente',
          value: misPendientes[0] ? (clients.find(c => c.id === misPendientes[0].clientId)?.razonSocial.substring(0, 15) || 'Asignado') : 'Ninguno',
          subtext: misPendientes[0]?.fechaProgramada || 'Sin pendientes',
          badge: { text: 'Próximo', color: 'blue' },
          targetTab: 'Tecnico'
        },
        {
          id: 'cumplimiento_tech',
          title: 'Efectividad en Campo',
          value: '98%',
          subtext: 'SLA de llegada puntual',
          badge: { text: 'Excelente', color: 'emerald' }
        }
      ];
    }

    if (selectedRoleFilter === 'Ventas') {
      return [
        {
          id: 'contratos_vencer_kpi',
          title: 'Contratos por Vencer (≤45d)',
          value: contratosNuevos.filter(c => {
            if (!c.fecha_fin) return false;
            const diff = (new Date(c.fecha_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return diff >= 0 && diff <= 45;
          }).length,
          subtext: 'Oportunidades de renovación comercial',
          badge: { text: 'Renovaciones', color: 'amber' },
          targetTab: 'ClientesContratos'
        },
        {
          id: 'total_contratos',
          title: 'Contratos Activos',
          value: contratosNuevos.length,
          subtext: 'Cobertura comercial total',
          badge: { text: 'Vigentes', color: 'emerald' },
          targetTab: 'ClientesContratos'
        },
        {
          id: 'servicios_finalizados',
          title: 'Servicios Aprobados M/M',
          value: ejecutadasDelMes.length,
          subtext: 'Listos para facturación',
          badge: { text: 'Facturable', color: 'blue' },
          targetTab: 'GestionOTs'
        },
        {
          id: 'potencia_kva',
          title: 'Potencia Gestionada',
          value: '4,250 kVA',
          subtext: 'Capacidad de infraestructura instalada',
          badge: { text: 'Capacidad', color: 'emerald' }
        }
      ];
    }

    // Default: 'Todos' / 'Operaciones'
    return [
      {
        id: 'ots_activas',
        title: 'Pipeline OTs Activas',
        value: otsActivas.length,
        subtext: `${otsActivas.length} en ejecución de ${totalOts} totales`,
        badge: { text: 'En Campo', color: 'emerald' },
        targetTab: 'Monitoreo',
        progressValue: otsActivas.length,
        progressTotal: totalOts,
        color: '#00B594'
      },
      {
        id: 'visitas_mes',
        title: 'Visitas Ejecutadas',
        value: ejecutadasDelMes.length,
        subtext: `${ejecutadasDelMes.length} completadas de ${totalOts} programadas`,
        badge: { text: 'Completado', color: 'emerald' },
        targetTab: 'Monitoreo',
        progressValue: ejecutadasDelMes.length,
        progressTotal: totalOts,
        color: '#00B594'
      },
      {
        id: 'informes_pend',
        title: 'Informes Pendientes',
        value: informesPendientes.length,
        subtext: 'Esperando aprobación de supervisor',
        badge: informesPendientes.length > 3 ? { text: 'Revisar', color: 'amber' } : { text: 'Normal', color: 'emerald' },
        targetTab: 'Supervisor',
        progressValue: informesPendientes.length,
        progressTotal: totalOts,
        color: '#F59E0B'
      },
      {
        id: 'bypass_critico',
        title: 'Equipos en Bypass',
        value: bypassActivos.length,
        subtext: bypassActivos.length > 0 ? 'Requieren atención inmediata' : 'Sin incidencias críticas',
        badge: bypassActivos.length > 0 ? { text: 'Crítico', color: 'rose' } : { text: 'OK', color: 'emerald' },
        targetTab: 'Supervisor',
        progressValue: bypassActivos.length,
        progressTotal: reports.length || 1,
        color: bypassActivos.length > 0 ? '#F43F5E' : '#00B594'
      }
    ];
  }, [selectedRoleFilter, ots, otsActivas, ejecutadasDelMes, informesPendientes, bypassActivos, reports, clients, currentUser, contratosNuevos]);

  // Mock historical trend data for chart
  const areaData = useMemo(() => {
    return [
      { name: 'Feb', Completadas: 18, Facturadas: 15, 'Por Facturar': 3 },
      { name: 'Mar', Completadas: 24, Facturadas: 20, 'Por Facturar': 4 },
      { name: 'Abr', Completadas: 22, Facturadas: 19, 'Por Facturar': 3 },
      { name: 'May', Completadas: 29, Facturadas: 25, 'Por Facturar': 4 },
      { name: 'Jun', Completadas: 34, Facturadas: 28, 'Por Facturar': 6 },
      { name: 'Jul', Completadas: 31, Facturadas: 26, 'Por Facturar': 5 }
    ].slice(dashboardRange === 'semestral' ? 0 : 3);
  }, [dashboardRange]);

  return (
    <div className="space-y-6">
      {/* 1. Header Dinámico con Selector de Rol */}
      <DashboardHeader
        currentUser={currentUser}
        selectedRoleFilter={selectedRoleFilter}
        onRoleFilterChange={setSelectedRoleFilter}
        activeCount={otsActivas.length}
      />

      {/* 2. Grid de KPIs Adaptativos */}
      <KpiCardsGrid cards={kpiCards} onNavigateToTab={onNavigateToTab} />

      {/* 3. Pipeline de OTs (Embudo de Trabajo) */}
      <PipelineOTs ots={ots} onNavigateToTab={onNavigateToTab} />

      {/* 4. Panel Doble: Alertas de Riesgo + Carga de Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertasRiesgoPanel
          reports={reports}
          contratos={contratosNuevos}
          ots={ots}
          users={users}
          onNavigateToTab={onNavigateToTab}
        />
        <CargaTecnicos users={users} ots={ots} onNavigateToTab={onNavigateToTab} />
      </div>

      {/* 5. Evolución Operativa y Gráfica Principal */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Evolución de Operaciones y Servicios ({dashboardRange === 'semestral' ? 'Últimos 6 Meses' : 'Últimos 3 Meses'})
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Tendencia mensual de cumplimiento de OTs y facturación
            </p>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 p-0.5 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setDashboardRange('trimestral')}
              className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                dashboardRange === 'trimestral'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => setDashboardRange('semestral')}
              className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                dashboardRange === 'semestral'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Semestral
            </button>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompletadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B594" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00B594" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="colorFacturadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', fontSize: '11px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="Completadas" stroke="#00B594" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompletadas)" />
              <Area type="monotone" dataKey="Facturadas" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFacturadas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
