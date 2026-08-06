# AGENTS.md

Guía para agentes de IA que trabajan en el repositorio **Informes Mafort IA**.

## Documentación obligatoria (lectura previa)

Antes de tocar código, el agente DEBE leer y respetar la **única fuente de
verdad** alojada en `Documentacion/`:

| Documento | Aplica a |
|---|---|
| [`Documentacion/architecture_c4.md`](Documentacion/architecture_c4.md) | Modelo C4 del sistema. Toda decisión arquitectónica o referencia a componentes DEBE citar este doc. |
| [`Documentacion/arquitectura_infraestructura_nube.md`](Documentacion/arquitectura_infraestructura_nube.md) | Infraestructura AWS, Terraform, CI/CD. Toda modificación en `infra/`, `.github/workflows/`, `.ebextensions/` o `Procfile` DEBE actualizar este doc en la misma PR. |
| [`Documentacion/data_dictionary.md`](Documentacion/data_dictionary.md) | Modelo de datos. Toda modificación a `prisma/schema.prisma` o `src/types.ts` DEBE actualizar este doc en la misma PR. |
| [`Documentacion/guia_ui_ux.md`](Documentacion/guia_ui_ux.md) | **Sistema de diseño vigente**. El Dashboard es el patrón de referencia. Toda vista, componente, modal, botón, tabla o notificación nueva DEBE seguir esta guía. **Prohibido `window.alert()`** — usar el patrón canónico `<ToastModal>` descrito en la sección 5. |
| [`Documentacion/inventario_inconsistencias_ui.md`](Documentacion/inconsistencias_ui.md) | Auditoría UI/UX con plan de migración. Antes de homologar un módulo, consultar su sección. |
| [`Documentacion/pruebas_e2e/`](Documentacion/pruebas_e2e/) | **Flujos de Pruebas E2E Automatizadas**. Guiones y resultados de pruebas E2E para mantener `dev` estable. |

### Reglas UI/UX no negociables

1. **Sin `window.alert()` / `window.confirm()` / `prompt()`** en NUEVO código.
   Para notificaciones usar el componente shared `<ToastModal>` (o el patrón
   `alertState` mientras la migración dure) definido en `guia_ui_ux.md §5`.
2. **Sin emojis en UI**. Los emojis actuales en `alert()` se eliminan al migrar.
3. **Sin hex crudos** (`bg-[#00B594]`); usar tokens (`bg-teal-brand`) o la
   escala Tailwind (`emerald`, `rose`, `slate`, etc.).
4. **Sin utilidades Tailwind v4 inválidas** (`w-8.5`, `gap-4.5`,
   `border-slate-150`, `animate-slide-in-right`). Ver inventario §1.14.
5. **Sin tamaños tipográficos arbitrarios** (`text-[9px]`, `text-[10.5px]`,
   `text-[13px]`). Usar escala Tailwind o `text-[10px]` máx arbitrario.
6. **El Dashboard es la única referencia visual.** Toda vista nueva debe
   verse como `src/components/dashboard/*`.

### Skills workflow

Este proyecto usa el paquete [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) mediante el modelo de ejecución agent-driven de OpenCode (sin plugins ni slash commands nativos).

### Reglas core

- Si una tarea coincide con un skill, DEBE invocarse con la herramienta `skill`.
- Los skills están en `skills/<skill-name>/SKILL.md`.
- Nunca implementar directamente si un skill aplica.
- Seguir el workflow del skill exactamente (no aplicarlo parcialmente).

### Mockup visual obligatorio (antes de implementar)

> **Toda nueva funcionalidad, vista, modal o componente nuevo DEBE
> entregar primero un mockup visual al usuario para validación estética y
> de distribución, ANTES de escribir código de producción.**

- El mockup se entrega como un único archivo HTML autocontenido
  (Tailwind CDN + Google Fonts Sora/Inter/IBM Plex Mono + iconos
  `lucide` desde CDN) que reproduzca el patrón canónico del Dashboard
  (tokens de `guia_ui_ux.md §2`, layout `bg-white rounded-2xl border border-slate-100`,
  badges, header card, etc.).
