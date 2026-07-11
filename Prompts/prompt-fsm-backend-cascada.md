# Prompt optimizado — Backend FSM híbrido (Cascada de presupuesto)

> Análisis y correcciones incluidos. Pega el bloque de abajo directo en tu agente de código.

## Resumen del análisis

El prompt original tenía una persona y estructura claras, pero dejaba vacíos que suelen costar una ronda extra de correcciones:

- **Tarifario inexistente**: se mencionaba "tarifario contractual" pero el mapa de relaciones no incluía esa tabla — el modelo iba a inventarla.
- **Ambigüedad de la tarifa por hora**: no quedaba claro si vivía en `Contratos_Marco` o en `Equipos_Contratados`.
- **Condición de carrera**: `cerrarInformeYLiquidarOT` restaba el saldo sin transacción ni bloqueo de fila — riesgo real si dos técnicos cierran informes en paralelo.
- **Sin regla de saldo negativo**: no se definía qué pasa si el descuento deja el saldo en negativo.
- **Sin idempotencia**: no se especificaba qué pasa si la función de cierre se llama dos veces sobre el mismo informe.
- **Stack no fijado**: pedía código "listo para producción" sin decir si es SQL crudo, un query builder o un ORM — el modelo elige por ti, con riesgo de que no calce con tu stack real.
- **Lenguaje decorativo**: frases como "de forma matemática" o "oxígeno financiero" no aportan especificación, solo tokens.

Todo esto ya está corregido en el prompt de abajo.

---

## Prompt optimizado

```
Actúa como Arquitecto de Software Senior (TypeScript + PostgreSQL). Construye el backend
de un FSM híbrido (mantenimiento/reparación + alquiler de equipos) con control de
presupuesto en cascada: Cliente -> Contrato_Marco -> OT_Derivada -> Informe_Tecnico.

STACK: SQL crudo con queries parametrizadas (sin ORM). Node.js/Express, funciones async.

1. SQL (PostgreSQL)
Relaciones:
- Clientes (1:N) Contratos_Marco
- Contratos_Marco (1:N) Equipos_Contratados (activos cubiertos)
- Contratos_Marco (1:N) Ampliaciones_Contrato (historial de adendas)
- Contratos_Marco (1:N) Tarifario_Contrato (tarifa_hora_mano_obra, precio_unitario por repuesto/servicio, vigente por contrato)
- Contratos_Marco (1:N) Ordenes_Trabajo_Derivadas
- Ordenes_Trabajo_Derivadas (1:1) Informes_Tecnicos
- Informes_Tecnicos (1:N) Repuestos_Utilizados (cantidad, precio_unitario copiado de Tarifario_Contrato al momento de uso, no referenciado en vivo)

Reglas: PK/FK explícitas, UNIQUE donde aplique, DECIMAL(12,2) para montos,
columna saldo_actual_contrato con CHECK >= 0 salvo que se indique lo contrario.

2. Interfaces TypeScript
Traduce cada tabla 1:1. ContratoMarco incluye opcionalmente equipos[], ampliaciones[],
tarifario[]. Estados como union types (ej. EstadoOT = 'Programada'|'En Proceso'|
'Ejecutada'|'Cerrada'). Un tipo por archivo/bloque, sin clases innecesarias.

3. Funciones de servicio (async, con transacción SQL explícita — BEGIN/COMMIT/ROLLBACK
   y bloqueo de fila con SELECT ... FOR UPDATE sobre Contratos_Marco antes de leer/escribir
   saldo_actual_contrato):

A. cerrarInformeYLiquidarOT(idInforme: number)
   - Idempotente: si la OT ya está 'Cerrada', retorna sin re-descontar.
   - monto_total = horas_mano_obra * tarifa_hora (de Tarifario_Contrato) + SUM(repuestos.cantidad * precio_unitario)
   - Si saldo_actual_contrato - monto_total < 0: registrar igual pero marcar contrato
     con flag 'sobregiro' (no bloquear el cierre; el bloqueo ocurre antes, en C).
   - Actualiza estado OT -> 'Cerrada' y saldo_actual_contrato del padre.

B. aplicarAmpliacionContrato(idContrato: number, montoAmpliacion: number, nuevaFecha?: Date)
   - Inserta en Ampliaciones_Contrato (auditoría).
   - Suma montoAmpliacion a monto_total_contrato y saldo_actual_contrato.

C. validarCreacionOT(idContrato: number, idEquipo: number): Promise<boolean>
   - false si saldo_actual_contrato <= 0.
   - false si idEquipo no está en Equipos_Contratados de ese contrato.

Código modular, comentarios solo en líneas con lógica no obvia (cálculos, transacciones).
No expliques el código fuera de los comentarios inline.
```
