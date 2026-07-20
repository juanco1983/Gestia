const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Insert fieldset disabled wrapper around scrollable form
const oldScrollDiv = '            {/* Form scroll blocks %}\n            <div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">';
// Let\'s search by sub-parts to be line-ending safe
const targetDivStr = '            <div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">';
const newDivStr = '            <div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">\n              <fieldset disabled={selectedOt.estado === OTStatus.EN_REVISION || selectedOt.estado === OTStatus.CONCLUIDA} className="space-y-8">';

content = content.replace(targetDivStr, newDivStr);

const targetEndDivStr = '            </div>\n\n            {/* Offline notification banner & submission */}';
const newEndDivStr = '              </fieldset>\n            </div>\n\n            {/* Offline notification banner & submission */}';

content = content.replace(targetEndDivStr, newEndDivStr);

// 2. Replace ACTION CARD button list inside the detail view
const targetButtonsStart = '                        ) : selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION ? (';
const targetButtonsEnd = '                        )}';

const startIndex = content.indexOf(targetButtonsStart);
const endIndex = content.indexOf(targetButtonsEnd, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Action card buttons start or end not found! startIndex:", startIndex, "endIndex:", endIndex);
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + targetButtonsEnd.length);

const replacement = `                        ) : (
                          <div className="flex flex-col gap-4 w-full text-slate-800">
                            <h4 className="text-xs font-black text-white border-b border-slate-700 pb-2">
                              📋 LISTADO DE EQUIPOS Y REPORTES TÉCNICOS:
                            </h4>
                            <div className="space-y-3">
                              {otEquipoIds.map(eqId => {
                                const equipo = equipos.find(e => e.id === eqId);
                                const report = reports.find(r => r.otId === selectedOt.id && r.equipoId === eqId);

                                return (
                                  <div key={eqId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800 border border-slate-700 p-4 rounded-xl gap-3 text-left">
                                    <div className="space-y-1">
                                      <span className="text-xs font-bold text-white">
                                        {equipo ? \`\${equipo.codigo} - \${equipo.tipo}\` : \`Equipo ID: \${eqId}\`}
                                      </span>
                                      <p className="text-[10px] text-slate-400">
                                        {equipo ? \`Marca: \${equipo.marca || '-'} | Modelo: \${equipo.modelo || '-'}\` : ''}
                                      </p>
                                      <div className="pt-1 flex items-center gap-2">
                                        {report ? (
                                          <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/20">
                                            ✅ Completado
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/20">
                                            ⏳ Pendiente
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="shrink-0">
                                      {(selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION || selectedOt.estado === OTStatus.OBSERVADA) ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedEquipoId(eqId);
                                            loadReportOrCreate(selectedOt, eqId);
                                            setIsEditingReport(true);
                                          }}
                                          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl transition-all text-xs font-mono cursor-pointer active:scale-95 text-center"
                                        >
                                          {report ? 'Editar Reporte' : 'Iniciar Reporte'}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={!report}
                                          onClick={() => {
                                            if (report) {
                                              setSelectedEquipoId(eqId);
                                              loadReportOrCreate(selectedOt, eqId);
                                              setIsEditingReport(true);
                                            }
                                          }}
                                          className={\`w-full sm:w-auto font-black px-4 py-2.5 rounded-xl transition-all text-xs font-mono text-center \${
                                            report 
                                              ? 'bg-slate-700 hover:bg-slate-650 text-white cursor-pointer' 
                                              : 'bg-slate-800 text-slate-650 border border-slate-700 cursor-not-allowed'
                                          }\`}
                                        >
                                          Ver Reporte
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION && (
                              <div className="pt-2 border-t border-slate-700 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('¿Está seguro de finalizar el servicio? Se registrará la hora de término y se enviarán los informes completados.')) {
                                      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                      
                                      const allCompleted = otEquipoIds.every(id => 
                                        reports.some(r => r.otId === selectedOt.id && r.equipoId === id)
                                      );

                                      onUpdateOt({
                                        ...selectedOt,
                                        estado: allCompleted ? OTStatus.EN_REVISION : OTStatus.TRABAJO_EN_EJECUCION,
                                        horaFinServicio: now
                                      });

                                      if (allCompleted) {
                                        alert("Servicio finalizado. Todos los informes fueron enviados al supervisor.");
                                      } else {
                                        alert("Servicio finalizado localmente. Complete los informes de equipos restantes para enviar al supervisor.");
                                      }
                                    }
                                  }}
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-5 py-3 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                                >
                                  <Clock size={16} />
                                  <span>Finalizar Servicio (Concluir Visita)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )`;

content = before + replacement + after;

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched TecnicoView UI blocks");
process.exit(0);
