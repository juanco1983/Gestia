# Mafort - Sistema de Órdenes de Trabajo y Reportes Técnicos

Este proyecto es una aplicación web full-stack moderna construida con **React (Vite) + TypeScript** en el frontend y un servidor **Node.js (Express) + TypeScript** en el backend. 

Ha sido diseñado específicamente para operar de manera robusta, con soporte offline avanzado, cobertura contractual de S.L.A. para fotografías y un motor de renderizado de reportes PDF de alta fidelidad.

---

## 💾 ¿Cómo se guardan los datos y las fotos actualmente?

**Sí, se están guardando en una base de datos local persistente.**

El servidor de Node.js incluye un motor de persistencia ligero basado en un archivo físico llamado `db.json` ubicado en la raíz del proyecto.
- **Persistencia Real**: Cada vez que creas un cliente, un contrato, una orden de trabajo (OT) o guardas un reporte con fotos (tanto de manera directa como mediante sincronización offline), los datos se escriben inmediatamente en el archivo `db.json` en tu disco duro.
- **Fotos e Imágenes**: Las fotos tomadas o cargadas se procesan como cadenas de texto en formato **Base64** de alta fidelidad y las autocompletadas utilizan **gráficos vectoriales técnicos autogenerados (SVG)**. Todas se guardan de forma segura y completa dentro del mismo archivo `db.json`.
- **Sin Pérdidas**: A diferencia del almacenamiento en el navegador (`localStorage`), estos datos **no se borran** si limpias la caché, si cierras el navegador o si reinicias la computadora. Estarán allí listos para ser revisados o editados en cualquier momento.

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

### 2. Escalamiento a Base de Datos de Producción (PostgreSQL, SQL Server, etc.)
Para pasar del archivo local `db.json` a una base de datos robusta en la nube cuando el volumen de usuarios crezca, solo debes realizar un cambio en el archivo `server.ts`:

1. Reemplazar las funciones `getDb()` y `saveDb()` (líneas 258 a 278 de `server.ts`) para que realicen consultas `SELECT` e `INSERT` directas a tu base de datos centralizada (por ejemplo, PostgreSQL en AWS RDS o Azure Database for PostgreSQL).
2. Como el backend expone una API REST limpia (`/api/users`, `/api/ots`, `/api/reports`), **el frontend de React no requerirá ningún cambio**. Todo el cambio de base de datos se realiza de forma aislada en el backend.

### 3. Almacenamiento de Imágenes a Gran Escala (S3 / Azure Blob Storage)
Cuando manejes miles de reportes con fotos pesadas, en lugar de guardar las fotos en Base64 en la base de datos SQL:
1. Sube el archivo de imagen directamente a un servicio de almacenamiento como **AWS S3** o **Azure Blob Storage**.
2. Guarda únicamente la **URL pública/firmada** de la imagen en tu base de datos.
3. El frontend renderizará las imágenes usando esa URL de manera nativa e instantánea.
