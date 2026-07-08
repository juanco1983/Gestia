import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Users, 
  LogIn, 
  ChevronDown,
  Landmark
} from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User, token: string) => void;
}

export default function LoginView({ users, onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTestUsers, setShowTestUsers] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor complete el campo de correo o rol operativo.');
      return;
    }

    if (!password) {
      setError('Por favor digite su contraseña corporativa.');
      return;
    }

    // Call real login endpoint on backend
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Correo o contraseña incorrectos.');
      }
    })
    .catch((err) => {
      setError('Error de conexión con el servidor: ' + err.message);
    });
  };

  const handleQuickAccess = (roleType: 'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente') => {
    setError('');
    const matchedUser = users.find(u => u.role === roleType);
    
    if (!matchedUser) {
      setError(`No hay ningún usuario activo registrado con el rol: ${roleType}`);
      return;
    }

    if (matchedUser.estado === 'Suspendido') {
      setError(`⚠️ ALERTA: El operador "${matchedUser.username}" está "Suspendido".`);
      return;
    }

    // Authenticate with default password 'mafort'
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: matchedUser.email, password: 'mafort' })
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'La contraseña por defecto no es correcta.');
      }
    })
    .catch((err) => {
      setError('Error de conexión con el servidor: ' + err.message);
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#CBECE4] flex flex-col items-center justify-between p-6 sm:p-10 font-sans select-none relative" id="mafort-login-wrapper">
      
      {/* Centered Login Content Container */}
      <div className="w-full max-w-[460px] flex flex-col items-center my-auto">
        
        {/* GESTIA Logo Branding */}
        <div className="flex flex-col items-center mb-6 w-full max-w-[280px]">
          <img 
            src="/logo.png" 
            className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xs" 
            alt="Gestia Logo" 
          />
        </div>



        {/* White Login Card */}
        <div className="w-full bg-white rounded-[28px] border border-slate-100 shadow-[0_15px_40px_rgba(148,163,184,0.06)] p-8 sm:p-10 text-left">
          
          <h2 className="text-2xl font-black text-[#111827] tracking-tight leading-none">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Ingresa tus credenciales para acceder al sistema
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-sans mb-4 transition-all">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase text-[#64748B] tracking-wider">
                CORREO ELECTRÓNICO
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@mafort.com"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594] transition-all font-sans"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase text-[#64748B] tracking-wider">
                CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-11 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                className="w-full bg-[#00B594] hover:bg-[#009b7e] text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,181,148,0.2)]"
              >
                <LogIn size={15} />
                <span>Acceder al Sistema</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("Microsoft Office 365 SSO: La integración corporativa con Azure Active Directory (Azure AD) está en preparación. Estará disponible próximamente.");
                }}
                className="w-full bg-slate-50 text-slate-400 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>Iniciar sesión con Office 365 (Próximamente)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick access operators */}
        <div className="w-full text-center">
          <button
            type="button"
            onClick={() => setShowTestUsers(!showTestUsers)}
            className="flex items-center justify-center gap-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold py-2 cursor-pointer mx-auto mt-6"
          >
            <Users size={13} />
            <span>Usuarios de prueba disponibles</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${showTestUsers ? 'rotate-180' : ''}`} />
          </button>

          {showTestUsers && (
            <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in w-full text-left">
              {[
                {
                  role: 'Administrador' as const,
                  title: 'Admin',
                  email: 'admin@mafort.pe',
                  avatar: 'AD',
                  color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                },
                {
                  role: 'Supervisor' as const,
                  title: 'Supervisor',
                  email: 'supervisor@mafort.pe',
                  avatar: 'SV',
                  color: 'bg-amber-100 text-amber-700 border-amber-200',
                },
                {
                  role: 'Tecnico' as const,
                  title: 'Carlos (Técnico)',
                  email: 'tecnico@mafort.pe',
                  avatar: 'CO',
                  color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                },
                {
                  role: 'Ventas' as const,
                  title: 'Coord. Ventas',
                  email: 'ventas@mafort.pe',
                  avatar: 'CV',
                  color: 'bg-blue-100 text-blue-700 border-blue-200',
                },
                {
                  role: 'Cliente' as const,
                  title: 'Cliente Demo',
                  email: 'cliente@mafort.pe',
                  avatar: 'CL',
                  color: 'bg-rose-100 text-rose-700 border-rose-200',
                }
              ].map((item) => {
                const uObj = users.find(u => u.role === item.role);
                const isSuspended = uObj?.estado === 'Suspendido';
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickAccess(item.role)}
                    disabled={isSuspended}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSuspended
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-250'
                        : 'bg-white hover:bg-slate-50 hover:border-slate-350 shadow-2xs cursor-pointer'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center text-[10px] font-extrabold shrink-0`}>
                      {item.avatar}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <span className="text-[10px] font-bold text-slate-700 block truncate leading-none">
                        {item.title}
                      </span>
                      <span className="text-[8px] text-slate-400 block truncate font-mono">
                        {item.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Footer bar */}
      <footer className="w-full max-w-[950px] flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 pt-4 mt-auto text-slate-400 text-xs">
        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono tracking-wider">
          <Shield size={12} className="text-[#00B594]" />
          <span>PROTECCIÓN DE DATOS ACTIVA</span>
        </span>
        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider mt-2 sm:mt-0">
          SLA HUBS v1.5
        </span>
      </footer>

    </div>
  );
}