- Debe mostrar TODAS las pantallas relevantes del módulo (listado, detalle,
  form, drawer, estados vacíos/loading) en un solo HTML o enlaces entre
  archivos, para que el usuario pueda aprobar o pedir ajustes.
- No se inicia la fase `BUILD` (`incremental-implementation`) hasta que el
  usuario apruebe explícitamente el mockup.
- Ajustes estéticos o de distribución se iteran sobre el mockup, no sobre
  el código de producción.
- Para modificaciones pequeñas a vista existente, igualmente se entrega
  mockup del antes/después si el cambio altera layout, jerarquía visual o
 amaño.

### Planes de trabajo — organización por tipo

> **Todo plan de mejora, feature, fix, refactor o cambio de infra DEBE
> guardarse en `Documentacion/planes/<tipo>/` y agruparse por categoría.**
> Si la subcarpeta del tipo no existe, se crea al momento de generar el
> primer plan de esa categoría.

**Categorías vigentes:**

| Subcarpeta | Aplica a |
|---|---|
| `Documentacion/planes/UX-UI/` | Homologación UI/UX, rediseños de vistas, mudanza de patrones (ToastModal, ConfirmModal, tokens, etc.) |
| `Documentacion/planes/features/` | Nuevos módulos o funcionalidades (ej: Inventario de Equipos, nuevo reporte) |
| `Documentacion/planes/fixes/` | Correcciones de bugs, fallos puntuales, hot-fixes documentados |
| `Documentacion/planes/refactors/` | Refactorings no UX (simplificación, reestructuración de código, deuda técnica) |
| `Documentacion/planes/infra/` | Cambios de infraestructura, CI/CD, deploy, BD, migraciones Prisma |

**Reglas:**

- Un plan = un archivo Markdown con nombre `YYYY-MM-DD-<slug-descriptivo>.md`
  (ej: `2026-07-25-inventario-equipos.md`).
- Cada plan DEBE contener: contexto, alcance, criterios de aceptación,
  desglose de tareas (inProgress/completed), riesgos y dependencias.
- Si el plan tiene mockup, el HTML del mockup se guarda en
  `Documentacion/mockups/<slug>.html` y se enlaza desde el plan.
- Sin excepciones: nunca dejar planes sueltos en la raíz de
  `Documentacion/planes/`. Los planes preexistentes se mantienen donde están
  por compatibilidad histórica, pero todo plan NUEVO sigue esta regla.

### Mapeo de intención → skill

El agente debe mapear automáticamente la intención del usuario:

