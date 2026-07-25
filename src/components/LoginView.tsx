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
import { useLocalToast } from './shared/ToastModal';

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
  const { notifyInfo, toastView } = useLocalToast();

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
    <div className="min-h-[100dvh] bg-canvas flex items-center justify-center p-4 sm:p-10 font-sans select-none relative overflow-hidden" id="gestia-login-wrapper">
      
      {/* Ambient organic backdrop (Aurora blur) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <span className="absolute w-[520px] h-[520px] rounded-full bg-[#BDEBDC] filter blur-[70px] opacity-35 -top-[180px] -left-[160px]"></span>
        <span className="absolute w-[460px] h-[460px] rounded-full bg-[#D6D6F7] filter blur-[70px] opacity-35 -bottom-[200px] -right-[140px]"></span>
      </div>

      {/* Stage Container */}
      <div className="relative z-10 w-full max-w-[960px] flex flex-col gap-3 md:grid md:grid-cols-[1.05fr_1fr] bg-white md:rounded-[28px] rounded-2xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(11,59,52,0.25)] border border-hairline my-auto">

        {/* Left Panel — Brand / Signature Pulse (DESKTOP ONLY) */}
        <div className="hidden md:flex bg-gradient-to-br from-teal-deep to-[#12806A] text-white p-14 flex-col justify-between relative select-none">
          <div className="flex items-center gap-3">
            <svg className="w-9.5 h-9.5" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="#8FF0D2" strokeWidth="1.4" opacity="0.5"/>
              <path d="M12 22 L17 14 L21 24 L25 16 L29 22" stroke="#8FF0D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <div className="font-display font-semibold text-lg tracking-[0.2px] leading-tight">
              GESTIA
              <small className="block font-sans font-normal text-[10.5px] text-[#BFE6DB] tracking-[1.2px] uppercase mt-0.5">
                Gestión inteligente de servicios de campo
              </small>
            </div>
          </div>

          <div className="my-10">
            <svg viewBox="0 0 340 56" preserveAspectRatio="none" className="w-full h-14">
              <path 
                className="stroke-[#8FF0D2] stroke-[2.4px] fill-none stroke-linecap-round stroke-linejoin-round filter drop-shadow-[0_0_6px_rgba(143,240,210,0.5)] animate-pulse-line" 
                d="M0 30 L60 30 L74 8 L88 46 L100 30 L340 30"
              />
              <circle cx="88" cy="46" r="3.2" className="fill-[#8FF0D2]" />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="font-display font-semibold text-[27px] leading-[1.28] tracking-[-0.2px] text-white">
              Cada equipo, cada visita, cada SLA — en un mismo pulso operativo.
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[#CFEDE3] max-w-[360px]">
              Gestia centraliza tus órdenes de trabajo, técnicos y contratos con una capa de inteligencia que anticipa cuellos de botella antes de que ocurran.
            </p>
          </div>

          <div className="flex gap-8 mt-10">
            <div className="space-y-0.5">
              <b className="font-mono text-xl font-medium block">23.0</b>
              <span className="text-[11px] text-[#A9DCCC] uppercase tracking-wider">días ciclo prom.</span>
            </div>
            <div className="space-y-0.5">
              <b className="font-mono text-xl font-medium block">99.4%</b>
              <span className="text-[11px] text-[#A9DCCC] uppercase tracking-wider">disponibilidad</span>
            </div>
            <div className="space-y-0.5">
              <b className="font-mono text-xl font-medium block">+120</b>
              <span className="text-[11px] text-[#A9DCCC] uppercase tracking-wider">técnicos activos</span>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="p-8 sm:p-14 flex flex-col justify-center">

          {/* Brand Panel Compact — MOBILE ONLY (reemplaza logo PNG mini) */}
          <div className="md:hidden bg-gradient-to-br from-teal-deep to-[#12806A] text-white rounded-2xl p-5 flex flex-col gap-4 mb-4 relative overflow-hidden select-none">
            <div className="flex items-center gap-2.5">
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="19" stroke="#8FF0D2" strokeWidth="1.4" opacity="0.6"/>
                <path d="M12 22 L17 14 L21 24 L25 16 L29 22" stroke="#8FF0D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div className="leading-tight">
                <h1 className="font-display font-semibold text-base tracking-[0.4px]">GESTIA</h1>
                <small className="block text-[8.5px] text-[#BFE6DB] tracking-[1px] uppercase font-normal">Gestión inteligente de servicios de campo</small>
              </div>
            </div>

            <svg viewBox="0 0 320 28" preserveAspectRatio="none" className="w-full h-7">
              <path
                className="stroke-[#8FF0D2] stroke-[2px] fill-none stroke-linecap-round stroke-linejoin-round drop-shadow-[0_0_4px_rgba(143,240,210,0.6)]"
                d="M0 14 L80 14 L96 4 L112 24 L124 14 L320 14"
              />
              <circle cx="112" cy="24" r="3" className="fill-[#8FF0D2]" />
            </svg>

            <h2 className="font-display font-semibold text-[15px] leading-tight tracking-tight text-white">
              Tu pulso operativo en tiempo real.
            </h2>

            <div className="flex gap-4 pt-1">
              <div className="space-y-0.5">
                <b className="font-mono text-sm font-medium block">23.0</b>
                <span className="text-[8.5px] text-[#A9DCCC] uppercase tracking-wide">días ciclo</span>
              </div>
              <div className="space-y-0.5">
                <b className="font-mono text-sm font-medium block">99.4%</b>
                <span className="text-[8.5px] text-[#A9DCCC] uppercase tracking-wide">uptime</span>
              </div>
              <div className="space-y-0.5">
                <b className="font-mono text-sm font-medium block">+120</b>
                <span className="text-[8.5px] text-[#A9DCCC] uppercase tracking-wide">técnicos</span>
              </div>
            </div>
          </div>

          <div className="mb-8 text-left">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.2px] text-ink">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-sans mb-4 transition-all">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
            
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase text-ink-soft tracking-wider">
                Correo electrónico
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@gestia.com"
                className="w-full bg-[#FBFDFC] border border-hairline rounded-sm py-2.5 px-4 text-sm text-ink placeholder-[#9CAAA3] focus:outline-none focus:border-teal-brand focus:ring-4 focus:ring-teal-mist transition-all font-sans"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase text-ink-soft tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FBFDFC] border border-hairline rounded-sm py-2.5 pl-4 pr-11 text-sm text-ink placeholder-[#9CAAA3] focus:outline-none focus:border-teal-brand focus:ring-4 focus:ring-teal-mist transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Pass */}
            <div className="flex items-center justify-between pt-1 pb-3 text-xs">
              <label className="flex items-center gap-2 text-ink-soft font-normal normal-case tracking-normal mb-0 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-teal-brand rounded-sm cursor-pointer" />
                <span>Recordarme</span>
              </label>
              <a href="#" className="text-teal-deep font-semibold hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full bg-teal-deep hover:bg-[#0d4a40] text-white font-semibold py-3 px-4 rounded-sm text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_24px_-10px_rgba(11,59,52,0.55)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                <span>Acceder al sistema</span>
              </button>

              <div className="flex items-center gap-3 py-1 text-slate-400 text-xs justify-center">
                <span className="w-10 h-px bg-hairline"></span>
                <span>o continúa con</span>
                <span className="w-10 h-px bg-hairline"></span>
              </div>

              <button
                type="button"
                onClick={() => {
                  notifyInfo(
                    'Office 365 SSO Próximamente',
                    'La integración corporativa con Azure Active Directory (Azure AD) está en preparación y estará disponible próximamente.'
                  );
                }}
                className="w-full bg-white text-ink-soft border border-hairline font-medium py-2.5 px-4 rounded-sm text-[13px] cursor-not-allowed opacity-75 flex items-center justify-center gap-2"
              >
                <span>Iniciar sesión con Office 365 (Próximamente)</span>
              </button>
            </div>
          </form>

          {/* Copiloto IA Note */}
          <div className="mt-8 flex gap-3 items-start bg-ai-mist rounded-sm p-3.5 border border-[#DCDCF6] text-left">
            <span className="w-2 h-2 rounded-full bg-ai-brand mt-1.5 flex-none shadow-[0_0_0_4px_rgba(108,111,224,0.15)]"></span>
            <p className="text-[12.5px] text-[#4C4C86] leading-relaxed">
              <b className="text-[#3A3A78]">Copiloto activo:</b> al ingresar, Gestia prioriza automáticamente las 2 OTs con riesgo de incumplimiento de SLA esta semana.
            </p>
          </div>

          {/* Test Users Toggle */}
          <div className="w-full text-center mt-6">
            <button
              type="button"
              onClick={() => setShowTestUsers(!showTestUsers)}
              className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink text-xs font-medium py-1.5 cursor-pointer hover:underline decoration-dotted"
            >
              <Users size={14} />
              <span>¿Solo exploras? Ver usuarios de prueba disponibles ↓</span>
            </button>

            {showTestUsers && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in w-full text-left">
                {[
                  {
                    role: 'Administrador' as const,
                    title: 'Admin Master QA',
                    email: 'admin@mafort.pe',
                    avatar: 'AD',
                    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                  },
                  {
                    role: 'Supervisor' as const,
                    title: 'Ing. Roberto Salas',
                    email: 'supervisor@mafort.pe',
                    avatar: 'SV',
                    color: 'bg-amber-100 text-amber-700 border-amber-200',
                  },
                  {
                    role: 'Tecnico' as const,
                    title: 'Juan Córdova (Téc.)',
                    email: 'juan.cordova@materiagris.pe',
                    avatar: 'JC',
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  },
                  {
                    role: 'Ventas' as const,
                    title: 'María López (Ventas)',
                    email: 'ventas@mafort.pe',
                    avatar: 'ML',
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                  },
                  {
                    role: 'Cliente' as const,
                    title: 'Ana Gutiérrez (Cliente)',
                    email: 'cliente@mafort.pe',
                    avatar: 'AG',
                    color: 'bg-rose-100 text-rose-700 border-rose-200',
                  }
                ].map((item) => {
                  const uObj = users.find(u => u.email === item.email);
                  const isSuspended = uObj?.estado === 'Suspendido';
                  return (
                    <button
                      key={item.email}
                      type="button"
                      onClick={() => handleQuickAccess(item.role)}
                      disabled={isSuspended}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                        isSuspended
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                          : 'bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-[10.5px] font-extrabold shrink-0`}>
                        {item.avatar}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="text-[10px] font-bold text-slate-700 block truncate">
                          {item.title}
                        </span>
                        <span className="text-[8px] text-slate-400 block truncate font-mono uppercase tracking-tight">
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

      </div>

      {toastView}
    </div>
  );
}
