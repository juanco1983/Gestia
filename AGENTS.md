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

### Git workflow (regla estricta)

- **Todo commit DEBE ir seguido de `git push`** al remoto. No dejar commits en local.
- Regla general: si commiteaste, push al instante. Si no vas a push, no commitees.
- Antes de commitear: verificar `git status`, `git diff` y `git log` recientes para mantener contexto limpio.
- Commits atómicos por cambio conceptual. Mensajes siguiendo el estilo del repo (ver `git log` recientes): `tipo(scope): descripcion` en español.

### Anti-racionalización

Ignorar estos pensamientos:

- "Esto es muy pequeño para un skill"
- "Puedo implementarlo rápido"
- "Primero gathero contexto"

Comportamiento correcto: siempre verificar y usar skills primero.
