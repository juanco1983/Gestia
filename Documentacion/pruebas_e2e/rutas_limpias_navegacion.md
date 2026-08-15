# Guion de Pruebas E2E: Rutas Limpias y Navegación "Atrás"

- **Slug:** `rutas_limpias_navegacion`
- **Módulo:** Navegación SPA y HTML5 History API
- **Fecha:** 2026-08-15
- **Estado:** APTO PARA EJECUCIÓN

---

## 1. Objetivos de Prueba

Validar que la aplicación Gestia maneje la navegación basada en URLs de manera consistente, permitiendo:
1. Cambio dinámico de URL en la barra de direcciones al navegar entre módulos.
2. Navegación hacia atrás y adelante con la historia del navegador (`goBack` / `goForward`).
3. Carga directa de la aplicación ingresando directamente a rutas profundas (ej: `/ventas`, `/inventario-equipos`).

---

## 2. Escenarios de Prueba

### Escenario 1: Cambio de URL al seleccionar módulos
1. El usuario inicia sesión en la aplicación.
2. La URL inicial debe ser `/dashboard`.
3. El usuario hace clic en el enlace "Comercial" del menú lateral.
4. **Resultado esperado:** La URL debe cambiar a `/comercial` y el módulo correspondiente debe ser visible.
5. El usuario hace clic en "Técnicos".
6. **Resultado esperado:** La URL debe cambiar a `/tecnicos` y el módulo correspondiente debe ser visible.

### Escenario 2: Navegación "Atrás" con el historial del navegador
1. Partiendo del escenario 1 (usuario en `/tecnicos`).
2. El usuario presiona el botón "Atrás" del navegador (`page.goBack()`).
3. **Resultado esperado:** La URL retrocede a `/comercial` y se muestra el módulo Comercial.
4. El usuario presiona el botón "Atrás" nuevamente (`page.goBack()`).
5. **Resultado esperado:** La URL retrocede a `/dashboard` y se muestra el Dashboard principal.

### Escenario 3: Carga directa por URL (Deep Link / Refresh)
1. El usuario navega directamente a la URL `/inventario-equipos`.
2. **Resultado esperado:** La aplicación abre mostrando directamente el módulo de Inventario de Equipos.
