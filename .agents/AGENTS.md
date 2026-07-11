# Reglas de Proyecto: Gestia IA

## Flujo de Trabajo en Git (Git Flow Obligatorio)
1. **Ramas de Funcionalidades**:
   - Para cada cambio, tarea o nueva funcionalidad, el agente debe crear una nueva rama `feature/<nombre-feature>` partiendo de la rama `dev`.
   - **NUNCA** se deben realizar commits o cambios directos sobre la rama `dev`.
2. **Proceso de Revisión y Pull Request (PR)**:
   - Una vez finalizado el desarrollo en la rama `feature`, el agente debe realizar un `git push` de dicha rama a GitHub de forma automática.
   - El agente debe generar un Pull Request (PR) desde la rama `feature` hacia `dev` (usando GitHub CLI `gh pr create` o instruyendo al usuario).
   - El usuario validará el código y aprobará el PR directamente en la interfaz de GitHub.
3. **Fusión de Código y Despliegue (Merge & Deploy)**:
   - **NUNCA** se realiza el merge local a `dev` por parte del agente.
   - El usuario es el único responsable de aprobar y hacer el merge del PR en GitHub.
   - Una vez hecho el merge en GitHub hacia `dev`, se disparará automáticamente el pipeline CI/CD (GitHub Actions) que despliega la aplicación y la BD.
