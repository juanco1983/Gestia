const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update React imports to include useMemo
content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useMemo } from 'react';"
);

// 2. Update types imports to include Equipo
content = content.replace(
  "import { OT, OTStatus, EquipmentType, ServiceType, TechnicalReport, Client, User } from '../types';",
  "import { OT, OTStatus, EquipmentType, ServiceType, TechnicalReport, Client, User, Equipo } from '../types';"
);

// 3. Add todayStr and delete duplicate selectedOt state declaration using split/join
const targetDatePlace = "  const [fechaServicio, setFechaServicio] = useState('');";
content = content.replace(targetDatePlace, "  const todayStr = new Date().toISOString().split('T')[0];\n  const [fechaServicio, setFechaServicio] = useState('');");

const duplicateTarget = "  const [selectedOt, setSelectedOt] = useState<OT | null>(null);";
const parts = content.split(duplicateTarget);
if (parts.length > 2) {
  content = parts[0] + duplicateTarget + parts[1] + parts.slice(2).join(duplicateTarget);
} else {
  console.error("Duplicate selectedOt states not found via split!", parts.length);
  process.exit(1);
}

// 4. Update the myOts filter block to check userAssignments
const oldMyOtsFilter = `  // If user is Admin, Ventas or Supervisor, show all OTs assigned or let them see the full board
  const myOts = ots.filter(o => {
    if (isTechUser) {
      const isTitular = normalizeName(o.tecnicoTitular) === normalizedCurrentUser || o.tecnicoTitularId === currentUser?.id;
      const isApoyoArr = (o.tecnicosAdicionalesIds || []).includes(currentUser?.id || '') || 
                         (o.tecnicosAdicionalesNombres || []).map(n => normalizeName(n)).includes(normalizedCurrentUser);
      const isApoyoLegacy = normalizeName(o.tecnicoApoyo) === normalizedCurrentUser;
      
      return isTitular || isApoyoArr || isApoyoLegacy;
    }
    // Para roles administrativos, mostrar todas las OTs programadas o en proceso para pruebas
    return o.estado !== OTStatus.CREADA && o.estado !== OTStatus.PENDIENTE_PROGRAMACION;
  });`;

const newMyOtsFilter = `  // If user is Admin, Ventas or Supervisor, show all OTs assigned or let them see the full board
  const myOts = ots.filter(o => {
    if (isTechUser) {
      const isTitular = normalizeName(o.tecnicoTitular) === normalizedCurrentUser || o.tecnicoTitularId === currentUser?.id;
      const isApoyoArr = (o.tecnicosAdicionalesIds || []).includes(currentUser?.id || '') || 
                         (o.tecnicosAdicionalesNombres || []).map(n => normalizeName(n)).includes(normalizedCurrentUser);
      const isApoyoLegacy = normalizeName(o.tecnicoApoyo) === normalizedCurrentUser;
      const hasEquipmentAsg = userAssignments.some(a => a.otId === o.id);
      
      return isTitular || isApoyoArr || isApoyoLegacy || hasEquipmentAsg;
    }
    // Para roles administrativos, mostrar todas las OTs programadas o en proceso para pruebas
    return o.estado !== OTStatus.CREADA && o.estado !== OTStatus.PENDIENTE_PROGRAMACION;
  });`;

content = content.replace(oldMyOtsFilter, newMyOtsFilter);

// 5. Replace saveActiveDraft and auto-save useEffect using robust index search
const saveDraftIndex = content.indexOf("saveActiveDraft =");
const saveDraftStartIndex = content.lastIndexOf('\n', saveDraftIndex) + 1;
const prefillIndex = content.indexOf("const handlePrefillAllWithMafortDefaults =");

if (saveDraftStartIndex === 0 || saveDraftIndex === -1 || prefillIndex === -1) {
  console.error("Save draft or prefill markers not found!", saveDraftStartIndex, prefillIndex);
  process.exit(1);
}

const beforeSaveDraft = content.substring(0, saveDraftStartIndex);
const afterSelectOt = content.substring(prefillIndex);

