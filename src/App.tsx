import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_CLIENTS, INITIAL_CONTRACTS, INITIAL_OTS, INITIAL_USERS, INITIAL_LOGS } from './mockData';
import { Client, Contract, OT, OTStatus, TechnicalReport, User, UserActivityLog, OrdenTrabajoLinea, Contrato, TargetVentas, ServiceType, EquipmentType, OtEquipoAsignacion } from './types';
import { INITIAL_ORDENES_TRABAJO, INITIAL_CONTRATOS_NUEVOS, INITIAL_TARGET_VENTAS } from './utils/otDefaults';
import OrdenesTrabajoView from './components/OrdenesTrabajoView';
import ClientesContratosView from './components/ClientesContratosView';
import VentasView from './components/VentasView';
import TecnicoView from './components/TecnicoView';
import SupervisorView from './components/SupervisorView';
import ClienteView from './components/ClienteView';
import LoginView from './components/LoginView';
import UserManagementView from './components/UserManagementView';
import TechMonitoringDashboard from './components/TechMonitoringDashboard';
import DashboardView from './components/dashboard/DashboardView';
import { APP_MODULES } from './modulesConfig';
import { 
  AlertCircle, 
  Terminal, 
  LayoutDashboard, 
  PhoneCall, 
  Wrench, 
  ShieldCheck, 
  Briefcase, 
  Users, 
  LogOut, 
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  FileText, 
  Activity, 
  ArrowUpRight,
  Menu,
  Bell,
  Play,
  Calendar,
  Building2,
  Mail,
  User as UserIcon,
} from 'lucide-react';

// Helper components for the main dashboard mockup look
interface CircularProgressProps {
  value: number;
  total: number;
  label?: string;
  color?: string;
  size?: number;
}

