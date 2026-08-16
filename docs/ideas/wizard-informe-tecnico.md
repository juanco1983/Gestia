# Wizard del Informe Técnico — Rediseño UX

## Problem Statement

¿Cómo podríamos diseñar el flujo de llenado del informe técnico para que un técnico de
campo (en tablet o teléfono, con tiempo limitado y manos a veces ocupadas) lo complete
correctamente la primera vez, sin perderse en el formulario, sin resentir los datos
repetitivos y sin frustrarse con el encuadre de fotos?

## Recommended Direction

**Wizard Hybrid con Burst Photo**

Un asistente de 10 pasos con:

- **Header sticky vertical** a la izquierda (desktop/tablet landscape): lista de pasos
  numerados con estado Semáforo (slate = pendiente, teal pulsando = actual, emerald
  con check = completado).
- **Main area** a la derecha: UNA pantalla por paso, sin scroll, foco total.
- **Paso 1**: 9 cards visuales con icono + descripción para elegir tipo de servicio.
  Auto-seleccionado si `ot.tipoMantenimiento` ya está definido (skip posible).
- **Pasos 2-5**: cabecera, antecedentes, acciones, pasos. Auto-cargados desde Equipo
  registrado + Cliente + Plantilla del tipo. El técnico solo corrige si algo cambió.
- **Paso 6**: Características del equipo + Vista Panorámica. Todo pre-cargado del Equipo,
  solo se sube la foto panorámica nueva.
- **Paso 7 (FOTOS)**: Modo Burst. Botón grande "Tomar fotos" que abre cámara nativa
  (`input capture multiple`). Técnico toma N fotos en ráfaga. Luego pantalla de
  etiquetado: miniaturas a la izquierda, slots pendientes (X/N total) a la derecha.
  Técnico toca foto → toca slot para emparejar. Sin overlay de encuadre para no
  trabar la captura en campo.
- **Paso 8 (Mediciones)**: Condicional por template. Solo se muestra si
  `template.tieneBaterias || template.tieneGraficosSVG`. Tablas de entrada/salida/bypass
  + baterías B1/B2 con gráficos.
- **Paso 9**: Diagnóstico + Recomendaciones (bullets con presets por tipo, editables).
- **Paso 10**: Resumen visual con checklist grande de todo el informe. Botón "Enviar
  Informe" verde grande, solo habilitado si no faltan fotos/pasos críticos.

**UX inteligente (sin IA conversacional real todavía):**

- "Auto-completar inteligente" = auto-carga desde Equipo registrado + Cliente + Plantilla
  por tipo, mostrando badge "Datos cargados de: Equipo XYZ / Cliente / Plantilla
  Predictivo" con botón siempre visible "Editar manualmente".
- Footer inteligente: si el paso actual está incompleto, el botón "Siguiente" cambia
  su label al mensaje útil ("Te faltan 6 fotos", "Antecedentes pendientes", etc.).
- Permite "Saltar este paso" si el técnico decide que no aplica, marcándolo en rojo
  en el resumen final.

## Key Assumptions to Validate

- [ ] **Equipos están cargados en la BD** ligados a Contrato/Adenda → sin esto la
  auto-carga silenciosa falla. Validar: revisar al azar 5 OTs recientes y ver si
  tienen equipoId con Equipo bien cargado (marca, modelo, serie).
- [ ] **`input type=file capture=multiple` funciona en la tablet del técnico** para
  burst mode. Validar: hacer prueba HARDCODEADA en tablet Samsung (más común,
  ec tender). Móvilío habitual en Android trae capture multiple pero iPad Safari
  históricamente lo ha tratado mal.
- [ ] **El técnico prefiere Burst + etiquetar** sobre 1-foto-por-slot con propósito.
  Validar con un técnico real si es posible, o asumir como MVP reversible.
- [ ] **`ServiceType` de la OT es confiable** (`ot.tipoMantenimiento`) para
  auto-seleccionar el tipo. Si no, el paso 1 siempre se muestra.

## MVP Scope

**Incluye:**
- 10 pasos, una pantalla cada uno, con progress bar Semáforo vertical
- Auto-carga desde Equipo/Cliente/Plantilla al iniciar
- Burst mode fotos con etiquetado posterior (drag o tap-to-pair)
- Skip step si no aplica (botón "Saltar este paso")
- Footer inteligente con mensajes accionables
- Resumen final visual con CTA de envío condicional

**No incluye (V2):**
- Voz a texto para antecedentes/diagnóstico
- Overlay de encuadre con silueta en cámara
- IA conversacional real ( backend LLM)
- Foto por slot con overlay individual
- Edición colaborativa en tiempo real

## Not Doing (and Why)

- **Voz a texto** — el usuario la descartó explícitamente en la sesión de refine.
- **Overlay de encuadre por slot** — contradictorio con burst mode, y añade
  friction si el silueta no calza. Burst mode prioriza velocidad.
- **IA conversacional real** — no hay backend LLM en el stack actual; la
  "auto-carga inteligente" es suficiente valor para el MVP.
- **Tipo servicio selector obligatorio siempre** — skip paso 1 si OT ya tiene
  `tipoMantenimiento` definido, para no añadir friction innecesaria.
- **Captura individual por slot con propósito explícito** — descartado en favor
  del burst mode. El técnico SABE qué foto#N debe ser (slot #N en orden).

## Open Questions

1. ¿Las tablets usadas tienen Android (Samsung Tab A/B) o iOS (iPad)? Esto
   define la implementación exacta del `<input type=file capture=multiple>`.
   En iOS Safari, capture multiple no permite más de 1 foto por toque —
   requeriría un polyfill o fallback a "tomar varias veces".
2. ¿El técnico puede elegir el orden de slots obligatoriamente (ej: foto #1
   debe ser Características UPS) o puede etiquetar al final libremente?
3. ¿En el paso 8 (mediciones), el botón Siguiente debe bloquearse si los
   campos están vacíos, o permitir avanzar y solo validar al envío final?
4. ¿Se conserva el autoguardado en localStorage del wizard actual? Sí, eso
   no cambia.
