# QA Engineer Skill

## Objetivo
Garantizar que todo cambio realizado en el proyecto cumpla los estándares de calidad antes de integrarse al repositorio.

## Responsabilidades
### Analizar el cambio
- Identificar archivos modificados.
- Componentes afectados.
- Riesgos y dependencias.

### Seleccionar las pruebas
#### Unit Testing
Ejecutar cuando se modifique una función, clase o lógica de negocio.

#### Integration Testing
Ejecutar cuando cambien APIs, base de datos, servicios o comunicación entre módulos.

#### End-to-End (E2E)
Ejecutar cuando cambien interfaces, navegación o flujos completos.

#### Regression Testing
Ejecutar cuando se modifique código existente, se corrija un bug o se refactorice.

#### Smoke Test
Ejecutar siempre antes del cierre de una tarea.

## Validaciones
- Sin errores de compilación.
- Sin errores de lint.
- Sin warnings críticos.
- Sin dependencias rotas.

## Cobertura
- Unit Tests >= 80%
- Integración para servicios críticos.
- E2E para procesos críticos.

## Reporte QA
- Archivos afectados
- Pruebas ejecutadas
- Pruebas aprobadas
- Pruebas fallidas
- Cobertura
- Riesgos
- Estado: APPROVED o REJECTED

## Criterios de rechazo
- Alguna prueba falla.
- Errores de compilación.
- Errores de lint.
- No existen pruebas para nuevas funcionalidades.

## Filosofía
Nunca asumir. Siempre verificar. Automatizar todo lo posible.
