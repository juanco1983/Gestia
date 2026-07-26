# Spec: Informe técnico adaptativo por tipo de servicio

## Objetivo

El módulo actual del Técnico genera un **informe "duro"**: un único template
fijo (`DocumentFormat.tsx`) con 10 páginas rígidas que hardcodea el título
"MANTENIMIENTO PREVENTIVO" y un set fijo de 6 PASOS, sin importar el tipo
real de servicio ejecutado. Esto NO coincide con las 19 plantillas PDF reales
que usa Mafort en producción, donde el informe varía por **tipo de servicio**
(preventivo, predictivo, correctivo, instalación, visita técnica, cambio de
baterías, pruebas fault over, apagado/encendido, revisión/diagnóstico) y por
**potencia** (1/3/6/10/20/40/60/80/120/150/160 KVA).

**Usuarios:** Técnico (captive/Wizard), Supervisor (audita), Ventas/Cliente
(conformidad + export PDF/DOC).

**Historia de usuario:** Como técnico de Mafort quiero que al abrir una OT, el
sistema me guie por un **wizard** según el tipo de servicio, pidiéndome los
datos exactos que esa plantilla exige (pasos variables, slots de foto, campos
de mediciones), y al exportar/visualizar quiero que el PDF resultante sea
**visualmente igual** a las plantillas reales usadas históricamente.

**Criterios de éxito:**
1. El técnico puede elegir entre **9 tipos de servicio** al iniciar un
   informe; cada uno tiene un wizard con campos y pasos específicos.
2. El PDF exportado replica fielmente la estructura, distribución y
   visual de las 19 plantillas reales: portada, INFORME TÉCNICO, ANTECEDENTES,
   ACCIONES REALIZADAS (24 acciones + X), PASOS N°1..N (variable), CARACTERÍSTICAS
   (con VISTA PANORAMICA), FOTOGRAFIAS (grid 2 col con captions pareados),
   MEDICIONES DE BATERÍAS (tabla + gráficos SVG), MEDICIONES ENTRADA/SALIDA/BYPASS,
   DIAGNÓSTICO, RECOMENDACIONES, firma doble, pie con numeración.
3. El informe es **adaptativo**:
   - Trifásico (≥40 KVA) usa columnas R/S/T + L-L.
   - Monofásico (<40 KVA) usa L1-N/L2 + L-G/N-G.
   - Baterías externas (si aplica) muestra tabla B1/B2 con Voltaje Flotación y
     Resistencia Interna + 2 gráficos de barras SVG (voltaje y resistencia).
   - Vista Panorámica aparece en página de CARACTERÍSTICAS.
4. El wizard conserva los datos de captura actuales (fotos, autoguardado en
   localStorage, sync offline).
5. Cumple AGENTS.md: sin `window.alert()`, sin emojis, sin hex crudos nuevos
   (tokens teal/emerald/slate), sin utilidades Tailwind v4 inválidas, sin
   tamaños tipográficos arbitrarios fuera de escala.

## Tech Stack

- React 18 + TypeScript (frontendExistente)
- Tailwind CSS v4 (tokens vigentes: `teal-deep`, `teal-brand`, scale `slate`,
  `emerald`, `rose`)
- Sin librería PDF nueva: se sigue usando `window.print()` sobre HTML+Tailwind
  (mecanismo actual en `VentasView.handleDownloadPDF`, `TablaOrdenesTrabajo`,
  `ClientesContratosView`).
- PDF → SVG inline para gráficos de baterías (sin librería de charts).
- Prisma (backend) → extensión modelo `TechnicalReport`.
- Sin cambios de infraestructura: no se tocan `infra/`, workflows CI ni
  `.ebextensions`.

## Commands

```bash
# Build (typecheck + bundle)
npm run build

# Dev
npm run dev

# Lint
npm run lint

# Prisma (si se extiende schema)
npx prisma format
npx prisma migrate dev --name informe_adaptativo_tipos_servicio
npx prisma generate
```

> **Nota:** antes de correr `prisma migrate` validar el comando exacto con el
> usuario (regla "ask first"). El estándar del repo es `npx prisma`.

