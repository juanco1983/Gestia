# Pruebas E2E Automatizadas — Gestia IA

En esta carpeta se almacenan las especificaciones, guiones y flujos para la realización de **pruebas E2E (End-to-End)** automatizadas del sistema.

## Regla Estricta del Proyecto (AGENTS.md)

1. **Documentación de Flujo**: Toda nueva funcionalidad, refactor o corrección DEBE contar con su especificación de prueba E2E documentada en esta carpeta (`Documentacion/pruebas_e2e/<YYYY-MM-DD-slug>.md`).
2. **Ejecución desde Navegador con Playwright**: Las pruebas E2E deben ejecutarse interactuando visualmente con la aplicación en el navegador mediante **Playwright** (`npx playwright test`), haciendo clics en botones, rellenando formularios y simulando la experiencia de un usuario real en pantalla. Queda prohibido dar por válida una prueba con simples unit tests o scripts backend API.
3. **Ejecución Local Obligatoria**: Antes de realizar `git push` de la rama `feature/` o proponer un PR hacia `dev`, la prueba E2E en navegador DEBE ser ejecutada y verificada en local.
4. **Estabilidad de `dev`**: La rama `dev` es una rama permanente y estable; ningún código debe subirse sin haber aprobado la prueba E2E desde el navegador.