function CircularProgress({ value, total, label, color = '#00B594', size = 42 }: CircularProgressProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 13.5;
  const circumference = 2 * Math.PI * radius; // approx 84.82
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="relative flex items-center justify-center shrink-0 animate-fade-in" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="text-slate-150"
          strokeWidth="3.2"
          stroke="currentColor"
          fill="none"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          strokeWidth="3.2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={color}
          fill="none"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute font-sans text-[8.5px] font-black text-slate-700 leading-none">
        {label || `${value}/${total}`}
      </div>
    </div>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from 'recharts';

const getAppDefaultModulesForRole = (role: string): string[] => {
  if (role === 'Administrador') {
    return ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas', 'Tecnico', 'Supervisor', 'Cliente', 'Usuarios'];
  } else if (role === 'Ventas') {
    return ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas'];
  } else if (role === 'Tecnico') {
    return ['Dashboard', 'Monitoreo', 'Tecnico'];
  } else if (role === 'Supervisor') {
    return ['Dashboard', 'Monitoreo', 'Supervisor'];
  } else if (role === 'Cliente') {
    return ['Dashboard', 'Monitoreo', 'Cliente'];
  }
  return ['Dashboard', 'Monitoreo'];
};


export default function App() {
  // Live dynamic list of users
  // Clear ALL mafort cache to prevent zombie data (offline queues, old states) from pushing to the server
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('gestia_') && key !== 'gestia_jwt_token' && key !== 'gestia_current_user') {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const [users, setUsers] = useState<User[]>(() => {
    const local = localStorage.getItem('gestia_users');
    const parsed = local ? JSON.parse(local) : INITIAL_USERS;
    if (Array.isArray(parsed)) {
      let changed = false;
      const updated = parsed.map((u: any) => {
        if (!u.allowedModules || u.allowedModules.length === 0) {
          u.allowedModules = getAppDefaultModulesForRole(u.role);
          changed = true;
        }
        return u;
      });
      if (changed) {
        localStorage.setItem('gestia_users', JSON.stringify(updated));
      }
      return updated;
    }
    return INITIAL_USERS;
  });

  // Dynamic security activity logs
  const [userLogs, setUserLogs] = useState<UserActivityLog[]>(() => {
    const local = localStorage.getItem('gestia_user_logs');
    return local ? JSON.parse(local) : INITIAL_LOGS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const local = localStorage.getItem('gestia_current_user');
    if (local) {
      try {
        const u = JSON.parse(local) as User;
        if (u && (!u.allowedModules || u.allowedModules.length === 0)) {
          u.allowedModules = getAppDefaultModulesForRole(u.role);
          localStorage.setItem('gestia_current_user', JSON.stringify(u));
        }
        return u;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<'Dashboard' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente' | 'Usuarios' | 'GestionOTs' | 'ClientesContratos' | 'Monitoreo'>(() => {
    const local = localStorage.getItem('gestia_current_user');
    if (local) {
      try {
        const u = JSON.parse(local) as User;
        if (u && u.role) {
          if (u.role === 'Administrador') return 'Dashboard';
          return u.role as any;
        }
      } catch (e) {
        // Fallback
      }
    }
    return 'Dashboard';
  });
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard sub-tab switcher
  const [dashboardSubTab, setDashboardSubTab] = useState<'analytics' | 'monitoring'>('analytics');
  
  // Dashboard chart range switcher (Trimestral/Semestral)
  const [dashboardRange, setDashboardRange] = useState<'trimestral' | 'semestral'>('trimestral');

  // Real-time online state
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Persistent States loaded from localStorage
  const [clients, setClients] = useState<Client[]>(() => {
    const local = localStorage.getItem('gestia_clients');
    if (local) {
      const parsed = JSON.parse(local);
      const containsOldData = parsed.some((c: any) => 
        c.razonSocial?.includes('Repsol') || 
        c.razonSocial?.includes('San Pablo') || 
        c.razonSocial?.includes('Prosegur')
      );
      if (!containsOldData && parsed.length > 0) return parsed;
    }
    return INITIAL_CLIENTS;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const local = localStorage.getItem('gestia_contracts');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_contracts from localStorage", e);
      }
    }
    return INITIAL_CONTRACTS;
  });

  const [ots, setOts] = useState<OT[]>(() => {
    const local = localStorage.getItem('gestia_ots');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_ots from localStorage", e);
      }
    }
    return INITIAL_OTS;
  });

  const [reports, setReports] = useState<TechnicalReport[]>(() => {
    const local = localStorage.getItem('gestia_reports');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_reports from localStorage", e);
      }
    }
    return [];
  });

  // Offline buffer state queue
  const [offlineQueue, setOfflineQueue] = useState<TechnicalReport[]>(() => {
    const local = localStorage.getItem('gestia_offline_queue');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_offline_queue from localStorage", e);
      }
    }
    return [];
  });

  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoLinea[]>(() => {
    const local = localStorage.getItem('gestia_ordenes_trabajo');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_ordenes_trabajo from localStorage", e);
      }
    }
    return INITIAL_ORDENES_TRABAJO;
  });

  const [contratosNuevos, setContratosNuevos] = useState<Contrato[]>(() => {
    const local = localStorage.getItem('gestia_contratos_nuevos');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing gestia_contratos_nuevos from localStorage", e);
      }
    }
    return INITIAL_CONTRATOS_NUEVOS;
  });

  const [targetVentas, setTargetVentas] = useState<TargetVentas[]>(() => {
    const local = localStorage.getItem('gestia_target_ventas');
    return local ? JSON.parse(local) : INITIAL_TARGET_VENTAS;
  });

  const [otEquipoAsignaciones, setOtEquipoAsignaciones] = useState<OtEquipoAsignacion[]>(() => {
    const local = localStorage.getItem('gestia_ot_equipo_asignaciones');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('gestia_ot_equipo_asignaciones', JSON.stringify(otEquipoAsignaciones));
  }, [otEquipoAsignaciones]);

  const [tipoCambio, setTipoCambio] = useState<number>(() => {
    const local = localStorage.getItem('gestia_tipo_cambio');
    return local ? Number(local) : 3.75;
  });

  useEffect(() => {
    localStorage.setItem('gestia_tipo_cambio', tipoCambio.toString());
  }, [tipoCambio]);

  // Sync state on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gestia_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gestia_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('gestia_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gestia_user_logs', JSON.stringify(userLogs));
  }, [userLogs]);

  useEffect(() => {
    localStorage.setItem('gestia_ots', JSON.stringify(ots));
  }, [ots]);

  useEffect(() => {
    localStorage.setItem('gestia_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('gestia_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('gestia_ots', JSON.stringify(ots));
  }, [ots]);

  useEffect(() => {
    localStorage.setItem('gestia_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('gestia_ordenes_trabajo', JSON.stringify(ordenesTrabajo));
  }, [ordenesTrabajo]);

  // Local/offline sync between ordenesTrabajo (financial/billing cuotas) and ots (operational tasks)
  useEffect(() => {
    let changed = false;
    const updatedOts = [...ots];

    ordenesTrabajo.forEach((linea) => {
      if (linea.pendiente === 'POR EJECUTAR') {
        const otId = `OT-${linea.ot}`;
        const exists = updatedOts.some(ot => ot.id === otId || ot.otFinancieraId === linea.id);
        if (!exists) {
          // Find client matching razon_social
          let clientId = linea.clientId || '';
          if (!clientId && clients) {
            const matched = clients.find(c => c.razonSocial === linea.razon_social);
            if (matched) clientId = matched.id;
            else if (clients.length > 0) clientId = clients[0].id;
          }

          let tipoMantenimiento = ServiceType.PREVENTIVO;
          if (linea.tipo_venta === 'EMERGENCIA') {
            tipoMantenimiento = ServiceType.EMERGENCIA;
          } else if (linea.tipo_venta === 'REPARACION') {
            tipoMantenimiento = ServiceType.CORRECTIVO;
          }

          const newOt: OT = {
            id: otId,
            clientId: clientId,
            tipoMantenimiento: tipoMantenimiento,
            tipoEquipo: EquipmentType.UPS,
            potenciaKva: 30,
            fechaProgramada: linea.fecha || new Date().toISOString().split('T')[0],
            tecnicoTitular: '',
            estado: OTStatus.CREADA,
            otFinancieraId: linea.id,
            contratoId: (linea as any).contratoId || undefined,
            adendaId: (linea as any).adendaId || undefined,
            equipoId: (linea as any).equipoId || undefined
          };
          updatedOts.push(newOt);
          changed = true;
        } else {
          // Sync existing fields if they changed
          const idx = updatedOts.findIndex(ot => ot.id === otId || ot.otFinancieraId === linea.id);
          if (idx !== -1) {
            const existing = updatedOts[idx];
            let localChanged = false;
            
            let clientId = linea.clientId || '';
            if (!clientId && clients) {
              const matched = clients.find(c => c.razonSocial === linea.razon_social);
              if (matched) clientId = matched.id;
            }

            if (existing.clientId !== clientId && clientId) {
              existing.clientId = clientId;
              localChanged = true;
            }
            if (existing.fechaProgramada !== linea.fecha && linea.fecha) {
              existing.fechaProgramada = linea.fecha;
              localChanged = true;
            }
            let tipoMantenimiento = ServiceType.PREVENTIVO;
            if (linea.tipo_venta === 'EMERGENCIA') {
              tipoMantenimiento = ServiceType.EMERGENCIA;
            } else if (linea.tipo_venta === 'REPARACION') {
              tipoMantenimiento = ServiceType.CORRECTIVO;
            }
            if (existing.tipoMantenimiento !== tipoMantenimiento) {
              existing.tipoMantenimiento = tipoMantenimiento;
              localChanged = true;
            }
            if (!existing.otFinancieraId) {
              existing.otFinancieraId = linea.id;
              localChanged = true;
            }
            if (existing.contratoId !== (linea as any).contratoId) {
              existing.contratoId = (linea as any).contratoId || undefined;
              localChanged = true;
            }
            if ((existing as any).adendaId !== (linea as any).adendaId) {
              (existing as any).adendaId = (linea as any).adendaId || undefined;
              localChanged = true;
            }
            if (existing.equipoId !== (linea as any).equipoId) {
              existing.equipoId = (linea as any).equipoId || undefined;
              localChanged = true;
            }

            if (localChanged) {
              updatedOts[idx] = existing;
              changed = true;
            }
          }
        }
      } else if (linea.pendiente === 'ANULADO') {
        const otId = `OT-${linea.ot}`;
        const idx = updatedOts.findIndex(ot => ot.id === otId || ot.otFinancieraId === linea.id);
        if (idx !== -1) {
          updatedOts.splice(idx, 1);
          changed = true;
        }
      }
    });

    if (changed) {
      setOts(updatedOts);
    }
  }, [ordenesTrabajo, clients]);

  useEffect(() => {
    localStorage.setItem('gestia_contratos_nuevos', JSON.stringify(contratosNuevos));
  }, [contratosNuevos]);

  useEffect(() => {
    localStorage.setItem('gestia_target_ventas', JSON.stringify(targetVentas));
  }, [targetVentas]);

  useEffect(() => {
    localStorage.setItem('gestia_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('gestia_jwt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('gestia_jwt_token');
      localStorage.removeItem('gestia_current_user');
      setCurrentUser(null);
      throw new Error('Sesión expirada o inválida. Por favor inicie sesión.');
    }
    return response;
  };

  // Load from database on mount or login
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        console.log(">>> INICIANDO CARGA: Verificando datos locales pendientes...");
        
        // Intentamos sincronizar primero
        const syncSuccess = await handleSyncOffline();
        
        // Si hay cambios pendientes de sincronizar (cola offline) y la sincronización falló,
        // NO cargamos del servidor para evitar que datos antiguos sobrescriban el trabajo del usuario.
        // NOTA: Solo offlineQueue representa cambios reales pendientes. Los arrays como ordenesTrabajo
        // pueden contener datos iniciales/seed que NO deben bloquear la carga del servidor.
        const hasPendingOfflineChanges = offlineQueue.length > 0;

        if (!syncSuccess && hasPendingOfflineChanges) {
          console.warn(">>> ADVERTENCIA: Sincronización fallida y hay cambios offline pendientes. Abortando carga del servidor para proteger datos locales.");
          return;
        }

        console.log(">>> CARGANDO DATOS DEL SERVIDOR...");
        const [
          usersRes, logsRes, clientsRes, contractsRes, otsRes, reportsRes,
          otLineasRes, contratosComercialesRes, targetVentasRes, configRes,
          asignacionesRes
        ] = await Promise.all([
          fetchWithAuth('/api/users').then(res => res.json()),
          fetchWithAuth('/api/logs').then(res => res.json()),
          fetchWithAuth('/api/clients').then(res => res.json()),
          fetchWithAuth('/api/contracts').then(res => res.json()),
          fetchWithAuth('/api/ots').then(res => res.json()),
          fetchWithAuth('/api/reports').then(res => res.json()),
          fetchWithAuth('/api/ot-lineas').then(res => res.json()),
          fetchWithAuth('/api/contratos-comerciales').then(res => res.json()),
          fetchWithAuth('/api/target-ventas').then(res => res.json()),
          fetchWithAuth('/api/config').then(res => res.json()),
          fetchWithAuth('/api/ot-equipo-asignaciones').then(res => res.json())
        ]);

        if (Array.isArray(usersRes)) setUsers(usersRes);
        if (Array.isArray(logsRes)) setUserLogs(logsRes);
        if (Array.isArray(clientsRes)) setClients(clientsRes);
        if (Array.isArray(contractsRes)) setContracts(contractsRes);
        if (Array.isArray(otsRes)) setOts(otsRes);
        if (Array.isArray(reportsRes)) setReports(reportsRes);
        if (Array.isArray(otLineasRes)) setOrdenesTrabajo(otLineasRes);
        if (Array.isArray(contratosComercialesRes)) setContratosNuevos(contratosComercialesRes);
        if (Array.isArray(targetVentasRes)) setTargetVentas(targetVentasRes);
        if (Array.isArray(asignacionesRes)) setOtEquipoAsignaciones(asignacionesRes);
        if (configRes && typeof configRes.tipoCambio === 'number') setTipoCambio(configRes.tipoCambio);
      } catch (error) {
        console.error("Conexión local (utilizando caché local offline):", error);
      }
    };
    
    if (currentUser) {
      loadFromBackend();
    }

    // Auto-sync when coming back online
    const handleOnline = () => {
      console.log("Conexión restablecida. Iniciando sincronización...");
      handleSyncOffline();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  // Sync route on role switch
  useEffect(() => {
    if (currentUser) {
      const allowedRoles = ['Administrador', 'Ventas'];
      const userDefaultRole = currentUser.role === 'Cliente' ? 'Cliente' :
                               currentUser.role === 'Tecnico' ? 'Tecnico' :
                               currentUser.role === 'Supervisor' ? 'Supervisor' : 'Dashboard';
      
      if (!allowedRoles.includes(currentUser.role) && currentRole !== userDefaultRole && currentRole !== currentUser.role) {
        setCurrentRole(userDefaultRole as any);
      }
    }
  }, [currentUser, currentRole]);

  // DB Handlers
  const handleAddClient = async (newClient: Client) => {
    try {
      const response = await fetchWithAuth('/api/clients', {
        method: 'POST',
        body: JSON.stringify(newClient)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error en el servidor al registrar el cliente.");
      }
      const created = await response.json();
      setClients(prev => [...prev, created]);
      return true;
    } catch (e: any) {
      if (e.message && (e.message.includes("registrar") || e.message.includes("servidor") || e.message.includes("Sesión expirada"))) {
        throw e;
      }
      setClients(prev => [...prev, newClient]);
      console.warn("Cliente guardado en caché local:", e);
      throw new Error("offline");
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const response = await fetchWithAuth(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClient)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error al actualizar el cliente.");
      }
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      return true;
    } catch (e: any) {
      if (e.message && (e.message.includes("actualizar") || e.message.includes("Sesión expirada"))) {
        throw e;
      }
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      console.warn("Error al actualizar cliente en el servidor (actualizado localmente):", e);
      throw new Error("offline");
    }
  };

  const handleAddContract = async (newContract: Contract) => {
    setContracts(prev => [...prev, newContract]);
    try {
      await fetchWithAuth('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(newContract)
      });
    } catch (e) {
      console.warn("Contrato guardado en caché local:", e);
    }
  };

  const handleAddOT = async (newOT: OT) => {
    try {
      const response = await fetchWithAuth('/api/ots', {
        method: 'POST',
        body: JSON.stringify(newOT)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(`No se pudo crear la OT: ${errorData.error || 'Error desconocido'}`);
        return;
      }

      const created = await response.json();
      setOts(prev => [...prev, created]);
    } catch (e) {
      console.warn("OT guardada en caché local (offline):", e);
      setOts(prev => [...prev, newOT]);
    }
  };

  const syncFinancialLineWithOT = (otId: string, status: OTStatus, otFinancieraId?: string) => {
    if (status === OTStatus.APROBADA || status === OTStatus.FIRMADA) {
      setOrdenesTrabajo(prevLines => 
        prevLines.map(line => {
          const isMatch = line.id === otFinancieraId || 
                          line.ot === otId || 
                          String(line.ot) === String(otId).replace('OT-', '');
          if (isMatch) {
            // Append comment to history log if not already there
            const alreadyHasLog = line.estatus?.some(e => e.texto.includes("marcada como EJECUTADO")) || false;
            const newEstatus = [...(line.estatus || [])];
            if (!alreadyHasLog) {
              newEstatus.push({
                fecha: new Date().toISOString().split("T")[0],
                autor: "Sistema Automatizado",
                texto: `Aprobación o Firma registrada. OT Técnica ${otId} marcada como EJECUTADO y lista para facturar.`
              });
            }
            return {
              ...line,
              pendiente: 'EJECUTADO',
              estado: 'POR FACTURAR',
              listaParaFacturar: true,
              estatus: newEstatus
            };
          }
          return line;
        })
      );
    }
  };

  const handleUpdateOT = async (updatedOT: OT) => {
    setOts(prev => prev.map(o => o.id === updatedOT.id ? updatedOT : o));
    syncFinancialLineWithOT(updatedOT.id, updatedOT.estado, updatedOT.otFinancieraId);
    try {
      await fetchWithAuth(`/api/ots/${updatedOT.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedOT)
      });
    } catch (e) {
      console.warn("OT update guardado localmente:", e);
    }
  };

  const handleSaveEquipoAsignacion = async (asg: OtEquipoAsignacion) => {
    try {
      const response = await fetchWithAuth('/api/ot-equipo-asignaciones', {
        method: 'POST',
        body: JSON.stringify(asg)
      });
      if (response.ok) {
        const createdOrUpdated = await response.json();
        setOtEquipoAsignaciones(prev => {
          const exists = prev.some(a => a.otId === createdOrUpdated.otId && a.equipoId === createdOrUpdated.equipoId);
          if (exists) {
            return prev.map(a => (a.otId === createdOrUpdated.otId && a.equipoId === createdOrUpdated.equipoId) ? createdOrUpdated : a);
          }
          return [...prev, createdOrUpdated];
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error saving equipment assignment:", err);
      return false;
    }
  };

  const handleUpdateOtStatus = async (otId: string, status: OTStatus) => {
    let extraUpdates: Partial<OT> = {};
    if (status === OTStatus.TRABAJO_EN_EJECUCION) {
      const now = new Date();
      extraUpdates.horaInicioServicio = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    }
    
    setOts(prevOts => {
      const matched = prevOts.find(o => o.id === otId);
      if (matched) {
        syncFinancialLineWithOT(otId, status, matched.otFinancieraId);
      }
      return prevOts.map(o => o.id === otId ? { ...o, estado: status, ...extraUpdates } : o);
    });
    try {
      await fetchWithAuth(`/api/ots/${otId}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: status, ...extraUpdates })
      });
    } catch (e) {
      console.warn("Estado de OT guardado localmente:", e);
    }
  };

  const handleAddReport = async (newReport: TechnicalReport) => {
    setReports(prev => {
      const filtered = prev.filter(r => r.otId !== newReport.otId);
      return [...filtered, newReport];
    });
    try {
      await fetchWithAuth('/api/reports', {
        method: 'POST',
        body: JSON.stringify(newReport)
      });
    } catch (e) {
      console.warn("Reporte guardado localmente:", e);
    }
  };

  const handleSaveReportOffline = (report: TechnicalReport) => {
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, report]);
      setReports(prev => {
        const filtered = prev.filter(r => r.otId !== report.otId);
        return [...filtered, report];
      });
    } else {
      handleAddReport(report);
    }
  };

  const handleSyncOffline = async () => {
    // Sincronización offline desactivada por solicitud del usuario
    console.log(">>> Sincronización offline desactivada.");
    return true;
  };

  const handleAddUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    try {
      await fetchWithAuth('/api/users', {
        method: 'POST',
        body: JSON.stringify(user)
      });
    } catch (e) {
      console.warn("Usuario guardado en local:", e);
    }
  };

  const handleUpdateUser = async (userId: string, updated: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
    }

    try {
      await fetchWithAuth(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn("Cambios guardados localmente:", e);
    }
  };

  const handleAddLog = async (log: UserActivityLog) => {
    setUserLogs(prev => [log, ...prev]);
    try {
      await fetchWithAuth('/api/logs', {
        method: 'POST',
        body: JSON.stringify(log)
      });
    } catch (e) {
      console.warn("Bitácora guardada en local:", e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));

    const newAuditLog: UserActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: currentUser ? currentUser.email : 'sistema',
      action: 'ELIMINAR_USUARIO',
      details: `Baja permanente del operador [${userToDelete?.username || userId}]`,
      ipAddress: '192.168.10.15'
    };
    handleAddLog(newAuditLog);

    try {
      await fetchWithAuth(`/api/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Usuario eliminado localmente:", e);
    }
  };

  // FINANCIAL / OPERATIONS HANDLERS FOR ORDENESTRABAJOVIEW
  const handleAddOtLinea = async (linea: OrdenTrabajoLinea) => {
    setOrdenesTrabajo(prev => [linea, ...prev]);
    try {
      await fetchWithAuth('/api/ot-lineas', {
        method: 'POST',
        body: JSON.stringify(linea)
      });
    } catch (e) {
      console.warn("Línea OT guardada localmente:", e);
    }
  };

  const handleUpdateOtLinea = async (updated: OrdenTrabajoLinea) => {
    setOrdenesTrabajo(prev => {
      const nextLines = prev.map(l => (l.id === updated.id ? updated : l));

      // Instantly update contract balance and consumption in memory
      const targetContratoId = updated.contratoId || ots.find(o => o.id === updated.otTecnicaId)?.contratoId;
      if (targetContratoId) {
        setContratosNuevos(prevContratos => prevContratos.map(c => {
          if (c.id === targetContratoId || c.n_contrato === targetContratoId) {
            const allContractLines = nextLines.filter(l => l.contratoId === c.id || l.otTecnicaId);
            const totalFacturado = allContractLines.reduce((acc, l) => {
              if (l.n_factura || l.estado === 'FACTURADO' || l.pendiente === 'EJECUTADO') {
                return acc + (l.sub_importe_sin_igv || l.monto_marco_sin_igv || 0);
              }
              return acc;
            }, 0);
            const presupuesto = c.monto_sin_igv || c.presupuesto_total_usd || c.monto_original || 0;
            return {
              ...c,
              monto_facturado_sin_igv: totalFacturado,
              saldo_disponible_usd: Math.max(0, presupuesto - totalFacturado)
            };
          }
          return c;
        }));
      }

      return nextLines;
    });

    try {
      await fetchWithAuth(`/api/ot-lineas/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn("Línea OT actualizada localmente:", e);
    }
  };

  const handleAddContratoComercial = async (newContrato: any) => {
    try {
      const response = await fetchWithAuth('/api/contratos-comerciales', {
        method: 'POST',
        body: JSON.stringify(newContrato)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error al crear el contrato comercial.");
      }
      const created = await response.json();
      setContratosNuevos(prev => [created, ...prev]);
      return true;
    } catch (e: any) {
      if (e.message && (e.message.includes("crear") || e.message.includes("Sesión expirada"))) {
        throw e;
      }
      setContratosNuevos(prev => [newContrato, ...prev]);
      console.warn("Contrato comercial guardado localmente:", e);
      throw new Error("offline");
    }
  };

  const handleUpdateContratoComercial = async (updated: any) => {
    try {
      const response = await fetchWithAuth(`/api/contratos-comerciales/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error al actualizar el contrato comercial.");
      }
      const serverUpdated = await response.json();
      setContratosNuevos(prev => prev.map(c => c.id === updated.id ? serverUpdated : c));
      return true;
    } catch (e: any) {
      if (e.message && (e.message.includes("actualizar") || e.message.includes("Sesión expirada"))) {
        throw e;
      }
      setContratosNuevos(prev => prev.map(c => c.id === updated.id ? updated : c));
      console.warn("Contrato comercial actualizado localmente:", e);
      throw new Error("offline");
    }
  };

  const handleUpdateTipoCambio = async (val: number) => {
    setTipoCambio(val);
    try {
      await fetchWithAuth('/api/config', {
        method: 'POST',
        body: JSON.stringify({ tipoCambio: val })
      });
    } catch (e) {
      console.warn("Tipo de cambio guardado localmente:", e);
    }
  };

  // Render LoginView if unauthorized
  
  // --- DASHBOARD CALCULATIONS (useMemo) ---
  const dashboardData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentMonthStr = String(currentMonth).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonthStr}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Mes actual en español para coincidir con db.json si se requiere (ENE, FEB, etc)
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
    const currentMonthEs = monthNames[currentMonth - 1];

    // Card 1: Pipeline de OTs Activas (excluye FACTURADA y CERRADA, filtrado por mes actual)
    const otsDelMes = ots.filter(o => o.fechaProgramada && o.fechaProgramada.startsWith(`${currentYear}-${currentMonthStr}`));
    const otsActivas = otsDelMes.filter(o => o.estado !== OTStatus.FACTURADA && o.estado !== OTStatus.CERRADA);
    const otsObservadas = otsActivas.filter(o => o.estado === OTStatus.OBSERVADA).length;

    // Card 2: Visitas del Mes (Ejecutadas vs Programadas)
    const ejecutadasDelMes = otsDelMes.filter(o => o.estado === OTStatus.FIRMADA || o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA);
    const tasaEjecucion = otsDelMes.length > 0 ? (ejecutadasDelMes.length / otsDelMes.length) * 100 : 0;
    
    // Card 3: Informes Pendientes de Revisión
    const otsInformes = ots.filter(o => 
      o.estado === OTStatus.INFORME_ENVIADO || o.estado === OTStatus.EN_REVISION || o.estado === OTStatus.OBSERVADA || 
      o.estado === OTStatus.CORREGIDA || o.estado === OTStatus.APROBADA || o.estado === OTStatus.FIRMADA
    );
    const informesPendientes = ots.filter(o => o.estado === OTStatus.INFORME_ENVIADO || o.estado === OTStatus.EN_REVISION);

    // Card 4: Equipos en Bypass Activo
    const bypassActivos = reports.filter(r => r.indicadoresBateria?.bypassActivo === true);
    // Filtrar solo de OTs que no estén cerradas
    const bypassActivosNoCerrados = bypassActivos.filter(r => {
      const ot = ots.find(o => o.id === r.otId);
      return ot && ot.estado !== OTStatus.CERRADA;
    });

    // Gráfica Principal (Flujo OTs por Estado)
    const grupoAsignar = ots.filter(o => o.estado === 'Creada' || o.estado === 'Pendiente de Programación').length;
    const grupoProgramadas = ots.filter(o => o.estado === 'Asignada' || o.estado === 'Programada').length;
    const grupoCampo = ots.filter(o => o.estado === 'En Camino' || o.estado === 'En Sitio' || o.estado === 'Trabajo en Ejecución').length;
    const grupoDocumentacion = ots.filter(o => o.estado === 'Informe Pendiente' || o.estado === 'Informe Enviado').length;
    const grupoRevision = ots.filter(o => o.estado === 'En Revisión' || o.estado === 'Observada' || o.estado === 'Corregida').length;
    const grupoFinalizadas = ots.filter(o => o.estado === 'Aprobada' || o.estado === 'Firmada' || o.estado === 'Facturada' || o.estado === 'Cerrada').length;

    const barData = [
      { name: 'Por Asignar', count: grupoAsignar, fill: '#94A3B8' },
      { name: 'Programadas', count: grupoProgramadas, fill: '#3B82F6' },
      { name: 'En Campo', count: grupoCampo, fill: '#F59E0B' },
      { name: 'Documentación', count: grupoDocumentacion, fill: '#6366F1' },
      { name: 'En Revisión', count: grupoRevision, fill: '#F43F5E' },
      { name: 'Finalizadas', count: grupoFinalizadas, fill: '#00B594' },
    ];

    // Generar datos históricos para la gráfica de áreas de acuerdo al rango seleccionado
    const getHistoricoOtsData = (rango: 'trimestral' | 'semestral') => {
      const cantidadMeses = rango === 'semestral' ? 6 : 3;
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const data = [];
      
      for (let i = cantidadMeses - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const prefix = `${yyyy}-${mm}`;
        const nombreMes = `${nombresMeses[d.getMonth()]} ${yyyy}`;

        // Filtrar OTs de este mes
        const otsMes = ots.filter(o => o.fechaProgramada && o.fechaProgramada.startsWith(prefix));

        const completadas = otsMes.filter(o => 
          o.estado === 'Aprobada' || 
          o.estado === 'Firmada' || 
          o.estado === 'Facturada' || 
          o.estado === 'Cerrada'
        ).length;

        const facturadas = otsMes.filter(o => o.estado === 'Facturada').length;

        const porFacturar = otsMes.filter(o => 
          o.estado === 'Aprobada' || 
          o.estado === 'Firmada'
        ).length;

        data.push({
          name: nombreMes,
          Completadas: completadas,
          Facturadas: facturadas,
          'Por Facturar': porFacturar
        });
      }
      return data;
    };

    const areaData = getHistoricoOtsData(dashboardRange);

    // Estadísticas acumuladas de acuerdo al rango seleccionado
    const totalCompletadas3M = areaData.reduce((acc, curr) => acc + curr.Completadas, 0);
    const totalFacturadas3M = areaData.reduce((acc, curr) => acc + curr.Facturadas, 0);
    const totalPorFacturar3M = areaData.reduce((acc, curr) => acc + curr['Por Facturar'], 0);

    // Tiles bajo la gráfica
    // Tiempo promedio ciclo (días)
    let totalDias = 0;
    let countDias = 0;
    ots.forEach(o => {
      if (o.estado === 'Firmada' || o.estado === 'Cerrada' || o.estado === 'Facturada') {
         const creado = new Date(o.fechaProgramada); 
         if (!isNaN(creado.getTime())) {
             const diffTime = Math.abs(today.getTime() - creado.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             totalDias += diffDays;
             countDias++;
         }
      }
    });
    const tiempoPromedio = countDias > 0 ? (totalDias / countDias).toFixed(1) : 'N/D';
    
    // Sin técnico asignado
    const sinTecnico = ots.filter(o => (!o.tecnicoTitularId || o.tecnicoTitular === '') && (o.estado === 'Creada' || o.estado === 'Pendiente de Programación')).length;

    // Gráfica Secundaria (Pie Chart)
    const porServicio = [
      { name: 'Preventivo', value: ots.filter(o => o.tipoMantenimiento === 'Preventivo').length, color: '#00B594' },
      { name: 'Correctivo', value: ots.filter(o => o.tipoMantenimiento === 'Correctivo').length, color: '#F59E0B' },
      { name: 'Emergencia', value: ots.filter(o => o.tipoMantenimiento === 'Emergencia').length, color: '#F43F5E' }
    ].filter(i => i.value > 0);

    const porEquipo = [
      { name: 'UPS', value: ots.filter(o => o.tipoEquipo?.includes('UPS')).length, color: '#00B594' },
      { name: 'Climatización', value: ots.filter(o => o.tipoEquipo?.includes('Climatización')).length, color: '#3B82F6' },
      { name: 'Transformador', value: ots.filter(o => o.tipoEquipo?.includes('Transformador')).length, color: '#F59E0B' },
      { name: 'Rectificador', value: ots.filter(o => o.tipoEquipo?.includes('Rectificador')).length, color: '#6366F1' },
      { name: 'Otros', value: ots.filter(o => o.tipoEquipo && !o.tipoEquipo.includes('UPS') && !o.tipoEquipo.includes('Climatización') && !o.tipoEquipo.includes('Transformador') && !o.tipoEquipo.includes('Rectificador')).length, color: '#94A3B8' }
    ].filter(i => i.value > 0);

    // Tarjeta Usuario: Métricas
    const misOtsHoy = ots.filter(o => o.tecnicoTitularId === currentUser?.id && o.fechaProgramada === todayStr).length;
    const misOtsSemana = ots.filter(o => o.tecnicoTitularId === currentUser?.id && o.fechaProgramada?.startsWith(`${currentYear}-${currentMonthStr}`)).length;
    const infRevision = ots.filter(o => o.estado === OTStatus.EN_REVISION).length;
    
    const facturadoMes = ordenesTrabajo
      .filter(l => l.estado === 'FACTURADO' && (l.mes_prog_facturacion === currentMonthEs || l.mes === currentMonthEs))
      .reduce((sum, l) => sum + (Number(l.sub_importe_sin_igv) || 0), 0);
      
    const porFacturarMes = ordenesTrabajo
      .filter(l => l.estado === 'POR FACTURAR' && (l.mes_prog_facturacion === currentMonthEs || l.mes === currentMonthEs))
      .reduce((sum, l) => sum + (Number(l.sub_importe_sin_igv) || 0), 0);

    const target = targetVentas.find(t => t.anio === currentYear && (t.mes_num === currentMonth || t.mes === currentMonthEs));
    const targetValor = target ? Number(target.target_ventas_usd) || 0 : 0;

    const misOtsCliente = ots.filter(o => o.clientId === currentUser?.clientId && o.estado !== OTStatus.CERRADA).length;

    // Alertas
    const alertas = [];
    const a1 = ots.filter(o => o.fechaProgramada === todayStr && o.estado === OTStatus.PROGRAMADA && (!o.tecnicoTitularId || o.tecnicoTitularId === ''));
    if (a1.length > 0) alertas.push({ type: '🔴', text: `${a1.length} OTs de hoy PROGRAMADAS sin técnico asignado` });
    
    const a2 = ots.filter(o => o.estado === OTStatus.OBSERVADA);
    if (a2.length > 0) alertas.push({ type: '🟠', text: `${a2.length} OTs OBSERVADAS esperando corrección` });
    
    const a3 = ots.filter(o => {
      if (o.estado !== OTStatus.INFORME_PENDIENTE) return false;
      const progDate = new Date(o.fechaProgramada);
      if (isNaN(progDate.getTime())) return false;
      const diffDays = (today.getTime() - progDate.getTime()) / (1000*3600*24);
      return diffDays > 3;
    });
    if (a3.length > 0) alertas.push({ type: '🟡', text: `${a3.length} OTs retrasadas en INFORME_PENDIENTE (>3 días)` });
    
    // mes anterior
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthEs = monthNames[prevMonth - 1];
    const a4 = ordenesTrabajo.filter(l => l.estado === 'POR FACTURAR' && (l.mes_prog_facturacion === prevMonthEs || l.mes === prevMonthEs));
    if (a4.length > 0) alertas.push({ type: '🟡', text: `${a4.length} OTs por facturar del mes anterior (${prevMonthEs})` });
    
    const a5 = ots.filter(o => o.estado === OTStatus.FIRMADA && (o as any).listaParaFacturar !== true);
    if (a5.length > 0) alertas.push({ type: '🟢', text: `${a5.length} OTs FIRMADAS esperando visto bueno financiero` });

    return {
      otsDelMes,
      otsActivas,
      otsObservadas,
      ejecutadasDelMes,
      tasaEjecucion,
      otsInformes,
      informesPendientes,
      bypassActivosNoCerrados,
      barData,
      areaData,
      totalCompletadas3M,
      totalFacturadas3M,
      totalPorFacturar3M,
      tasaCierre: tasaEjecucion.toFixed(1),
      tiempoPromedio,
      sinTecnico,
      porServicio,
      porEquipo,
      misOtsHoy,
      misOtsSemana,
      infRevision,
      facturadoMes,
      porFacturarMes,
      targetValor,
      misOtsCliente,
      alertas,
      todayStr
    };
   }, [ots, reports, ordenesTrabajo, targetVentas, currentUser, dashboardRange]);

  const [pieView, setPieView] = useState<'servicio' | 'equipo'>('servicio');
  // ----------------------------------------

  if (!currentUser) {
    return (
      <LoginView 
        users={users}
        onLoginSuccess={(user, token) => {
          if (token) {
            localStorage.setItem('gestia_jwt_token', token);
          }
          const newAuditLog: UserActivityLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userEmail: user.email,
            action: 'INICIO_SESION',
            details: `Ingreso validado al portal. Rol asignado: ${user.role}`,
            ipAddress: '192.168.10.15'
          };
          
          setUsers(prev => prev.map(u => {
            if (u.id === user.id) {
              return { ...u, ultimoIngreso: newAuditLog.timestamp };
            }
            return u;
          }));

          handleAddLog(newAuditLog);
          setCurrentUser({ ...user, ultimoIngreso: newAuditLog.timestamp });
          const defaultRole = user.role === 'Cliente' ? 'Cliente' :
                              user.role === 'Tecnico' ? 'Tecnico' :
                              user.role === 'Supervisor' ? 'Supervisor' :
                              user.role === 'Ventas' ? 'Ventas' : 'Dashboard';
          setCurrentRole(defaultRole as any);
        }} 
      />
    );
  }

  // Count active stats (filtered if the user has role 'Cliente')
  const statsOts = currentUser?.role === 'Cliente' && currentUser?.clientId
    ? ots.filter(o => o.clientId === currentUser.clientId)
    : ots;
  const otsEnProceso = statsOts.filter(o => o.estado === OTStatus.TRABAJO_EN_EJECUCION || o.estado === OTStatus.PROGRAMADA).length;
  const otsRevision = statsOts.filter(o => o.estado === OTStatus.EN_REVISION).length;
  const otsAprobadas = statsOts.filter(o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.FIRMADA).length;

  return (
    <div className="min-h-[100dvh] bg-canvas flex font-sans text-slate-800" id="mafort-app-wrapper">
      
      {/* 1. LEFT SIDEBAR (Sticky full-height pane) */}
      <aside className={`bg-teal-deep text-[#DDEFE9] flex flex-col justify-between shrink-0 h-[100dvh] sticky top-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[248px]' : 'w-0 overflow-hidden'}`} id="sidebar-panel">
        <div className="flex flex-col pt-5 px-4 overflow-y-auto flex-1">
          
          {/* Sidebar Header / Brand (GESTIA) */}
          <div className="flex items-center gap-3 pb-5 pt-1 px-1.5 select-none text-left">
            <svg className="w-8.5 h-8.5 shrink-0" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="#7FE6C6" strokeWidth="1.6" opacity="0.6"/>
              <path d="M12 22 L17 14 L21 24 L25 16 L29 22" stroke="#7FE6C6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <div className="leading-tight">
              <h2 className="font-display font-semibold text-[16px] text-white tracking-[0.08em] uppercase">
                GESTIA
              </h2>
              <span className="text-[9px] font-normal text-[#8FCBB8] font-mono tracking-widest mt-0.5 block">
                SISTEMA · CONECTADO
              </span>
            </div>
          </div>

          {/* Mini pulse wave */}
          <svg className="w-full h-[22px] mb-4.5 opacity-90 flex-none" viewBox="0 0 220 22" preserveAspectRatio="none">
            <path className="stroke-[#7FE6C6] stroke-[1.6px] fill-none stroke-linecap-round" d="M0 11 L60 11 L70 3 L80 19 L90 11 L220 11" />
          </svg>

          {/* Navigation Items */}
          <nav className="space-y-0.5 flex-1">
            {APP_MODULES.filter(link => {
              if (currentUser.allowedModules && currentUser.allowedModules.length > 0) {
                return currentUser.allowedModules.includes(link.id);
              }
              if (currentUser.role === 'Administrador') return true;
              if (link.id === 'GestionOTs' || link.id === 'ClientesContratos') {
                return currentUser.role === 'Ventas';
              }
              if (link.id === 'Usuarios') {
                return false;
              }
              return link.id === 'Dashboard' || link.id === 'Monitoreo' || link.id === currentUser.role;
            }).map((link) => {
              const isSelected = currentRole === link.id || (link.id === 'Usuarios' && currentRole === 'Usuarios');
              let badgeCount: number | string | undefined;
              if (link.id === 'Supervisor') {
                badgeCount = ots.filter(o => o.estado === OTStatus.EN_REVISION).length;
              } else if (link.id === 'Tecnico') {
                badgeCount = users.filter(u => u.role === 'Tecnico' && u.estado === 'Activo').length;
              } else if (link.id === 'Usuarios') {
                badgeCount = users.filter(u => u.estado === 'Activo').length;
              } else if (link.id === 'ClientesContratos') {
                badgeCount = 'CRM';
              } else if (link.id === 'Monitoreo') {
                badgeCount = 'Agenda';
              } else if (link.id === 'GestionOTs') {
                badgeCount = 'SLA';
              } else if (link.id === 'Ventas') {
                badgeCount = 'Ventas';
              } else if (link.id === 'Cliente') {
                badgeCount = 0;
              }
              
              const isDefaultBadgeText = typeof badgeCount === 'string';

              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentRole(link.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-all text-left cursor-pointer relative group ${
                    isSelected 
                      ? 'bg-white/9 text-white font-medium' 
                      : 'text-[#B9DACE] hover:text-white hover:bg-white/6'
                  }`}
                >
                  {/* Left indicator bar for active item */}
                  {isSelected && (
                    <span className="absolute left-[-16px] top-2 bottom-2 w-[3px] rounded-r bg-[#7FE6C6]" />
                  )}
                  
                  <span className={`${isSelected ? 'text-white' : 'text-[#B9DACE]'} shrink-0`}>
                    {link.icon}
                  </span>
                  
                  <span className="truncate">{link.displayLabel}</span>
                  
                  {badgeCount !== undefined && (
                    <span className={`ml-auto text-[10.5px] font-mono py-0.5 px-2 rounded-full ${
                      isSelected 
                        ? 'bg-[#7FE6C6] text-[#083329] font-semibold' 
                        : 'bg-white/10 text-[#CFEBE1]'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Bottom: Logout */}
        <div className="p-4 border-t border-white/8 flex-none">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] text-[#B9DACE] hover:text-white hover:bg-white/6 transition-all cursor-pointer text-left"
          >
            <LogOut size={15} className="shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN VIEW AREA (Right Pane) */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden animate-fade-in" id="main-view-pane">
        
        {/* Header Bar */}
        <header className="h-[64px] bg-white border-b border-slate-100/80 px-6 flex items-center justify-between shrink-0" id="header-bar">
          
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Hamburger menu */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
              title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <Menu size={16} />
            </button>

            {/* Search Input bar */}
            <div className="flex-1 max-w-[460px] flex items-center gap-2.5 bg-white border border-hairline rounded-[11px] px-3.5 h-[42px] text-ink-mute text-[13.5px]">
              <Search size={15} className="text-ink-mute shrink-0" strokeWidth={2} />
              <input
                type="text"
                placeholder="Buscar órdenes de UPS, contratos, SLAs…"
                className="w-full bg-transparent border-none text-ink placeholder-ink-mute focus:outline-none text-[13.5px] font-sans"
              />
              <kbd className="ml-auto font-mono text-[10.5px] bg-canvas border border-hairline rounded-[5px] px-1.5 py-0.5 text-ink-mute select-none">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Connected/Offline toggles, profile & notifications */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Connectivity Pill with controllers */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setIsOnline(true);
                  handleAddLog({
                    id: `log_${Date.now()}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    userEmail: currentUser.email,
                    action: 'EDITAR_USUARIO',
                    details: 'Sincronizador en la nube activado.',
                    ipAddress: '127.0.0.1'
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  isOnline ? 'bg-[#10B981] text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Wifi size={10} />
                <span>Conectado</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOnline(false);
                  handleAddLog({
                    id: `log_${Date.now()}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    userEmail: currentUser.email,
                    action: 'EDITAR_USUARIO',
                    details: 'Simulación de desconexión sin señal Wifi activada.',
                    ipAddress: '127.0.0.1'
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  !isOnline ? 'bg-slate-500 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <WifiOff size={10} />
                <span>Offline</span>
              </button>
            </div>

            {/* Offline reports sync alert */}
            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOffline}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1 rounded-lg text-[10px] font-mono font-black flex items-center gap-1 animate-pulse shrink-0 cursor-pointer"
              >
                <RefreshCw size={10} />
                <span>Sync {offlineQueue.length}</span>
              </button>
            )}

            {/* Notification bell and logout */}
            <div className="flex items-center gap-2 text-slate-400">
              <button 
                type="button"
                onClick={() => alert(`🔔 Notificaciones de SLA Gestia: Cuenta con ${otsRevision} órdenes de trabajo pendientes de firma o revisión en el servidor.`)}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200 relative hover:text-slate-700 cursor-pointer"
              >
                <Bell size={14} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              </button>
            </div>

            {/* Profile capsule */}
            <div className="flex items-center gap-3">
              <div className="text-right leading-none hidden sm:block select-none">
                <span className="font-extrabold text-slate-850 text-xs block leading-tight">
                  {currentUser.username}
                </span>
                <span className="text-[9px] text-[#10B981] font-extrabold tracking-wider block mt-0.5 uppercase font-sans">
                  {(currentUser.role as string) === 'Usuarios' ? 'SEGURIDAD' : currentUser.role.toUpperCase()} •
                </span>
              </div>
              
              <div className="w-9 h-9 rounded-full bg-[#EBF7F2] border border-[#10B981]/20 flex items-center justify-center text-[#10B981] font-black text-xs select-none">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>

              {/* Logout button */}
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={14} />
              </button>
            </div>

          </div>
        </header>

        {/* Scrollable Work Area Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#EAEFEB]" id="main-workspace-content">
          
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* 1. MAIN INTEGRATED DASHBOARD VIEW */}
            {currentRole === 'Dashboard' && (
              <DashboardView
                currentUser={currentUser}
                ots={ots}
                clients={clients}
                reports={[...reports, ...offlineQueue]}
                users={users}
                contratosNuevos={contratosNuevos}
                otEquipoAsignaciones={otEquipoAsignaciones}
                onNavigateToTab={(tabId) => setCurrentRole(tabId as any)}
              />
            )}
            {/* 1.5 MONITOREO DE TÉCNICOS VIEW MODULE */}
            {currentRole === 'Monitoreo' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <TechMonitoringDashboard 
                  ots={ots}
                  clients={clients}
                  reports={[...reports, ...offlineQueue]}
                  users={users}
                  onUpdateOtStatus={handleUpdateOtStatus}
                  onUpdateOt={handleUpdateOT}
                  onUpdateReport={(updatedRep) => {
                    setReports(prev => prev.map(r => r.id === updatedRep.id ? updatedRep : r));
                  }}
                  contratosNuevos={contratosNuevos}
                  otEquipoAsignaciones={otEquipoAsignaciones}
                  onAddOT={handleAddOT}
                />
              </div>
            )}

            {/* 1.8 GESTIÓN DE OTS VIEW MODULE (SLA / Finanzas) */}
            {currentRole === 'GestionOTs' && (currentUser?.role === 'Administrador' || currentUser?.role === 'Ventas') && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <OrdenesTrabajoView
                  lineas={ordenesTrabajo}
                  clients={clients}
                  contratosComerciales={contratosNuevos}
                  targetVentas={targetVentas}
                  currentUser={{ email: currentUser?.email || 'admin@gestia.com', username: currentUser?.username || 'Administrador' }}
                  onAddLinea={handleAddOtLinea}
                  onUpdateLinea={handleUpdateOtLinea}
                  tipoCambio={tipoCambio}
                  onUpdateTipoCambio={handleUpdateTipoCambio}
                  ots={ots}
                  reports={[...reports, ...offlineQueue]}
                  users={users}
                  onUpdateOT={handleUpdateOT}
                />
              </div>
            )}

            {/* 1.9 CLIENTES Y CONTRATOS VIEW MODULE */}
            {currentRole === 'ClientesContratos' && (currentUser?.role === 'Administrador' || currentUser?.role === 'Ventas') && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <ClientesContratosView
                  clients={clients}
                  contratos={contratosNuevos}
                  users={users}
                  currentUser={{ email: currentUser?.email || 'admin@gestia.com', username: currentUser?.username || 'Administrador' }}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onAddContrato={handleAddContratoComercial}
                  onUpdateContrato={handleUpdateContratoComercial}
                />
              </div>
            )}

            {/* 2. VENTAS VIEW MODULE */}
            {currentRole === 'Ventas' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <VentasView 
                  clients={clients}
                  contracts={contracts}
                  contratosComerciales={contratosNuevos}
                  ots={ots}
                  reports={[...reports, ...offlineQueue]}
                  onAddClient={handleAddClient}
                  onAddContract={handleAddContract}
                  onAddOT={handleAddOT}
                  onUpdateOT={handleUpdateOT}
                />
              </div>
            )}

            {/* 3. TÉCNICO VIEW MODULE */}
            {currentRole === 'Tecnico' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <TecnicoView 
                  ots={ots}
                  clients={clients}
                  reports={[...reports, ...offlineQueue]}
                  isOnline={isOnline}
                  onSaveReportOffline={handleSaveReportOffline}
                  onUpdateOtStatus={handleUpdateOtStatus}
                  onUpdateOt={handleUpdateOT}
                  onAddOT={handleAddOT}
                  currentUser={currentUser}
                  equipos={clients.flatMap(c => (c as any).equipos || [])}
                  otEquipoAsignaciones={otEquipoAsignaciones}
                />
              </div>
            )}

            {/* 4. SUPERVISOR VIEW MODULE */}
            {currentRole === 'Supervisor' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <SupervisorView 
                  ots={ots}
                  clients={clients}
                  reports={[...reports, ...offlineQueue]}
                  onUpdateOtStatus={handleUpdateOtStatus}
                  onUpdateReport={(updatedRep) => {
                    setReports(prev => prev.map(r => r.id === updatedRep.id ? updatedRep : r));
                  }}
                  otEquipoAsignaciones={otEquipoAsignaciones}
                />
              </div>
            )}

            {/* 5. CLIENTE VIEW MODULE */}
            {currentRole === 'Cliente' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <ClienteView 
                  ots={ots}
                  clients={clients}
                  reports={reports}
                  onUpdateOtStatus={handleUpdateOtStatus}
                  onUpdateReport={(updatedRep) => {
                    setReports(prev => prev.map(r => r.otId === updatedRep.otId ? updatedRep : r));
                  }}
                />
              </div>
            )}

            {/* 6. SEGURIDAD & OPERADORES VIEW MODULE */}
            {currentRole === 'Usuarios' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <UserManagementView 
                  users={users}
                  logs={userLogs}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onAddLog={handleAddLog}
                  onDeleteUser={handleDeleteUser}
                />
              </div>
            )}

          </div>

        </main>

      </div>

      {/* SANDBOX-SAFE LOGOUT CONFIRMATION MODAL OVERLAY */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 font-sans" id="logout-confirmation-modal">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <LogOut size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-850 text-sm">Cerrar Sesión Activa</h4>
                <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wide">Gestia Hub & Control de Calidad</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              ¿Seguro que desea salir del sistema? Se registrará la bitácora de desconexión técnica. Todo cambio guardado offline permanecerá a salvo en este dispositivo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                id="cancel-logout-btn"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  const newAuditLog: UserActivityLog = {
                    id: `log_${Date.now()}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    userEmail: currentUser?.email || 'sistema',
                    action: 'INICIO_SESION',
                    details: 'Cierre de sesión seguro realizado exitosamente.',
                    ipAddress: '192.168.10.15'
                  };
                  handleAddLog(newAuditLog);
                  setCurrentUser(null);
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all animate-none"
                id="confirm-logout-btn"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getAreaOperativa = (role: string) => {
  switch(role) {
    case 'Administrador': return 'Administración General';
    case 'Ventas': return 'Coordinación de Ventas';
    case 'Tecnico': return 'Mantenimiento Técnico';
    case 'Supervisor': return 'Supervisión de Campo';
    case 'Cliente': return 'Operaciones Sede Cliente';
    default: return 'Sistemas Corporativos';
  }
};