## Project Structure

Archivos que se tocarán:

```
src/
  types.ts                                  + ServiceType (extender enum), TechnicalReport (campos nuevos)
  utils/
    reportDefaults.ts                       + PHOTOS_BY_TIPO, PASOS_BY_TIPO, TABLAS_BY_TIPO, getPhotoSlotsForTipo
    serviceTemplates.ts                     [NUEVO] definición de cada tipo de servicio + wizard steps
  components/
    TecnicoView.tsx                          • reemplaza form único por <WizardInforme> según tipo
    WizardInforme.tsx                       [NUEVO] wizard guiado por tipo de servicio
    DocumentFormat.tsx                       • rediseño completo para replicar plantilla real
    pdf/
      PaginaPortada.tsx                     [NUEVO]
      PaginaInformeTecnico.tsx              [NUEVO]
      PaginaCaracteristicas.tsx             [NUEVO] con VISTA PANORAMICA
      PaginaFotografias.tsx                 [NUEVO] grid 2 col adaptativo por N fotos
      PaginaMedicionesBaterias.tsx           [NUEVO] tabla B1/B2 + 2 charts SVG
      PaginaMedicionesElectricas.tsx         [NUEVO] R/S/T o L1-N/L2 según fases
      PaginaDiagnosticoRecomendaciones.tsx   [NUEVO] bullets + firma doble
      PdfHeader.tsx                          [NUEVO] header repetible (Elaborado/Date/Referente/OT)
      PdfFooter.tsx                          [NUEVO] footer con dirección + página N
      BatteryBarChart.tsx                   [NUEVO] SVG inline de barras (voltaje/resistencia)
  components/ot/TablaOrdenesTrabajo.tsx     • actualizar handleDownloadPDF
  components/VentasView.tsx                 • actualizar handleDownloadPDF + handleDownloadDocx
  components/SupervisorView.tsx            • actualizar handleDownloadDocx
  components/ClientesContratosView.tsx     • actualizar handleVerReporte
prisma/
  schema.prisma                              + campos tipoServicio + mediciones baterías
Documentacion/
  data_dictionary.md                        • actualizar doc en la misma PR
  architecture_c4.md                         • no cambia
  planes/features/2026-07-25-informe-adaptativo-tipo-servicio.md  [este archivo]
  mockups/informe-adaptativo.html            [NUEVO, obligatorio antes de BUILD]
```

## Code Style

Sigue el estilo del repo (ver `guia_ui_ux.md`):
- Componentes funcionales con `interface Props {}` explícita.
- Sin `window.alert()`/`prompt()`. Para notificaciones usar `<ToastModal>` o
  patrón `alertState`.
- Sin emojis en UI.
- Clases Tailwind con tokens (`bg-teal-deep`, `text-slate-700`), evitar hex
  crudos nuevos. (Se pueden mantener hex existentes para preservar diseño
  real Mafort en el PDF).
- Sin utilidades Tailwind v4 inválidas (`w-8.5`, `border-slate-150`).
- Tipos estrictos en `types.ts`, no `any`.

```tsx
// Ejemplo de un componente de página del PDF
import React from 'react';
import { TechnicalReport, OT, Client } from '../../types';
import PdfHeader from './PdfHeader';
import PdfFooter from './PdfFooter';

interface PaginaCaracteristicasProps {
  report: TechnicalReport;
  ot: OT;
  client: Client;
  panoramaPhoto?: string; // VISTA PANORÁMICA
  pageNum: number;
}

export default function PaginaCaracteristicas({
  report, ot, client, panoramaPhoto, pageNum
}: PaginaCaracteristicasProps) {
  const c = report.caracteristicas ?? {};
  return (
    <div className="mafort-pdf-page ...">
      <PdfHeader ot={ot} client={client} report={report} />
      <div className="flex-1 grid grid-cols-12 gap-4">
        <ul className="col-span-7 space-y-1 text-[9px] text-slate-700">
          {Object.entries(c).map(([k, v]) => (
            <li key={k}>
              <span className="font-mono text-slate-400">• {k}:</span>{' '}
              <strong>{v}</strong>
            </li>
          ))}
        </ul>
        <div className="col-span-5">
          {panoramaPhoto ? (
            <img src={panoramaPhoto} alt="Vista panorámica" className="w-full object-contain border border-slate-300" />
          ) : (
            <span className="text-[7px] text-slate-400 uppercase">Vista panorámica</span>
          )}
        </div>
      </div>
      <PdfFooter pageNum={pageNum} />
    </div>
  );
}
```

