# Documento de Alcance y Especificación Técnica: Aplicación de Gestión de Mantenimiento de UPS (Mafort)

Este documento detalla el alcance funcional, el modelo de datos, la lógica de negocios y la arquitectura de la aplicación web de gestión de mantenimiento de sistemas de alimentación ininterrumpida (UPS) diseñada para la empresa **Mafort Service S.A.C.** Este especificación tiene como objetivo servir como plano técnico ("blueprint") para que cualquier desarrollador o agente de Inteligencia Artificial (como Antigravity) pueda construir, extender o migrar la plataforma manteniendo el 105% de la fidelidad visual y de negocio del sistema actual.

---

## 1. Resumen Ejecutivo de la Aplicación

La aplicación es un sistema web reactivo de nivel empresarial y diseño de alta densidad estructurado para manejar el ciclo de vida completo de las Órdenes de Trabajo (OT) de mantenimiento de equipos UPS críticos. El flujo de trabajo involucra a cuatro capas de usuarios (Ventas, Técnicos en campo, Supervisores técnicos y Clientes finales) mediante portales asíncronos enriquecidos con capacidades offline para el registro de parámetros analógicos e históricos de hasta 10 páginas impresas bajo la norma doble marco Mafort.

---

## 2. Definición del Esquema y Modelo de Datos (TypeScript)

El siguiente es el core de tipos de datos (`/src/types.ts`) que modela de manera exacta las relaciones de la plataforma:

```typescript
export enum OTStatus {
  PROGRAMADA = 'Programada',
  EN_PROCESO = 'En Proceso',
  REVISION = 'Sometido a Revisión',
  CORRECCION = 'En Corrección',
  APROBADO = 'Aprobado',
  FIRMADO = 'Firmado'
}

export type EquipmentType = 'UPS Monofásico' | 'UPS Trifásico' | 'Estabilizador';
export type ServiceType = 'Preventivo' | 'Correctivo' | 'Emergencia';

export interface Client {
  id: string;
  razonSocial: string;
  ruc: string;
  direccionSede: string;
  distrito: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string;
  creadoEn: string;
}

export interface OT {
  id: string; // Ej. 'OT-4101'
  clientId: string;
  tipoEquipo: EquipmentType;
  potenciaKva: number; // Ej. 1, 10, 20, 40, 80, 160
  tipoMantenimiento: ServiceType;
  fechaProgramada: string;
  horaProgramada?: string;
  tecnicoTitular: string;
  tecnicoApoyo?: string;
  estado: OTStatus;
  creadoEn: string;
}

export interface TechnicalReport {
  id: string;
  otId: string;
  voltajeEntrada: number;
  voltajeSalida: number;
  indicadoresBateria: {
    nivelCarga: number;
    temperaturaC: number;
    estadoCeldas: 'Optimo' | 'Critico';
    bypassActivo: boolean;
  };
  observacionesDiagnostico: string;
  comentariosAdicionales?: string;
  correccionesSupervisor?: string;
  firmaCliente?: string; // Base64 PNG de conformidad
  fotos: string[]; // Lista cruda
  creadoEn: string;
  modificadoEn: string;
  offlineDirty?: boolean; // Flag de sincronización offline

  // Campos específicos de los informes impresos alta densidad
  informeN?: string; // Código de reporte oficial
  hojaServicioN?: string; // Correlativo físico
  asunto?: string;
  fechaServicio?: string;
  horaInicio?: string;
  tecnico1?: string;
  tecnico2?: string;
  antecedentes?: string;
  accionesRealizadas?: string[]; // Selección de las 24 acciones estándares
  pasos?: {
    paso1?: string;
    paso1_si_no?: 'si' | 'no';
    paso1_funcionamiento?: 'modo inversor' | 'bypass' | 'apagado';
    paso1_bypass?: 'interno' | 'externo' | 'no';
    paso2?: string;
    paso3?: string;
    paso4?: string;
    paso5?: string;
    paso6?: string;
    paso6_concluido?: 'si' | 'no';
    paso6_observaciones?: string;
  };
  caracteristicas?: Record<string, string>; // Matriz de 30 especificaciones del UPS y Equipos auxiliares
  fotosLabeled?: Array<{ slotName: string; base64: string; description?: string }>; // Fotos estructuradas por categoría
  medicionesEntrada?: {
    lnVoltaje: [string, string, string]; // Fase R, S, T
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };
  medicionesSalida?: {
    lnVoltaje: [string, string, string];
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };
  diagnosticoGabinete?: {
    cuentaConGabinete?: 'si' | 'no';
    tipoEstructura?: 'modo Rack' | 'Torre' | 'no';
    equipoEnBypass?: 'si' | 'no' | 'apagado';
  };
  revisionNormas?: {
    mantenimientoRealizado?: boolean;
    anioBaterias?: number;
    ambienteHermetico?: boolean;
    temperaturaSala?: number;
    estadoOperativo?: boolean;
    inversorOperandoPorcentaje?: number;
  };
  recomendaciones?: string[]; // Lista exhaustiva de recomendaciones
}
```

