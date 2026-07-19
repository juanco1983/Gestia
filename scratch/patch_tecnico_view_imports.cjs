const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update React imports
const oldReactImport = "import React, { useState, useEffect } from 'react';";
const newReactImport = "import React, { useState, useEffect, useMemo } from 'react';";
content = content.replace(oldReactImport, newReactImport);

// 2. Update types imports
const oldTypesImport = "import { OT, OTStatus, EquipmentType, ServiceType, TechnicalReport, Client, User } from '../types';";
const newTypesImport = "import { OT, OTStatus, EquipmentType, ServiceType, TechnicalReport, Client, User, Equipo } from '../types';";
content = content.replace(oldTypesImport, newTypesImport);

// 3. Replace state definitions and myOts filter
const targetSegmentStart = "  const normalizedCurrentUser = normalizeName(mockTechName);\n  \n  // If user is Admin, Ventas or Supervisor, show all OTs assigned or let them see the full board\n  const myOts = ots.filter(o => {\n    if (isTechUser) {\n      const isTitular = normalizeName(o.tecnicoTitular) === normalizedCurrentUser || o.tecnicoTitularId === currentUser?.id;\n      const isApoyoArr = (o.tecnicosAdicionalesIds || []).includes(currentUser?.id || '') || \n                         (o.tecnicosAdicionalesNombres || []).map(n => normalizeName(n)).includes(normalizedCurrentUser);\n      const isApoyoLegacy = normalizeName(o.tecnicoApoyo) === normalizedCurrentUser;\n      \n      return isTitular || isApoyoArr || isApoyoLegacy;\n    }\n    // Para roles administrativos, mostrar todas las OTs programadas o en proceso para pruebas\n    return o.estado !== OTStatus.CREADA && o.estado !== OTStatus.PENDIENTE_PROGRAMACION;\n  });";

const replacementSegment = `  const normalizedCurrentUser = normalizeName(mockTechName);

  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [userAssignments, setUserAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.id) {
      fetch('/api/ot-equipo-asignaciones')
        .then(res => res.json())
        .then(data => {
          const myAsgs = data.filter(a => a.tecnicoId === currentUser.id);
          setUserAssignments(myAsgs);
        })
        .catch(err => console.error("Error fetching user assignments:", err));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedOt?.clientId) {
      fetch(\`/api/clients/\${selectedOt.clientId}/equipos\`)
        .then(res => res.json())
        .then(data => setEquipos(data))
        .catch(err => console.error("Error fetching client equipments:", err));
    }
  }, [selectedOt?.clientId]);

  useEffect(() => {
    if (selectedOt?.id) {
      fetch(\`/api/ot-equipo-asignaciones?otId=\${selectedOt.id}\`)
        .then(res => res.json())
        .then(data => setAsignaciones(data))
        .catch(err => console.error("Error fetching OT assignments:", err));
    }
  }, [selectedOt?.id]);

  const otEquipoIds = useMemo(() => {
    return selectedOt?.equipoId
      ? selectedOt.equipoId.split(',').map(x => x.trim()).filter(Boolean)
      : [];
  }, [selectedOt?.equipoId]);

  // If user is Admin, Ventas or Supervisor, show all OTs assigned or let them see the full board
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

const index = content.indexOf(targetSegmentStart);
if (index === -1) {
  console.error("Target segment for state / filter not found!");
  process.exit(1);
}

content = content.replace(targetSegmentStart, replacementSegment);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated imports and states in TecnicoView.tsx");