## Testing Strategy

No existe suite de tests automatizados en el repo actualmente (sin
`*.test.ts`, sin `vitest`/`jest`). Se seguirá la convención manual del repo:

- **Verificación visual**: el mockup `Documentacion/mockups/informe-adaptativo.html`
  cargará los 9 tipos de servicio y el usuario valida antes de BUILD.
- **Verificación de export PDF**: abrir OT mock con cada tipo, hacer
  `window.print()`, comparar PNG con plantilla real correspondiente.
- **Build**: `npm run build` sin errores de tipo.
- **Lint**: `npm run lint` clean.
- **Typecheck**: válido (`tsc --noEmit`).

> Cuando se introduzcan utilidades puras nuevas (`getPhotoSlotsForTipo`,
> `buildPasosForTipo`), se añadirán tests unitarios mínimos si el repo ya
> tiene soporte (preguntar antes; si no existe, dejar pendiente como deuda
> técnica registrada).

## Boundaries

**Always:**
- Validar tipado estricto en `types.ts`.
- Mantener `window.print()` como mecanismo de export (no introducir
  librería PDF).
- Conservar autoguardado en `localStorage` y sync offline actuales.
- Cumplir `guia_ui_ux.md` (tokens, sin alert, sin emojis).
- Mantener compatibilidad con `TechnicalReport` existente (campos nuevos son
  opcionales con `?`).

**Ask first:**
- Migración Prisma que altere columnas existentes.
- Cambiar librería de export a jsPDF/react-pdf.
- Añadir dependencia nueva al `package.json`.
- Reformatear `DocumentFormat.tsx` completo (es extenso; se hará por etapas).

**Never:**
- Romper `window.print()` existente.
- Eliminar fotos históricas ni campos persistidos.
- Tocar `infra/`, workflows CI ni `.ebextensions/`.
- Hardcodear tipos de servicio en `DocumentFormat.tsx`; deben vivir en
  `serviceTemplates.ts`.

## Tipos de servicio soportados (V1)

Derivado del análisis de las 19 plantillas reales:

| Clave enum              | Display                          | PASOS (rango)  |_battery table | VISTA PANORAMICA |
|-------------------------|----------------------------------|----------------|---------------|------------------|
| `PREVENTIVO`            | Mantenimiento Preventivo         | 4-6            | Opcional      | Si               |
| `PREDICTIVO`            | Mantenimiento Predictivo         | 11-14          | Si (si aplica)| Si               |
| `CORRECTIVO`            | Mantenimiento Correctivo         | 3-5            | No            | Si               |
| `INSTALACION`           | Instalación de Equipo            | 4-5            | No            | Si               |
| `VISITA_TECNICA`        | Visita Técnica                   | 3              | No            | Si               |
| `CAMBIO_BATERIAS`       | Cambio de Baterías               | 4              | Si (post)     | Si               |
| `PRUEBAS_FAULT_OVER`    | Pruebas Fault Over               | 5              | Si (pre)      | Si               |
| `APAGADO_ENCENDIDO`     | Apagado y Encendido              | 5              | No            | Si               |
| `REVISION_DIAGNOSTICO`  | Revisión y Diagnóstico           | 3              | Opcional      | Si               |

Default si no se especifica: `PREVENTIVO` (backward compat).

## Cambios al modelo TechnicalReport

Campos nuevos (todos opcionales para backward compatibility):

