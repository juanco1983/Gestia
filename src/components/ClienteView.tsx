import React, { useRef, useState, useEffect } from 'react';
import { 
  CheckSquare, 
  PenTool, 
  Trash2, 
  FileCheck, 
  Calendar,
  Building,
  Sparkles,
  Printer
} from 'lucide-react';
import { OT, OTStatus, Client, TechnicalReport } from '../types';
import DocumentFormat from './DocumentFormat';

interface ClienteViewProps {
  ots: OT[];
  clients: Client[];
  reports: TechnicalReport[];
  onUpdateOtStatus: (otId: string, status: OTStatus) => void;
  onUpdateReport: (report: TechnicalReport) => void;
}

export default function ClienteView({
  ots,
  clients,
  reports,
  onUpdateOtStatus,
  onUpdateReport
}: ClienteViewProps) {
  // OTs that have been approved by supervisor and need client signature
  const signableOts = ots.filter(o => o.estado === OTStatus.APROBADA || o.estado === OTStatus.FIRMADA);

  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  
  // Custom Canvas Drawing pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Retrieve current report associated with selected OT
  const getAssociatedReport = (otId: string) => {
    return reports.find(r => r.otId === otId);
  };

  const handleSelectOt = (ot: OT) => {
    setSelectedOt(ot);
    setHasSigned(false);
  };

  // Canvas drawing handlers
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and style signature line
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Deep Navy Blue Ink
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [selectedOt]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || selectedOt?.estado === OTStatus.FIRMADA) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || selectedOt?.estado === OTStatus.FIRMADA) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleClearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleConfirmSignature = () => {
    if (!selectedOt || !canvasRef.current || !hasSigned) return;

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    const report = getAssociatedReport(selectedOt.id);
    if (report) {
      const updatedReport = {
        ...report,
        firmaCliente: signatureDataUrl
      };
      onUpdateReport(updatedReport);
    }

    onUpdateOtStatus(selectedOt.id, OTStatus.FIRMADA);
    alert(`🎉 ¡SLA FIRMADO Y CONCLUIDO CON ÉXITO!\n\nSe ha estresado la conformidad del cliente y archivado las mediciones de entrada/salida. El informe técnico oficial está listo para auditoría final.`);
    setSelectedOt(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800 animate-fade-in" id="cliente-portal-container">
      {/* List of OTs ready for sign-off */}
      <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden self-start">
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
          <h2 className="text-white text-sm font-bold uppercase font-mono tracking-tight flex items-center gap-2">
            <PenTool size={16} className="text-sky-400" />
            <span>Firma de Conformidad</span>
          </h2>
          <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono font-bold">
            {signableOts.length} actas
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {signableOts.map(ot => {
            const client = clients.find(c => c.id === ot.clientId);
            const isSelected = selectedOt?.id === ot.id;
            const isCompleted = ot.estado === OTStatus.FIRMADA;

            return (
              <div 
                key={ot.id}
                onClick={() => handleSelectOt(ot)}
                className={`p-4 transition-all cursor-pointer ${
                  isSelected ? 'bg-sky-50/50 border-l-4 border-sky-500' : 'hover:bg-slate-50/50'
                }`}
                id={`sign-ot-${ot.id}-card`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sky-600 font-mono text-[11px] font-bold block">{ot.id}</span>
                    <h3 className="font-extrabold text-slate-950 text-xs leading-snug uppercase truncate max-w-[180px]">{client?.razonSocial || 'Cliente Desconocido'}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ot.tipoEquipo}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-sky-50 text-sky-600 border border-sky-200 animate-pulse'
                  }`}>
                    {isCompleted ? 'Firmado' : 'Por Firmar'}
                  </span>
                </div>
              </div>
            );
          })}
          {signableOts.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs font-mono py-16">
              No tienes actas listas para firmar en este momento.
            </div>
          )}
        </div>
      </div>

      {/* Portal review & Draw signature */}
      <div className="lg:col-span-2 space-y-6">
        {selectedOt ? (
          (() => {
            const client = clients.find(c => c.id === selectedOt.clientId) || {
              razonSocial: 'Cliente General S.A.',
              direccionSede: 'Sede Central',
              distrito: 'Surco'
            };
            const report = getAssociatedReport(selectedOt.id);
            const isSignedAndClosed = selectedOt.estado === OTStatus.FIRMADA;

            return (
              <div className="space-y-6">
                
                {/* Visual context */}
                <div className="bg-slate-900 text-white rounded-xl shadow-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
                  <div>
                    <span className="text-xs text-sky-400 font-mono font-bold uppercase tracking-wider block">Revisión de Ficha de Conformidad</span>
                    <h3 className="text-base font-extrabold text-slate-100">{selectedOt.id} — {client.razonSocial}</h3>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-705 text-white font-mono px-3 py-1.5 text-xs rounded border border-slate-700 font-bold flex items-center gap-1 transition-all"
                  >
                    <Printer size={13} />
                    <span>Imprimir de Resguardo</span>
                  </button>
                </div>

                {/* Simulated high-fidelity scrollable report preview */}
                <div className="bg-slate-100 border border-slate-200 p-6 rounded-xl max-h-[600px] overflow-y-auto">
                  <div className="bg-sky-50 border border-sky-200 text-sky-850 rounded p-3 text-xs mb-4 flex items-center gap-2 select-none">
                    <Sparkles size={14} className="text-sky-600 blink shrink-0" />
                    <span><strong>Previsualice el documento antes de firmar:</strong> Abajo se presenta el informe que será emitido. Deslícese por las páginas para corroborar las mediciones y evidencias.</span>
                  </div>

                  {report ? (
                    <div className="shadow-lg bg-white border border-slate-200 p-1 origin-top scale-95 rounded">
                      <DocumentFormat report={report} ot={selectedOt} client={client as Client} />
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-center text-slate-400 py-12">No se encontró detalle para este informe técnico.</p>
                  )}
                </div>

                {/* SIGNATURE DRAWER BOX */}
                <div className="bg-white border border-slate-200 shadow-md rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
                      <span>Estampar Firma Digital de Conformidad (Pág 10)</span>
                    </h3>
                    {!isSignedAndClosed && (
                      <button 
                        onClick={handleClearSignature}
                        className="text-xs text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase font-mono"
                        title="Borrar firma hecha"
                      >
                        <Trash2 size={13} />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>

                  {isSignedAndClosed ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4 text-center">
                      <p className="font-bold text-emerald-600 text-xs flex items-center justify-center gap-1.5">
                        <CheckSquare size={15} />
                        <span>Este informe de servicio técnico cuenta con conformidad digital certificada.</span>
                      </p>
                      {report?.firmaCliente && (
                        <div className="mx-auto border border-slate-200 rounded p-2 bg-white max-w-[320px]">
                          <img src={report.firmaCliente} alt="Firma registrada" className="h-24 mx-auto object-contain" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        <canvas
                          ref={canvasRef}
                          width={480}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="cursor-crosshair w-full max-w-[480px] bg-white touch-none"
                          id="signature-pad-canvas"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Arrastre el mouse o use su pantalla táctil para firmar.</span>
                        <span>Firma obligatoria para cierre S.L.A</span>
                      </div>

                      <button
                        onClick={handleConfirmSignature}
                        disabled={!hasSigned}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer ${
                          hasSigned 
                            ? 'bg-sky-600 text-white font-extrabold hover:bg-sky-500 shadow-md shadow-sky-500/10' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                        id="sign-confirm-submission"
                      >
                        <FileCheck size={14} />
                        <span>Confirmar Conformidad y Generar PDF</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })()
        ) : (
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200/80 p-12 text-center text-slate-400 space-y-3 font-sans h-full flex flex-col items-center justify-center min-h-[400px]">
            <CheckSquare size={36} className="text-slate-350" />
            <div className="space-y-1">
              <p className="font-bold text-slate-700 text-sm">Bandeja de Conformidades del Cliente</p>
              <p className="text-slate-400 text-xs">Para previsualizar las 10 páginas del reporte completo y autorizar el cierre con su firma, seleccione una de las actas de la lista izquierda.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
