# Reglas de Proyecto: Gestia IA

## Flujo de Trabajo en Git (Git Flow Obligatorio)
1. **Ramas de Funcionalidades**:
   - Para cada cambio, tarea o nueva funcionalidad, el agente debe crear una nueva rama `feature/<nombre-feature>` partiendo de la rama `dev`.
   - **NUNCA** se deben realizar commits o cambios directos sobre la rama `dev`.
2. **Proceso de Aprobación**:
   - Todo el desarrollo, base de datos local y compilación se realizan en la rama `feature`.
   - El agente debe esperar a que el usuario valide de forma local en su máquina y dé su conformidad explícita.
3. **Fusión de Código y Despliegue (Merge & Deploy)**:
   - **ÚNICAMENTE** se realiza el merge de la rama `feature` a `dev` cuando el usuario dé la conformidad de las pruebas locales.
   - Una vez hecho el merge en `dev`, se procede a la ejecución del despliegue mediante los mecanismos integrados de CI/CD del proyecto.