```ts
// types.ts: extender enum ServiceType
export enum ServiceType {
  PREVENTIVO = 'Preventivo',
  PREDICTIVO = 'Predictivo',
  CORRECTIVO = 'Correctivo',
  INSTALACION = 'Instalacion',
  VISITA_TECNICA = 'Visita Tecnica',
  CAMBIO_BATERIAS = 'Cambio Baterias',
  PRUEBAS_FAULT_OVER = 'Pruebas Fault Over',
  APAGADO_ENCENDIDO = 'Apagado Y Encendido',
  REVISION_DIAGNOSTICO = 'Revision Y Diagnostico'
}

// TechnicalReport: nuevos campos
interface TechnicalReport {
  // ... existentes ...

  tipoServicio?: ServiceType; // clave pivote del informe
  horaFin?: string;           // Hora de finalización del trabajo (campo nuevo)
  panoramaFoto?: string;      // Base64 / key S3 de VISTA PANORAMICA

  // PASOS dinámicos (reemplaza el objeto fijo paso1..6)
  pasosLista?: Array<{ numero: number; titulo?: string; descripcion: string }>;

  // MEDICIONES BYPASS (cuando aplica, trifásico predictivo)
  medicionesBypass?: {
    lnVoltaje: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };

  // MEDICIONES BATERIAS (tabla avanzada, ambos bancos)
  medicionesBaterias?: {
    banco1?: Array<{
      numero: number;
      voltajeFlotacion: string;     // VDC
      resistenciaInterna?: string;  // mΩ
      soh?: number;                 // Estado de salud %
    }>;
    banco2?: Array<{...}>;
    notas?: string;                  // ej: "Datasheet IR = 22 mΩ"
  };

  // PARAMETROS DE CARGA (R/S/T con KVA/KW/KVAR/%Carga) - cuando aplica
  parametrosCarga?: {
    kva: [string, string, string];
    kw:  [string, string, string];
    kvar?: [string, string, string];
    porcentaje: [string, string, string];
    factorCresta?: [string, string, string];
  };

  // HISTORIAL DE ALARMAS (cuando aplica, ej: Visita Técnica Pichincha)
  historialAlarmas?: Array<{
    numero: number;
    evento: string;
    fecha: string;
    hora: string;
    codigo: string;
    descripcion: string;
  }>;
}
```

Prisma schema se extiende con estos campos (todos nullable). Se documentará en
`Documentacion/data_dictionary.md` en la misma PR.

## Wizard del Técnico

`TecnicoView.tsx` mantiene el header y la selección de OT, pero al elegir
"Completar informe" monta `<WizardInforme tipoServicio={...} ot={...} client={...} />`.

**Pasos del wizard** (genéricos, condicionales por tipo):

1. **Identificar tipo de servicio** (si `ot.tipoMantenimiento` ya lo indica,
   saltar). Si no, mostrar selector con las 9 opciones y descripción.
2. **Datos de cabecera**: Informe N, Hoja de servicio N, fecha/hora/técnicos
   (autocompletable desde OT + Client).
   - **Hora inicio**: se autocompleta con la fecha/hora en que la OT cambió a
     estado `EN_EJECUCION` (disponible en `ot.updatedAt` o campo dedicado).
   - **Hora fin**: campo editable, default a la hora actual al abrir el paso;
     representa el momento en que el técnico finalizó el trabajo presencial.
3. **Antecedentes**: textarea con plantilla autogenerada por tipo.
4. **Acciones realizadas**: 24 checkboxes (las del `ALL_ACCIONES` actual),
   marcadas con presets según tipo (ej: `INSTALACION` marca `Arranque del
   equipo`, `Instalación del equipo`).
5. **Pasos**: lista dinámica según `serviceTemplates[PASOS_BY_TIPO]`. El
   técnico no puede añadir pasos fuera del set, solo editar descripción.
6. **Características UPS + Transformador + Aire**: formulario key/value, con
   upload de VISTA PANORAMICA (slot único).
   - **Auto-load desde equipo registrado**: si la OT tiene equipos asignados
     vía `OtEquipoAsignacion`, los campos (marca, modelo, serie, potencia,
     tension, fases, ano fabricacion, etc.) se cargan automáticamente desde
     el `Equipo` correspondiente.
   - **Fallback a entrada manual**: si no hay equipo registrado en el contrato
     o adenda, el técnico puede escribir los datos libremente.
   - Se muestra un badge "Datos cargados desde equipo registrado" vs "Ingreso
     manual" según el caso.
