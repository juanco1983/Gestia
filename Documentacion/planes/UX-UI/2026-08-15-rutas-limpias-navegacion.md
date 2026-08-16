# Plan: Implementación de Rutas Limpias (HTML5 History API) y Navegación "Atrás"

- **Fecha:** 2026-08-15
- **Categoría:** UX-UI
- **Autor:** Antigravity AI
- **Estado:** Planificado (Esperando Aprobación de Usuario)

---

## 1. Contexto y Objetivos

Actualmente, Gestia utiliza un estado interno de React (`currentRole`) en `App.tsx` para alternar entre los diferentes módulos (Dashboard, Ventas, Técnico, Gestión OTs, etc.). La URL de la barra de direcciones permanece estática en `/`.

### Problemas Detectados:
1. Al presionar el botón **"Atrás"** del navegador o del teléfono celular, el navegador interpreta que no hay historial interno y **saca al usuario de la aplicación**.
2. No es posible compartir enlaces directos (Deep Linking) a módulos específicos (ej: `/ventas`, `/inventario-equipos`).
3. Al recargar la página (`F5`), la app regresa al módulo por defecto en lugar de mantenerse en la pantalla actual.

### Objetivos:
1. Implementar la sincronización de navegación usando la **API de Historial HTML5 (`window.history.pushState` / `popstate`)** o `react-router-dom`.
2. Habilitar la navegación natural con los botones **Atrás / Adelante** del navegador sin recargar ni salir de la app.
3. Configurar la regla de reescritura SPA (`Rewrite Rule`) en **AWS Amplify** (`infra/modules/frontend/main.tf`) para que rutas directas como `/ventas` respondan `200 /index.html` en lugar de `404 Not Found`.

---

## 2. Alcance del Cambio

### Archivos Afectados:

1. **`src/App.tsx`**:
   - Mapeo bidireccional entre rutas URL (`/dashboard`, `/ventas`, `/tecnico`, etc.) y los módulos de `currentRole`.
   - Escuchador del evento `window.addEventListener('popstate', ...)` para actualizar el estado cuando el usuario presione **Atrás / Adelante**.
   - Función auxiliar `navigate(path, role)` que ejecuta `window.history.pushState` y cambia el estado.
   - Sincronización del estado inicial al cargar la página a partir de `window.location.pathname`.

2. **`src/modulesConfig.tsx`**:
   - Agregar el campo `path: string` a la definición de cada módulo en `APP_MODULES` (ej: `/dashboard`, `/ventas`, `/gestion-ots`, `/clientes-contratos`, `/tecnico`, `/supervisor`, `/cliente`, `/usuarios`, `/inventario-equipos`, `/monitoreo`).

3. **`infra/modules/frontend/main.tf`**:
   - Agregar el bloque `custom_rule` a la aplicación AWS Amplify:
     ```hcl
     custom_rule {
       source = "/<*>"
       target = "/index.html"
       status = "200"
     }
     ```

4. **`Documentacion/pruebas_e2e/rutas_limpias_navegacion.md`**:
   - Guion de pruebas E2E para Playwright que verifique cambio de URLs, botón atrás del navegador y recarga de página.

---

## 3. Criterios de Aceptación

1. **Navegación Visual:** Al hacer clic en un módulo del menú lateral, la URL de la barra de direcciones cambia a `/nombre-modulo`.
2. **Botón Atrás:** Al presionar el botón "Atrás" del navegador, la app retrocede al módulo anterior sin recargar ni salir de la plataforma.
3. **Recarga F5:** Al recargar la página estando en `/ventas`, la app vuelve a cargar directamente en el módulo de Ventas.
4. **AWS Amplify SPA Ready:** La regla de reescritura en Terraform está desplegada y responde 200 en cualquier ruta profunda.
5. **Calidad y E2E:** 100% de pruebas E2E aprobadas en Playwright con video de evidencia generado.

---

## 4. Desglose de Tareas

- [ ] Crear rama `feature/url-routing` a partir de `dev`.
- [ ] Mapear rutas en `modulesConfig.tsx`.
- [ ] Implementar manejador de historial `popstate` y `pushState` en `App.tsx`.
- [ ] Actualizar `infra/modules/frontend/main.tf` con `custom_rule` SPA.
- [ ] Crear guion E2E en `Documentacion/pruebas_e2e/rutas_limpias_navegacion.md`.
- [ ] Ejecutar y validar pruebas E2E con Playwright (`npx playwright test`).
- [ ] Invocar skill `qa-engineer` y generar reporte QA.
- [ ] Hacer `git push origin feature/url-routing` y notificar al usuario para PR.