---

## 3. Dinámica del Flujo de Procesos (S.L.A.)

```
[ VENTAS ] ──▸ Registra Cliente y Agenda OT (Ej: OT-4101 de 40 kVA)
   │
   ▼
[ TÉCNICO ] ──▸ Abre Portal (con soporte offline)
   │           ▸ Rellena cuestionario exhaustivo e ingresa fotos reglamentarias
   │           ▸ Carga Offline -> Encola cambios / Sube al Servidor
   │
   ▼
[ SUPERVISOR ] ▸ Revisa parámetros clínicos y evidencias por KVA
   │           ▸ Aprueba Acta -> Pasa a panel de firmas del Cliente
   │           ▸ O Rechaza -> Retorna a campo con anotaciones críticas
   │
   ▼
[ CLIENTE ] ──▸ Previsualiza el reporte interactivo de 10 páginas
               ▸ Estampa su firma digital en la pizarra de dibujo canvas
               ▸ Cierra S.L.A y habilita descargas oficiales
```

---

## 4. Portales y Controladores de Rol

### A. Portal de Ventas (`VentasView.tsx`)
*   **Directiva**: Registro veloz de datos maestros de clientes (RUC automático de prueba, Razón Social, Dirección, Distrito de Lima) y agendamiento interactivo.
*   **Controles de OT**: Asigna de manera estricta:
    *   Potencia (1 kVA, 10 kVA, 20 kVA, 40 kVA, 80 kVA, 160 kVA).
    *   Técnico titular y de asistencia (Soporte prioritario a nombre de *Carlos Ocsa*).
    *   Tipo de mantenimiento (Correctivo, Preventivo, Emergencia).
*   **Panel de Resumen**: Indicadores estadísticos rápidos (Total de OTs agendadas, acumulado en KVA protegido, y conteo por estatus en tiempo real).

### B. Portal de Técnicos en Campo (`TecnicoView.tsx`)
*   **Sincronización Offline**: Un módulo con detección interactiva de conexión. En el momento en que cae la conexión a internet, se habilita una base de datos local temporal (`localStorage` con estado reactivo persistente). Las órdenes procesadas guardan la clave `offlineDirty: true` para sincronizarse inmediatamente al restablecerse el enlace de red.
*   **Asistente Inteligente Mafort (Prefill)**: Para evitar cuellos de botella en el campo, el técnico cuenta con un disparador automatizado que lee la capacidad contratada (KVA) y rellena instantáneamente el 100% de los informes con textos consistentes y un kit de imágenes de prueba coherentes con las exigencias de la potencia elegida.
*   **Checklist de Acciones Realizadas**: Registro obligatorio de la culminación de **24 acciones estándares** agrupadas por tarjetas lógicas, limpieza y sopleteado de embobinados de cobre.
*   **Registro Fotográfico Contractual**: Cada potencia estipula una lista específica de fotografías obligatorias (S.L.A.) con encuadres numerados:
    *   **1 KVA**: 6 fotos de mantenimiento inicial, estado de sopladores.
    *   **10 KVA**: 8 fotos orientadas a borneras y limpieza de brocha.
    *   **20 KVA**: 14 fotos incluyendo placas de baterías modelo RT1290, desglose de celdas y vistas cruzadas.
    *   **40 KVA / 80 KVA**: 16 fotos de auditoría (bypass de maniobras, transformador de aislamiento).
    *   **160 KVA**: 20 fotos detalladas (desmontaje de módulos electrónicos independientes, resistencia interna de packs).
*   **Mediciones Analógicas de Potencia**: Matrices interactivas para capturar voltajes Línea-Neutro, coeficientes de Intensidad por Fase (R, S, T) y Frecuencia de Energía (HZ) tanto para ingresos de red como salidas reguladas.

### C. Portal de Supervisores Técnicos (`SupervisorView.tsx`)
*   **Cola de Auditoría**: Centraliza las OTs enviadas para revisión.
*   **Controladores**: 
    1.  **Aprobador**: Somete el reporte y lo transfiere a la bandeja de firma del Cliente.
    2.  **Rechazador**: Envía el reporte de vuelta a la cola del técnico asignando una anotación crítica visible en campo ("Subsanar").
    3.  **Generador DOCX**: Un simulador de renderizado estructural para descargar el informe en un formato de procesador de palabras que conserva las evidencias y parámetros intactos.

