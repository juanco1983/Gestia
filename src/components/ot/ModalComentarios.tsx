import React from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { OrdenTrabajoLinea } from '../../types';

interface ModalComentariosProps {
  linea: OrdenTrabajoLinea;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  onAddComment: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ModalComentarios({
  linea,
  newCommentText,
  setNewCommentText,
  onAddComment,
  onClose
}: ModalComentariosProps) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" id="ot-modal-comentarios">
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="text-teal-brand" size={16} />
              Bitácora de Estatus & Seguimiento
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono block mt-0.5">
              OT: {linea.ot} • Cliente: {linea.empresa}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body (Comment history) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
          {(!linea.estatus || linea.estatus.length === 0) ? (
            <div className="text-center py-12 space-y-2">
              <MessageSquare className="mx-auto text-slate-300" size={32} />
              <p className="text-xs text-slate-400 font-bold">No hay comentarios ni avances registrados para esta línea de OT.</p>
              <p className="text-[10px] text-slate-400 font-medium">Usa el formulario de abajo para registrar un nuevo hito.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(linea.estatus || []).map((est, index) => (
                <div key={index} className="bg-white border border-slate-200/80 p-4 rounded-2xl text-xs space-y-2 text-left shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-teal-brand bg-teal-mist px-2 py-0.5 rounded-md font-mono">{est.autor}</span>
                    <span className="text-slate-400 font-mono font-bold">{est.fecha}</span>
                  </div>
                  <p className="text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{est.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Form) */}
        <div className="border-t border-slate-200 p-5 bg-white">
          <form onSubmit={onAddComment} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Agregar avance o nota informal del servicio (ej. '15.06: entregado')..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:border-teal-brand focus:ring-1 focus:ring-teal-brand transition-all"
            />
            <button
              type="submit"
              className="bg-teal-brand hover:bg-teal-deep text-white p-2.5 rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all shadow-md"
              title="Enviar comentario"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
