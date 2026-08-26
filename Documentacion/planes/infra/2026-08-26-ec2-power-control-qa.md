# Plan de Infraestructura: Soporte de Apagado/Encendido (Power Control) en Ambiente QA

## 1. Contexto y Objetivos

Para optimizar costos en la nube de AWS en horarios no laborales o periodos de inactividad, el sistema cuenta con el workflow de GitHub Actions `ec2-power-control.yml`. Dicho workflow permite suspender los procesos de Auto-Healing en el Auto Scaling Group (ASG) de Elastic Beanstalk y detener la instancia EC2 (`t3.micro`), dejando el costo de cómputo en $0 mientras está apagado.

Originalmente el workflow solo exponía las opciones `dev` y `prod`. Este cambio habilita el soporte completo para el ambiente **`qa`** (`gestia-backend-qa`).

---

## 2. Alcance del Cambio

1. **Workflow GitHub Actions** (`.github/workflows/ec2-power-control.yml`):
   - Agregar `qa` a la lista de selección `inputs.environment.options`.
   - Compatibilidad automática con el nombre de entorno Elastic Beanstalk `gestia-backend-qa`.
2. **Documentación de Arquitectura** (`Documentacion/Guias y Estandares/arquitectura_infraestructura_nube.md`):
   - Actualizar la tabla de especificación del workflow `ec2-power-control.yml` reflejando los ambientes `dev/qa/prod`.

---

## 3. Criterios de Aceptación

- [x] El archivo `.github/workflows/ec2-power-control.yml` incluye `qa` en `inputs.environment.options`.
- [x] La documentación de infraestructura en `Documentacion/Guias y Estandares/arquitectura_infraestructura_nube.md` está sincronizada.
- [x] No se alteran los flujos de `app-deploy.yml` ni los scripts de Terraform.

---

## 4. Procedimiento Operativo para QA

1. Ir a **GitHub Actions** > **⚡ EC2 Power Control (Ahorro de Costos)**.
2. Hacer clic en **Run workflow**.
3. Seleccionar:
   - **Acción**: `STOP` (para apagar) o `START` (para encender).
   - **Ambiente**: `qa`.
4. Hacer clic en **Run workflow**.

> [!WARNING]
> Recuerda encender (`START`) el ambiente `qa` antes de realizar un push o merge a la rama `qa` para que el pipeline de despliegue `app-deploy.yml` no falle al conectar con la instancia.
