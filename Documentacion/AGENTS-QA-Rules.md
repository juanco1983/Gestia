# QA Rules

## Activación
Invocar automáticamente el Skill QA Engineer cuando:
- Se modifique código fuente.
- Se agreguen funcionalidades.
- Se elimine código.
- Se modifique una API.
- Se cambie el esquema de base de datos.
- Se modifique la interfaz.
- Se corrija un bug.
- Se refactorice código.

## Flujo obligatorio
1. Analizar impacto.
2. Implementar.
3. Ejecutar Unit Testing.
4. Ejecutar Integration Testing (si aplica).
5. Ejecutar End-to-End (si aplica).
6. Ejecutar Regression Testing.
7. Ejecutar Smoke Test.
8. Generar QA Report.
9. Permitir Commit.
10. Permitir Push.
11. Permitir Pull Request.

## Política
- Nunca hacer commit si alguna prueba falla.
- Nunca hacer push con errores de lint.
- Nunca aceptar código sin pruebas.
- Siempre generar un QA Report.

## Definición de Done
- Código compila.
- Lint limpio.
- Todas las pruebas pasan.
- Sin errores críticos.
- Cobertura suficiente.
- QA Report generado.
- Listo para producción.