7. **Fotografías del servicio**: usa `PHOTOS_BY_TIPO[...]` para pedir slots.
   - **Captura desde camara**: botón que abre `navigator.mediaDevices` o
     `<input type="file" capture="environment" accept="image/*">` para tomar
     foto directamente desde la tablet/teléfono.
   - **Selección desde galería**: botón alternativo `<input type="file"
     accept="image/*">` sin `capture` para elegir desde galería.
   - **Vista previa**: cada slot muestra miniatura de la foto capturada, con
     opción de retomar/reemplazar.
   - Se conserva el drag-and-drop para desktop.
8. **Mediciones** (condicional):
   - **Baterías** (si `predictivo | cambio_baterias | pruebas_fault_over`) →
     tabla B1/B2 editable, add/remove filas, genera SVG automáticamente.
   - **Eléctricas** → R/S/T (trifásico) o L1-N/L2 (monofásico) según
     `potenciaKva >= 40`.
9. **Diagnóstico + Recomendaciones**: bullets editables (presets por tipo).
10. **Revisión final** → submit (igual flujo actual: localStorage → backend
    → EN_REVISION).

## DocumentFormat.tsx (rediseño completo)

Reemplaza 1 componente monolítico por orquestador que arma la lista de
páginas según `report.tipoServicio` + `ot.potenciaKva`:

```ts
function DocumentFormat({ report, ot, client }) {
  const tipo = report.tipoServicio ?? ServiceType.PREVENTIVO;
  const isTrifasico = ot.potenciaKva >= 40;
  const fotosCount = (report.fotosLabeled ?? []).length;
  const photPages = Math.ceil(fotosCount / 8);   // 8 fotos por página

  return (
    <>
      <PaginaPortada ... />
      <PaginaInformeTecnico ... />     {/* INFORME TÉCNICO + ANTECEDENTES + ACCIONES + PASOS */}
      <PaginaCaracteristicas ... />    {/* CARACTERÍSTICAS + VISTA PANORAMICA */}
      {Array.from({length: photPages}).map((_,i) => <PaginaFotografias num={i} ... />)}
      {report.medicionesBaterias && <PaginaMedicionesBaterias ... />}
      <PaginaMedicionesElectricas ... /> {/* entrada + bypass(opc) + salida + carga(opc) */}
      {report.historialAlarmas && <PaginaHistorialAlarmas ... />}
      <PaginaDiagnosticoRecomendaciones ... /> {/* + firma doble */}
    </>
  );
}
```

- PDF Header/Footer repetible en cada página, EXACTAMENTE como plantillas
  reales: "Elaborado por MAFORT SERVICE S.A.C | Date {fecha} | Referente
  INFORME #{n} | Orden de Trabajo #{n}".
- Estilos A4 portrait (`max-w-[800px] min-h-[1120px]`, `print:page-break-after-always`).
- Gráficos de baterías: componente `<BatteryBarChart tipo="voltaje|resistencia"
  data={...} />` que genera `<svg>` inline con ejes, barras y labels,
  replicando la apariencia plana de las plantillas reales (no usar librería
  externa de charts).

## Plan de implementación (fase PLAN)

Secuencia (con dependencias):

1. **Mockup HTML** (`Documentacion/mockups/informe-adaptativo.html`) —
   visualizar las 9 plantillas + los 3 layouts de mediciones (trifásico,
   monofásico, baterías con gráfico). **Requiere aprobación explícita del
   usuario antes de iniciar BUILD**.
2. **Spec data + types**: extender `ServiceType` enum y `TechnicalReport`
   (TS + Prisma).
3. **`serviceTemplates.ts`**: catálogo de los 9 tipos con sus PASOS, fotos y
   presets de ACCIONES_VALIDAS.
4. **`refactor DocumentFormat.tsx` en sub-componentes** sin alterar salida
   visual (extracción pura). Verificar PDF export idéntico antes de
   continuar.