const saveDraftReplacement = `  const saveActiveDraft = (showNotification = false) => {
    if (!selectedOt || !selectedEquipoId) return;

    const draft = {
      informeN,
      hojaServicioN,
      asunto,
      fechaServicio,
      horaInicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasos: {
        paso1,
        paso1_si_no,
        paso1_funcionamiento,
        paso1_bypass,
        paso2,
        paso3,
        paso4,
        paso5,
        paso6,
        paso6_concluido,
        paso6_observaciones
      },
      caracteristicas,
      medicionesEntrada,
      medicionesSalida,
      diagnosticoGabinete: {
        cuentaConGabinete,
        tipoEstructura,
        equipoEnBypass
      },
      revisionNormas: {
        mantenimientoRealizado: true,
        anioBaterias,
        ambienteHermetico: true,
        temperaturaSala,
        estadoOperativo,
        inversorOperandoPorcentaje
      },
      recomendaciones,
      fotosLabeled
    };
    localStorage.setItem(\`ot_draft_\${selectedOt.id}_\${selectedEquipoId}\`, JSON.stringify(draft));
    if (showNotification) {
      alert("Borrador de equipo guardado localmente.");
      setTimeout(() => setDraftLoadedMessage(null), 3000);
    }
  };

  // Auto-save draft on form state changes per equipment
  useEffect(() => {
    if (!selectedOt || !selectedEquipoId || !isEditingReport) return;

    const timer = setTimeout(() => {
      const draft = {
        informeN,
        hojaServicioN,
        asunto,
        fechaServicio,
        horaInicio,
        tecnico1,
        tecnico2,
        antecedentes,
        accionesRealizadas,
        pasos: {
          paso1,
          paso1_si_no,
          paso1_funcionamiento,
          paso1_bypass,
          paso2,
          paso3,
          paso4,
          paso5,
          paso6,
          paso6_concluido,
          paso6_observaciones
        },
        caracteristicas,
        medicionesEntrada,
        medicionesSalida,
        diagnosticoGabinete: {
          cuentaConGabinete,
          tipoEstructura,
          equipoEnBypass
        },
        revisionNormas: {
          mantenimientoRealizado: true,
          anioBaterias,
          ambienteHermetico: true,
          temperaturaSala,
          estadoOperativo,
          inversorOperandoPorcentaje
        },
        recomendaciones,
        fotosLabeled
      };
      localStorage.setItem(\`ot_draft_\${selectedOt.id}_\${selectedEquipoId}\`, JSON.stringify(draft));
    }, 1500); // 1.5s debounce to avoid spamming localStorage
    
    return () => clearTimeout(timer);
  }, [
    selectedOt, selectedEquipoId, informeN, hojaServicioN, asunto, fechaServicio, horaInicio,
    tecnico1, tecnico2, antecedentes, accionesRealizadas,
    paso1, paso1_si_no, paso1_funcionamiento, paso1_bypass,
    paso2, paso3, paso4, paso5, paso6, paso6_concluido, paso6_observaciones,
    caracteristicas, fotosLabeled, medicionesEntrada, medicionesSalida,
    cuentaConGabinete, tipoEstructura, equipoEnBypass,
    anioBaterias, temperaturaSala, estadoOperativo, inversorOperandoPorcentaje,
    recomendaciones, isEditingReport
  ]);

  const handleSelectOt = (ot: OT) => {
    setSelectedOt(ot);
    setIsEditingReport(false);
    setSelectedEquipoId(null);
  };

  const loadReportOrCreate = (ot, eqId) => {
    const existing = reports.find(r => r.otId === ot.id && r.equipoId === eqId);

    if (existing) {
      setInformeN(existing.informeN || \`INF-\...ot.id.replace('OT-', '')}\`);
      setHojaServicioN(existing.hojaServicioN || '');
      setAsunto(existing.asunto || '');
      setFechaServicio(existing.fechaServicio || todayStr);
      setHoraInicio(existing.horaInicio || '09:00 AM');
      setTecnico1(existing.tecnico1 || mockTechName);
      setTecnico2(existing.tecnico2 || 'Ninguno');
      setAntecedentes(existing.antecedentes || '');
      setAccionesRealizadas(existing.accionesRealizadas || []);
      
      if (existing.pasos) {
        const p = existing.pasos;
        setPaso1(p.paso1 || '');
        setPaso1_si_no(p.paso1_si_no || 'si');
        setPaso1_funcionamiento(p.paso1_funcionamiento || 'modo inversor');
        setPaso1_bypass(p.paso1_bypass || 'no');
        setPaso2(p.paso2 || '');
        setPaso3(p.paso3 || '');
        setPaso4(p.paso4 || '');
        setPaso5(p.paso5 || '');
        setPaso6(p.paso6 || '');
        setPaso6_concluido(p.paso6_concluido || 'si');
        setPaso6_observaciones(p.paso6_observaciones || '');
      }
      
      setCaracteristicas(existing.caracteristicas || {});
      setMedicionesEntrada(existing.medicionesEntrada || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });
      setMedicionesSalida(existing.medicionesSalida || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });
      
      setCuentaConGabinete(existing.diagnosticoGabinete?.cuentaConGabinete || 'si');
      setTipoEstructura(existing.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
      setEquipoEnBypass(existing.diagnosticoGabinete?.equipoEnBypass || 'no');
      setAnioBaterias(existing.revisionNormas?.anioBaterias || 2022);
      setTemperaturaSala(existing.revisionNormas?.temperaturaSala || 21);
      setEstadoOperativo(existing.revisionNormas?.estadoOperativo !== undefined ? existing.revisionNormas.estadoOperativo : true);
      setInversorOperandoPorcentaje(existing.revisionNormas?.inversorOperandoPorcentaje || 30);
      setRecomendaciones(existing.recomendaciones || []);
      setFotosLabeled(existing.fotosLabeled || []);
    } else {
      const saved = localStorage.getItem(\`ot_draft_\${ot.id}_\${eqId}\`);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setInformeN(draft.informeN || \`INF-\${ot.id.replace('OT-', '')}\`);
          setHojaServicioN(draft.hojaServicioN || '');
          setAsunto(draft.asunto || '');
          setFechaServicio(draft.fechaServicio || todayStr);
          setHoraInicio(draft.horaInicio || '09:00 AM');
          setTecnico1(draft.tecnico1 || mockTechName);
          setTecnico2(draft.tecnico2 || 'Ninguno');
          setAntecedentes(draft.antecedentes || '');
          setAccionesRealizadas(draft.accionesRealizadas || []);
          
          if (draft.pasos) {
            setPaso1(draft.pasos.paso1 || '');
            setPaso1_si_no(draft.pasos.paso1_si_no || 'si');
            setPaso1_funcionamiento(draft.pasos.paso1_funcionamiento || 'modo inversor');
            setPaso1_bypass(draft.pasos.paso1_bypass || 'no');
            setPaso2(draft.pasos.paso2 || '');
            setPaso3(draft.pasos.paso3 || '');
            setPaso4(draft.pasos.paso4 || '');
            setPaso5(draft.pasos.paso5 || '');
            setPaso6(draft.pasos.paso6 || '');
            setPaso6_concluido(draft.pasos.paso6_concluido || 'si');
            setPaso6_observaciones(draft.pasos.paso6_observaciones || '');
          }
          
          setCaracteristicas(draft.caracteristicas || {});
          setMedicionesEntrada(draft.medicionesEntrada || {
            lnVoltaje: ["220", "220", "220"],
            lnIntensidad: ["0", "0", "0"],
            frecuencia: ["60.0", "60.0", "60.0"],
            llVoltaje: ["380", "380", "380"]
          });
          setMedicionesSalida(draft.medicionesSalida || {
            lnVoltaje: ["220", "220", "220"],
            lnIntensidad: ["0", "0", "0"],
            frecuencia: ["60.0", "60.0", "60.0"],
            llVoltaje: ["380", "380", "380"]
          });
          
          setCuentaConGabinete(draft.diagnosticoGabinete?.cuentaConGabinete || 'si');
          setTipoEstructura(draft.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
          setEquipoEnBypass(draft.diagnosticoGabinete?.equipoEnBypass || 'no');
          setAnioBaterias(draft.revisionNormas?.anioBaterias || 2022);
          setTemperaturaSala(draft.revisionNormas?.temperaturaSala || 21);
          setEstadoOperativo(draft.revisionNormas?.estadoOperativo !== undefined ? draft.revisionNormas.estadoOperativo : true);
          setInversorOperandoPorcentaje(draft.revisionNormas?.inversorOperandoPorcentaje || 30);
          setRecomendaciones(draft.recomendaciones || []);
          setFotosLabeled(draft.fotosLabeled || []);
          
          setDraftLoadedMessage("Borrador de equipo cargado automáticamente.");
          setTimeout(() => setDraftLoadedMessage(null), 3000);
          return;
        } catch (err) {
          console.error("Error parsing saved draft", err);
        }
      }

      // Default fallback
      let matchingEq = null;
      // Find matching equipment by scanning all clients' equipments if catalog is populated
      const allClientsEquipos = clients.flatMap(c => (c as any).equipos || []);
      const foundEq = equipos.find(eq => eq.id === eqId) || allClientsEquipos.find(eq => eq.id === eqId);
      matchingEq = foundEq;

      const client = clients.find(c => c.id === ot.clientId);
      const defaultReport = generateDefaultReport(ot, client || {} as any);
      
      // customize defaultReport for the specific equipment
      defaultReport.equipoId = eqId;
      if (matchingEq) {
        defaultReport.caracteristicas = {
          "Marca": matchingEq.marca || "N/A",
          "Modelo": matchingEq.modelo || "N/A",
          "N° Serie": matchingEq.serie || "N/A"
        };
      }

      setInformeN(defaultReport.informeN || \`INF-\${ot.id.replace('OT-', '')}\`);
      setHojaServicioN(defaultReport.hojaServicioN || '');
      setAsunto(defaultReport.asunto || '');
      setFechaServicio(defaultReport.fechaServicio || todayStr);
      setHoraInicio(defaultReport.horaInicio || '09:00 AM');
      setTecnico1(mockTechName);
      setTecnico2((ot.tecnicosAdicionalesNombres && ot.tecnicosAdicionalesNombres[0]) || 'Ninguno');
      setAntecedentes(defaultReport.antecedentes || '');
      setAccionesRealizadas(defaultReport.accionesRealizadas || []);
      
      if (defaultReport.pasos) {
        setPaso1(defaultReport.pasos.paso1 || '');
        setPaso1_si_no(defaultReport.pasos.paso1_si_no || 'si');
        setPaso1_funcionamiento(defaultReport.pasos.paso1_funcionamiento || 'modo inversor');
        setPaso1_bypass(defaultReport.pasos.paso1_bypass || 'no');
        setPaso2(defaultReport.pasos.paso2 || '');
        setPaso3(defaultReport.pasos.paso3 || '');
        setPaso4(defaultReport.pasos.paso4 || '');
        setPaso5(defaultReport.pasos.paso5 || '');
        setPaso6(defaultReport.pasos.paso6 || '');
        setPaso6_concluido(defaultReport.pasos.paso6_concluido || 'si');
        setPaso6_observaciones(defaultReport.pasos.paso6_observaciones || '');
      }

      setCaracteristicas(defaultReport.caracteristicas || {});
      setMedicionesEntrada(defaultReport.medicionesEntrada || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });
      setMedicionesSalida(defaultReport.medicionesSalida || {
        lnVoltaje: ["220", "220", "220"],
        lnIntensidad: ["0", "0", "0"],
        frecuencia: ["60.0", "60.0", "60.0"],
        llVoltaje: ["380", "380", "380"]
      });

      setCuentaConGabinete(defaultReport.diagnosticoGabinete?.cuentaConGabinete || 'si');
      setTipoEstructura(defaultReport.diagnosticoGabinete?.tipoEstructura || 'modo Rack');
      setEquipoEnBypass(defaultReport.diagnosticoGabinete?.equipoEnBypass || 'no');
      setAnioBaterias(defaultReport.revisionNormas?.anioBaterias || 2022);
      setTemperaturaSala(defaultReport.revisionNormas?.temperaturaSala || 21);
      setEstadoOperativo(defaultReport.revisionNormas?.estadoOperativo !== undefined ? defaultReport.revisionNormas.estadoOperativo : true);
      setInversorOperandoPorcentaje(defaultReport.revisionNormas?.inversorOperandoPorcentaje || 30);
      setRecomendaciones(defaultReport.recomendaciones || []);

      const kva = matchingEq?.potenciaKva || ot.potenciaKva;
      const slots = getPhotoSlotsForKva(kva);
      setFotosLabeled(slots.map(s => ({ slotName: s, base64: '', description: \`Verificación: \${s}\` })));
    }

    if (ot.estado === OTStatus.PROGRAMADA || ot.estado === OTStatus.OBSERVADA) {
      onUpdateOtStatus(ot.id, OTStatus.TRABAJO_EN_EJECUCION);
    }
  };

`;