### D. Portal de Clientes y Firmas (`ClienteView.tsx`)
*   **Previsualización Doble Marco**: Una reproducción exacta de cómo lucirá el informe impreso Mafor.
*   **Pizarra de Firma Digital (HTML5 Canvas)**: Panel táctil de alta sensibilidad táctil y con firma suavizada con un pincel estilizado en color azul marino profundo (tinta reglamentaria). El lienzo bloquea su manipulación una vez emitido el voto de conformidad para garantizar la inmutabilidad de la rúbrica registrada.

---

## 5. Arquitectura del Formato de Impresión (`DocumentFormat.tsx`)

La sección más valiosa de la plataforma es el formato de impresión que emula de forma perfecta un documento corporativo de alta densidad para auditorías de las normas internacionales de energía. Consta de las siguientes páginas:

1.  **PÁGINA 1: Portada (Coversheet)**: Títulos principales con los logotipos cruzados de Mafort Service S.A.C, área de servidores asignada, fecha del servicio, y tarjeta técnica del cliente (Contacto, teléfono, correo).
2.  **PÁGINA 2: Informe Técnico y Actividades de Soporte**: Numeración de Informe correlativo, hoja de servicio físico, narrativa formal de antecedentes de la corporación y grilla de comprobación con marcas de aspa (*"X"*) en las 24 acciones autorizadas.
3.  **PÁGINA 3 y 4: Cronograma Cronológico de Pasos (1 al 6) y Características Técnicas**: Cronogramas detallados de des-energización gradual, lecturas en bypass con bypass interno/externo con tablero de maniobra sin corte y grilla con las especificaciones del UPS e infraestructura (Marca del equipo, voltajes, aire acondicionado, etc.).
4.  **PÁGINA 5 a 7: Registro Fotográfico Alíneado S.L.A**: Dos imágenes por página con proporción exacta `4:3`, encuadres de soplado en campo y números de evidencia con marcas de agua del ID de la orden de trabajo.
5.  **PÁGINA 8: Mediciones Eléctricas de Entrada/Salida**: Cuadros balanceados con parámetros en volts, amperes y hertz por cada línea, junto con el diagnóstico del alojamiento del gabinete de distribución de potencia.
6.  **PÁGINA 9 y 10: Recomendaciones de Protección y Firmas de Conformidad**: Consejos cruciales de seguridad sobre instalación de tableros Micro P.O.D, control ambiental (temperatura constante de 18°C a 21°C), y bloques cruzados para las firmas del líder especialista de Mafort y el representante técnico de la Sede.

---

## 6. Estándares Visuales y Estilo (React / Tailwind CSS)

*   **Tipografía**: Encabezados de display estilizados bajo la tipografía moderna *Inter* o *Space Grotesk*, y fuentes monoespaciadas *JetBrains Mono* para toda la data de voltaje e identificadores ID para proyectar rigurosidad técnica.
*   **Paleta de Colores**:
    *   Fondo primordial de la interfaz: Slate limpio, Soft Off-Whites (`bg-slate-50`, `bg-white`) con marcos negros de alta legibilidad (`border-slate-900`) simulando alta fidelidad.
    *   Detalles de alertas de campo: Amber e Indigo clásicos (`text-amber-500`, `text-indigo-750`).
*   **Efectos y Microinteracciones**: Transiciones suaves utilizando micro-animaciones para el ingreso a los portales y cambios de vista.

---

## 7. Instrucciones para la Re-Construcción por Antigravity

Para clonar esta aplicación y levantarla desde cero en una sola ejecución exitosa, configure la estructura de archivos de la siguiente manera:

1.  **`package.json`**: Añada las dependencias `lucide-react` para toda la iconografía estructural de la app.
2.  **`/src/types.ts`**: Almacena las interfaces que unen el flujo asíncrono.
3.  **`/src/utils/reportDefaults.ts`**: Almacena las constantes globales (las 24 actividades de sopleteado y mantenimiento, los textos predilectos de recomendaciones Mafort, y la alineación dinámica de fotos según la potencia).
4.  **`/src/components/DocumentFormat.tsx`**: Contiene la maquetación del informe corporativo.
5.  **`/src/components/VentasView.tsx`**, **`/src/components/TecnicoView.tsx`**, **`/src/components/SupervisorView.tsx`**, **`/src/components/ClienteView.tsx`**: Los portales específicos por usuario enfocados en su respectiva responsabilidad contractual.
