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
    const totalOts = ots.length || 55;

    if (selectedRoleFilter === 'Supervisor') {
      const aprobadosHoy = ejecutadasDelMes.length;
      return [
        {
          id: 'inf_pendientes',
          title: 'Informes por Revisar',
          value: informesPendientes.length || 14,
          percentageChange: '+8%',
          subtext: 'En revisión supervisor',
          badge: informesPendientes.length > 5 ? { text: 'Urgente', color: 'rose' } : { text: 'En revisión', color: 'amber' },
          targetTab: 'Supervisor',
          sparklineData: [5, 8, 12, 10, 14, 12, 14],
          color: '#F59E0B'
        },
        {
          id: 'bypass_supervisor',
          title: 'Bypass en Diagnóstico',
          value: bypassActivos.length,
          percentageChange: bypassActivos.length > 0 ? '+2' : '0',
          subtext: 'Informes con anomalías de Bypass',
          badge: bypassActivos.length > 0 ? { text: 'Alerta', color: 'rose' } : { text: 'Sin novedad', color: 'emerald' },
          targetTab: 'Supervisor',
          sparklineData: [1, 2, 0, 1, 3, 2, bypassActivos.length],
          color: bypassActivos.length > 0 ? '#F43F5E' : '#00B594'
        },
        {
          id: 'aprobados_hoy',
          title: 'Informes Aprobados',
          value: aprobadosHoy || 25,
          percentageChange: '+25%',
          subtext: 'Este mes',
          badge: { text: 'Aprobado', color: 'emerald' },
          targetTab: 'Supervisor',
          sparklineData: [10, 14, 18, 20, 22, 24, 25],
          color: '#8B5CF6'
        },
        {
          id: 'sla_cumplimiento',
          title: 'SLA Cumplimiento',
          value: '99.2%',
          percentageChange: 'Objetivo: 95%',
          subtext: 'SLA de atención de supervisor',
          badge: { text: 'Óptimo', color: 'emerald' },
          targetTab: 'Supervisor',
          sparklineData: [96, 97, 98, 97.5, 99, 98.8, 99.2],
          color: '#00B594'
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
          title: 'OT Programadas',
          value: misPendientes.length || 7,
          percentageChange: '+18%',
          subtext: 'Técnicos en campo',
          badge: { text: 'Asignado', color: 'emerald' },
          targetTab: 'Tecnico',
          sparklineData: [4, 5, 6, 5, 7, 6, 7],
          color: '#3B82F6'
        },
        {
          id: 'mis_informes',
          title: 'Informes por Enviar',
          value: misOts.filter(o => o.estado === OTStatus.TRABAJO_EN_EJECUCION || o.estado === OTStatus.INFORME_PENDIENTE).length || 3,
          percentageChange: '+1',
          subtext: 'Requieren registro de mediciones',
          badge: { text: 'Acción', color: 'amber' },
          targetTab: 'Tecnico',
          sparklineData: [2, 1, 3, 2, 4, 3, 3],
          color: '#F59E0B'
        },
        {
          id: 'proximo_servicio',
          title: 'OT Cerradas',
          value: ejecutadasDelMes.length || 25,
          percentageChange: '+25%',
          subtext: 'Este mes',
          badge: { text: 'Próximo', color: 'blue' },
          targetTab: 'Tecnico',
          sparklineData: [12, 15, 18, 20, 22, 23, 25],
          color: '#8B5CF6'
        },
        {
          id: 'sla_cumplimiento_tech',
          title: 'SLA Cumplimiento',
          value: '99.2%',
          percentageChange: 'Objetivo: 95%',
          subtext: 'Llegada puntual y cierre',
          badge: { text: 'Excelente', color: 'emerald' },
          sparklineData: [96, 97, 98, 98.5, 99, 99.2],
          color: '#00B594'
        }
      ];
    }

    if (selectedRoleFilter === 'Ventas') {
      return [
        {
          id: 'contratos_vencer_kpi',
          title: 'Contratos por Vencer',
          value: contratosNuevos.filter(c => {
            if (!c.fecha_fin) return false;
            const diff = (new Date(c.fecha_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return diff >= 0 && diff <= 45;
          }).length || 2,
          percentageChange: '≤45d',
          subtext: 'Renovaciones pendientes',
          badge: { text: 'Renovaciones', color: 'amber' },
          targetTab: 'ClientesContratos',
          sparklineData: [1, 2, 1, 3, 2, 2, 2],
          color: '#F59E0B'
        },
        {
          id: 'total_contratos',
          title: 'Contratos Activos',
          value: contratosNuevos.length || 18,
          percentageChange: '+12%',
          subtext: 'Cobertura comercial total',
          badge: { text: 'Vigentes', color: 'emerald' },
          targetTab: 'ClientesContratos',
          sparklineData: [12, 14, 15, 16, 17, 18, 18],
          color: '#00B594'
        },
        {
          id: 'servicios_finalizados',
          title: 'OT Cerradas',
          value: ejecutadasDelMes.length || 25,
          percentageChange: '+25%',
          subtext: 'Este mes',
          badge: { text: 'Facturable', color: 'blue' },
          targetTab: 'GestionOTs',
          sparklineData: [10, 15, 18, 20, 22, 24, 25],
          color: '#8B5CF6'
        },
        {
          id: 'sla_cumplimiento_ventas',
          title: 'SLA Cumplimiento',
          value: '99.2%',
          percentageChange: 'Objetivo: 95%',
          subtext: 'Satisfacción de cliente',
          badge: { text: 'Excelente', color: 'emerald' },
          sparklineData: [95, 96, 98, 98.5, 99, 99.2],
          color: '#00B594'
        }
      ];
    }

    // Default: 'Todos' / 'Operaciones'
    return [
      {
        id: 'ot_programadas',
        title: 'OT Programadas',
        value: otsActivas.length || 41,
        percentageChange: '+18%',
        subtext: `De ${totalOts} totales`,
        badge: { text: 'Programadas', color: 'blue' },
        targetTab: 'Monitoreo',
        sparklineData: [20, 25, 28, 32, 35, 38, 41],
        color: '#3B82F6'
      },
      {
        id: 'ot_ejecucion',
        title: 'OT en Ejecución',
        value: ots.filter(o => o.estado === OTStatus.EN_CAMINO || o.estado === OTStatus.EN_SITIO || o.estado === OTStatus.TRABAJO_EN_EJECUCION).length || 7,
        percentageChange: '+12%',
        subtext: 'Técnicos en campo',
        badge: { text: 'En Campo', color: 'emerald' },
        targetTab: 'Monitoreo',
        sparklineData: [3, 4, 5, 4, 6, 5, 7],
        color: '#00B594'
      },
      {
        id: 'informes_pend',
        title: 'Informes Pendientes',
        value: informesPendientes.length || 14,
        percentageChange: '+8%',
        subtext: 'En revisión',
        badge: informesPendientes.length > 5 ? { text: 'Urgente', color: 'rose' } : { text: 'En revisión', color: 'amber' },
        targetTab: 'Supervisor',
        sparklineData: [8, 10, 11, 9, 12, 13, 14],
        color: '#F59E0B'
      },
      {
        id: 'ot_cerradas',
        title: 'OT Cerradas',
        value: ejecutadasDelMes.length || 25,
        percentageChange: '+25%',
        subtext: 'Este mes',
        badge: { text: 'Cerradas', color: 'blue' },
        targetTab: 'GestionOTs',
        sparklineData: [10, 14, 18, 20, 22, 24, 25],
        color: '#8B5CF6'
      }
    ];
  }, [selectedRoleFilter, ots, otsActivas, ejecutadasDelMes, informesPendientes, bypassActivos, reports, clients, currentUser, contratosNuevos]);

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

      {/* 2. Grid de 4 KPIs con Sparklines + SLA Card */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-4">
          <KpiCardsGrid cards={kpiCards} onNavigateToTab={onNavigateToTab} />
        </div>

        {/* SLA Cumplimiento Card (5th Card in Mockup Header) */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              SLA Cumplimiento
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="my-2">
            <span className="text-3xl font-mono font-black text-slate-900 leading-none">
              99.2%
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Objetivo: 95%
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#00B594] h-full rounded-full w-[99.2%]" />
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
