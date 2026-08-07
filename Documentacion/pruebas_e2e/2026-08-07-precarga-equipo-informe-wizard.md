# Flujo E2E: Precarga de datos del equipo en el Informe Técnico (Wizard del Técnico)

Fecha: 2026-08-07
Spec: `tests/wizard-precarga-caracteristicas.spec.ts`
Prioridad: **Regresión** (fix UI/flujo del módulo técnico)

## Objetivo
Verificar que al generar el informe técnico de una OT vinculada a un equipo registrado en
el contrato, el paso **6. Características del Equipo** muestre precargados el **modelo**,
**nº de serie** y **demás datos** (marca, tipo, potencia, ubicación, especificaciones)
registrados — y no los valores ficticios por defecto.

## Guion E2E (interacción real de usuario en navegador)

| # | Paso | Acción | Resultado esperado |
|---|---|---|---|
| 1 | Autenticación API | `POST /api/login` (admin@mafort.pe) | token JWT |
| 2 | Crear equipo | `POST /api/equipos` con `marca`, `modelo`, `serie`, `potenciaKva`, `ubicacion`, `estado`, `especificaciones` | equipo creado (id) |
| 3 | Crear OT | `POST /api/ots` con `equipoId`, `tecnicoTitular=Juan Córdova`, `estado=Trabajo en Ejecución` | OT creada |
| 4 | Login UI | Login como Técnico (`juan.cordova@materiagris.pe`) | Sidebar + portal técnico visible |
| 5 | Abrir OT | Clic en la tarjeta de la OT en el sidebar | Ficha de OT visible |
| 6 | Iniciar informe | Clic en botón **"Llenar Informe Técnico"** | Wizard abierto |
| 7 | Ir a paso 6 | Clic en **"Características del Equipo"** | Valores de características visibles |
| 8 | Verificar precarga | Leer valores de los inputs del paso 6 | Contienen `modelo` y `serie` del equipo registrado |

## Assertions clave (en el spec)

- `todosLosInputs` contiene el `modelo` registrado del equipo.
- `todosLosInputs` contiene la `serie` registrada del equipo.
- Sin errores de consola inesperados (se ignoran el error 404 preexistente de
  `/api/clients/:id/equipos`, ajeno a este cambio).

## Comando de ejecución

```
npx playwright test tests/wizard-precarga-caracteristicas.spec.ts --reporter=list
```

## Resultado

**PASS** ✓ — el informe precarga `modelo` y `serie` reales del equipo registrado.
Evidencia (video `.webm` + trace + screenshot) en `test-results/`.

## Nota de causa raíz

El equipo no se resolvía porque `equipos` (prop de TecnicoView) proviene de
`clients.flatMap(c => c.equipos)`, y `/api/clients` no incluye equipos; la carga local
usaba `/api/clients/:id/equipos` (ruta inexistente). La corrección consulta
`GET /api/equipos/:id`, que sí devuelve `marca`, `modelo`, `serie`, `especificaciones`.