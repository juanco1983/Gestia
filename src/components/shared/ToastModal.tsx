import React, { useState, useCallback, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Cloud, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'offline' | 'info';

export interface ToastState {
  show: boolean;
  type: ToastType;
  title: string;
  message: string;
}

export interface ToastApi {
  notify: (type: ToastType, title: string, message: string) => void;
  close: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastModalProvider>');
  }
  return ctx;
}

const INITIAL_STATE: ToastState = {
  show: false,
  type: 'success',
  title: '',
  message: ''
};

export const ToastModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<ToastState>(INITIAL_STATE);

  const notify = useCallback(
    (type: ToastType, title: string, message: string) => {
      setAlertState({ show: true, type, title, message });
    },
    []
  );

  const close = useCallback(() => {
    setAlertState(prev => ({ ...prev, show: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ notify, close }}>
      {children}
      <ToastModalView state={alertState} onClose={close} />
    </ToastContext.Provider>
  );
};

const ToastModalView: React.FC<{ state: ToastState; onClose: () => void }> = ({
  state,
  onClose
}) => {
  if (!state.show) return null;

  const palette = getPalette(state.type);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 font-sans"
      id="gestia-notification-modal"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 text-left"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${palette.iconBg}`}>
            <palette.Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-850 text-sm truncate">{state.title}</h4>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">
              GESTIA HUB & CONTROL DE CALIDAD
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
          {state.message}
        </p>

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${palette.buttonBg}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

function getPalette(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle2,
        iconBg: 'bg-emerald-50 border border-emerald-100 text-emerald-500',
        buttonBg: 'bg-[--color-teal-brand] hover:bg-teal-deep text-white shadow-sm'
      };
    case 'error':
      return {
        Icon: XCircle,
        iconBg: 'bg-rose-50 border border-rose-100 text-rose-500',
        buttonBg: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
      };
    case 'offline':
      return {
        Icon: Cloud,
        iconBg: 'bg-sky-50 border border-sky-100 text-sky-500',
        buttonBg: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
      };
    case 'info':
    default:
      return {
        Icon: Info,
        iconBg: 'bg-sky-50 border border-sky-100 text-sky-500',
        buttonBg: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
      };
  }
}

export interface LocalToastApi {
  alertState: ToastState;
  notify: (type: ToastType, title: string, message: string) => void;
  closeToast: () => void;
  notifySuccess: (title: string, message: string) => void;
  notifyError: (title: string, message: string) => void;
  notifyOffline: (title: string, message: string) => void;
  notifyInfo: (title: string, message: string) => void;
  toastView: React.ReactNode;
}

export function useLocalToast(): LocalToastApi {
  const [alertState, setAlertState] = useState<ToastState>(INITIAL_STATE);

  const notify = useCallback((type: ToastType, title: string, message: string) => {
    setAlertState({ show: true, type, title, message });
  }, []);

  const closeToast = useCallback(() => {
    setAlertState(prev => ({ ...prev, show: false }));
  }, []);

  const notifySuccess = useCallback((title: string, message: string) => notify('success', title, message), [notify]);
  const notifyError = useCallback((title: string, message: string) => notify('error', title, message), [notify]);
  const notifyOffline = useCallback((title: string, message: string) => notify('offline', title, message), [notify]);
  const notifyInfo = useCallback((title: string, message: string) => notify('info', title, message), [notify]);

  const ref = useRef<ToastState>(alertState);
  ref.current = alertState;

  const toastView = <ToastModalView state={alertState} onClose={closeToast} />;

  return {
    alertState,
    notify,
    closeToast,
    notifySuccess,
    notifyError,
    notifyOffline,
    notifyInfo,
    toastView
  };
}
