# AGENTS.md

Guía para agentes de IA que trabajan en el repositorio **Informes Mafort IA**.

## Integración con Agent Skills

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