content = beforeSaveDraft + saveDraftReplacement + afterSelectOt;

// 6. Replace handleSubmitReport (starts around index 24396 in clean file)
const submitTarget = "handleSubmitReport =";
const submitStartIndex = content.lastIndexOf('\n', content.indexOf(submitTarget)) + 1;
const returnIndex = content.indexOf("return (", submitStartIndex);

if (submitStartIndex === 0 || returnIndex === -1) {
  console.error("Submit report or return statement markers not found!", submitStartIndex, returnIndex);
  process.exit(1);
}

const beforeSubmitReport = content.substring(0, submitStartIndex);
const afterSubmitReport = content.substring(returnIndex);

const handleSubmitReplacement = `  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOt || !selectedEquipoId) return;

    // Check if there are empty photo slots
    const missingPhotos = fotosLabeled.filter(f => !f.base64);
    if (missingPhotos.length > 0) {
      alert(\`⚠️ ERROR DE COBERTURA CONTRACTUAL S.L.A:\\n\\nSe requieren exactamente \${fotosLabeled.length} fotografías con la alineación y encuadre correspondientes. Aún le faltan ingresar \${missingPhotos.length} fotos. Cárguelas o autocomplételas antes de guardar.\`);
      return;
    }

    const compiledReport: TechnicalReport = {
      id: \`rep_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      otId: selectedOt.id,
      equipoId: selectedEquipoId,
      voltajeEntrada: parseFloat(medicionesEntrada.lnVoltaje[0]) || 220,
      voltajeSalida: parseFloat(medicionesSalida.lnVoltaje[0]) || 220,
      indicadoresBateria: {
        nivelCarga: inversorOperandoPorcentaje,
        temperaturaC: temperaturaSala,
        estadoCeldas: estadoOperativo ? 'Optimo' : 'Critico',
        bypassActivo: equipoEnBypass === 'si'
      },
      observacionesDiagnostico: paso6_concluido === 'si' ? 'Mantenimiento preventivo S.L.A concluido en modo inversor.' : paso6_observaciones,
      comentariosAdicionales: antecedentes.substring(0, 200),
      fotos: fotosLabeled.map(f => f.base64),
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),

      informeN,
      hojaServicioN,
      asunto,
      fechaServicio,
      horaInicio,
      tecnico1,
      tecnico2,
      antecedentes,
      accionesRealizadas,
      pasos: {
        paso1,
        paso1_si_no,
        paso1_funcionamiento,
        paso1_bypass,
        paso2,
        paso3,
        paso4,
        paso5,
        paso6,
        paso6_concluido,
        paso6_observaciones
      },
      caracteristicas,
      fotosLabeled,
      medicionesEntrada,
      medicionesSalida,
      diagnosticoGabinete: {
        cuentaConGabinete,
        tipoEstructura,
        equipoEnBypass
      },
      revisionNormas: {
        mantenimientoRealizado: true,
        anioBaterias,
        ambienteHermetico: true,
        temperaturaSala,
        estadoOperativo,
        inversorOperandoPorcentaje
      },
      recomendaciones
    };

    if (!isOnline) {
      compiledReport.offlineDirty = true;
      onSaveReportOffline(compiledReport);
      alert("Reporte guardado localmente en modo Offline.");
      setIsEditingReport(false);
      setSelectedEquipoId(null);
      return;
    }

    try {
      const response = await fetch('/api/technical-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compiledReport),
      });

      if (response.ok) {
        localStorage.removeItem(\`ot_draft_\${selectedOt.id}_\${selectedEquipoId}\`);
        
        // Add compiled report to local list or let parent fetch it
        if (reports) {
          reports.push(compiledReport);
        }

        // Check if all equipments of the OT are now reported
        const otherEqIds = otEquipoIds.filter(id => id !== selectedEquipoId);
        const allCompleted = otherEqIds.every(id => 
          reports.some(r => r.otId === selectedOt.id && r.equipoId === id)
        );

        if (allCompleted) {
          onUpdateOtStatus(selectedOt.id, OTStatus.CONCLUIDA);
          alert("✅ Reporte enviado. Todos los equipos de la OT están completados. La OT ha sido enviada al supervisor.");
        } else {
          alert("✅ Reporte de equipo enviado exitosamente. Aún quedan equipos pendientes en esta OT.");
        }
        
        setIsEditingReport(false);
        setSelectedEquipoId(null);
      } else {
        const errorData = await response.json();
        alert(\`Error al guardar reporte: \${errorData.error || 'Intente nuevamente'}\`);
      }
    } catch (error) {
      console.error("Network error saving report:", error);
      alert("Error de red. Guardando reporte localmente.");
      compiledReport.offlineDirty = true;
      onSaveReportOffline(compiledReport);
      setIsEditingReport(false);
      setSelectedEquipoId(null);
    }
  };

`;

