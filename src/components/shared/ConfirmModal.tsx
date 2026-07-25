import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmState extends Required<ConfirmOptions> {
  show: boolean;
  resolve: ((value: boolean) => void) | null;
}

const INITIAL_STATE: ConfirmState = {
  show: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  tone: 'warning',
  resolve: null
};

export interface LocalConfirmApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (value: boolean) => void;
  confirmView: React.ReactNode;
}

const TONE_PALETTE: Record<ConfirmTone, {
  iconBg: string;
  confirmBg: string;
}> = {
  danger: {
    iconBg: 'bg-rose-50 border border-rose-100 text-rose-500',
    confirmBg: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
  },
  warning: {
    iconBg: 'bg-amber-50 border border-amber-100 text-amber-500',
    confirmBg: 'bg-[--color-teal-brand] hover:bg-teal-deep text-white shadow-sm'
  },
  info: {
    iconBg: 'bg-sky-50 border border-sky-100 text-sky-500',
    confirmBg: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
  }
};

export function useConfirm(): LocalConfirmApi {
  const [confirmState, setConfirmState] = useState<ConfirmState>(INITIAL_STATE);
  const stateRef = useRef<ConfirmState>(confirmState);
  stateRef.current = confirmState;

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({
        show: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        tone: options.tone ?? 'warning',
        resolve
      });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    const current = stateRef.current;
    if (current.resolve) {
      current.resolve(value);
    }
    setConfirmState(prev => ({ ...prev, show: false, resolve: null }));
  }, []);

  const confirmView = (
    <ConfirmModalView state={confirmState} onClose={closeConfirm} />
  );

  return { confirm, closeConfirm, confirmView };
}

const ConfirmModalView: React.FC<{
  state: ConfirmState;
  onClose: (value: boolean) => void;
}> = ({ state, onClose }) => {
  if (!state.show) return null;

  const palette = TONE_PALETTE[state.tone];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 font-sans"
      id="gestia-confirm-modal"
      onClick={() => onClose(false)}
      role="presentation"
    >
      <dialog
        open
        className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 text-left m-0"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        aria-modal="true"
        aria-labelledby="gestia-confirm-title"
        aria-describedby="gestia-confirm-message"
      >
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${palette.iconBg}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 id="gestia-confirm-title" className="font-bold text-slate-850 text-sm truncate">
              {state.title}
            </h4>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">
              CONFIRMACIÓN REQUERIDA
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            aria-label="Cancelar"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p
          id="gestia-confirm-message"
          className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line"
        >
          {state.message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            {state.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            autoFocus
            className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${palette.confirmBg}`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </dialog>
    </div>,
    document.body
  );
};
