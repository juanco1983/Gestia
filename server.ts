import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ubigeos from 'ubigeo-peru';

const JWT_SECRET = process.env.JWT_SECRET || "gestia_secret_token_key_123456";

// AWS S3 client initialization
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "gestia-dev-photos";

// Helper to convert base64 image strings and upload to AWS S3 or fallback locally
async function uploadBase64ToS3(base64Str: string, otId: string, index: string | number): Promise<string> {
  if (!base64Str || typeof base64Str !== "string") return "";
  if (base64Str.startsWith("/api/photos/") || base64Str.startsWith("/uploads/") || base64Str.startsWith("http")) {
    return base64Str;
  }

  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Str;
  }

  const mimeType = matches[1];
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Tipo de imagen no permitido: ${mimeType}. Solo se admiten JPEG, PNG, WEBP y SVG.`);
  }

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Validación de tamaño: máximo 10MB por fotografía de informe
  if (buffer.length > 10485760) {
    throw new Error("La imagen excede el límite de tamaño de 10MB");
  }

  let extension = "jpg";
  if (mimeType === "image/png") extension = "png";
  else if (mimeType === "image/webp") extension = "webp";
  else if (mimeType === "image/svg+xml") extension = "svg";

  const cleanOtId = otId.replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const key = `reports/OT-${cleanOtId}/${timestamp}-${index}.${extension}`;

  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      return `/api/photos/${key}`;
    }
  } catch (s3Err) {
    console.warn("[S3 Upload Fallback] No se pudo subir a S3, guardando localmente:", (s3Err as any)?.message);
  }

  // Fallback local: Guardar en carpeta uploads local o retornar la imagen Base64
  try {
    const fs = await import('fs/promises');
    const uploadsDir = path.join(process.cwd(), 'uploads', `OT-${cleanOtId}`);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${timestamp}-${index}.${extension}`);
    await fs.writeFile(filePath, buffer);
    return `/uploads/OT-${cleanOtId}/${timestamp}-${index}.${extension}`;
  } catch (err) {
    console.warn("[Local File Warning] No se pudo guardar imagen localmente, conservando Base64:", err);
    return base64Str;
  }
}

// Helper to delete objects from S3 on transaction rollback or entity deletion
async function deleteFromS3(relativeUrl: string): Promise<void> {
  if (!relativeUrl || typeof relativeUrl !== "string") return;
  try {
    const key = relativeUrl
      .replace(/^\/api\/photos\//, "")
      .replace(/^\/api\/contracts\/files\//, "")
      .replace(/^\/api\/equipos\/files\//, "")
      .replace(/^\/uploads\//, "");

    if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        })
      );
      console.log(`[Rollback/Cleanup S3] Objeto eliminado: ${key}`);
    }
  } catch (err) {
    console.error(`[Rollback/Cleanup S3 ERROR] No se pudo eliminar ${relativeUrl}:`, err);
  }
}
let connectionString = `${process.env.DATABASE_URL}`;
const isAWS = connectionString.includes("amazonaws.com");
if (isAWS) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, "");
}
const pool = new Pool({ 
  connectionString,
  ssl: isAWS ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT: number = parseInt(process.env.PORT || (process.env.NODE_ENV === "production" ? "5000" : "3000"), 10);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ----------------------------------------
// REST API ROUTES
// ----------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "postgres_prisma" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {}
  }
  next();
}

app.use("/api", authenticateToken);

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son requeridos" });
    }
    const cleanInput = email.trim().toLowerCase();
    
    // Find user by email or username
    let matchedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: 'insensitive' } },
          { username: { contains: cleanInput, mode: 'insensitive' } }
        ]
      }
    });

    if (!matchedUser) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    if (matchedUser.estado === 'Suspendido') {
      return res.status(403).json({ error: `⚠️ ACCESO DENEGADO: El usuario "${matchedUser.username}" se encuentra temporalmente "Suspendido".` });
    }

    const isPasswordValid = bcrypt.compareSync(password, matchedUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: matchedUser.id, email: matchedUser.email, role: matchedUser.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userWithoutPassword } = matchedUser;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/api/db-dump", async (req: any, res) => {
  if (!req.user || req.user.role !== "Administrador") {
    return res.status(403).json({ error: "Acceso denegado: Se requiere rol de Administrador" });
  }
  try {
    const data = {
      users: await prisma.user.findMany(),
      clients: await prisma.client.findMany(),
      contracts: await prisma.contract.findMany(),
      ots: await prisma.oT.findMany(),
      reports: await prisma.technicalReport.findMany(),
      ordenesTrabajo: await prisma.ordenTrabajoLinea.findMany(),
      contratosNuevos: await prisma.contratoNuevo.findMany(),
      targetVentas: await prisma.targetVenta.findMany(),
      logs: await prisma.userActivityLog.findMany(),
    };
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar dump" });
  }
});

