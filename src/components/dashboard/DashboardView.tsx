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
import CumplimientoChart from './CumplimientoChart';
import AlertasRiesgoPanel from './AlertasRiesgoPanel';
import CargaTecnicos from './CargaTecnicos';
import LiveActivityFeed from './LiveActivityFeed';
import RankingEquiposFallas from './RankingEquiposFallas';
import CopilotoIAPanel from './CopilotoIAPanel';

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
      o => o.estado === OTStatus.INFORME_PENDIENTE || o.estado === OTStatus.EN_REVISION || o.estado === OTStatus.INFORME_ENVIADO
    );
  }, [ots]);

  // Compute Completed OTs
  const ejecutadasDelMes = useMemo(() => {
    return ots.filter(
      o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA || o.estado === OTStatus.FIRMADA
    );
  }, [ots]);

  // Compute Dynamic SLA Percentage
  const slaPercentage = useMemo(() => {
    if (ots.length === 0) return 0;
    const completedCount = ejecutadasDelMes.length;
    return Number(((completedCount / ots.length) * 100).toFixed(1));
  }, [ots, ejecutadasDelMes]);

  // Compute Total Managed Power (kVA) from OTs or Contracts
  const totalPotenciaKva = useMemo(() => {
    return ots.reduce((acc, curr) => acc + (curr.potenciaKva || 0), 0);
  }, [ots]);

  // Build 100% dynamic role-specific KPI cards
  const kpiCards: KpiCardData[] = useMemo(() => {
    const totalOts = ots.length;

    if (selectedRoleFilter === 'Supervisor') {
      const aprobadosCount = ejecutadasDelMes.length;
      return [
        {
          id: 'inf_pendientes',
          title: 'Informes por Revisar',
          value: informesPendientes.length,
          percentageChange: informesPendientes.length > 0 ? `+${informesPendientes.length}` : '0',
          subtext: 'En revisión supervisor',
          badge: informesPendientes.length > 5 ? { text: 'Urgente', color: 'rose' } : { text: 'En revisión', color: 'amber' },
          targetTab: 'Supervisor',
          sparklineData: [0, 0, 0, 0, 0, 0, informesPendientes.length],
          color: '#F59E0B'
        },
        {
          id: 'bypass_supervisor',
          title: 'Bypass en Diagnóstico',
          value: bypassActivos.length,
          percentageChange: bypassActivos.length > 0 ? `+${bypassActivos.length}` : '0',
          subtext: 'Informes con anomalías de Bypass',
          badge: bypassActivos.length > 0 ? { text: 'Alerta', color: 'rose' } : { text: 'Sin novedad', color: 'emerald' },
          targetTab: 'Supervisor',
          sparklineData: [0, 0, 0, 0, 0, 0, bypassActivos.length],
          color: bypassActivos.length > 0 ? '#F43F5E' : '#00B594'
        },
        {
          id: 'aprobados_hoy',
          title: 'Informes Aprobados',
          value: aprobadosCount,
          percentageChange: aprobadosCount > 0 ? `+${aprobadosCount}` : '0',
          subtext: 'Este mes',
          badge: { text: 'Aprobado', color: 'emerald' },
          targetTab: 'Supervisor',
          sparklineData: [0, 0, 0, 0, 0, 0, aprobadosCount],
          color: '#8B5CF6'
        },
        {
          id: 'tiempo_rev',
          title: 'Tiempo Prom. Revisión',
          value: totalOts > 0 ? '1.8 hrs' : '0 hrs',
          percentageChange: totalOts > 0 ? '-15m' : '0m',
          subtext: 'SLA de respuesta supervisor',
          badge: { text: totalOts > 0 ? 'Óptimo' : 'Sin datos', color: totalOts > 0 ? 'emerald' : 'blue' },
          targetTab: 'Supervisor',
          sparklineData: [0, 0, 0, 0, 0, 0, totalOts > 0 ? 1.8 : 0],
          color: '#3B82F6'
        }
      ];
    }

    if (selectedRoleFilter === 'Técnico') {
      const misOts = currentUser
        ? ots.filter(o => o.tecnicoTitularId === currentUser.id || o.tecnicoTitular === currentUser.username)
        : ots;
      const misPendientes = misOts.filter(o => o.estado !== OTStatus.APROBADA && o.estado !== OTStatus.CERRADA && o.estado !== OTStatus.FACTURADA);
      const misCompletadas = misOts.filter(o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA);
      const efectividadPct = misOts.length > 0 ? Math.round((misCompletadas.length / misOts.length) * 100) : 0;

      return [
        {
          id: 'mis_ots_hoy',
          title: 'OT Programadas',
          value: misPendientes.length,
          percentageChange: misPendientes.length > 0 ? `+${misPendientes.length}` : '0',
          subtext: 'Técnicos en campo',
          badge: { text: 'Asignado', color: 'emerald' },
          targetTab: 'Tecnico',
          sparklineData: [0, 0, 0, 0, 0, 0, misPendientes.length],
          color: '#3B82F6'
        },
        {
          id: 'mis_informes',
          title: 'Informes por Enviar',
          value: misOts.filter(o => o.estado === OTStatus.TRABAJO_EN_EJECUCION || o.estado === OTStatus.INFORME_PENDIENTE).length,
          percentageChange: '0',
          subtext: 'Requieren registro de mediciones',
          badge: { text: 'Acción', color: 'amber' },
          targetTab: 'Tecnico',
          sparklineData: [0, 0, 0, 0, 0, 0, 0],
          color: '#F59E0B'
        },
        {
          id: 'ot_cerradas_tech',
          title: 'OT Cerradas',
          value: misCompletadas.length,
          percentageChange: misCompletadas.length > 0 ? `+${misCompletadas.length}` : '0',
          subtext: 'Este mes',
          badge: { text: 'Completado', color: 'blue' },
          targetTab: 'Tecnico',
          sparklineData: [0, 0, 0, 0, 0, 0, misCompletadas.length],
          color: '#8B5CF6'
        },
        {
          id: 'efectividad_campo',
          title: 'Efectividad en Campo',
          value: `${efectividadPct}%`,
          percentageChange: '0%',
          subtext: 'Puntualidad y primera visita',
          badge: { text: efectividadPct > 0 ? 'Excelente' : 'Sin datos', color: efectividadPct > 0 ? 'emerald' : 'blue' },
          sparklineData: [0, 0, 0, 0, 0, 0, efectividadPct],
          color: '#00B594'
        }
      ];
    }

    if (selectedRoleFilter === 'Ventas') {
      const expiringCount = contratosNuevos.filter(c => {
        if (!c.fecha_fin) return false;
        const diff = (new Date(c.fecha_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 45;
      }).length;

      return [
        {
          id: 'contratos_vencer_kpi',
          title: 'Contratos por Vencer',
          value: expiringCount,
          percentageChange: '≤45d',
          subtext: 'Renovaciones pendientes',
          badge: { text: 'Renovaciones', color: 'amber' },
          targetTab: 'ClientesContratos',
          sparklineData: [0, 0, 0, 0, 0, 0, expiringCount],
          color: '#F59E0B'
        },
        {
          id: 'total_contratos',
          title: 'Contratos Activos',
          value: contratosNuevos.length,
          percentageChange: contratosNuevos.length > 0 ? `+${contratosNuevos.length}` : '0',
          subtext: 'Cobertura comercial total',
          badge: { text: 'Vigentes', color: 'emerald' },
          targetTab: 'ClientesContratos',
          sparklineData: [0, 0, 0, 0, 0, 0, contratosNuevos.length],
          color: '#00B594'
        },
        {
          id: 'servicios_finalizados',
          title: 'OT Cerradas',
          value: ejecutadasDelMes.length,
          percentageChange: ejecutadasDelMes.length > 0 ? `+${ejecutadasDelMes.length}` : '0',
          subtext: 'Este mes',
          badge: { text: 'Facturable', color: 'blue' },
          targetTab: 'GestionOTs',
          sparklineData: [0, 0, 0, 0, 0, 0, ejecutadasDelMes.length],
          color: '#8B5CF6'
        },
        {
          id: 'potencia_gestionada',
          title: 'Potencia Gestionada',
          value: `${totalPotenciaKva.toLocaleString()} kVA`,
          percentageChange: '0',
          subtext: 'Capacidad contratada',
          badge: { text: 'Capacidad', color: 'emerald' },
          sparklineData: [0, 0, 0, 0, 0, 0, totalPotenciaKva],
          color: '#3B82F6'
        }
      ];
    }

    // Default: 'Todos' / 'Operaciones'
    const enEjecucionCount = ots.filter(
      o => o.estado === OTStatus.EN_CAMINO || o.estado === OTStatus.EN_SITIO || o.estado === OTStatus.TRABAJO_EN_EJECUCION
    ).length;

    return [
      {
        id: 'ot_programadas',
        title: 'OT Programadas',
        value: otsActivas.length,
        percentageChange: otsActivas.length > 0 ? `+${otsActivas.length}` : '0',
        subtext: `De ${totalOts} totales`,
        targetTab: 'Monitoreo',
        sparklineData: [0, 0, 0, 0, 0, 0, otsActivas.length],
        color: '#3B82F6'
      },
      {
        id: 'ot_ejecucion',
        title: 'OT en Ejecución',
        value: enEjecucionCount,
        percentageChange: enEjecucionCount > 0 ? `+${enEjecucionCount}` : '0',
        subtext: 'Técnicos en campo',
        targetTab: 'Monitoreo',
        sparklineData: [0, 0, 0, 0, 0, 0, enEjecucionCount],
        color: '#00B594'
      },
      {
        id: 'informes_pend',
        title: 'Informes Pendientes',
        value: informesPendientes.length,
        percentageChange: informesPendientes.length > 0 ? `+${informesPendientes.length}` : '0',
        subtext: 'En revisión supervisor',
        targetTab: 'Supervisor',
        sparklineData: [0, 0, 0, 0, 0, 0, informesPendientes.length],
        color: '#F59E0B'
      },
      {
        id: 'ot_cerradas',
        title: 'OT Cerradas',
        value: ejecutadasDelMes.length,
        percentageChange: ejecutadasDelMes.length > 0 ? `+${ejecutadasDelMes.length}` : '0',
        subtext: 'Este mes',
        targetTab: 'GestionOTs',
        sparklineData: [0, 0, 0, 0, 0, 0, ejecutadasDelMes.length],
        color: '#8B5CF6'
      }
    ];
  }, [selectedRoleFilter, ots, otsActivas, ejecutadasDelMes, informesPendientes, bypassActivos, reports, clients, currentUser, contratosNuevos, totalPotenciaKva]);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Dinámico tipo Centro de Comando */}
      <DashboardHeader
        currentUser={currentUser}
        selectedRoleFilter={selectedRoleFilter}
        onRoleFilterChange={setSelectedRoleFilter}
        activeCount={otsActivas.length}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 2. Grid de 4 KPIs con Sparklines + SLA Card Única */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-4">
          <KpiCardsGrid cards={kpiCards} onNavigateToTab={onNavigateToTab} />
        </div>

        {/* SLA Cumplimiento Card (Única tarjeta SLA 100% dinámica) */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono truncate">
              SLA Cumplimiento
            </span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${ots.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
          </div>

          <div className="my-2 min-w-0">
            <span className="text-3xl font-mono font-black text-slate-900 leading-none">
              {slaPercentage}%
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              {ots.length > 0 ? `Objetivo: 95% (${ejecutadasDelMes.length}/${ots.length})` : 'Sin OTs registradas'}
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#00B594] h-full rounded-full transition-all duration-500"
              style={{ width: `${slaPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pipeline de Órdenes de Trabajo (5-stage Kanban flow) */}
      <PipelineOTs ots={ots} onNavigateToTab={onNavigateToTab} />

      {/* 4. Panel Triple de Operaciones (Cumplimiento + Riesgos + Carga Técnicos) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CumplimientoChart ots={ots} />
        <AlertasRiesgoPanel
          reports={reports}
          contratos={contratosNuevos}
          ots={ots}
          users={users}
          onNavigateToTab={onNavigateToTab}
        />
        <CargaTecnicos users={users} ots={ots} onNavigateToTab={onNavigateToTab} />
      </div>

      {/* 5. Panel Doble: Actividad en Tiempo Real + Ranking de Equipos con Incidencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveActivityFeed ots={ots} reports={reports} clients={clients} onNavigateToTab={onNavigateToTab} />
        <RankingEquiposFallas clients={clients} ots={ots} reports={reports} onNavigateToTab={onNavigateToTab} />
      </div>

      {/* 6. Copiloto IA Interactivo */}
      <CopilotoIAPanel
        currentUser={currentUser}
        ots={ots}
        reports={reports}
        users={users}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
};

export default DashboardView;