content = beforeSubmitReport + handleSubmitReplacement + afterSubmitReport;

// 7. Update UI: insert fieldset disabled wrapper around scrollable form
const targetDivStr = '<div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">';
const newDivStr = '<div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">\n              <fieldset disabled={selectedOt?.estado === OTStatus.EN_REVISION || selectedOt?.estado === OTStatus.CONCLUIDA} className="space-y-8">';

content = content.replace(targetDivStr, newDivStr);

const targetEndDivStr = '            </div>\n\n            {/* Offline notification banner & submission */}';
const newEndDivStr = '              </fieldset>\n            </div>\n\n            {/* Offline notification banner & submission */}';

content = content.replace(targetEndDivStr, newEndDivStr);

// 8. Replace ACTION CARD button list inside the detail view using targetButtonsBlock
const targetButtonsBlock = `                      {selectedOt.estado === OTStatus.PROGRAMADA ? (
                        <button
                          type="button"
                          onClick={() => handleArriveAtLocation(selectedOt.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                        >
                          <Navigation size={16} />
                          <span>Iniciar Trabajo (Llegada a Local)</span>
                        </button>
                      ) : selectedOt.estado === OTStatus.TRABAJO_EN_EJECUCION ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingReport(true)}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95 animate-pulse"
                        >
                          <FileEdit size={16} />
                          <span>Llenar Informe Técnico</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full bg-slate-800 text-slate-500 border border-slate-700/50 font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2"
                        >
                          <span>Reporte Enviado / OT Concluida</span>
                        </button>
                      )}`;

const replacementButtonsBlock = `                      {selectedOt.estado === OTStatus.PROGRAMADA ? (
                        <button
                          type="button"
                          onClick={() => handleArriveAtLocation(selectedOt.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer active:scale-95"
                        >
                          <Navigation size={16} />
                          <span>Iniciar Trabajo (Llegada a Local)</span>
                        </button>
                      ) : (
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
                                            : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
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
                                      estado: allCompleted ? OTStatus.CONCLUIDA : OTStatus.TRABAJO_EN_EJECUCION,
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
                      )}`;

content = content.replace(targetButtonsBlock, replacementButtonsBlock);

// 9. Fix the typo in the default prefill replace string `INF-\...ot.id` by matching actual content
content = content.replace("`INF-\\...ot.id.replace('OT-', '')}`", "`INF-\${ot.id.replace('OT-', '')}`");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched TecnicoView.tsx final");
process.exit(0);
