import type { Side, Alignment } from 'driver.js';

export type TourModule = 'Dashboard' | 'ClientesContratos' | 'GestionOTs' | 'Monitoreo' | 'Tecnico' | 'Supervisor' | 'Ventas' | 'Cliente' | 'Usuarios';

export interface TourStep {
  id: string;
  module: TourModule;
  selector: string;
  title: string;
  description: string;
  side?: Side;
  align?: Alignment;
  note?: string;
  tip?: string;
  banner?: 'dependencia' | 'final' | 'info';
}

export const TOUR_STORAGE_KEY = 'gestia_tour_progreso';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'bienvenida',
    module: 'Dashboard',
    selector: '#tour-dashboard-header',
    title: 'Bienvenido a Gestia',
    description:
      'Este es el Centro de Comando Operativo. Aquí se consolida la actividad de todos los módulos en tiempo real. Te guiaré por el proceso completo de un servicio, en el orden real: cliente, contrato, visita, OT e informe.',
    side: 'bottom',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'crear-cliente',
    module: 'ClientesContratos',
    selector: '[data-tour="cliente-crear"]',
    title: 'Paso 1 · Registrar el cliente',
    description:
      'Todo servicio comienza con el cliente. En el módulo Comercial, pulsa "Registrar Cliente" y completa razón social, RUC y datos legales.',
    side: 'bottom',
    align: 'start',
    tip: 'El código del cliente se genera automáticamente al escribir la razón social.',
    banner: 'info',
  },
  {
    id: 'crear-contrato',
    module: 'ClientesContratos',
    selector: '[data-tour="contrato-crear"]',
    title: 'Paso 2 · Crear el contrato',
    description:
      'Con el cliente seleccionado, registra el contrato o acuerdo marco que define el SLA, el monto y las visitas comprometidas del servicio.',
    side: 'bottom',
    align: 'end',
    note: 'El contrato queda vinculado al cliente creado en el paso anterior.',
    banner: 'info',
  },
  {
    id: 'asignar-equipo',
    module: 'ClientesContratos',
    selector: '[data-tour="contrato-equipo"]',
    title: 'Paso 3 · Asignar el equipo al contrato',
    description:
      'Dentro del contrato, la sección "Equipos Asociados" lista los UPS por atender. Pulsa "Asignar Equipo" para asociar un equipo existente o crear uno nuevo. Es requisito indispensable para generar el informe técnico.',
    side: 'bottom',
    align: 'start',
    note: 'Sin este paso no se puede emitir un informe técnico: TechnicalReport requiere equipo del contrato.',
    banner: 'dependencia',
  },
  {
    id: 'programar-visita',
    module: 'Monitoreo',
    selector: '[data-tour="programar-visita"]',
    title: 'Paso 4 · Programar la visita',
    description:
      'En Operaciones, pulsa "Programar Visita" para agendar el día, la hora y los equipos que el técnico atenderá en el cliente. Esta agenda alimenta de forma automática la OT.',
    side: 'bottom',
    align: 'start',
    note: 'La OT técnica y su línea financiera se crean automáticamente al programar la visita.',
    banner: 'dependencia',
  },
  {
    id: 'crear-ot',
    module: 'GestionOTs',
    selector: '[data-tour="ot-crear"]',
    title: 'Paso 5 · La OT se genera desde la visita',
    description:
      'En Gestión de OT no se digita la OT a mano: esta ya fue creada al programar la visita en Operaciones (paso anterior). Aquí supervisas SLA, cuotas y facturación. Solo es posible cuando existe una visita programada.',
    side: 'bottom',
    align: 'start',
    note: 'Dependencia: requiere la visita programada del paso 4.',
    banner: 'dependencia',
  },
  {
    id: 'asignar-tecnico',
    module: 'Monitoreo',
    selector: '[data-tour="asignar-tecnico"]',
    title: 'Paso 6 · Asignar técnico responsable',
    description:
      'Selecciona la OT creada y pulsa "Asignar Técnicos Responsables" para designar quién ejecutará el servicio en campo. Puedes agregar técnicos de apoyo.',
    side: 'top',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'bandeja-tecnico',
    module: 'Tecnico',
    selector: '[data-tour="bandeja-tecnico"]',
    title: 'Paso 7 · Bandeja del técnico',
    description:
      'El técnico ve aquí sus OTs asignadas y toma la que le corresponde. Desde esta bandeja inicia el trabajo de campo y el llenado del informe.',
    side: 'bottom',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'informe-tecnico',
    module: 'Tecnico',
    selector: '[data-tour="informe-tecnico"]',
    title: 'Paso 8 · Elaborar el informe técnico',
    description:
      'Al tomar la OT se abre el asistente de informe: tipo de servicio, acciones realizadas, mediciones, fotografías, diagnóstico y recomendaciones. Requiere el equipo del contrato (paso 3).',
    side: 'bottom',
    align: 'start',
    note: 'Si no hay conexión, el informe se guarda localmente y se sincroniza al volver a estar en línea.',
    banner: 'dependencia',
  },
  {
    id: 'aprobacion-supervisor',
    module: 'Supervisor',
    selector: '#audit-approve-btn',
    title: 'Paso 9 · Aprobación del supervisor',
    description:
      'El informe pasa a la bandeja de Supervisión para su revisión. El supervisor aprueba o rechaza con observaciones. Solo los informes aprobados liberan la facturación.',
    side: 'bottom',
    align: 'start',
    tip: 'Con el informe aprobado, el PDF queda disponible en el módulo Ventas bajo Control de Calidad.',
    banner: 'dependencia',
  },
  {
    id: 'portal-ventas',
    module: 'Ventas',
    selector: '[data-tour="ventas-control-calidad"]',
    title: 'Paso 10 · Portal de Ventas',
    description:
      'Consulta los informes técnicos aprobados y el estado de la facturación. Aquí también se revisan targets de venta y cartera facturada.',
    side: 'bottom',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'portal-cliente',
    module: 'Cliente',
    selector: '[data-tour="cliente-bandeja"]',
    title: 'Paso 11 · Portal del Cliente',
    description:
      'El cliente accede a sus OT e informes para firmar conformidades y revisar el detalle del servicio facturado, todo en autoservicio.',
    side: 'bottom',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'administracion',
    module: 'Usuarios',
    selector: '[data-tour="usuarios-crear"]',
    title: 'Paso 12 · Administración',
    description:
      'En Administración gestionas usuarios y roles. Cada rol (Ventas, Técnico, Supervisor, Cliente) controla los módulos que ve en el sistema.',
    side: 'bottom',
    align: 'start',
    banner: 'info',
  },
  {
    id: 'facturacion',
    module: 'GestionOTs',
    selector: '[data-tour="linea-facturacion"]',
    title: 'Paso 13 · Final: facturar el servicio',
    description:
      'El proceso completa con la facturación: pulsa "Editar" sobre la cuota de la OT e ingresa el N° de Factura, la Fecha de Emisión y el sub importe (monto del servicio). Al guardar, el estado pasa automáticamente a FACTURADO y la línea queda bloqueada.',
    side: 'bottom',
    align: 'start',
    note: 'Cierre del ciclo: sin N° de factura y sin monto, la cuota permanece como EJECUTADO pendiente de facturar.',
    banner: 'final',
  },
];