import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  ShieldCheck, 
  UserX, 
  RefreshCw,
  Search,
  Activity,
  Terminal,
  Lock,
  Edit2,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { User, UserActivityLog } from '../types';
import { APP_MODULES } from '../modulesConfig';

export const AVAILABLE_MODULES = APP_MODULES.map(m => ({
  id: m.id,
  name: m.displayLabel
}));

export const getDefaultModulesForRole = (role: 'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente'): string[] => {
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

interface UserManagementViewProps {
  users: User[];
  logs: UserActivityLog[];
  currentUser: { email: string; username: string; role: 'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente' };
  onAddUser: (user: User) => void;
  onUpdateUser: (userId: string, updated: Partial<User>) => void;
  onAddLog: (log: UserActivityLog) => void;
  onDeleteUser?: (userId: string) => void;
}

export default function UserManagementView({
  users,
  logs,
  currentUser,
  onAddUser,
  onUpdateUser,
  onAddLog,
  onDeleteUser
}: UserManagementViewProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente'>('Tecnico');
  const [newArea, setNewArea] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAllowedModules, setNewAllowedModules] = useState<string[]>(['Dashboard', 'Monitoreo', 'Tecnico']);

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editRole, setEditRole] = useState<'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente'>('Tecnico');
  const [editAllowedModules, setEditAllowedModules] = useState<string[]>([]);

  // Password Reset state
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('');

  // Logs category filter
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (role: 'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente') => {
    setNewRole(role);
    setNewAllowedModules(getDefaultModulesForRole(role));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newArea || !newPassword) {
      alert("Por favor, complete todos los campos obligatorios, incluyendo la contraseña.");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      alert("Este correo electrónico ya se encuentra registrado.");
      return;
    }

    const generatedId = `user_${Date.now()}`;
    const newUser: User = {
      id: generatedId,
      username: newUsername.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      estado: 'Activo',
      area: newArea.trim(),
      creadoEn: new Date().toISOString().split('T')[0],
      password: newPassword.trim(),
      allowedModules: newAllowedModules
    };

    onAddUser(newUser);

    // Create Audit Log
    const newAuditLog: UserActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: currentUser.email,
      action: 'CREAR_USUARIO',
      details: `Usuario creado con éxito: ${newUser.username} (${newUser.role}) con acceso al área ${newUser.area} y módulos [${newAllowedModules.join(', ')}]. Contraseña configurada.`,
      ipAddress: '192.168.10.15'
    };
    onAddLog(newAuditLog);

    // Reset Form
    setNewUsername('');
    setNewEmail('');
    setNewArea('');
    setNewPassword('');
    setNewRole('Tecnico');
    setNewAllowedModules(['Dashboard', 'Monitoreo', 'Tecnico']);
    setShowAddForm(false);
  };

  const handleToggleStatus = (user: User) => {
    // Self-suspending safety lock
    if (user.email === currentUser.email) {
      alert("🔒 BLOQUEO DE SEGURIDAD AUTO-SABOTAJE: No se permite suspender su propia sesión activa en este momento.");
      return;
    }

    const nextStatus = user.estado === 'Activo' ? 'Suspendido' : 'Activo';
    onUpdateUser(user.id, { estado: nextStatus });

    // Log the security breach/update event
    const newAuditLog: UserActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: currentUser.email,
      action: 'CAMBIAR_ESTADO',
      details: `Estado modificado de [${user.username}]: ${user.estado} -> ${nextStatus}`,
      ipAddress: '192.168.10.15'
    };
    onAddLog(newAuditLog);
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditArea(user.area);
    setEditRole(user.role);
    setEditAllowedModules(user.allowedModules && user.allowedModules.length > 0 ? user.allowedModules : getDefaultModulesForRole(user.role));
  };

  const saveEdit = (userId: string) => {
    if (!editUsername || !editArea) {
      alert("El nombre de usuario y el departamento no pueden estar vacíos.");
      return;
    }

    onUpdateUser(userId, {
      username: editUsername,
      area: editArea,
      role: editRole,
      allowedModules: editAllowedModules
    });

    // Audit Log
    const newAuditLog: UserActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: currentUser.email,
      action: 'EDITAR_USUARIO',
      details: `Modificación de metadatos del usuario catalogado id ${userId}. Nombre: ${editUsername}, Rol: ${editRole}, Área: ${editArea}, Módulos: [${editAllowedModules.join(', ')}]`,
      ipAddress: '192.168.10.15'
    };
    onAddLog(newAuditLog);

    setEditingUserId(null);
  };

  const startResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setNewPasswordForReset('');
  };

  const saveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPasswordForReset.trim()) {
      alert("Por favor, ingrese la nueva contraseña.");
      return;
    }

    onUpdateUser(resetPasswordUser.id, { password: newPasswordForReset.trim() });

    // Audit Log
    const newAuditLog: UserActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: currentUser.email,
      action: 'REINICIO_CONTRASENA',
      details: `Actualización manual de credenciales de acceso (contraseña personalizada) para ${resetPasswordUser.username} (${resetPasswordUser.email})`,
      ipAddress: '192.168.10.15'
    };
    onAddLog(newAuditLog);

    setResetPasswordUser(null);
    setNewPasswordForReset('');
    alert("🔑 Contraseña actualizada exitosamente.");
  };

  const sortedLogs = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const filteredLogs = sortedLogs.filter(l => {
    if (logFilter === 'ALL') return true;
    return l.action === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto py-2 space-y-6 text-slate-800" id="mafort-user-management-view">
      
      {/* Module Title card styled elegantly with TeamHub light themes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600 block shadow-xs">
              <Users size={18} />
            </span>
            <h2 className="text-base font-bold font-sans tracking-tight text-slate-800">Centro de Gestión de Operadores</h2>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Administre privilegios de acceso para personal de ventas, ingenieros de campo y supervisores técnicos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 self-start md:self-auto text-left">
          <Lock size={13} className="text-emerald-500" />
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Nivel de Seguridad:</span>
            <span className="text-slate-700 font-bold block text-[11px]">SLA OPERATIVO PROTEGIDO</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Left 2 Columns: Users Administration list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* List Header */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre, email, área o rol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-705 placeholder-slate-400 focus:outline-none focus:border-emerald-450 transition-all font-sans"
                  id="user-search-input"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
              >
                <UserPlus size={14} />
                <span>Registrar Nuevo Operador</span>
              </button>
            </div>

            {/* Formulario de Alta de Nuevo Colaborador como Modal Flotante */}
            {showAddForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                        <UserPlus size={16} />
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Alta de Nuevo Operador</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-650 font-bold text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. René Farfán"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Correo Corporativo *</label>
                      <input
                        type="email"
                        required
                        placeholder="nombre@mafort.pe"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Rol Operativo *</label>
                        <select
                          value={newRole}
                          onChange={(e) => handleRoleChange(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Administrador">🔑 Administrador</option>
                          <option value="Ventas">📞 Ventas</option>
                          <option value="Tecnico">👷 Técnico</option>
                          <option value="Supervisor">🛡️ Supervisor</option>
                          <option value="Cliente">🏢 Cliente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Área o Departamento *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Mantenimiento Energía"
                          value={newArea}
                          onChange={(e) => setNewArea(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="block text-[10px] uppercase font-mono text-slate-500 font-bold">Módulos de Acceso Permitidos *</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewAllowedModules(AVAILABLE_MODULES.map(m => m.id))}
                            className="text-[9px] font-mono text-slate-500 hover:text-emerald-500 font-bold underline cursor-pointer"
                          >
                            Todos
                          </button>
                          <span className="text-slate-350">|</span>
                          <button
                            type="button"
                            onClick={() => setNewAllowedModules([])}
                            className="text-[9px] font-mono text-slate-500 hover:text-rose-500 font-bold underline cursor-pointer"
                          >
                            Ninguno
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 max-h-36 overflow-y-auto">
                        {AVAILABLE_MODULES.map((m) => {
                          const isChecked = newAllowedModules.includes(m.id);
                          return (
                            <label 
                              key={m.id} 
                              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                                isChecked 
                                  ? 'bg-emerald-50/50 border-emerald-250 text-slate-800 font-semibold' 
                                  : 'bg-white border-slate-150 text-slate-605 hover:bg-slate-55'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAllowedModules([...newAllowedModules, m.id]);
                                  } else {
                                    setNewAllowedModules(newAllowedModules.filter(id => id !== m.id));
                                  }
                                }}
                                className="rounded text-emerald-500 focus:ring-emerald-500 w-3 h-3 border-slate-300 cursor-pointer"
                              />
                              <span className="text-[11px] leading-tight">{m.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Contraseña de Acceso *</label>
                      <input
                        type="password"
                        required
                        placeholder="Contraseña corporativa"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <CheckCircle size={14} />
                        <span>Guardar y Habilitar</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">Operador</th>
                    <th className="p-4">Rol / Área</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Último Ingreso</th>
                    <th className="p-4 text-right">Ajustes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                        Ningún usuario coincide con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isCurrentUser = user.email === currentUser.email;

                      return (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-slate-50/40 transition-colors ${
                            user.estado === 'Suspendido' ? 'bg-rose-50/10' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                                <span>{user.username}</span>
                                {isCurrentUser && (
                                  <span className="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">SESIÓN</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                user.role === 'Administrador' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                user.role === 'Ventas' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                user.role === 'Tecnico' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                user.role === 'Supervisor' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-sky-50 text-sky-700 border border-sky-100'
                              }`}>
                                {user.role}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-sans">{user.area}</div>
                            </div>
                          </td>

                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              disabled={isCurrentUser}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                user.estado === 'Activo'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300 cursor-pointer'
                                  : 'bg-rose-50 text-rose-600 border-rose-250 hover:bg-rose-100 hover:border-rose-300 cursor-pointer'
                              } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isCurrentUser ? "No puede suspenderse a sí mismo" : "Presione para alternar acceso"}
                            >
                              {user.estado === 'Activo' ? (
                                <>
                                  <ShieldCheck size={11} />
                                  <span>Activo</span>
                                </>
                              ) : (
                                <>
                                  <UserX size={11} />
                                  <span>Suspendido</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-4 text-slate-500 font-mono text-[10px]">
                            {user.ultimoIngreso ? (
                              <div className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" />
                                <span>{user.ultimoIngreso}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sin registros</span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEdit(user)}
                                className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                title="Modificar asignación o nombre"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => startResetPassword(user)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                title="Cambiar contraseña"
                              >
                                <Lock size={13} />
                              </button>
                              {onDeleteUser && !isCurrentUser && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Está seguro de eliminar de forma permanente a ${user.username}? Esta acción auditará la baja.`)) {
                                      onDeleteUser(user.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-605 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                  title="Dar de baja operativa"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Alert/Explanation about Security protocol */}
            <div className="p-4 bg-emerald-50/30 border-t border-slate-150 text-[11px] text-slate-600 flex items-start gap-2.5 text-left">
              <ShieldAlert className="shrink-0 text-emerald-600 mt-0.5" size={14} />
              <div>
                <strong>ADVERTENCIA DE SEGURIDAD OPERATIVA S.A.C:</strong> Al suspender a un usuario, cualquier intento de inicio de sesión manual o mediante acceso rápido quedará estrictamente revocado en tiempo real. Todos las altas/bajas de personal se auditan criptográficamente en la bitácora técnica de la derecha.
              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Real-time Audit Logs styled as sleek White Card matching image */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full text-left">
            
            {/* Header logs */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-250 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Terminal size={14} className="text-emerald-500" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">Eventos de Auditoría</h3>
              </div>
              <span className="animate-pulse flex items-center gap-1 text-[9px] text-emerald-700 font-mono font-bold uppercase bg-emerald-100/50 px-2 py-0.5 rounded-full">
                <Activity size={10} />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Logs controls */}
            <div className="p-3 bg-slate-50/30 border-b border-slate-200">
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Filtrar por Transacción:</label>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs text-slate-700 p-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono font-bold text-[11px]"
              >
                <option value="ALL">Mostrar Todos los Eventos</option>
                <option value="INICIO_SESION">Inicios de Sesión (Logins)</option>
                <option value="CREAR_USUARIO">Registro de Operadores</option>
                <option value="CAMBIAR_ESTADO">Cambios de Estado (Lock/Unlock)</option>
                <option value="EDITAR_USUARIO">Editar Configuración</option>
                <option value="REINICIO_CONTRASENA">Reinicio Contraseñas</option>
              </select>
            </div>

            {/* Logs List representation */}
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto divide-y divide-slate-100 flex-1 bg-slate-50/20">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-mono">
                  No hay transacciones registradas de este tipo.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <div key={log.id} className="pt-2.5 text-left space-y-1 font-mono text-[10px]">
                      <div className="flex items-center justify-between text-slate-400 text-[8px] pb-0.5">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock size={8} />
                          <span>{log.timestamp}</span>
                        </span>
                        <span>IP: {log.ipAddress}</span>
                      </div>

                      <div className="flex items-start gap-1.5 pt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black leading-none shrink-0 ${
                          log.action === 'INICIO_SESION' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          log.action === 'CREAR_USUARIO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          log.action === 'CAMBIAR_ESTADO' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-500 text-[9px] font-medium leading-none self-center truncate max-w-[120px]" title={log.userEmail}>{log.userEmail}</span>
                      </div>

                      <p className="text-slate-650 mt-1 leading-relaxed break-words bg-white/80 p-2 rounded-xl border border-slate-150 text-[10px]">
                        {log.details}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Logs footer info */}
            <div className="p-3 bg-slate-50 text-center text-[9px] text-slate-400 font-mono border-t border-slate-205">
              Registros totales auditados: <strong>{logs.length}</strong>
            </div>

          </div>
        </div>

      </div>

      {/* Modal Flotante de Edición de Usuario */}
      {editingUserId !== null && (() => {
        const userToEdit = users.find(u => u.id === editingUserId);
        if (!userToEdit) return null;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Edit2 size={16} />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Editar Configuración de Operador</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingUserId(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-mono text-slate-450 mb-1 font-bold">Correo Electrónico (No modificable)</span>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs text-slate-500 font-mono">
                    {userToEdit.email}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Nombre Completo *</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-505 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Rol Operativo *</label>
                    <select
                      value={editRole}
                      onChange={(e) => {
                        const role = e.target.value as any;
                        setEditRole(role);
                        setEditAllowedModules(getDefaultModulesForRole(role));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Administrador">🔑 Administrador</option>
                      <option value="Ventas">📞 Ventas</option>
                      <option value="Tecnico">👷 Técnico</option>
                      <option value="Supervisor">🛡️ Supervisor</option>
                      <option value="Cliente">🏢 Cliente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Área o Departamento *</label>
                    <input
                      type="text"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] uppercase font-mono text-slate-500 font-bold">Módulos de Acceso Permitidos *</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditAllowedModules(AVAILABLE_MODULES.map(m => m.id))}
                        className="text-[9px] font-mono text-slate-500 hover:text-emerald-500 font-bold underline cursor-pointer"
                      >
                        Todos
                      </button>
                      <span className="text-slate-355">|</span>
                      <button
                        type="button"
                        onClick={() => setEditAllowedModules([])}
                        className="text-[9px] font-mono text-slate-500 hover:text-rose-500 font-bold underline cursor-pointer"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 max-h-36 overflow-y-auto">
                    {AVAILABLE_MODULES.map((m) => {
                      const isChecked = editAllowedModules.includes(m.id);
                      return (
                        <label 
                          key={m.id} 
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'bg-emerald-50/50 border-emerald-255 text-slate-800 font-semibold' 
                              : 'bg-white border-slate-150 text-slate-605 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAllowedModules([...editAllowedModules, m.id]);
                              } else {
                                setEditAllowedModules(editAllowedModules.filter(id => id !== m.id));
                              }
                            }}
                            className="rounded text-emerald-500 focus:ring-emerald-500 w-3 h-3 border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] leading-tight">{m.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUserId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(editingUserId)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle size={14} />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Flotante de Cambio de Contraseña */}
      {resetPasswordUser !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <Lock size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Cambiar Contraseña</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-slate-655 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveNewPassword} className="space-y-4">
              <div>
                <span className="block text-[10px] uppercase font-mono text-slate-450 mb-1 font-bold">Colaborador</span>
                <div className="font-bold text-slate-800 text-xs">
                  {resetPasswordUser.username} <span className="font-normal text-slate-500 font-mono">({resetPasswordUser.email})</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="Ingrese la nueva contraseña de acceso"
                  value={newPasswordForReset}
                  onChange={(e) => setNewPasswordForReset(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <CheckCircle size={14} />
                  <span>Actualizar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