5. **Implementar páginas nuevas** una a una (siguiendo `incremental-implementation`):
   - 5.1 `PdfHeader`, `PdfFooter`, `PaginaPortada`
   - 5.2 `PaginaInformeTecnico` (con PASOS dinámicos)
   - 5.3 `PaginaCaracteristicas` (con VISTA PANORAMICA)
   - 5.4 `PaginaFotografias` (grid 2 col ± fotos extra)
   - 5.5 `PaginaMedicionesBaterias` + `BatteryBarChart`
   - 5.6 `PaginaMedicionesElectricas` (trifásico + bypass + carga)
   - 5.7 `PaginaDiagnosticoRecomendaciones` (firma doble)
6. **`WizardInforme.tsx`** reemplaza el form de `TecnicoView`.
7. **Actualizar exportadores** (`VentasView`, `VentasView.docx`,
   `SupervisorView.docx`, `TablaOrdenesTrabajo`, `ClientesContratosView`).
8. **Actualizar `Documentacion/data_dictionary.md`** con campos nuevos.
9. **Validación visual contra las 19 plantillas reales** (PDF-to-PDF).
10. **PR** (rama `feature/informe-adaptativo-tipo-servicio` → `dev`).

## Riesgos y mitigaciones

| Riesgo                                            | Mitigación                                                |
|---------------------------------------------------|-----------------------------------------------------------|
| Ruptura de informes históricos guardados          | Todos los campos nuevos son `?` opcionales                |
| `prisma migrate` con datos existentes             | Migración solo añade columnas nullable; sin data loss    |
| PDF visual cambia y usuarios notan diferencia     | Mockup pre-aprobado + comparación visual PDF-vs-PDF        |
| Performance: SVG de baterías en 80 filas         | Memoización; renderizar solo en print                     |
| Tamaño `DocumentFormat.tsx` actual hace difícil refactor | Extracción por páginas en sub-archivos; revise incrementalmente |
| Wizard cambia flujo del técnico                   | Mismo localStorage, mismo endpoint, misma validación de slots |

## Dependencias

- Sin dependencias nuevas. SVG se hace manual.
- Sin tocar infraestructura.

## Open Questions

1. ¿Se conserva el campo `informeN` con formato `INF-2026-XXX` o se normaliza
   a `INFORME #0XXX` como en las plantillas reales?
2. ¿Para 150 KVA (Liebert APM) se considera trifásico? (≥40 KVA en código lo
   cubre, pero confirmar.)
3. ¿El wizard debe pedir "Vista Panorámica" como slot obligatorio (en todas
   las plantillas aparece) o solo recomendado?
4. ¿Recomendaciones: presets editables por técnico, o presets bloqueados por
   tipo de servicio?

## Success Criteria (testables)

- [ ] `npm run build` sin errores de tipo.
- [ ] `npm run lint` clean.
- [ ] Mockup `Documentacion/mockups/informe-adaptativo.html` aprobado por el
      usuario.
- [ ] Para cada tipo de servicio, el técnico puede iniciar wizard y
      completarlo sin errores.
- [ ] Export PDF (window.print) de una OT_PREVENTIVO_TRIFASICO produce PDF con
      páginas: Portada, INFORME TÉCNICO, CARACTERÍSTICAS + VISTA PANORÁMICA,
      FOTOGRAFÍAS (≥1 pág), MEDICIONES BATERÍAS + gráficos SVG, MEDICIONES
      ENTRADA/BYPASS/SALIDA, DIAGNÓSTICO+RECOMENDACIONES+FIRMA. Estructura
      visual ≈ plantilla `INF. 0214 Teleperformance 40KVA Pred`.
- [ ] Export PDF de una OT_VISITA_TECNICA_MONOFASICA produce PDF con la
      estructura corta (Portada + INFORME TÉCNICO con 3 PASOS + CARACTERÍSTICAS +
      FOTOGRAFÍAS + DIAGNÓSTICO + FIRMA). Estructura ≈ `INF. 244 Inkafarma`.
- [ ] `Documentacion/data_dictionary.md` actualizado en la misma PR.
- [ ] `_pdf` no usa `window.alert()` ni emojis ni hex crudos nuevos ni
      utilidades Tailwind v4 inválidas.
