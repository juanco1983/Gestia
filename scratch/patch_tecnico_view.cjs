const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF for easy replacement
content = content.replace(/\r\n/g, '\n');

const startMarker = "  const saveActiveDraft = (showNotification = false) => {";
const endMarker = "    localStorage.removeItem(`mafort_draft_${selectedOt.id}`);\n    setSelectedOt(null);\n  };";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found! startIndex:", startIndex, "endIndex:", endIndex);
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + endMarker.length);

const replacement = `  const saveActiveDraft = (showNotification = false) => {
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
      cuentaConGabinete,
      tipoEstructura,
      equipoEnBypass,
      anioBaterias,
      temperaturaSala,
      estadoOperativo,
      inversorOperandoPorcentaje,
      recomendaciones,
      fotosLabeled
    };
    localStorage.setItem(\`ot_draft_\${selectedOt.id}_\${selectedEquipoId}\`, JSON.stringify(draft));
    if (showNotification) {
      alert("Borrador de equipo guardado localmente.");
      setTimeout(() => setDraftLoadedMessage(null), 3000);
    }
  };

  const loadReportOrCreate = (ot, eqId) => {
    const existing = reports.find(r => r.otId === ot.id && r.equipoId === eqId);

    if (existing) {
      setInformeN(existing.informeN || \`INF-\${ot.id.replace('OT-', '')}\`);
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
      
      setCuentaConGabinete(existing.cuentaConGabinete || 'si');
      setTipoEstructura(existing.tipoEstructura || 'modo Rack');
      setEquipoEnBypass(existing.equipoEnBypass || 'no');
      setAnioBaterias(existing.anioBaterias || 2022);
      setTemperaturaSala(existing.temperaturaSala || 21);
      setEstadoOperativo(existing.estadoOperativo !== undefined ? existing.estadoOperativo : true);
      setInversorOperandoPorcentaje(existing.inversorOperandoPorcentaje || 30);
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
          
          setCuentaConGabinete(draft.cuentaConGabinete || 'si');
          setTipoEstructura(draft.tipoEstructura || 'modo Rack');
          setEquipoEnBypass(draft.equipoEnBypass || 'no');
          setAnioBaterias(draft.anioBaterias || 2022);
          setTemperaturaSala(draft.temperaturaSala || 21);
          setEstadoOperativo(draft.estadoOperativo !== undefined ? draft.estadoOperativo : true);
          setInversorOperandoPorcentaje(draft.inversorOperandoPorcentaje || 30);
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
      clients.forEach(c => {
        if (c.equipos) {
          const found = c.equipos.find(eq => eq.id === eqId);
          if (found) matchingEq = found;
        }
      });

      const defaultReport = generateDefaultReport(
        ot.id,
        eqId,
        matchingEq?.tipo || 'UPS',
        matchingEq?.especificaciones?.potenciaKva || matchingEq?.potenciaKva || 3,
        mockTechName
      );

      setInformeN(\`INF-\${ot.id.replace('OT-', '')}\`);
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

      setCuentaConGabinete(defaultReport.cuentaConGabinete || 'si');
      setTipoEstructura(defaultReport.tipoEstructura || 'modo Rack');
      setEquipoEnBypass(defaultReport.equipoEnBypass || 'no');
      setAnioBaterias(defaultReport.anioBaterias || 2022);
      setTemperaturaSala(defaultReport.temperaturaSala || 21);
      setEstadoOperativo(defaultReport.estadoOperativo !== undefined ? defaultReport.estadoOperativo : true);
      setInversorOperandoPorcentaje(defaultReport.inversorOperandoPorcentaje || 30);
      setRecomendaciones(defaultReport.recomendaciones || []);

      const kva = matchingEq?.especificaciones?.potenciaKva || matchingEq?.potenciaKva || 3;
      const slots = getPhotoSlotsForKva(kva);
      setFotosLabeled(slots.map(s => ({ slotName: s, base64: '', description: '' })));
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedOt || !selectedEquipoId) return;

    // Check if there are empty photo slots
    const missingPhotos = fotosLabeled.filter(f => !f.base64);
    if (missingPhotos.length > 0) {
      alert(\`⚠️ ERROR DE COBERTURA CONTRACTUAL S.L.A:\\n\\nSe requieren exactamente \${fotosLabeled.length} fotografías con la alineación y encuadre correspondientes. Aún le faltan ingresar \${missingPhotos.length} fotos. Cárguelas o autocomplételas antes de guardar.\`);
      return;
    }

    const reportPayload = {
      otId: selectedOt.id,
      equipoId: selectedEquipoId,
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
      cuentaConGabinete,
      tipoEstructura,
      equipoEnBypass,
      anioBaterias,
      temperaturaSala,
      estadoOperativo,
      inversorOperandoPorcentaje,
      recomendaciones,
      fotosLabeled
    };

    if (!isOnline) {
      onSaveReportOffline(reportPayload);
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
        body: JSON.stringify(reportPayload),
      });

      if (response.ok) {
        localStorage.removeItem(\`ot_draft_\${selectedOt.id}_\${selectedEquipoId}\`);
        
        // Check if all equipments of the OT are now reported
        const otherEqIds = otEquipoIds.filter(id => id !== selectedEquipoId);
        const allCompleted = otherEqIds.every(id => 
          reports.some(r => r.otId === selectedOt.id && r.equipoId === id)
        );

        if (allCompleted) {
          onUpdateOtStatus(selectedOt.id, OTStatus.EN_REVISION);
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
      onSaveReportOffline(reportPayload);
      setIsEditingReport(false);
      setSelectedEquipoId(null);
    }
  };`;

fs.writeFileSync(filePath, before + replacement + after, 'utf8');
console.log("Successfully patched TecnicoView.tsx");
