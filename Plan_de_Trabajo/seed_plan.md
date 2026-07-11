# PLAN DE SEMILLAS DE BASE DE DATOS (Prisma Seed)

De acuerdo a tus indicaciones, el archivo `db.json` será eliminado y reemplazaremos todo con un script oficial de PostgreSQL (`prisma/seed.ts`). Este script se encargará de "poblar" la base de datos limpia con un entorno de prueba sumamente robusto cada vez que lo necesitemos.

## 1. CREACIÓN DE USUARIOS (1 por cada rol)

Se crearán 5 cuentas oficiales bajo el dominio gestia.com. El Administrador tendrá acceso irrestricto a todos los módulos. La contraseña por defecto es `gestia2026`.

| Nombre | Rol | Email |
|:---|:---|:---|
| Admin Gestor | **Administrador** | `admin@gestia.com` |
| Ana Comercial | **Ventas** | `ventas@gestia.com` |
| Juan Técnico | **Tecnico** | `tecnico@gestia.com` |
| Roberto Salas | **Supervisor** | `supervisor@gestia.com` |
| Cliente Demo | **Cliente** | `cliente@demo.com` |

---

## 2. CLIENTES Y CONTRATOS MARCO

Crearemos 3 empresas ficticias para darle variedad a los casos:
1. **Banco Central (Sede Lima):** Contrato UPS de alta criticidad (Visitas bimensuales).
2. **Clínica San Juan:** Contrato Climatización (Visitas trimestrales).
3. **Minera Los Andes:** Sin contrato activo (Solo servicios por Órdenes de Servicio sueltas / Correctivos).

---

## 3. LOS 10 CASOS DE PRUEBA (Mayo - Julio)

Se crearán 10 Órdenes de Trabajo (Técnicas y Financieras) que exploran todas las aristas y flujos de la aplicación, distribuidas en los últimos 3 meses:

### Casos de Mayo (Ciclo de vida completado)
1. **[Cerrado y Facturado]** Mantenimiento Preventivo de UPS (Banco Central). Flujo perfecto: Creada -> Programada -> Ejecutada -> Informe Aprobado -> Firmado por Cliente -> Facturado. (Tiene PDF generado).
2. **[Cerrado y Facturado]** Atención de Emergencia de Transformador (Minera). Reportado fuera de hora, ejecutado y facturado el mismo mes.
3. **[Firmado]** Mantenimiento de Climatización (Clínica). El técnico lo hizo, el supervisor aprobó, el cliente ya firmó la conformidad en la tablet, pero Ventas aún NO emite la factura (Estado financiero: POR FACTURAR).

### Casos de Junio (En cuellos de botella administrativos)
4. **[En Revisión]** Preventivo UPS (Banco Central). El técnico ya subió el informe con 16 fotos desde la app móvil. Actualmente en la bandeja del Supervisor esperando su auditoría.
5. **[Observada]** Correctivo UPS (Banco Central). El supervisor rechazó el informe porque faltan fotos de las mediciones de salida. Está devuelta en la bandeja del técnico ("Juan Técnico") para que la corrija.
6. **[Aprobada]** Preventivo Climatización (Clínica). Aprobado por el supervisor. Está esperando que el Cliente ("Cliente Demo") inicie sesión y trace su firma en el canvas digital.

### Casos de Julio (Activos y por ejecutar)
7. **[Trabajo en Ejecución]** Emergencia UPS (Minera). El técnico acaba de darle "Iniciar Servicio" hoy mismo. El SLA está corriendo en tiempo real.
8. **[Programada]** Preventivo Climatización (Clínica). Asignada a "Juan Técnico" para la próxima semana. Aparecerá en su calendario móvil, pero aún no puede iniciarla.
9. **[Creada]** Instalación de Tablero (Minera). Ventas la acaba de registrar en el sistema, pero el Supervisor aún no le ha asignado fecha ni técnico.
10. **[Anulada]** Alquiler de UPS (Banco). El servicio fue cancelado por el cliente antes de enviar al técnico. Sirve para probar filtros de estado.

---

## 4. ESTRUCTURA TÉCNICA DEL SCRIPT

El script `prisma/seed.ts` utilizará el nuevo Diccionario de Datos (camelCase puro):
- `numeroFactura`
- `tipoContrato`
- `montoIncIgv`

Se ejecutará de forma automática al correr `npx prisma db seed`, garantizando que en 3 segundos tengas este escenario perfecto para probar o hacer demostraciones a gerencia.
