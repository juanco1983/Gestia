# Mafort - Sistema de Órdenes de Trabajo y Reportes Técnicos

Este proyecto es una aplicación web full-stack moderna construida con **React (Vite) + TypeScript** en el frontend y un servidor **Node.js (Express) + TypeScript** en el backend. 

Ha sido diseñado específicamente para operar de manera robusta, con soporte offline avanzado, cobertura contractual de S.L.A. para fotografías y un motor de renderizado de reportes PDF de alta fidelidad.

---

## 💾 ¿Cómo se guardan los datos y las fotos actualmente?

**Se guardan en una base de datos PostgreSQL (fuente única de verdad).**

El backend (Node.js + Express) persiste toda la información mediante **Prisma ORM sobre PostgreSQL** (`postgresql://.../mafort_db`), definido por `DATABASE_URL` en `.env`. El esquema canónico vive en `prisma/schema.prisma` y las migraciones en `prisma/migrations/`.
- **Persistencia Real**: cada cliente, contrato, orden de trabajo (OT), reporte técnico o sincronización offline se escribe directamente en la base PostgreSQL vía el cliente Prisma.
- **Fotos e Imágenes**: las fotos se procesan como Base64 y se suben a **AWS S3** (o fallback local en `uploads/`); en la base solo se guarda la URL.
- **Sin Pérdidas**: a diferencia del almacenamiento en el navegador (`localStorage`), los datos viven en la base de datos centralizada y no dependen de la caché o del equipo del operador.

> **Nota de arquitectura:** Postgres es la **única fuente de verdad**. El archivo legacy `db.json` fue eliminado; no forma parte del sistema actual. Ver `Documentacion/architecture_c4.md`.

---

## 💻 Guía para Ejecutar el Piloto Localmente

Sigue estos sencillos pasos para iniciar el sistema en tu propia computadora:

### 1. Requisitos Previos
Asegúrate de tener instalado **Node.js** (versión 18 o superior recomendada). Puedes descargarlo gratis desde [nodejs.org](https://nodejs.org/).

### 2. Obtener el Código del Proyecto
Exporta el proyecto desde la interfaz de AI Studio haciendo clic en el menú de configuración y seleccionando:
- **Export to ZIP** (Descargará un archivo comprimido) o **Export to GitHub** (Creará un repositorio en tu cuenta).

Descomprime el archivo ZIP en una carpeta de tu computadora (por ejemplo, `C:\proyectos\mafort` o `~/mafort`).

### 3. Instalar las Dependencias
Abre tu terminal (Símbolo del sistema, PowerShell o Terminal de macOS/Linux), navega hasta la carpeta del proyecto y ejecuta:

```bash
npm install
```

*Esto instalará Express, Vite, TypeScript, Tailwind CSS y el resto de librerías requeridas.*

### 4. Iniciar el Servidor de Desarrollo
Para levantar el servidor web local y el backend integrado de manera simultánea, ejecuta:

```bash
npm run dev
```

Verás un mensaje en la terminal similar a este:
`[Mafort Backend System] Running securely on port 3000`

### 5. Acceder a la Aplicación
Abre tu navegador web favorito e ingresa a la siguiente dirección:

👉 **[http://localhost:3000](http://localhost:3000)**

¡Listo! El sistema estará corriendo localmente y podrás realizar pruebas, registrar OTs, rellenar reportes y exportar PDFs con total fluidez.

---

## 🚀 Preparación para llevarlo a AWS, Azure o Nube Productiva

El sistema ha sido estructurado siguiendo estándares de la industria para que el despliegue en producción sea sumamente directo.

### 1. Despliegue en la Nube (AWS / Azure / GCP)
La aplicación es **100% compatible con contenedores Docker**. Puedes empaquetarla fácilmente en una imagen Docker y desplegarla en:
- **AWS**: App Runner, Elastic Beanstalk, o ECS (Fargate).
- **Azure**: Container Apps o App Service.
- **GCP**: Cloud Run.

El comando de compilación ya está optimizado en tu `package.json`:
```bash
npm run build
```
Este comando empaqueta el frontend estático y compila el backend de Node.js en un solo archivo optimizado listo para producción (`dist/server.cjs`). Para iniciar la aplicación en producción solo debes correr:
```bash
npm start
```

### 2. Base de Datos (PostgreSQL)
La aplicación usa **PostgreSQL como única fuente de verdad**, accedida vía **Prisma ORM**. Configura la conexión en la variable `DATABASE_URL` (ver `.env`). El esquema canónico está en `prisma/schema.prisma`; aplica las migraciones con `npx prisma migrate deploy`.

### 3. Almacenamiento de Imágenes a Gran Escala (S3 / Azure Blob Storage)
Cuando manejes miles de reportes con fotos pesadas, en lugar de guardar las fotos en Base64 en la base de datos SQL:
1. Sube el archivo de imagen directamente a un servicio de almacenamiento como **AWS S3** o **Azure Blob Storage**.
2. Guarda únicamente la **URL pública/firmada** de la imagen en tu base de datos.
3. El frontend renderizará las imágenes usando esa URL de manera nativa e instantánea.