app.post("/api/admin/wipe-operational-db", async (req: any, res) => {
  if (!req.user || req.user.role !== "Administrador") {
    return res.status(403).json({ error: "Acceso denegado: Se requiere rol de Administrador" });
  }
  try {
    // 1. Cleanup de S3 para evitar acumulación de objetos huérfanos
    try {
      const allReports = await prisma.technicalReport.findMany();
      for (const r of allReports) {
        if (Array.isArray(r.fotos)) {
          for (const f of r.fotos) if (typeof f === 'string') await deleteFromS3(f);
        }
        if (Array.isArray(r.fotosLabeled)) {
          for (const f of (r.fotosLabeled as any[])) {
            if (f?.base64 && typeof f.base64 === 'string') await deleteFromS3(f.base64);
          }
        }
        if (r.firmaCliente) await deleteFromS3(r.firmaCliente);
        if (r.panoramaFoto) await deleteFromS3(r.panoramaFoto);
      }

      const allContracts = await prisma.contratoNuevo.findMany();
      for (const c of allContracts) {
        if (c.pdf_url) await deleteFromS3(c.pdf_url);
      }

      const allAdendas = await prisma.contratoAmpliacion.findMany();
      for (const a of allAdendas) {
        if (a.adenda_pdf_url) await deleteFromS3(a.adenda_pdf_url);
      }

      const allEquipos = await prisma.equipo.findMany();
      for (const eq of allEquipos) {
        if (Array.isArray(eq.fotos)) {
          for (const f of eq.fotos) if (typeof f === 'string') await deleteFromS3(f);
        }
      }
    } catch (s3CleanupErr) {
      console.warn("[S3 Wipe Warning] Error parcial durante la limpieza de objetos S3:", s3CleanupErr);
    }

    // 2. Eliminación en cascada en la base de datos PostgreSQL
    const deletedReports = await prisma.technicalReport.deleteMany();
    const deletedAsignaciones = await prisma.otEquipoAsignacion.deleteMany();
    const deletedServicios = await prisma.servicioEquipo.deleteMany();
    const deletedOts = await prisma.oT.deleteMany();
    const deletedOtLineas = await prisma.ordenTrabajoLinea.deleteMany();
    const deletedEquipoAmpliaciones = await prisma.equipoAmpliacion.deleteMany();
    const deletedEquipos = await prisma.equipo.deleteMany();
    const deletedAdendas = await prisma.contratoAmpliacion.deleteMany();
    const deletedContratos = await prisma.contratoNuevo.deleteMany();
    const deletedClients = await prisma.client.deleteMany();

    res.json({
      message: "Base de datos operacional reseteada con éxito a 0 registros",
      summary: {
        technicalReports: deletedReports.count,
        otEquipoAsignaciones: deletedAsignaciones.count,
        servicioEquipos: deletedServicios.count,
        ots: deletedOts.count,
        ordenTrabajoLineas: deletedOtLineas.count,
        equipoAmpliaciones: deletedEquipoAmpliaciones.count,
        equipos: deletedEquipos.count,
        contratoAmpliaciones: deletedAdendas.count,
        contratosNuevos: deletedContratos.count,
        clients: deletedClients.count
      }
    });
  } catch (err) {
    console.error("Error al limpiar base de datos en nube:", err);
    res.status(500).json({ error: "Error al resetear la base de datos" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const sanitizedUsers = users.map(({ password, ...userWithoutPassword }: any) => userWithoutPassword);
    res.json(sanitizedUsers);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = req.body;
    if (!newUser.id) newUser.id = `user_${Date.now()}`;
    if (!newUser.creadoEn) newUser.creadoEn = new Date().toISOString().substring(0, 10);
    
    newUser.password = newUser.password 
      ? bcrypt.hashSync(newUser.password.trim(), 10) 
      : bcrypt.hashSync("gestia", 10);
    
    const createdUser = await prisma.user.create({ data: newUser });
    const { password, ...sanitized } = createdUser;
    res.status(201).json(sanitized);
  } catch (err) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password.trim(), 10);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    });
    const { password, ...sanitized } = updated;
    res.json(sanitized);
  } catch (err) {
    res.status(404).json({ error: "Usuario no encontrado" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (err) {
    res.status(404).json({ error: "Usuario no encontrado" });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await prisma.userActivityLog.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const newLog = req.body;
    if (!newLog.id) newLog.id = `log_${Date.now()}`;
    if (!newLog.timestamp) newLog.timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const created = await prisma.userActivityLog.create({ data: newLog });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

async function ensureUbigeoData() {
  try {
    const distCount = await prisma.distrito.count();
    if (distCount < 100) {
      console.log("Seeding ALL INEI Ubigeo data...");
      await prisma.distrito.deleteMany({});
      await prisma.provincia.deleteMany({});
      await prisma.pais.deleteMany({});

      const paisPER = await prisma.pais.upsert({
        where: { id: 'PER' },
        update: { nombre: 'Perú' },
        create: { id: 'PER', nombre: 'Perú' }
      });
      await prisma.pais.upsert({ where: { id: 'CHL' }, update: { nombre: 'Chile' }, create: { id: 'CHL', nombre: 'Chile' } });
      await prisma.pais.upsert({ where: { id: 'COL' }, update: { nombre: 'Colombia' }, create: { id: 'COL', nombre: 'Colombia' } });
      await prisma.pais.upsert({ where: { id: 'MEX' }, update: { nombre: 'México' }, create: { id: 'MEX', nombre: 'México' } });

      const rawUbigeo = ubigeos as any;
      const data = rawUbigeo?.inei || rawUbigeo?.default?.inei || rawUbigeo?.default || rawUbigeo;
      
      if (Array.isArray(data) && data.length > 0) {
        const departamentos = data.filter((u: any) => u.provincia === '00' && u.distrito === '00');
        const provincias = data.filter((u: any) => u.provincia !== '00' && u.distrito === '00');
        const distritos = data.filter((u: any) => u.provincia !== '00' && u.distrito !== '00');

        for (const prov of provincias) {
          const provId = `${prov.departamento}${prov.provincia}`;
          const dep = departamentos.find((d: any) => d.departamento === prov.departamento);
          const nombreStr = dep ? `${prov.nombre} (${dep.nombre})` : prov.nombre;
          await prisma.provincia.upsert({
            where: { id: provId },
            update: { nombre: nombreStr, paisId: paisPER.id },
            create: { id: provId, nombre: nombreStr, paisId: paisPER.id }
          });
        }

        for (const dist of distritos) {
          const provId = `${dist.departamento}${dist.provincia}`;
          const distId = `${dist.departamento}${dist.provincia}${dist.distrito}`;
          await prisma.distrito.upsert({
            where: { id: distId },
            update: { nombre: dist.nombre, provinciaId: provId },
            create: { id: distId, nombre: dist.nombre, provinciaId: provId }
          });
        }

        console.log(`Successfully seeded ${provincias.length} provinces and ${distritos.length} districts!`);
      }
    }
  } catch (err) {
    console.error("Error ensuring ubigeo data:", err);
  }
}

// Call on startup
ensureUbigeoData().catch(console.error);

app.get("/api/ubigeo/paises", async (req, res) => {
  try {
    await ensureUbigeoData();
    let paises = await prisma.pais.findMany({ orderBy: { nombre: 'asc' } });
    if (paises.length === 0) {
      paises = [
        { id: 'PER', nombre: 'Perú' },
        { id: 'CHL', nombre: 'Chile' },
        { id: 'COL', nombre: 'Colombia' },
        { id: 'MEX', nombre: 'México' }
      ] as any;
    }
    res.json(paises);
  } catch (err) {
    res.json([
      { id: 'PER', nombre: 'Perú' },
      { id: 'CHL', nombre: 'Chile' },
      { id: 'COL', nombre: 'Colombia' },
      { id: 'MEX', nombre: 'México' }
    ]);
  }
});

app.get("/api/ubigeo/provincias", async (req, res) => {
  try {
    await ensureUbigeoData();
    const { paisId } = req.query;
    let whereClause: any = {};
    if (paisId) {
      const pStr = String(paisId).trim();
      whereClause = {
        OR: [
          { paisId: pStr },
          { pais: { nombre: { contains: pStr, mode: 'insensitive' } } }
        ]
      };
    }
    let provincias = await prisma.provincia.findMany({ where: whereClause, orderBy: { nombre: 'asc' } });
    res.json(provincias);
  } catch (err) {
    console.error("Error fetching provincias:", err);
    res.status(500).json({ error: "Error fetching provincias" });
  }
});

app.get("/api/ubigeo/distritos", async (req, res) => {
  try {
    await ensureUbigeoData();
    const { provinciaId } = req.query;
    if (!provinciaId) {
      let distritos = await prisma.distrito.findMany({ orderBy: { nombre: 'asc' }, take: 100 });
      return res.json(distritos);
    }
    const provStr = String(provinciaId).trim();
    
    // Exact ID match first
    let distritos = await prisma.distrito.findMany({ 
      where: { provinciaId: provStr }, 
      orderBy: { nombre: 'asc' } 
    });
    
    // Match by province name if ID didn't match directly
    if (distritos.length === 0) {
      const provByName = await prisma.provincia.findFirst({
        where: {
          OR: [
            { nombre: { contains: provStr, mode: 'insensitive' } },
            { id: { startsWith: provStr } }
          ]
        }
      });
      if (provByName) {
        distritos = await prisma.distrito.findMany({
          where: { provinciaId: provByName.id },
          orderBy: { nombre: 'asc' }
        });
      }
    }
    res.json(distritos);
  } catch (err) {
    console.error("Error fetching distritos:", err);
    res.status(500).json({ error: "Error fetching distritos" });
  }
});

app.get("/api/clients", async (req, res) => {
  try {
    res.json(await prisma.client.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

async function generateClientCode(): Promise<string> {
  const count = await prisma.client.count();
  return `CLI-${(count + 1).toString().padStart(3, '0')}`;
}

async function generateContractCode(): Promise<string> {
  const count = await prisma.contratoNuevo.count();
  return `COT-2026-${(count + 1).toString().padStart(3, '0')}`;
}

async function generateOtCode(): Promise<string> {
  const count = await prisma.oT.count();
  return `OT-2026-${(count + 1).toString().padStart(3, '0')}`;
}

async function generateVisitaCode(): Promise<string> {
  const count = await prisma.visita.count();
  const year = new Date().getFullYear();
  return `VIS-${year}-${(count + 1).toString().padStart(4, '0')}`;
}

async function generateStandaloneEquipoCode(tipo?: string): Promise<string> {
  const count = await prisma.equipo.count();
  const typePrefix = (tipo || '').toUpperCase().includes('UPS') ? 'UPS' : 'TAB';
  return `EQ-${typePrefix}-${(count + 1).toString().padStart(3, '0')}`;
}

app.post("/api/clients", async (req, res) => {
  try {
    const newClient = req.body;
    if (!newClient.id || newClient.id.startsWith('client_')) {
      newClient.id = await generateClientCode();
    } else {
      const existing = await prisma.client.findUnique({
        where: { id: newClient.id }
      });
      if (existing) {
        return res.status(400).json({ error: `El código de cliente '${newClient.id}' ya está registrado.` });
      }
    }
    const created = await prisma.client.create({ data: newClient });
    res.status(201).json(created);
  } catch (err: any) {
    console.error("Error al crear cliente:", err);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

app.put("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = { ...req.body };
    delete clientData.id;
    const updated = await prisma.client.update({
      where: { id },
      data: clientData,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

app.get("/api/contracts", async (req, res) => {
  try {
    res.json(await prisma.contract.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/contracts", async (req, res) => {
  try {
    const newContract = req.body;
    if (!newContract.id) newContract.id = `contra_${Date.now()}`;
    const created = await prisma.contract.create({ data: newContract });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ================= Visitas Endpoints =================
app.get("/api/visitas", async (req, res) => {
  try {
    const { tecnicoTitularId, fechaProgramada, estado, clientId } = req.query;
    const where: any = {};
    if (tecnicoTitularId) where.tecnicoTitularId = String(tecnicoTitularId);
    if (fechaProgramada) where.fechaProgramada = String(fechaProgramada);
    if (estado) where.estado = String(estado);
    if (clientId) where.clientId = String(clientId);

    const visitas = await prisma.visita.findMany({ where, orderBy: { creadoEn: 'desc' } });
    res.json(visitas);
  } catch (err) {
    console.error("Error listando visitas:", err);
    res.status(500).json({ error: "Error listando visitas" });
  }
});

app.get("/api/visitas/:id", async (req, res) => {
  try {
    const visita = await prisma.visita.findUnique({ where: { id: req.params.id } });
    if (!visita) return res.status(404).json({ error: "Visita no encontrada" });
    res.json(visita);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo visita" });
  }
});

app.get("/api/visitas/:id/ots", async (req, res) => {
  try {
    const ots = await prisma.oT.findMany({ where: { visitaId: req.params.id } });
    res.json(ots);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo OTs de la visita" });
  }
});

app.post("/api/visitas", async (req, res) => {
  try {
    const visitaData = { ...req.body };
    if (!visitaData.codigo) {
      visitaData.codigo = await generateVisitaCode();
    }
    const created = await prisma.visita.create({ data: visitaData });
    res.status(201).json(created);
  } catch (err) {
    console.error("Error creando visita:", err);
    res.status(500).json({ error: "Error creando visita" });
  }
});

app.put("/api/visitas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.creadoEn;
    delete updateData.actualizadoEn;

    const updatedVisita = await prisma.visita.update({
      where: { id },
      data: updateData
    });

    // Cascade status updates to child OTs when logistics state changes
    if (updateData.estado === 'En Camino' || updateData.estado === 'En Sitio' || updateData.estado === 'Completada') {
      await prisma.oT.updateMany({
        where: { visitaId: id },
        data: { estado: updateData.estado }
      });
    }

    res.json(updatedVisita);
  } catch (err) {
    console.error("Error actualizando visita:", err);
    res.status(500).json({ error: "Error actualizando visita" });
  }
});

app.get("/api/ots", async (req, res) => {
  try {
    res.json(await prisma.oT.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/ots", async (req, res) => {
  try {
    const { contratoId, adendaId, costo_estimado_usd, ...otData } = req.body;
    if (!otData.id || otData.id.startsWith('OT-1')) {
      otData.id = await generateOtCode();
    }

    // Auto-derive tipoEquipo and potenciaKva from Equipo if equipoId is set
    if (otData.equipoId) {
      const equipo = await prisma.equipo.findUnique({ where: { id: otData.equipoId } });
      if (equipo) {
        if (!otData.tipoEquipo) otData.tipoEquipo = equipo.tipo;
        if (otData.potenciaKva === undefined || otData.potenciaKva === null) {
          otData.potenciaKva = equipo.potenciaKva ?? 0;
        }
      }
    }
    if (otData.potenciaKva === undefined || otData.potenciaKva === null) {
      otData.potenciaKva = 0;
    }

    // Auto-create matching OrdenTrabajoLinea in database
    let clientReasonSocial = "Cliente General";
    let clientRuc = "S/D";
    let clientContact = "Responsable";
    let targetClientId = otData.clientId || null;

    if (targetClientId) {
      const client = await prisma.client.findUnique({ where: { id: targetClientId } });
      if (client) {
        clientReasonSocial = client.razonSocial;
        clientRuc = client.ruc;
        clientContact = client.contactoNombre;
      }
    }

    let contractNum = "S/D";
    let contractOc = "S/D";
    let contractComercial = "S/D";
    if (contratoId) {
      const contract = await prisma.contratoNuevo.findUnique({ where: { id: contratoId } });
      if (contract) {
        contractNum = contract.n_contrato || "S/D";
        contractOc = contract.oc || "S/D";
        contractComercial = contract.comercial || "S/D";

        if (clientReasonSocial === "Cliente General") {
          if (contract.cliente) {
            clientReasonSocial = contract.cliente;
          }
          if (contract.clientId) {
            targetClientId = contract.clientId;
            const clientFromContract = await prisma.client.findUnique({ where: { id: contract.clientId } });
            if (clientFromContract) {
              clientReasonSocial = clientFromContract.razonSocial;
              clientRuc = clientFromContract.ruc;
              clientContact = clientFromContract.contactoNombre;
            }
          }
        }
      }
    }

    if (clientReasonSocial === "Cliente General" && otData.equipoId) {
      const equipo = await prisma.equipo.findUnique({ where: { id: otData.equipoId } });
      if (equipo && (equipo as any).cliente) {
        clientReasonSocial = (equipo as any).cliente;
      }
    }

    if (targetClientId && !otData.clientId) {
      otData.clientId = targetClientId;
    }

    const maxMarco = await prisma.ordenTrabajoLinea.aggregate({ _max: { ot_marco: true } });
    const otMarcoNum = (maxMarco._max.ot_marco || 90000) + 1;

    const MESES_ESPANOL = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthName = MESES_ESPANOL[today.getMonth()];
    const currentDateStr = today.toISOString().split('T')[0];

    const costo = costo_estimado_usd ? Number(costo_estimado_usd) : 0;

    const financialLineData = {
      id: `otl_${otData.id || Date.now()}`,
      anio: currentYear,
      ot_marco: otMarcoNum,
      ot: (otData.id || `OT-${Date.now()}`).replace('OT-', ''),
      mes: currentMonthName,
      fecha: currentDateStr,
      nombre_solicitante: clientContact,
      razon_social: clientReasonSocial,
      clientId: otData.clientId || targetClientId || null,
      empresa: clientReasonSocial,
      descripcion: `${otData.tipoMantenimiento || 'Servicio'} de ${otData.tipoEquipo || 'Equipo'} - Código OT: ${otData.id || ''}`,
      n_cotizacion: contractNum,
      n_oc_os: contractOc,
      simbolo_moneda: '$',
      monto_marco_sin_igv: costo,
      monto_marco_inc_igv: Number((costo * 1.18).toFixed(2)),
      sub_importe_sin_igv: costo,
      sub_importe_inc_igv: Number((costo * 1.18).toFixed(2)),
      total_usd: costo,
      anio_prog_facturacion: currentYear,
      mes_prog_servicio: currentMonthName,
      mes_prog_facturacion: currentMonthName,
      tipo_venta: 'MANTENIMIENTO',
      pendiente: 'POR EJECUTAR',
      estado: 'POR FACTURAR',
      n_factura: '',
      comercial: contractComercial,
      contratoId: contratoId || null,
      adendaId: adendaId || null,
      otTecnicaId: otData.id || null,
      equipoId: otData.equipoId || null
    };

    if (contratoId && costo_estimado_usd) {
      const contrato = await prisma.contratoNuevo.findUnique({
        where: { id: contratoId }
      });

      if (!contrato) {
        return res.status(404).json({ error: "Contrato no encontrado" });
      }

      const saldoActual = contrato.saldo_disponible_usd ?? contrato.presupuesto_total_usd ?? 0;

      if (saldoActual < costo) {
        return res.status(400).json({ error: "Saldo insuficiente en el contrato marco", saldoDisponible: saldoActual });
      }

      // Start transaction to create OT, deduct balance, and create OrdenTrabajoLinea
      const [createdOt, updatedContrato, createdLine] = await prisma.$transaction([
        prisma.oT.create({
          data: { ...otData, contratoId, adendaId: adendaId || null, costo_estimado_usd: costo }
        }),
        prisma.contratoNuevo.update({
          where: { id: contratoId },
          data: { saldo_disponible_usd: saldoActual - costo }
        }),
        prisma.ordenTrabajoLinea.create({
          data: financialLineData
        })
      ], { timeout: 15000 });

      return res.status(201).json(createdOt);
    } else {
      // Normal OT creation (includes automatically created financial line)
      const [created, createdLine] = await prisma.$transaction([
        prisma.oT.create({ 
          data: { 
            ...otData, 
            contratoId: contratoId || null, 
            adendaId: adendaId || null, 
            costo_estimado_usd: costo_estimado_usd ? Number(costo_estimado_usd) : null 
          } 
        }),
        prisma.ordenTrabajoLinea.create({
          data: financialLineData
        })
      ], { timeout: 15000 });
      return res.status(201).json(created);
    }
  } catch (err: any) {
    console.error("Error creating OT:", err);
    res.status(500).json({ error: "Error al crear la OT", details: err?.message || String(err) });
  }
});

app.put("/api/ots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id: _, correccionesSupervisor, ...bodyData } = req.body;
    const updatedOt = await prisma.oT.update({
      where: { id },
      data: bodyData
    });

    if (correccionesSupervisor) {
      await prisma.technicalReport.updateMany({
        where: { otId: id },
        data: { correccionesSupervisor }
      }).catch(() => {});
    }

    if (updatedOt.estado === "Conformidad Firmada (Listo para Facturar)" || 
        updatedOt.estado === "Aprobada" || 
        updatedOt.estado === "Firmada") {
      // Search by otFinancieraId OR by OT number — always sync regardless of whether otFinancieraId is set
      const finId = updatedOt.otFinancieraId;
      const lines = await prisma.ordenTrabajoLinea.findMany({
        where: {
          OR: [
            ...(finId ? [{ id: finId }] : []),
            { otTecnicaId: updatedOt.id },
            { ot: updatedOt.id },
            { ot: updatedOt.id.replace('OT-', '') }
          ]
        }
      });

      for (const line of lines) {
        const statusArray: any[] = Array.isArray(line.estatus) ? line.estatus : [];
        const alreadyHasLog = statusArray.some((e: any) => e.texto && e.texto.includes("marcada como EJECUTADO"));
        if (!alreadyHasLog) {
          statusArray.push({
            fecha: new Date().toISOString().split("T")[0],
            autor: "Sistema Automatizado",
            texto: `Aprobación o Firma registrada. OT Técnica ${updatedOt.id} marcada como EJECUTADO y lista para facturar.`
          });
        }
        await prisma.ordenTrabajoLinea.update({
          where: { id: line.id },
          data: {
            pendiente: "EJECUTADO",
            estado: "POR FACTURAR",
            listaParaFacturar: true,
            estatus: statusArray
          }
        });
      }
    }

    // Auto-create ServicioEquipo when OT is signed/approved and has equipoId
    if (updatedOt.equipoId && ["Conformidad Firmada (Listo para Facturar)", "Aprobada", "Firmada"].includes(updatedOt.estado)) {
      const equipoIds = updatedOt.equipoId.split(',').map((id: string) => id.trim()).filter(Boolean);
      for (const singleEquipoId of equipoIds) {
        const existingServices = await prisma.servicioEquipo.count({
          where: { otId: updatedOt.id, equipoId: singleEquipoId }
        });
        if (existingServices === 0) {
          // Try to get report data for richer service record
          let reportData: any = null;
          try {
            reportData = await prisma.technicalReport.findFirst({
              where: { otId: updatedOt.id, equipoId: singleEquipoId }
            });
          } catch {}

          // Derive estado_post intelligently from the technical report
          // If revisionNormas.estadoOperativo === false, the equipment is in observation; else Operativo
          let estadoPost = 'Operativo';
          if (reportData?.revisionNormas) {
            const normas = typeof reportData.revisionNormas === 'string'
              ? JSON.parse(reportData.revisionNormas)
              : reportData.revisionNormas;
            if (normas?.estadoOperativo === false) {
              estadoPost = 'En observación';
            }
          }

          await prisma.servicioEquipo.create({
            data: {
              equipoId: singleEquipoId,
              otId: updatedOt.id,
              fecha: (updatedOt as any).horaInicioServicio
                ? (updatedOt as any).horaInicioServicio.split('T')[0]
                : updatedOt.fechaProgramada || new Date().toISOString().split('T')[0],
              tipo: (updatedOt as any).tipoMantenimiento || 'Preventivo',
              estado_post: estadoPost,
              tecnicoTitular: (updatedOt as any).tecnicoTitular || 'Sistema',
              hallazgos: reportData?.observacionesDiagnostico || null,
              recomendaciones: reportData?.recomendaciones || null
            }
          });

          // Sync equipo.estado if service left equipment in observation/repair
          if (estadoPost !== 'Operativo') {
            await prisma.equipo.update({
              where: { id: singleEquipoId },
              data: { estado: estadoPost }
            });
          }
        }
      }
    }

    res.json(updatedOt);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Error al actualizar la Orden de Trabajo" });
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    const { otId, equipoId } = req.query;
    const where: any = {};
    if (otId) where.otId = otId as string;
    if (equipoId) where.equipoId = equipoId as string;
    res.json(await prisma.technicalReport.findMany({ where }));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});
async function processReportPhotos(report: any): Promise<{ report: any; uploadedUrls: string[] }> {
  const uploadedUrls: string[] = [];
  const clonedReport = JSON.parse(JSON.stringify(report));
  const otId = clonedReport.otId || "UNKNOWN";

  try {
    if (Array.isArray(clonedReport.fotosLabeled)) {
      for (let i = 0; i < clonedReport.fotosLabeled.length; i++) {
        const item = clonedReport.fotosLabeled[i];
        if (item && typeof item.base64 === "string" && item.base64.startsWith("data:image/")) {
          const s3Url = await uploadBase64ToS3(item.base64, otId, i);
          uploadedUrls.push(s3Url);
          item.base64 = s3Url;
        }
      }
    }

    if (Array.isArray(clonedReport.fotos)) {
      for (let i = 0; i < clonedReport.fotos.length; i++) {
        const base64Str = clonedReport.fotos[i];
        if (typeof base64Str === "string" && base64Str.startsWith("data:image/")) {
          if (clonedReport.fotosLabeled && clonedReport.fotosLabeled[i] && clonedReport.fotosLabeled[i].base64.startsWith("/api/photos/")) {
            clonedReport.fotos[i] = clonedReport.fotosLabeled[i].base64;
          } else {
            const s3Url = await uploadBase64ToS3(base64Str, otId, `flat-${i}`);
            uploadedUrls.push(s3Url);
            clonedReport.fotos[i] = s3Url;
          }
        }
      }
    }

    if (typeof clonedReport.firmaCliente === "string" && clonedReport.firmaCliente.startsWith("data:image/")) {
      const s3Url = await uploadBase64ToS3(clonedReport.firmaCliente, otId, "firma");
      uploadedUrls.push(s3Url);
      clonedReport.firmaCliente = s3Url;
    }

    if (typeof clonedReport.panoramaFoto === "string" && clonedReport.panoramaFoto.startsWith("data:image/")) {
      const s3Url = await uploadBase64ToS3(clonedReport.panoramaFoto, otId, "panorama");
      uploadedUrls.push(s3Url);
      clonedReport.panoramaFoto = s3Url;
    }

    return { report: clonedReport, uploadedUrls };
  } catch (err) {
    for (const url of uploadedUrls) {
      await deleteFromS3(url);
    }
    throw err;
  }
}

const VALID_REPORT_FIELDS = new Set([
  'id','otId','equipoId','voltajeEntrada','voltajeSalida',
  'indicadoresBateria','observacionesDiagnostico','comentariosAdicionales',
  'firmaCliente','correccionesSupervisor','creadoEn','modificadoEn',
  'offlineDirty','fotos','informeN','hojaServicioN','asunto',
  'fechaServicio','horaInicio','tecnico1','tecnico2','antecedentes',
  'accionesRealizadas','pasos','caracteristicas','fotosLabeled',
  'medicionesEntrada','medicionesSalida','diagnosticoGabinete',
  'revisionNormas','recomendaciones',
  'tipoServicio','horaFin','panoramaFoto','pasosLista'
]);

function sanitizeForPrisma(data: any): any {
  const clean: any = {};
  for (const key of Object.keys(data)) {
    if (VALID_REPORT_FIELDS.has(key)) {
      clean[key] = data[key];
    }
  }
  return clean;
}

app.post("/api/reports", async (req, res) => {
  let uploadedUrls: string[] = [];
  try {
    const reportBody = req.body;
    console.log("[POST /api/reports] incoming keys:", Object.keys(reportBody || {}));
    console.log("[POST /api/reports] otId:", reportBody?.otId);
    console.log("[POST /api/reports] equipoId:", reportBody?.equipoId);
    console.log("[POST /api/reports] id:", reportBody?.id);
    console.log("[POST /api/reports] fotosLabeled type:", Array.isArray(reportBody?.fotosLabeled) ? `array(${reportBody.fotosLabeled.length})` : typeof reportBody?.fotosLabeled);
    if (Array.isArray(reportBody?.fotosLabeled) && reportBody.fotosLabeled.length > 0) {
      console.log("[POST /api/reports] fotosLabeled[0] keys:", Object.keys(reportBody.fotosLabeled[0] || {}));
      console.log("[POST /api/reports] fotosLabeled[0].base64 type:", typeof reportBody.fotosLabeled[0]?.base64);
      const b64 = reportBody.fotosLabeled[0]?.base64;
      console.log("[POST /api/reports] fotosLabeled[0].base64 startsWith:", typeof b64 === 'string' ? b64.slice(0, 80) : b64);
    }
    console.log("[POST /api/reports] ALL keys:", JSON.stringify(Object.keys(reportBody || {})));
    const { otId, ...data } = reportBody;

    // Log completo del body para diagnóstico
    try {
      const fs = await import('fs/promises');
      const safeLog = JSON.stringify(reportBody, (k, v) => {
        if (typeof v === 'string' && v.length > 100) return v.slice(0, 100) + `...(${v.length} chars)`;
        return v;
      }, 2);
      await fs.writeFile(path.join(process.cwd(), 'request-debug.log'), `${new Date().toISOString()}\n${safeLog}\n\n`, { flag: 'a' });
    } catch {}

    if (!otId) {
      return res.status(400).json({ error: "otId es obligatorio" });
    }

    // Process and upload photos to S3 or local storage
    const processed = await processReportPhotos(reportBody);
    uploadedUrls = processed.uploadedUrls;
    const finalReport = processed.report;

    const cleanFullReport = sanitizeForPrisma(finalReport);
    const { otId: finalOtId, id: reportId, equipoId: targetEquipoId, ...cleanData } = cleanFullReport;

    const targetEqId = targetEquipoId || finalReport.equipoId || null;

    // Search for existing report by otId and equipoId
    const existingReport = await prisma.technicalReport.findFirst({
      where: {
        otId: finalOtId,
        equipoId: targetEqId
      }
    });

    let saved: any;
    if (existingReport) {
      saved = await prisma.technicalReport.update({
        where: { id: existingReport.id },
        data: {
          ...cleanData,
          equipoId: targetEqId,
          offlineDirty: false,
          modificadoEn: new Date().toISOString()
        }
      });
      console.log(`[Report Sync] Reporte actualizado exitosamente (id: ${saved.id}) para OT ${finalOtId}`);
    } else {
      const newId = reportId || finalReport.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      saved = await prisma.technicalReport.create({
        data: {
          ...cleanFullReport,
          id: newId,
          otId: finalOtId,
          equipoId: targetEqId,
          offlineDirty: false,
          creadoEn: finalReport.creadoEn || new Date().toISOString(),
          modificadoEn: new Date().toISOString()
        }
      });
      console.log(`[Report Sync] Reporte creado exitosamente (id: ${saved.id}) para OT ${finalOtId}`);
    }

    // Auto-sync linked OrdenTrabajoLinea execution status to EJECUTADO in DB
    const cleanOtNumber = finalOtId.replace('OT-', '');
    const syncRes = await prisma.ordenTrabajoLinea.updateMany({
      where: {
        OR: [
          { otTecnicaId: finalOtId },
          { ot: finalOtId },
          { ot: cleanOtNumber }
        ]
      },
      data: {
        pendiente: 'EJECUTADO'
      }
    }).catch(e => {
      console.error("Error auto-syncing OT Financial line execution status:", e);
      return { count: 0 };
    });
    console.log(`[Report Sync] Updated ${syncRes?.count ?? 0} OrdenTrabajoLinea for OT ${finalOtId} (clean: ${cleanOtNumber})`);

    res.status(201).json(saved);
  } catch (err: any) {
    console.error("Error al guardar reporte técnico:", err?.message);
    console.error("Error stack:", err?.stack);
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(path.join(process.cwd(), 'error-debug.log'), `Time: ${new Date().toISOString()}\nMessage: ${err?.message}\nStack: ${err?.stack}\n\n`, { flag: 'a' });
    } catch {}
    // Rollback uploads if DB save fails
    for (const url of uploadedUrls) {
      await deleteFromS3(url);
    }
    const errMsg = (err?.message || "Error al procesar el reporte técnico").slice(0, 2000);
    res.status(500).json({ error: errMsg });
  }
});

app.get("/api/photos/*", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const user = req.user;
  const key = req.params[0];

  // Validate path pattern
  const pathRegex = /^reports\/OT-[\w-]+\/[\w.-]+$/;
  if (!pathRegex.test(key)) {
    return res.status(400).json({ error: "Formato de archivo o ruta inválidos" });
  }

  const otIdMatch = key.match(/^reports\/(OT-[\w-]+)\//);
  if (!otIdMatch) {
    return res.status(400).json({ error: "Formato de ruta inválido" });
  }
  const otId = otIdMatch[1];

  try {
    const ot = await prisma.oT.findUnique({
      where: { id: otId }
    });
    if (!ot) {
      return res.status(404).json({ error: "Orden de trabajo asociada no encontrada" });
    }

    const isAllowed = 
      ["Administrador", "Ventas", "Supervisor"].includes(user.role) ||
      (user.role === "Tecnico" && (ot.tecnicoTitularId === user.id || ot.tecnicoApoyoId === user.id)) ||
      (user.role === "Cliente" && ot.clientId === user.clientId);

    if (!isAllowed) {
      return res.status(403).json({ error: "Acceso denegado a este recurso" });
    }

    // Pre-signed URL generation if requested
    if (req.query.presign === 'true' && process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }), { expiresIn: 900 });
      return res.json({ url: presignedUrl, expiresIn: 900 });
    }

    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );

    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(500).json({ error: "Archivo sin contenido" });
    }
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return res.status(404).json({ error: "Imagen no encontrada en S3" });
    }
    console.error("Error al obtener imagen de S3:", err);
    res.status(500).json({ error: "Error al recuperar recurso" });
  }
});

app.get("/api/contracts/files/*", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  let rawKey = decodeURIComponent(req.params[0] || '').replace(/^\/+/, '');
  const key = rawKey.startsWith('contracts/') ? rawKey : `contracts/${rawKey}`;

  const isAllowed = ["Administrador", "Ventas", "Supervisor"].includes(req.user.role);
  if (!isAllowed) {
    return res.status(403).json({ error: "Acceso denegado a este recurso" });
  }

  try {
    // Pre-signed URL generation if requested
    if (req.query.presign === 'true' && process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }), { expiresIn: 900 });
      return res.json({ url: presignedUrl, expiresIn: 900 });
    }

    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );

    res.setHeader("Content-Type", s3Response.ContentType || "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `inline; filename="${key.split('/').pop()}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(500).json({ error: "Archivo sin contenido" });
    }
  } catch (error: any) {
    // Check local fallback
    try {
      const fs = await import('fs');
      const cleanContractDir = key.replace('contracts/', 'contracts-');
      const localPath = path.join(process.cwd(), 'uploads', cleanContractDir);
      if (fs.existsSync(localPath)) {
        res.setHeader("Content-Type", "application/pdf");
        return fs.createReadStream(localPath).pipe(res);
      }
    } catch (localErr) {}
    console.warn("Contract file not found in S3 or local uploads:", key);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// ----- Secure file serving for equipment photos -----
app.get("/api/equipos/files/*", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const key = req.params[0];
  const pathRegex = /^equipo\/[\w-]+\/[\w.-]+$/;
  if (!pathRegex.test(key)) {
    return res.status(400).json({ error: "Formato de archivo o ruta inválidos" });
  }
  const isAllowed = ["Administrador", "Ventas", "Supervisor"].includes(req.user.role);
  if (!isAllowed) {
    return res.status(403).json({ error: "Acceso denegado a este recurso" });
  }
  try {
    // Pre-signed URL generation if requested
    if (req.query.presign === 'true' && process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }), { expiresIn: 900 });
      return res.json({ url: presignedUrl, expiresIn: 900 });
    }

    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(500).json({ error: "Archivo sin contenido" });
    }
  } catch (error: any) {
    console.error("Error retrieving equipment photo:", error);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// Bulk offline sync
app.post("/api/sync", async (req, res) => {
  console.log(">>> SYNC REQUEST RECEIVED");
  try {
    const { reports, ots, visitas, clients, contracts, ordenesTrabajo, contratosNuevos, users, logs } = req.body;

    if (Array.isArray(visitas)) {
      for (const sv of visitas) {
        const svDataClean = { ...sv };
        delete svDataClean.creadoEn;
        delete svDataClean.actualizadoEn;

        const existing = sv.id ? await prisma.visita.findUnique({ where: { id: sv.id } }) : null;
        if (existing) {
          delete svDataClean.id;
          await prisma.visita.update({ where: { id: sv.id }, data: svDataClean });
        } else {
          await prisma.visita.create({ data: svDataClean });
        }
      }
    }

    if (Array.isArray(reports)) {
      const cleanReports = reports.filter(r => r.otId !== 'OT-003' && r.id !== 'rpt_003');
      for (const sr of cleanReports) {
        let reportToSave = sr;
        let s3Failed = false;

        try {
          const processed = await processReportPhotos(sr);
          reportToSave = processed.report;
        } catch (s3Error) {
          console.error(`Error processing S3 photos for report in sync (OT: ${sr.otId}):`, s3Error);
          s3Failed = true;
        }

        const { otId, ...data } = reportToSave;
        await prisma.technicalReport.upsert({
          where: {
            otId_equipoId: {
              otId: otId,
              equipoId: reportToSave.equipoId || null
            }
          },
          update: { ...data, offlineDirty: s3Failed },
          create: { ...reportToSave, offlineDirty: s3Failed }
        });
        await prisma.oT.updateMany({
          where: { id: otId },
          data: { estado: 'Sometido a Revisión' }
        });
      }
    }

    if (Array.isArray(ots)) {
      const cleanOts = ots.filter(o => o.id !== 'OT-003');
      for (const so of cleanOts) {
        const existing = await prisma.oT.findUnique({ where: { id: so.id } });
        if (existing) {
          const serverAdvanced = ['Aprobada', 'Firmada', 'Facturada', 'Cerrada'].includes(existing.estado);
          const clientAdvanced = ['Aprobada', 'Firmada', 'Facturada', 'Cerrada'].includes(so.estado);
          const updateData = { ...so };
          if (serverAdvanced && !clientAdvanced) {
            updateData.estado = existing.estado;
          }
          await prisma.oT.update({ where: { id: so.id }, data: updateData });
        } else {
          await prisma.oT.create({ data: so });
        }
      }
    }

    if (Array.isArray(clients)) {
      for (const sc of clients) {
        await prisma.client.upsert({ where: { id: sc.id }, update: sc, create: sc });
      }
    }

    if (Array.isArray(contracts)) {
      for (const sc of contracts) {
        await prisma.contract.upsert({ where: { id: sc.id }, update: sc, create: sc });
      }
    }

    if (Array.isArray(ordenesTrabajo)) {
      for (const sol of ordenesTrabajo) {
        // Descartamos los campos UI-only que NO existen en el schema Prisma
        // (ver Documentacion/data_dictionary.md → 'Campos removidos en
        // homologacion'). Los campos canonicos del schema que si deseamos
        // persistir (n_factura, fecha_factura, sub_importe_sin_igv, etc.)
        // pasan intactos en `rest`.
        const {
          nro_guia_informe, observacion, seguimiento, tipo_contratacion,
          creadoPor, creadoEn, modificadoPor, modificadoEn,
          anio_factura, mes_factura,
          dia_prog_servicio, dia_prog_facturacion,
          ...rest
        } = sol;
        const insertData = { ...rest };
        const existing = await prisma.ordenTrabajoLinea.findUnique({ where: { id: sol.id } });
        if (existing) {
          if (existing.estado === 'FACTURADO' && insertData.estado !== 'FACTURADO') {
            insertData.estado = existing.estado;
            insertData.pendiente = existing.pendiente;
            insertData.n_factura = existing.n_factura;
          }
          await prisma.ordenTrabajoLinea.update({ where: { id: sol.id }, data: insertData });
        } else {
          await prisma.ordenTrabajoLinea.create({ data: insertData });
        }
      }
    }

    if (Array.isArray(contratosNuevos)) {
      const allowedKeys = [
        'id', 'anio', 'n_contrato', 'comercial', 'comercialId', 'cliente', 'clientId',
        'detalle', 'monto_sin_igv', 'monto_inc_igv', 'monto_facturar_sin_igv', 'monto_facturar_inc_igv',
        'monto_facturado_sin_igv', 'monto_facturado_inc_igv', 'por_facturar_sin_igv', 'por_facturar_inc_igv',
        'monto_pagado_sin_igv', 'monto_pagado_inc_igv', 'pendiente_pago_sin_igv', 'pendiente_pago_inc_igv',
        'vence', 'oc', 'h2h_bcp', 'estado', 'tipo_contract', 'tipo_contrato',
        'fecha_inicio', 'fecha_fin', 'fecha_fin_original', 'comentarios', 'presupuesto_total_usd',
        'saldo_disponible_usd', 'monto_original', 'moneda', 'pdf_url'
      ];
      for (const scc of contratosNuevos) {
        const sanitized: any = {};
        for (const key of allowedKeys) {
          if (scc[key] !== undefined) {
            sanitized[key] = scc[key];
          }
        }
        await prisma.contratoNuevo.upsert({
          where: { id: scc.id },
          update: sanitized,
          create: sanitized
        });
      }
    }

    // Skip synchronization of users table from client body to prevent security issues and local cache overrides
    // User accounts should only be managed via /api/users endpoints by authorized admins.

    if (Array.isArray(logs) && logs.length > 0) {
      // In old code this replaced all logs, but it's safer to just push missing ones. We'll skip complex merging and just createMany.
      for (const l of logs) {
        const exists = await prisma.userActivityLog.findUnique({ where: { id: l.id } });
        if (!exists) await prisma.userActivityLog.create({ data: l });
      }
    }
    
    // Helper: el cliente Prisma ya devuelve los campos con su nombre canonico
    // (n_factura, fecha_factura) segun el schema. Los aliases @map son solo a
    // nivel de columna DB, no afectan el cliente. No se requiere mapeo.
    const mapLineaToFrontend = (linea: any) => linea;

    // Return all data
    const rawLineas = await prisma.ordenTrabajoLinea.findMany();
    res.json({
      success: true,
      ots: await prisma.oT.findMany(),
      reports: await prisma.technicalReport.findMany(),
      clients: await prisma.client.findMany(),
      contracts: await prisma.contract.findMany(),
      ordenesTrabajo: rawLineas.map(mapLineaToFrontend),
      contratosNuevos: await prisma.contratoNuevo.findMany(),
      users: await prisma.user.findMany(),
      logs: await prisma.userActivityLog.findMany()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error parsing sync data" });
  }
});

app.get("/api/ot-lineas", async (req, res) => {
  try {
    const rawLineas = await prisma.ordenTrabajoLinea.findMany();
    res.json(rawLineas);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener líneas de OT" });
  }
});

app.post("/api/ot-lineas", async (req, res) => {
  try {
    const newLinea = req.body;
    if (!newLinea.id) newLinea.id = `otl_${Date.now()}`;
    const created = await prisma.ordenTrabajoLinea.create({ data: newLinea });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error al crear línea de OT" });
  }
});

app.put("/api/ot-lineas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = { ...req.body };

    // Guard: bloquear cualquier modificación si la línea ya está FACTURADA.
    // La OT facturada es de solo lectura (verificación en el backend como fuente
    // de verdad; el frontend también aplica readOnly, pero aquí nos defended contra
    // cualquier cliente fuera de la UI oficial).
    const existing = await prisma.ordenTrabajoLinea.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Línea no encontrada" });
      return;
    }
    const existingEstado = (existing.estado || existing.pendiente || '').toString().toUpperCase();
    if (existingEstado === 'FACTURADO') {
      res.status(409).json({
        error: "La línea ya está facturada y no puede modificarse",
        code: "LINE_LOCKED_FACTURADO",
        line: existing
      });
      return;
    }

    // Standardized automatic status determination: If invoice number is provided -> FACTURADO
    const invNumber = (updatePayload.n_factura || '').toString().trim();
    if (invNumber !== '') {
      updatePayload.n_factura = invNumber;
      updatePayload.estado = 'FACTURADO';
      updatePayload.pendiente = 'FACTURADO';
    }

    const updatedLine = await prisma.ordenTrabajoLinea.update({
      where: { id },
      data: updatePayload
    });

    if (updatedLine.ot_marco) {
      await prisma.ordenTrabajoLinea.updateMany({
        where: { ot_marco: updatedLine.ot_marco, id: { not: id } },
        data: {
          razon_social: updatedLine.razon_social,
          empresa: updatedLine.empresa,
          n_cotizacion: updatedLine.n_cotizacion,
          n_oc_os: updatedLine.n_oc_os,
          descripcion: updatedLine.descripcion,
          simbolo_moneda: updatedLine.simbolo_moneda,
          monto_marco_sin_igv: updatedLine.monto_marco_sin_igv,
          monto_marco_inc_igv: updatedLine.monto_marco_inc_igv,
          comercial: updatedLine.comercial,
        }
      });
    }

    // Auto-recalculate and sync main Contract balance and consumed amount
    let targetContractId = updatedLine.contratoId;
    if (!targetContractId && updatedLine.otTecnicaId) {
      const otTec = await prisma.oT.findUnique({ where: { id: updatedLine.otTecnicaId } });
      if (otTec && otTec.contratoId) {
        targetContractId = otTec.contratoId;
      }
    }

    if (targetContractId) {
      const otTecnicaIds = (await prisma.oT.findMany({
        where: { contratoId: targetContractId },
        select: { id: true }
      })).map(o => o.id);

      const contractLines = await prisma.ordenTrabajoLinea.findMany({
        where: {
          OR: [
            { contratoId: targetContractId },
            { otTecnicaId: { in: otTecnicaIds } }
          ]
        }
      });

      let totalFacturadoSinIgv = 0;
      let totalFacturadoIncIgv = 0;
      for (const line of contractLines) {
        if (line.n_factura || line.estado === 'FACTURADO' || line.pendiente === 'FACTURADO' || line.pendiente === 'EJECUTADO') {
          const valSinIgv = line.sub_importe_sin_igv || line.monto_marco_sin_igv || 0;
          const valIncIgv = line.sub_importe_inc_igv || line.monto_marco_inc_igv || Number((valSinIgv * 1.18).toFixed(2));
          totalFacturadoSinIgv += valSinIgv;
          totalFacturadoIncIgv += valIncIgv;
        }
      }

      const contract = await prisma.contratoNuevo.findUnique({ where: { id: targetContractId } });
      if (contract) {
        const totalBudget = contract.monto_sin_igv || contract.presupuesto_total_usd || contract.monto_original || 0;
        const newSaldo = Math.max(0, totalBudget - totalFacturadoSinIgv);
        await prisma.contratoNuevo.update({
          where: { id: targetContractId },
          data: {
            monto_facturado_sin_igv: totalFacturadoSinIgv,
            monto_facturado_inc_igv: totalFacturadoIncIgv,
            por_facturar_sin_igv: Math.max(0, totalBudget - totalFacturadoSinIgv),
            saldo_disponible_usd: newSaldo,
            presupuesto_total_usd: totalBudget > 0 ? totalBudget : undefined
          }
        });
      }
    }

    res.json(updatedLine);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la línea de OT" });
  }
});

async function uploadContractBase64ToS3(base64Str: string, contractId: string, filename: string): Promise<string> {
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Formato Base64 inválido");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const allowedMimeTypes = ["application/pdf"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}. Solo se admiten archivos PDF.`);
  }

  const buffer = Buffer.from(base64Data, "base64");
  
  if (buffer.length > 15728640) {
    throw new Error("El archivo excede el límite de tamaño de 15MB");
  }

  const cleanContractId = contractId.replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const key = `contracts/${cleanContractId}/${timestamp}-${cleanFilename}`;

  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      return `/api/contracts/files/${key}`;
    }
  } catch (s3Err) {
    console.warn("[S3 Upload Fallback] No se pudo subir contrato a S3:", (s3Err as any)?.message);
  }

  // Fallback local
  try {
    const fs = await import('fs/promises');
    const uploadsDir = path.join(process.cwd(), 'uploads', `contracts-${cleanContractId}`);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${timestamp}-${cleanFilename}`);
    await fs.writeFile(filePath, buffer);
    return `/uploads/contracts-${cleanContractId}/${timestamp}-${cleanFilename}`;
  } catch (err) {
    return `/api/contracts/files/${key}`;
  }
}

// Helper to upload equipment photos (images) to S3 under equipo/ prefix
async function uploadEquipoPhotoToS3(base64Str: string, equipoId: string, index: string | number): Promise<string> {
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Formato Base64 inválido");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Tipo MIME no permitido: ${mimeType}`);
  }
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > 8388608) {
    throw new Error("La imagen excede el límite de tamaño de 8MB");
  }
  let extension = "jpg";
  if (mimeType === "image/png") extension = "png";
  else if (mimeType === "image/webp") extension = "webp";
  const cleanEquipoId = equipoId.replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const key = `equipo/${cleanEquipoId}/${timestamp}-${index}.${extension}`;

  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      return `/api/equipos/files/${key}`;
    }
  } catch (s3Err) {
    console.warn("[S3 Upload Fallback] No se pudo subir foto de equipo a S3:", (s3Err as any)?.message);
  }

  // Fallback local
  try {
    const fs = await import('fs/promises');
    const uploadsDir = path.join(process.cwd(), 'uploads', `equipo-${cleanEquipoId}`);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${timestamp}-${index}.${extension}`);
    await fs.writeFile(filePath, buffer);
    return `/uploads/equipo-${cleanEquipoId}/${timestamp}-${index}.${extension}`;
  } catch (err) {
    return `/api/equipos/files/${key}`;
  }
}



// ----- Secure file serving for equipment photos -----
app.get("/api/equipos/files/*", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const key = req.params[0];
  const pathRegex = /^equipo\/[\w-]+\/[\w.-]+$/;
  if (!pathRegex.test(key)) {
    return res.status(400).json({ error: "Formato de archivo o ruta inválidos" });
  }
  const isAllowed = ["Administrador", "Ventas", "Supervisor"].includes(req.user.role);
  if (!isAllowed) {
    return res.status(403).json({ error: "Acceso denegado a este recurso" });
  }
  try {
    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(500).json({ error: "Archivo sin contenido" });
    }
  } catch (error: any) {
    console.error("Error retrieving equipment photo:", error);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// Helper to auto-generate equipment code: {contratoId}-E{seq} or {contratoId}-A{adendaNum}-E{seq}
async function generateEquipoCodigo(contratoId: string, adendaCodigo?: string): Promise<string> {
  let prefix: string;
  if (adendaCodigo) {
    const adendaMatch = adendaCodigo.match(/-A(\d+)$/);
    const adendaSuffix = adendaMatch ? `-A${adendaMatch[1]}` : '';
    prefix = `${contratoId}${adendaSuffix}`;
  } else {
    prefix = contratoId;
  }
  const existing = await prisma.equipo.findMany({
    where: { codigo: { startsWith: `${prefix}-E` } },
    select: { codigo: true }
  });
  let maxSeq = 0;
  for (const e of existing) {
    const match = e.codigo.match(/-E(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }
  return `${prefix}-E${maxSeq + 1}`;
}

// ----- OT Equipment Assignments Endpoints -----
app.get("/api/ot-equipo-asignaciones", async (req, res) => {
  try {
    const { otId } = req.query;
    const where: any = {};
    if (otId) where.otId = otId as string;
    const asignaciones = await prisma.otEquipoAsignacion.findMany({ where });
    res.json(asignaciones);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener asignaciones" });
  }
});

app.post("/api/ot-equipo-asignaciones", async (req, res) => {
  try {
    const {
      otId,
      equipoId,
      tecnicoTitularId,
      tecnicoTitular,
      tecnicoApoyoId,
      tecnicoApoyo,
      fecha,
      hora,
      horaFin
    } = req.body;

    if (!otId || !equipoId) {
      return res.status(400).json({ error: "otId y equipoId son obligatorios" });
    }

    const saved = await prisma.otEquipoAsignacion.upsert({
      where: {
        otId_equipoId: {
          otId,
          equipoId
        }
      },
      update: {
        tecnicoTitularId: tecnicoTitularId || null,
        tecnicoTitular: tecnicoTitular || null,
        tecnicoApoyoId: tecnicoApoyoId || null,
        tecnicoApoyo: tecnicoApoyo || null,
        fecha: fecha || null,
        hora: hora || null,
        horaFin: horaFin || null
      },
      create: {
        otId,
        equipoId,
        tecnicoTitularId: tecnicoTitularId || null,
        tecnicoTitular: tecnicoTitular || null,
        tecnicoApoyoId: tecnicoApoyoId || null,
        tecnicoApoyo: tecnicoApoyo || null,
        fecha: fecha || null,
        hora: hora || null,
        horaFin: horaFin || null
      }
    });

    const allAsignaciones = await prisma.otEquipoAsignacion.findMany({
      where: { otId }
    });

    const firstValid = allAsignaciones.find(a => a.tecnicoTitularId);
    if (firstValid) {
      const ot = await prisma.oT.findUnique({ where: { id: otId } });
      if (ot) {
        let newStatus = ot.estado;
        if (["CREADA", "PENDIENTE_PROGRAMACION", "Pendiente de Programación"].includes(ot.estado)) {
          newStatus = "PROGRAMADA";
        }
        await prisma.oT.update({
          where: { id: otId },
          data: {
            tecnicoTitularId: firstValid.tecnicoTitularId,
            tecnicoTitular: firstValid.tecnicoTitular || '',
            tecnicoApoyoId: firstValid.tecnicoApoyoId,
            tecnicoApoyo: firstValid.tecnicoApoyo,
            fechaProgramada: firstValid.fecha || '',
            horaProgramada: firstValid.hora,
            horaFinProgramada: firstValid.horaFin,
            estado: newStatus
          }
        });
      }
    }

    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al guardar asignación" });
  }
});

// ----- Equipment endpoints -----
app.get("/api/equipos", async (req: any, res) => {
  try {
    const { contratoId, clienteId, estado, tipo, q } = req.query;
    const where: any = {};
    if (contratoId) where.contratoId = contratoId;
    if (clienteId) {
      where.OR = [
        { clienteId: clienteId },
        { contrato: { clientId: clienteId } }
      ];
    }
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (q) {
      const searchOR = [
        { codigo: { contains: q, mode: 'insensitive' } },
        { serie: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { modelo: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        const clientOR = where.OR;
        delete where.OR;
        where.AND = [
          { OR: clientOR },
          { OR: searchOR }
        ];
      } else {
        where.OR = searchOR;
      }
    }
    const equipos = await prisma.equipo.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: {
        adensasOrigen: true,
        servicios: { take: 1, orderBy: { creadoEn: 'desc' } }
      }
    });
    res.json(equipos);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener equipos" });
  }
});

app.get("/api/equipos/:id", async (req: any, res) => {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: req.params.id },
      include: { adensasOrigen: true, servicios: { orderBy: { creadoEn: 'desc' } } }
    });
    if (!equipo) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    res.json(equipo);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener equipo" });
  }
});

app.post("/api/equipos", async (req: any, res) => {
  try {
    const body = req.body;
    let codigo = body.codigo;
    if (!codigo || codigo.startsWith('EQ-1')) {
      codigo = body.contratoId
        ? await generateEquipoCodigo(body.contratoId)
        : await generateStandaloneEquipoCode(body.tipo);
    }

    let processedFotos = body.fotos;
    if (Array.isArray(body.fotos)) {
      processedFotos = [];
      for (let i = 0; i < body.fotos.length; i++) {
        const item = body.fotos[i];
        if (typeof item === 'string' && item.startsWith('data:image/')) {
          const s3Url = await uploadEquipoPhotoToS3(item, codigo || 'EQ', i);
          processedFotos.push(s3Url);
        } else {
          processedFotos.push(item);
        }
      }
    }

    const created = await prisma.equipo.create({
      data: {
        codigo,
        tipo: body.tipo,
        marca: body.marca,
        modelo: body.modelo,
        serie: body.serie,
        potenciaKva: (body.potenciaKva !== undefined && body.potenciaKva !== null && body.potenciaKva !== '') ? parseFloat(body.potenciaKva) : 0,
        ubicacion: body.ubicacion,
        estado: body.estado || 'Operativo',
        clienteId: body.clienteId,
        contratoId: body.contratoId,
        fotos: processedFotos,
        especificaciones: body.especificaciones
      }
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al crear equipo" });
  }
});

app.put("/api/equipos/:id", async (req: any, res) => {
  try {
    const { fotos, ...data } = req.body;
    let processedFotos = fotos;
    if (Array.isArray(fotos)) {
      processedFotos = [];
      for (let i = 0; i < fotos.length; i++) {
        const item = fotos[i];
        if (typeof item === 'string' && item.startsWith('data:image/')) {
          const s3Url = await uploadEquipoPhotoToS3(item, req.params.id, i);
          processedFotos.push(s3Url);
        } else {
          processedFotos.push(item);
        }
      }
    }

    const updated = await prisma.equipo.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(fotos !== undefined ? { fotos: processedFotos } : {})
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al actualizar equipo" });
  }
});

app.delete("/api/equipos/:id", async (req: any, res) => {
  try {
    const existing = await prisma.equipo.findUnique({ where: { id: req.params.id } });
    if (existing && Array.isArray(existing.fotos)) {
      for (const fotoUrl of (existing.fotos as any[])) {
        if (typeof fotoUrl === 'string') {
          await deleteFromS3(fotoUrl);
        }
      }
    }
    await prisma.equipo.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al eliminar equipo" });
  }
});

// GET service history for an equipment
app.get("/api/equipos/:id/servicios", async (req: any, res) => {
  try {
    const servicios = await prisma.servicioEquipo.findMany({
      where: { equipoId: req.params.id },
      orderBy: { creadoEn: "desc" }
    });
    res.json(servicios);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener historial de servicios" });
  }
});

// PUT update equipment status (with auto-register in service history)
app.put("/api/equipos/:id/estado", async (req: any, res) => {
  try {
    const { estado, hallazgos, recomendaciones, tecnicoTitular, otId } = req.body;
    if (!estado) {
      res.status(400).json({ error: "Estado es requerido" });
      return;
    }
    const equipo = await prisma.equipo.update({
      where: { id: req.params.id },
      data: { estado }
    });
    // Auto-register in service history
    await prisma.servicioEquipo.create({
      data: {
        equipoId: req.params.id,
        otId: otId || 'manual',
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Cambio de estado',
        estado_post: estado,
        tecnicoTitular: tecnicoTitular || 'Sistema',
        hallazgos: hallazgos || null,
        recomendaciones: recomendaciones || null
      }
    });
    res.json(equipo);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al actualizar estado del equipo" });
  }
});

// Assign existing equipment to a contract
app.post("/api/contracts/:id/equipos", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { equipoId } = req.body;
    if (!equipoId) {
      res.status(400).json({ error: "equipoId es requerido" });
      return;
    }
    const existing = await prisma.equipo.findUnique({ where: { id: equipoId } });
    if (!existing) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    if (existing.contratoId && existing.contratoId !== id) {
      res.status(400).json({ error: "El equipo ya está asignado a otro contrato. Debe ser liberado primero." });
      return;
    }
    const updateData: any = { contratoId: id };
    if (!existing.codigo) {
      updateData.codigo = await generateEquipoCodigo(id);
    }
    const updated = await prisma.equipo.update({
      where: { id: equipoId },
      data: updateData
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al asignar equipo al contrato" });
  }
});

// Unassign (release) equipment from a contract
app.delete("/api/contracts/:contratoId/equipos/:equipoId", async (req: any, res) => {
  try {
    const { equipoId } = req.params;
    const updated = await prisma.equipo.update({
      where: { id: equipoId },
      data: { contratoId: null }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al liberar equipo del contrato" });
  }
});

// Track equipment included in a specific adenda (ampliacion)
app.post("/api/contracts/:contratoId/ampliaciones/:adendaId/equipos", async (req: any, res) => {
  try {
    const { contratoId, adendaId } = req.params;
    const { equipoId } = req.body;
    if (!equipoId) {
      res.status(400).json({ error: "equipoId es requerido" });
      return;
    }
    // Get the adenda's codigo to build the equipment code prefix
    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
    if (!equipo) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    if (equipo.contratoId && equipo.contratoId !== contratoId) {
      res.status(400).json({ error: "El equipo ya está asignado a otro contrato. Debe ser liberado primero." });
      return;
    }
    const adenda = await prisma.contratoAmpliacion.findUnique({ where: { id: adendaId } });
    if (!adenda) {
      res.status(404).json({ error: "Adenda no encontrada" });
      return;
    }
    const pivote = await prisma.equipoAmpliacion.create({
      data: { adendaId, equipoId }
    });
    const updateData: any = { contratoId };
    // Regenerate code with adenda prefix if it doesn't have it yet
    const adendaMatch = adenda.codigo.match(/-A(\d+)$/);
    const adendaSuffix = adendaMatch ? `-A${adendaMatch[1]}` : '';
    if (!equipo?.codigo || !equipo.codigo.startsWith(`${contratoId}${adendaSuffix}-E`)) {
      updateData.codigo = await generateEquipoCodigo(contratoId, adenda.codigo);
    }
    await prisma.equipo.update({
      where: { id: equipoId },
      data: updateData
    });
    res.status(201).json(pivote);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al asociar equipo a adenda" });
  }
});

// Remove (unassign) equipment from a specific adenda (ampliacion)
app.delete("/api/contracts/:contratoId/ampliaciones/:adendaId/equipos/:equipoId", async (req: any, res) => {
  try {
    const { contratoId, adendaId, equipoId } = req.params;
    
    // Delete pivot association
    await prisma.equipoAmpliacion.deleteMany({
      where: {
        adendaId,
        equipoId
      }
    });

    // Unassign the equipment from the contract as well (since it is removed from this adenda)
    // Check if the equipment is still associated with any other adendas for this contract
    const otherAssociations = await prisma.equipoAmpliacion.findFirst({
      where: {
        equipoId,
        adenda: {
          contratoId
        }
      }
    });

    // If it has no other adenda associations, clear its contratoId
    if (!otherAssociations) {
      await prisma.equipo.update({
        where: { id: equipoId },
        data: { contratoId: null }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al retirar equipo de la adenda" });
  }
});

app.get("/api/tipo-contratos", async (req, res) => {
  try {
    res.json(await prisma.tipoContrato.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener tipos de contrato" });
  }
});

const CONTRATO_NUEVO_INCLUDE = {
  equipos: true,
  ampliaciones: {
    include: {
      equiposAdenda: {
        include: {
          equipo: true
        }
      }
    }
  }
};

app.get("/api/contratos-comerciales", async (req, res) => {
  try {
    res.json(await prisma.contratoNuevo.findMany({ include: CONTRATO_NUEVO_INCLUDE }));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/contratos-comerciales", async (req, res) => {
  try {
    const { pdf_base64, pdf_name, ampliaciones, equiposAdenda, equipos, ...newContrato } = req.body;
    if (!newContrato.id || newContrato.id.startsWith('cont_')) {
      newContrato.id = await generateContractCode();
    }
    if (!newContrato.n_contrato) {
      newContrato.n_contrato = newContrato.id;
    }
    if (pdf_base64 && pdf_name) {
      newContrato.pdf_url = await uploadContractBase64ToS3(pdf_base64, newContrato.id, pdf_name);
    }
    const created = await prisma.contratoNuevo.create({ 
      data: newContrato,
      include: CONTRATO_NUEVO_INCLUDE
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error" });
  }
});

app.put("/api/contratos-comerciales/:id", async (req, res) => {
  try {
    const { pdf_base64, pdf_name, id, ampliaciones, equiposAdenda, equipos, ...body } = req.body;
    if (pdf_base64 && pdf_name) {
      body.pdf_url = await uploadContractBase64ToS3(pdf_base64, req.params.id, pdf_name);
    }
    const updated = await prisma.contratoNuevo.update({
      where: { id: req.params.id },
      data: body,
      include: CONTRATO_NUEVO_INCLUDE
    });
    res.json(updated);
  } catch (err: any) {
    console.error("Error al actualizar contrato:", err);
    res.status(500).json({ error: err.message || "Error al actualizar el contrato" });
  }
});

app.post("/api/contracts/:id/ampliaciones", async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, fecha_inicio, fecha_fin, comentarios, adenda_pdf_base64, adenda_pdf_name } = req.body;
    
    let adenda_pdf_url: string | undefined;
    if (adenda_pdf_base64 && adenda_pdf_name) {
      adenda_pdf_url = await uploadContractBase64ToS3(adenda_pdf_base64, id, adenda_pdf_name);
    }

    const contrato = await prisma.contratoNuevo.findUnique({ where: { id } });

    const existingCount = await prisma.contratoAmpliacion.count({ where: { contratoId: id } });
    const codigo = `${id}-A${existingCount + 1}`;

    await prisma.contratoAmpliacion.create({
      data: {
        codigo,
        contratoId: id,
        monto: parseFloat(monto) || 0,
        fecha_inicio,
        fecha_fin,
        adenda_pdf_url,
        comentarios
      }
    });

    const updateData: any = { fecha_fin };
    if (contrato && !contrato.fecha_fin_original) {
      updateData.fecha_fin_original = contrato.fecha_fin;
    }
    await prisma.contratoNuevo.update({
      where: { id },
      data: updateData
    });

    const updatedContract = await prisma.contratoNuevo.findUnique({
      where: { id },
      include: CONTRATO_NUEVO_INCLUDE
    });
    res.status(201).json(updatedContract);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al agregar ampliación" });
  }
});

app.put("/api/ampliaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, fecha_inicio, fecha_fin, comentarios, adenda_pdf_base64, adenda_pdf_name } = req.body;

    const existing = await prisma.contratoAmpliacion.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Ampliación no encontrada" });
      return;
    }

    const updateData: any = {};
    if (monto !== undefined) updateData.monto = parseFloat(monto) || 0;
    if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin;
    if (comentarios !== undefined) updateData.comentarios = comentarios;
    if (adenda_pdf_base64 && adenda_pdf_name) {
      updateData.adenda_pdf_url = await uploadContractBase64ToS3(adenda_pdf_base64, existing.contratoId, adenda_pdf_name);
    }

    await prisma.contratoAmpliacion.update({
      where: { id },
      data: updateData
    });

    // Update contract fecha_fin if this is the latest ampliacion
    if (fecha_fin !== undefined) {
      const allAmps = await prisma.contratoAmpliacion.findMany({
        where: { contratoId: existing.contratoId },
        orderBy: { creadoEn: 'desc' }
      });
      const contractFechaFin = allAmps.length > 0 ? allAmps[0].fecha_fin : fecha_fin;
      await prisma.contratoNuevo.update({
        where: { id: existing.contratoId },
        data: { fecha_fin: contractFechaFin }
      });
    }

    const updatedContract = await prisma.contratoNuevo.findUnique({
      where: { id: existing.contratoId },
      include: CONTRATO_NUEVO_INCLUDE
    });
    res.json(updatedContract);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al actualizar ampliación" });
  }
});

app.get("/api/target-ventas", async (req, res) => {
  try {
    res.json(await prisma.targetVenta.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/target-ventas", async (req, res) => {
  try {
    await prisma.targetVenta.deleteMany(); // Replace all
    await prisma.targetVenta.createMany({ data: req.body });
    res.json(await prisma.targetVenta.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/config", (req, res) => {
  res.json({ tipoCambio: 3.75 });
});

app.post("/api/config", (req, res) => {
  res.json({ tipoCambio: req.body.tipoCambio || 3.75 });
});

// ----------------------------------------
// VITE OR STATIC FILE FALLBACK
// ----------------------------------------

async function seedTipoContratos() {
  try {
    const count = await prisma.tipoContrato.count();
    if (count === 0) {
      const types = ['ALQUILER', 'MANTENIMIENTO', 'SERVICIO', 'SUMINISTRO', 'EMERGENCIA', 'INSTALACION', 'REPARACION', 'PROYECTO', 'ANULADO'];
      await prisma.tipoContrato.createMany({
        data: types.map(t => ({ name: t }))
      });
      console.log("[Seeder] Sembrado de TipoContrato finalizado.");
    }
  } catch (err) {
    console.error("Error al sembrar TipoContrato:", err);
  }
}

async function runDataFixes() {
  try {
    // 0. Auto-seed master users and clients if database is freshly provisioned
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('mafort', salt);
      const initialUsers = [
        { id: 'user_0', username: 'Administrador General', email: 'admin@mafort.pe', password: hash, role: 'Administrador', estado: 'Activo', area: 'Administración General', ultimoIngreso: '2026-06-30 00:19:55', creadoEn: '2026-01-01', allowedModules: ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas', 'Tecnico', 'Supervisor', 'Cliente', 'Usuarios'] },
        { id: 'user_1', username: 'Coord. Ventas', email: 'ventas@mafort.pe', password: hash, role: 'Ventas', estado: 'Activo', area: 'Planeamiento Comercial', ultimoIngreso: '2026-06-22 07:15', creadoEn: '2026-01-10', allowedModules: ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas'] },
        { id: 'user_2', username: 'Carlos Ocsa', email: 'carlos.ocsa@mafort.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Mantenimiento de Campo', ultimoIngreso: '2026-06-22 07:22', creadoEn: '2026-01-12', allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico'] },
        { id: 'user_3', username: 'Ing. Roberto Salas', email: 'supervisor@mafort.pe', password: hash, role: 'Supervisor', estado: 'Activo', area: 'Control de Calidad (SLA)', ultimoIngreso: '2026-06-27 03:06:49', creadoEn: '2026-01-15', allowedModules: ['Dashboard', 'Monitoreo', 'Supervisor'] },
        { id: 'user_4', username: 'Ana Gutiérrez', email: 'ana.gutierrez@prosegur.pe', password: hash, role: 'Cliente', estado: 'Activo', area: 'Infraestructura TI - Prosegur', ultimoIngreso: '2026-06-28 16:30', creadoEn: '2026-02-01', clientId: 'client_1', allowedModules: ['Dashboard', 'Monitoreo', 'Cliente'] },
        { id: 'user_5', username: 'Juan Córdova', email: 'juan.cordova@materiagris.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Seguridad Eléctrica & Supervisor', ultimoIngreso: '2026-06-29 07:45', creadoEn: '2026-01-20', allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico'] },
        { id: 'user_6', username: 'Gino Murillo', email: 'gino.murillo@mafort.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Climatización & Control', ultimoIngreso: '2026-06-29 08:30', creadoEn: '2026-01-20', allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico'] }
      ];
      for (const u of initialUsers) {
        await prisma.user.create({ data: u as any });
      }
      console.log(`[Master Seed] Se crearon ${initialUsers.length} usuarios maestros en la BD.`);
    }

    const clientCount = await prisma.client.count();
    if (clientCount === 0) {
      const initialClients = [
        { id: 'client_1', razonSocial: 'Prosegur Tecnología S.A.', ruc: '20506830209', direccionSede: 'Av. Separadora Industrial 349, Ate', distrito: 'Ate', contactoNombre: 'Ana Gutiérrez', contactoEmail: 'ana.gutierrez@prosegur.pe', contactoTelefono: '946782301' },
        { id: 'client_2', razonSocial: 'Clínica San Pablo S.A.C.', ruc: '20503689023', direccionSede: 'Av. El Polo 789, Surco', distrito: 'Santiago de Surco', contactoNombre: 'Ing. Pedro Vásquez', contactoEmail: 'pedro.vasquez@sanpablo.pe', contactoTelefono: '987654321' },
        { id: 'client_3', razonSocial: 'Banco Interbank S.A.', ruc: '20100053455', direccionSede: 'Av. Carlos Villarán 140, La Victoria', distrito: 'La Victoria', contactoNombre: 'Luis Fernández', contactoEmail: 'luis.fernandez@interbank.pe', contactoTelefono: '912345678' }
      ];
      for (const c of initialClients) {
        await prisma.client.create({ data: c });
      }
      console.log(`[Master Seed] Se crearon ${initialClients.length} clientes maestros en la BD.`);
    }

    // 1. Check and fix BCP client mapping
    const clientBcp = await prisma.client.findUnique({ where: { id: 'client_bcp' } });
    if (!clientBcp) {
      await prisma.client.create({
        data: {
          id: 'client_bcp',
          razonSocial: 'Banco de Crédito del Perú',
          ruc: '20100047218',
          direccionSede: 'Calle Centenario 156',
          distrito: 'La Molina',
          pais: 'Perú',
          provincia: 'Lima',
          contactoNombre: 'Sr. Roberto Torres',
          contactoEmail: 'rtorres@bcp.com.pe',
          contactoTelefono: '912345678'
        }
      });
      console.log("[Data Fix] Client created: Banco de Crédito del Perú");
    }
    
    const cont250 = await prisma.contratoNuevo.findUnique({ where: { id: 'cont_250' } });
    if (cont250 && cont250.clientId !== 'client_bcp') {
      await prisma.contratoNuevo.update({
        where: { id: 'cont_250' },
        data: { clientId: 'client_bcp' }
      });
      await prisma.oT.updateMany({
        where: { contratoId: 'cont_250' },
        data: { clientId: 'client_bcp' }
      });
      console.log("[Data Fix] Fixed cont_250 clientId mapping to BCP.");
    }

    // 2. Check and fix Clinica Internacional mapping
    const clientClinica = await prisma.client.findUnique({ where: { id: 'client_clinica_internacional' } });
    if (!clientClinica) {
      await prisma.client.create({
        data: {
          id: 'client_clinica_internacional',
          razonSocial: 'Clínica Internacional',
          ruc: '20100234567',
          direccionSede: 'Av. Guardia Civil 385',
          distrito: 'San Borja',
          pais: 'Perú',
          provincia: 'Lima',
          contactoNombre: 'Dr. Alejandro Silva',
          contactoEmail: 'asilva@clinica-internacional.com.pe',
          contactoTelefono: '987654321'
        }
      });
      console.log("[Data Fix] Client created: Clínica Internacional");
    }
    
    const cont251 = await prisma.contratoNuevo.findUnique({ where: { id: 'cont_251' } });
    if (cont251 && cont251.clientId !== 'client_clinica_internacional') {
      await prisma.contratoNuevo.update({
        where: { id: 'cont_251' },
        data: { clientId: 'client_clinica_internacional' }
      });
      await prisma.oT.updateMany({
        where: { contratoId: 'cont_251' },
        data: { clientId: 'client_clinica_internacional' }
      });
      console.log("[Data Fix] Fixed cont_251 clientId mapping to Clínica Internacional.");
    }

    // 3. Check and fix Omnia Medica SAC mapping (OM-CL-001)
    const omniaClient = await prisma.client.findUnique({ where: { id: 'OM-CL-001' } });
    if (!omniaClient) {
      await prisma.client.create({
        data: {
          id: 'OM-CL-001',
          razonSocial: 'Omnia Medica SAC',
          ruc: '20608899123',
          direccionSede: 'Av. Las Camelias 450',
          distrito: 'San Isidro',
          pais: 'Perú',
          provincia: 'Lima',
          contactoNombre: 'Responsable Ómnia',
          contactoEmail: 'contacto@omniamedica.com',
          contactoTelefono: '912345678'
        }
      });
      console.log("[Data Fix] Client created: Omnia Medica SAC (OM-CL-001)");
    }

    await prisma.oT.updateMany({
      where: { contratoId: 'OM-CO-001' },
      data: { clientId: 'OM-CL-001' }
    });
    await prisma.ordenTrabajoLinea.updateMany({
      where: {
        OR: [
          { contratoId: 'OM-CO-001' },
          { clientId: 'OM-CL-001' },
          { ot: { contains: 'OM-CO-001' } }
        ]
      },
      data: {
        razon_social: 'Omnia Medica SAC',
        empresa: 'Omnia Medica SAC',
        clientId: 'OM-CL-001'
      }
    });
    console.log("[Data Fix] Fixed Omnia Medica SAC OTs and Lineas.");

    // 4. Auto-seed missing technical report for any pending OT in audit queue
    const pendingOtsNoReport = await prisma.oT.findMany({
      where: {
        OR: [
          { estado: 'Sometido a Revisión (Pendiente de Aprobación por Supervisor)' },
          { estado: 'Rechazado (Sometido a Corrección por Técnico)' },
          { estado: 'En Revisión' },
          { estado: 'Observada' }
        ]
      }
    });

    for (const ot of pendingOtsNoReport) {
      const reportCount = await prisma.technicalReport.count({ where: { otId: ot.id } });
      if (reportCount === 0) {
        const equipoId = ot.equipoId ? ot.equipoId.split(',')[0].trim() : null;
        await prisma.technicalReport.create({
          data: {
            id: `rep_${Date.now()}_${ot.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
            otId: ot.id,
            equipoId: equipoId,
            informeN: `INF-${ot.id}`,
            hojaServicioN: `HS-${ot.id}`,
            asunto: `Mantenimiento Preventivo S.L.A - ${ot.tipoEquipo || 'UPS'}`,
            fechaServicio: new Date().toISOString().split('T')[0],
            horaInicio: '09:00 AM',
            tecnico1: ot.tecnicoTitular || 'Juan Córdova',
            tecnico2: ot.tecnicoApoyo || 'Ninguno',
            antecedentes: 'Se realizó el mantenimiento preventivo programado según SLA. Inspección general de componentes y baterías.',
            accionesRealizadas: [
              'Inspección visual de gabinete y cableado de potencia.',
              'Medición de parámetros de entrada y salida (Voltaje/Frecuencia).',
              'Verificación de banco de baterías y tiempo de autonomía en inversor.',
              'Limpieza de tarjetas electrónicas y pruebas de conmutación a bypass.'
            ],
            voltajeEntrada: 220,
            voltajeSalida: 220,
            indicadoresBateria: {
              nivelCarga: 100,
              temperaturaC: 22,
              estadoCeldas: 'Optimo',
              bypassActivo: false
            },
            observacionesDiagnostico: 'El equipo queda en perfecto estado operativo en modo Inversor.',
            pasos: {
              paso1: 'Inspección física inicial',
              paso1_si_no: 'si',
              paso1_funcionamiento: 'modo inversor',
              paso1_bypass: 'no',
              paso2: 'Medición eléctrica completada',
              paso3: 'Prueba de baterías en carga',
              paso4: 'Limpieza e inspección de ventiladores',
              paso5: 'Verificación de alarmas en display',
              paso6: 'Conclusión de mantenimiento',
              paso6_concluido: 'si',
              paso6_observaciones: 'Mantenimiento preventivo S.L.A concluido satisfactoriamente.'
            },
            fotosLabeled: [
              { slotName: '1. Vista Frontal Gabinete', base64: '' },
              { slotName: '2. Placa de Especificaciones', base64: '' },
              { slotName: '3. Banco de Baterías', base64: '' },
              { slotName: '4. Panel Display Inversor', base64: '' }
            ],
            medicionesEntrada: { lnVoltaje: ['220', '220', '220'], frecuencia: '60' },
            medicionesSalida: { lnVoltaje: ['220', '220', '220'], frecuencia: '60' },
            revisionNormas: {
              mantenimientoRealizado: true,
              anioBaterias: 2024,
              ambienteHermetico: true,
              temperaturaSala: 22,
              estadoOperativo: true,
              inversorOperandoPorcentaje: 35
            },
            recomendaciones: 'Mantener el ambiente de la sala con aire acondicionado constante a 22°C.',
            creadoEn: new Date().toISOString(),
            modificadoEn: new Date().toISOString(),
            offlineDirty: false
          }
        });
        console.log(`[Data Fix] Auto-seeded missing TechnicalReport for pending OT ${ot.id}`);
      }
    }
  } catch (err) {
    console.error("[Data Fix Error] Failed to run database fixes:", err);
  }
}

async function startServer() {
  await seedTipoContratos();
  await runDataFixes();
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (!hasDist && process.env.NODE_ENV === "development") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("[Vite Fallback] No se pudo cargar Vite middleware dinámico:", err);
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Gestia Backend System] Running securely on port ${PORT}`);
  });
}

startServer();
