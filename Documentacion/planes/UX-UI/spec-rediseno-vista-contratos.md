# Rediseño: vista de contratos (Operaciones > Agenda)

## Contexto

La vista actual muestra cada contrato como una tarjeta que expone de inmediato
la grilla completa de "Equipos del contrato principal". Con contratos de
muchos equipos esto genera tarjetas muy largas, scroll excesivo y dificulta
comparar contratos de un vistazo. Los contratos sin equipos (0) igual ocupan
espacio con un mensaje vacío.

## Objetivo

Convertir cada tarjeta de contrato en un componente tipo **acordeón**:
colapsada por defecto, mostrando solo un resumen, y expandible al hacer clic
para ver el detalle de equipos.

## Alcance

Archivo(s) involucrados: componente(s) que renderizan la lista de contratos
en la vista "Operaciones > Agenda" (buscar el componente que actualmente
pinta "Contrato #{id}", el badge de tipo, cliente, vigencia y la grilla de
equipos).

No se pide tocar: lógica de backend, endpoints, modelo de datos. Es un
cambio de presentación/UI sobre datos que ya se están consumiendo.

## Estado actual (para referencia)

Cada tarjeta muestra, siempre expandido:
- Header: `Contrato #{id}`, badge de tipo (ej. "Mantenimiento", "Alquiler UPS 3 kVA")
- Nombre del cliente (bold)
- Vigencia: `{fecha_inicio} al {fecha_fin}` (o "S/D al S/D" si no hay datos)
- Botón "Programar visita" (alineado a la derecha)
- Sección "Equipos del contrato principal (N)" con grilla de tarjetas de
  equipo (nombre interno, modelo, ubicación, capacidad en kVA)
- Si N=0: mensaje en cursiva "No hay equipos asignados directamente al
  contrato principal."

## Comportamiento nuevo

### 1. Estado colapsado (default)

Cada tarjeta muestra únicamente:

- Header con: número de contrato, badge de tipo, cliente, vigencia (igual
  que ahora).
- **Resumen de equipos** en una sola línea, en vez de la grilla completa:
  - Ícono + texto: `{N} equipo(s)` y, si N > 0, `· {suma_kva} kVA total`
    (suma de la capacidad de todos los equipos del contrato).
  - Si N = 0, solo mostrar `0 equipos` (sin la parte de kVA).
- Botón "Programar visita" se mantiene visible y funcional en todo momento
  (no debe togglear el acordeón).
- Un ícono de chevron (flecha hacia abajo) a la derecha, que rota 180° al
  expandir.
- Toda el área del header (excepto el botón) es clickeable y togglea el
  estado expandido/colapsado.

### 2. Estado expandido (al hacer clic)

- Se despliega debajo del header la grilla de equipos existente (mismo
  contenido y estilo que la vista actual: nombre, modelo, ubicación, kVA),
  con una transición de altura suave (~200ms).
- Si N = 0, mostrar el mensaje "No hay equipos asignados directamente al
  contrato principal." solo en este estado expandido (no ocupa espacio
  cuando está colapsado).
- Un clic adicional en el header vuelve a colapsar la tarjeta.
- Comportamiento de apertura: **independiente por tarjeta** (no es acordeón
  exclusivo; se pueden tener varias tarjetas abiertas a la vez), salvo que
  el equipo de producto decida lo contrario.

### 3. Persistencia del estado (opcional, discutir con el equipo)

- No es obligatorio persistir qué tarjetas quedaron abiertas entre
  recargas de página. Si se implementa, usar `localStorage` con una key
  por id de contrato.

## Mejoras adicionales (nice-to-have, segunda iteración)

Estas no son parte del alcance mínimo pero se documentan para backlog:

1. **Filtros rápidos** sobre la lista: por estado del contrato (activo,
   vencido, próximo a vencer), por tipo (mantenimiento, alquiler, etc.), o
   toggle "solo con equipos asignados".
2. **Indicador visual de vigencia próxima a vencer**: si `fecha_fin` está a
   menos de 30 días de la fecha actual, aplicar un borde o badge en tono
   ámbar (`warning`) sobre la tarjeta.
3. **Contratos sin fecha real** (`S/D al S/D`): reemplazar por un badge
   gris "Sin vigencia definida" en vez de mostrar literalmente "S/D al S/D".

## Criterios de aceptación

- [ ] Las tarjetas cargan colapsadas por defecto.
- [ ] El resumen de equipos (cantidad + kVA total) es correcto y coincide
      con la suma real de los equipos del contrato.
- [ ] Hacer clic en el header (fuera del botón "Programar visita") expande
      o colapsa la tarjeta.
- [ ] Hacer clic en "Programar visita" NO togglea el acordeón; ejecuta la
      acción original.
- [ ] El detalle de equipos expandido es visualmente idéntico al actual
      (mismos campos: nombre, modelo, ubicación, kVA).
- [ ] Contratos con 0 equipos muestran "0 equipos" en colapsado y el
      mensaje de "sin equipos" solo al expandir.
- [ ] La transición de expandir/colapsar es suave, sin saltos bruscos de
      layout.
- [ ] El comportamiento es responsive (no se rompe en pantallas angostas).
- [ ] Accesibilidad: el header es operable por teclado (foco + Enter/Space
      togglea), y tiene `aria-expanded` reflejando el estado.

## Notas de diseño visual

- Mantener la paleta y tipografía actuales del sistema (no introducir
  nuevos estilos de color fuera de los ya usados en badges).
- El ícono de resumen de equipos puede ser un rayo/UPS genérico, consistente
  en todas las tarjetas.
- El chevron debe rotar con una transición CSS simple (`transform:
  rotate(180deg); transition: transform 150ms ease`).