- Feature / nueva funcionalidad → `spec-driven-development`, luego `incremental-implementation`, `test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / fallo / comportamiento inesperado → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplificación → `code-simplification`
- Diseño de API o interfaz → `api-and-interface-design`
- Trabajo de UI → `frontend-ui-engineering`
- Seguridad → `security-and-hardening`
- Performance → `performance-optimization`
- Documentación / decisiones de arquitectura → `documentation-and-adrs`
- Git / commits / branching → `git-workflow-and-versioning`
- CI/CD → `ci-cd-and-automation`
- Deprecación / migración → `deprecation-and-migration`
- Observabilidad → `observability-and-instrumentation`

### Ciclo de vida implícito

- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

### Modelo de ejecución

Para cada request:

1. Determinar si algún skill aplica (incluso con 1% de chance)
2. Invocar el skill apropiado con la herramienta `skill`
3. Seguir el workflow del skill estrictamente
4. Solo proceder a implementación después de completar los pasos requeridos (spec, plan, etc.)

### QA Engineer (gate de calidad)

> **Antes de cualquier commit/push/PR, se DEBE invocar al skill `qa-engineer`**
> (`skills/qa-engineer/SKILL.md`). Se invoca siempre que cambie código fuente,
> se agregue/elimine funcionalidad, cambie una API, cambie el esquema Prisma,
> cambie la UI, se corrija un bug o se refactorice.

El skill `qa-engineer`:
- Escala el nivel de test según el tipo de cambio (unit / integration / e2e /
  regression / smoke).
- Obliga a **E2E desde el navegador (Playwright)** para cambios de UI/flujo, e
  **integración (API/BD/Prisma)** para cambios de modelo o endpoints.
- Bloquea commit/push/PR si alguna prueba falla o hay errores de lint.
- Exige generar un **QA Report** (status APPROVED/REJECTED).
- Emite la evidencira en `Documentacion/evidencias/` (y la definitiva en
  `Documentacion/evidencias/definitivas/` antes del merge a `dev`).

Puntos no negociables (heredados de AGENTS.md):

- Postgres es la **única fuente de verdad**; nunca validar contra `db.json`/mock.
- Ningún merge a `dev` sin E2E + integración locales pasados.

### Git workflow (regla estricta)

- **Toda nueva feature/fix/refactor DEBE iniciarse en una rama NUEVA**
  con prefijo `feature/`, `fix/`, `refactor/` o `docs/` según el tipo. Nunca
  commitear directo a `dev` ni `main`. Nunca reutilizar una rama existente
  cuyo contexto no coincida — si llega una nueva tarea, crea otra rama nueva
  partiendo del estado actual (`git checkout -b <nueva-rama>`). Esto permite
  revertir cambios aislados sin contaminar otros trabajos en curso.
- **Todo commit DEBE ir seguido de `git push`** al remoto. No dejar commits en local.
- Regla general: si commiteaste, push al instante. Si no vas a push, no commitees.
- Antes de commitear: verificar `git status`, `git diff` y `git log` recientes para mantener contexto limpio.
- Commits atómicos por cambio conceptual. Mensajes siguiendo el estilo del repo (ver `git log` recientes): `tipo(scope): descripcion` en español.
- Antes de mergear a `dev`/`main` se hace PR, no push directo.

### Pruebas E2E y de Integración Obligatorias (antes de PR / Merge)

> **Toda implementación DEBE validar su flujo con pruebas de integración (API/BD) y pruebas E2E automatizadas desde el NAVEGADOR (simulando interacción real de usuario) antes de autorizar el merge a la rama `dev`, garantizando una rama permanente y estable.**

1. **Guardar Flujo de Pruebas**: El flujo, guion E2E y especificación de integración de cada funcionalidad DEBE guardarse en `Documentacion/pruebas_e2e/<slug>.md`.
2. **Ejecución Navegador Real y Pruebas de Integración**: Se debe validar la integridad del sistema mediante:
   - **Pruebas de Integración**: Verificación de endpoints API, modelo de datos Prisma, sincronización offline y cascada de estados sin alterar flujos preexistentes.
   - **Pruebas E2E desde Navegador**: Interacción directa desde la interfaz visual con **Playwright** (`npx playwright test`), simulando clics, formularios y experiencia de usuario final. Prohibido validar solo con unit tests aislados.
3. **Ejecución Local Obligatoria**: Antes de subir la rama `feature/` o crear un PR hacia `dev`, las pruebas de integración y E2E deben ejecutarse en el entorno local y verificar que el 100% de los escenarios pasen exitosamente.
4. **Rama `dev` Estable**: Queda estrictamente prohibido realizar merge a `dev` de cualquier cambio que no haya completado y superado sus pruebas de integración y E2E locales.
5. **Video de Evidencia Obligatorio**: Toda ejecución de pruebas de integración y E2E DEBE generar y guardar automáticamente grabaciones de video en formato `.webm` (configuración `video: 'on'` en `playwright.config.ts`) alojadas en `test-results/` como evidencia visual obligatoria de funcionamiento antes de autorizar un PR o merge.

### Anti-racionalización

Ignorar estos pensamientos:

- "Esto es muy pequeño para un skill"
- "Puedo implementarlo rápido"
- "Primero gathero contexto"

Comportamiento correcto: siempre verificar y usar skills primero.
