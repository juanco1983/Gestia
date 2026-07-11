# Plan de Implementación Consolidado (Ejecución Local)

Este es el plan de acción revisado para asegurar que la aplicación complete su transición a la nueva base de datos estandarizada, **ejecutándose todo de manera 100% local** en tu máquina (`localhost`), sin afectar entornos de nube si los hubiera, y garantizando que el Frontend no se rompa al borrar los datos viejos.

## Proposed Changes (Fase 1: Refactorización de Frontend)

Antes de borrar la base de datos, debemos actualizar las pantallas visuales (React) para que entiendan los nuevos nombres en `camelCase` (ej. `numeroFactura` en lugar de `n_factura`).

### Componentes de React (Frontend)
Realizaremos una actualización masiva mediante scripts de búsqueda y reemplazo en tu entorno local sobre los siguientes archivos:
- `src/components/VentasView.tsx`
- `src/components/ClientesContratosView.tsx`
- `src/components/ot/TablaOrdenesTrabajo.tsx`
- `src/components/ot/ModalEditarLinea.tsx`
- `src/utils/otDefaults.ts`

**Cambios principales a aplicar:**
- `n_factura` ➔ `numeroFactura`
- `n_cotizacion` ➔ `numeroCotizacion`
- `n_oc_os` ➔ `numeroOcOs`
- `tipo_contrato` y `tipo_contract` ➔ `tipoContrato`
- `monto_inc_igv` ➔ `montoIncIgv`
- `ot_marco` ➔ `otMarco`
(Y todos los demás campos especificados en el Diccionario de Datos).

---

## Proposed Changes (Fase 2: Limpieza y Ejecución de Base de Datos Local)

Una vez que el código esté sincronizado, ejecutaremos comandos en tu consola local para hacer el "reset".

### Archivos Locales a Eliminar
#### [DELETE] `db.json`
- Eliminaremos el archivo de la raíz para asegurar que no interfiera.
#### [DELETE] `src/utils/reseedDb.ts`
- Script antiguo obsoleto.

### Comandos Prisma a Ejecutar (Local)
1. **`npx prisma db push --accept-data-loss`**
   - *Impacto:* Vaciará la base de datos PostgreSQL local y creará las tablas de nuevo con las reglas exactas (camelCase, sin duplicados) definidas en `schema.prisma`.
2. **`npx prisma generate`**
   - *Impacto:* Refrescará el cliente local de Prisma para que Node.js reconozca los nuevos campos.
3. **`npx prisma db seed`**
   - *Impacto:* Ejecutará el script `seed.ts` que acabo de crear, llenando la BD con los 5 usuarios (`@gestia.com`) y las 10 OTs de prueba.

---

## Verification Plan

### Manual Verification (Localhost)
- Iniciaremos el servidor localmente con `npm run dev`.
- Navegaremos a `http://localhost:3000`.
- Iniciaremos sesión con `admin@gestia.com` / `gestia2026`.
- Verificaremos que el módulo de **Ventas** y **Gestión OTs** cargue correctamente sin arrojar errores de variables indefinidas en la consola del navegador.
- Validaremos que los 10 registros estén distribuidos correctamente en los meses de Mayo, Junio y Julio.
