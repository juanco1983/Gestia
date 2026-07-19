const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/SupervisorView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update React imports to include useEffect
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';"
);

// 2. Add selectedEquipoId state and useEffect to update it
const stateInsertionTarget = "  const [selectedOt, setSelectedOt] = useState<OT | null>(null);";
const stateInsertionContent = `  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);

  // Parse equipment IDs from selected OT
  const otEquipoIds = selectedOt?.equipoId
    ? selectedOt.equipoId.split(',').map(x => x.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (selectedOt) {
      const ids = selectedOt.equipoId ? selectedOt.equipoId.split(',').map(x => x.trim()).filter(Boolean) : [];
      setSelectedEquipoId(ids[0] || null);
    } else {
      setSelectedEquipoId(null);
    }
  }, [selectedOt]);`;

content = content.replace(stateInsertionTarget, stateInsertionContent);

// 3. Update getAssociatedReport to take equipoId
const oldGetReport = "  // Get report for selected OT\n  const getAssociatedReport = (otId: string) => {\n    return reports.find(r => r.otId === otId);\n  };";
const newGetReport = "  // Get report for selected OT and equipment\n  const getAssociatedReport = (otId: string, eqId: string | null) => {\n    if (!eqId) return undefined;\n    return reports.find(r => r.otId === otId && r.equipoId === eqId);\n  };";

content = content.replace(oldGetReport, newGetReport);

// 4. Update lookup invocation
content = content.replace(
  "  const report = getAssociatedReport(selectedOt.id);",
  "  const report = getAssociatedReport(selectedOt.id, selectedEquipoId);"
);

// 5. Wrap details inside multi-equipment layout
const oldReportBlock = `                {/* Render technical report details inside the panel for review */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">`;

const newReportBlock = `                {/* Multi-equipment report tabs selector */}
                {otEquipoIds.length > 1 && (
                  <div className="bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200/50 flex flex-wrap gap-2 shrink-0">
                    {otEquipoIds.map(eqId => {
                      const equipo = clients.flatMap(c => c.equipos || []).find(e => e.id === eqId);
                      const eqReport = getAssociatedReport(selectedOt.id, eqId);
                      const isTabSelected = selectedEquipoId === eqId;
                      return (
                        <button
                          key={eqId}
                          onClick={() => setSelectedEquipoId(eqId)}
                          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                            isTabSelected
                              ? 'bg-[#00B594] text-white shadow-md'
                              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                          }\`}
                        >
                          {equipo ? \`\${equipo.codigo} (\${equipo.tipo})\` : eqId}
                          {eqReport ? ' (Completado)' : ' (Pendiente)'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Render technical report details inside the panel for review */}
                {!report ? (
                  <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center text-slate-400 space-y-3">
                    <Clock size={36} className="text-slate-350 mx-auto animate-pulse" />
                    <h4 className="font-bold text-sm text-slate-800">Informe Pendiente para este Equipo</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      El técnico asignado aún no ha enviado el reporte correspondiente para el equipo seleccionado ({selectedEquipoId}).
                    </p>
                  </div>
                ) : (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">`;

content = content.replace(oldReportBlock, newReportBlock);

// 6. Add closing tag for conditional wrapper
const oldEndBlock = "                  </div>\n                </div>\n              </>\n            ) : (";
const newEndBlock = "                  </div>\n                </div>\n                )}\n              </>\n            ) : (";

content = content.replace(oldEndBlock, newEndBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched SupervisorView.tsx");
process.exit(0);
