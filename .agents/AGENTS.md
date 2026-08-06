# Reglas de Proyecto: Gestia IA

## Flujo de Trabajo en Git (Git Flow Obligatorio)
1. **Ramas de Funcionalidades**:
   - Para cada cambio, tarea o nueva funcionalidad, el agente debe crear una nueva rama `feature/<nombre-feature>` partiendo de la rama `dev`.
   - **NUNCA** se deben realizar commits o cambios directos sobre la rama `dev`.
2. **Proceso de Revisión y Pull Request (PR)**:
   - Una vez finalizado el desarrollo en la rama `feature`, el agente debe realizar un `git push` de dicha rama a GitHub de forma automática.
   - El agente debe hacer push de la rama `feature` a GitHub.
   - El usuario creará el Pull Request (PR) desde la rama `feature` hacia `dev` y lo aprobará directamente en la interfaz de GitHub.
3. **Fusión de Código y Despliegue (Merge & Deploy)**:
   - **NUNCA** se realiza el merge local a `dev` por parte del agente.
   - El usuario es el único responsable de aprobar y hacer el merge del PR en GitHub.
   - Una vez hecho el merge en GitHub hacia `dev`, se disparará automáticamente el pipeline CI/CD (GitHub Actions) que despliega la aplicación y la BD.
4. **Pruebas E2E y de Integración Obligatorias (Rama `dev` Estable)**:
   - Todo flujo de prueba E2E e integración DEBE guardarse en `Documentacion/pruebas_e2e/<slug>.md`.
   - Se deben incluir **Pruebas de Integración** (API + BD + estado) para garantizar que el flujo completo backend/frontend no se altere, e **interacción en Navegador con Playwright** como usuario final.
   - El agente DEBE ejecutar y verificar el 100% de las pruebas de integración y E2E en local antes de autorizar el PR hacia `dev`.
   - **NUNCA** se realiza el PR ni el merge hacia `dev` si las pruebas de integración y E2E no han sido ejecutadas y aprobadas.
5. **Video de Evidencia Obligatorio**:
   - Toda ejecución de prueba de integración y E2E DEBE generar y conservar grabaciones de video `.webm` en la carpeta `test-results/` (configuración `video: 'on'` en `playwright.config.ts`) como evidencia visual obligatoria antes de solicitar la creación del PR hacia `dev`.
