import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const JWT_SECRET = process.env.JWT_SECRET || "gestia_secret_token_key_123456";

// AWS S3 client initialization
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "gestia-dev-photos";

// Helper to convert base64 image strings and upload to AWS S3
async function uploadBase64ToS3(base64Str: string, otId: string, index: string | number): Promise<string> {
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Formato Base64 inválido");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Whitelist MIME types
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Tipo MIME no permitido: ${mimeType}`);
  }

  const buffer = Buffer.from(base64Data, "base64");
  
  // Size limit: 8MB (8388608 bytes)
  if (buffer.length > 8388608) {
    throw new Error("La imagen excede el límite de tamaño de 8MB");
  }

  let extension = "jpg";
  if (mimeType === "image/png") extension = "png";
  else if (mimeType === "image/webp") extension = "webp";
  else if (mimeType === "image/svg+xml") extension = "svg";

  const cleanOtId = otId.replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const key = `reports/OT-${cleanOtId}/${timestamp}-${index}.${extension}`;

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

// Helper to delete objects from S3 on transaction rollback
async function deleteFromS3(relativeUrl: string): Promise<void> {
  try {
    const key = relativeUrl.replace("/api/photos/", "");
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
    console.log(`[Rollback S3] Objeto eliminado: ${key}`);
  } catch (err) {
    console.error(`[Rollback S3 ERROR] No se pudo eliminar ${relativeUrl}:`, err);
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
const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  const token = authHeader && authHeader.split(" ")[1];
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

app.get("/api/ubigeo/paises", async (req, res) => {
  try {
    res.json(await prisma.pais.findMany({ orderBy: { nombre: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/ubigeo/provincias", async (req, res) => {
  try {
    const { paisId } = req.query;
    const whereClause = paisId ? { paisId: String(paisId) } : {};
    res.json(await prisma.provincia.findMany({ where: whereClause, orderBy: { nombre: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/ubigeo/distritos", async (req, res) => {
  try {
    const { provinciaId } = req.query;
    const whereClause = provinciaId ? { provinciaId: String(provinciaId) } : {};
    res.json(await prisma.distrito.findMany({ where: whereClause, orderBy: { nombre: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/clients", async (req, res) => {
  try {
    res.json(await prisma.client.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const newClient = req.body;
    if (!newClient.id) {
      newClient.id = `client_${Date.now()}`;
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

app.get("/api/ots", async (req, res) => {
  try {
    res.json(await prisma.oT.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/ots", async (req, res) => {
  try {
    const { contratoId, costo_estimado_usd, ...otData } = req.body;

    // Auto-derive tipoEquipo and potenciaKva from Equipo if equipoId is set
    if (otData.equipoId) {
      const equipo = await prisma.equipo.findUnique({ where: { id: otData.equipoId } });
      if (equipo) {
        if (!otData.tipoEquipo) otData.tipoEquipo = equipo.tipo;
        if (!otData.potenciaKva) otData.potenciaKva = equipo.potenciaKva;
      }
    }

    if (contratoId && costo_estimado_usd) {
      const contrato = await prisma.contratoNuevo.findUnique({
        where: { id: contratoId }
      });

      if (!contrato) {
        return res.status(404).json({ error: "Contrato no encontrado" });
      }

      const saldoActual = contrato.saldo_disponible_usd ?? contrato.presupuesto_total_usd ?? 0;
      const costo = Number(costo_estimado_usd);

      if (saldoActual < costo) {
        return res.status(400).json({ error: "Saldo insuficiente en el contrato marco", saldoDisponible: saldoActual });
      }

      // Start transaction to create OT and deduct balance
      const [createdOt, updatedContrato] = await prisma.$transaction([
        prisma.oT.create({
          data: { ...otData, contratoId, costo_estimado_usd: costo }
        }),
        prisma.contratoNuevo.update({
          where: { id: contratoId },
          data: { saldo_disponible_usd: saldoActual - costo }
        })
      ]);

      return res.status(201).json(createdOt);
    } else {
      // Normal OT creation
      const created = await prisma.oT.create({ data: req.body });
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error("Error creating OT:", err);
    res.status(500).json({ error: "Error al crear la OT" });
  }
});

app.put("/api/ots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOt = await prisma.oT.update({
      where: { id },
      data: req.body
    });

    if (updatedOt.estado === "Conformidad Firmada (Listo para Facturar)" || 
        updatedOt.estado === "Aprobada" || 
        updatedOt.estado === "Firmada") {
      const finId = updatedOt.otFinancieraId;
      if (finId) {
        // Try finding by id, then try finding by ot number
        const lines = await prisma.ordenTrabajoLinea.findMany({
          where: {
            OR: [
              { id: finId },
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
    }
    res.json(updatedOt);
  } catch (err) {
    res.status(404).json({ error: "Orden de Trabajo no encontrada" });
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    res.json(await prisma.technicalReport.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
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

    return { report: clonedReport, uploadedUrls };
  } catch (err) {
    for (const url of uploadedUrls) {
      await deleteFromS3(url);
    }
    throw err;
  }
}

app.post("/api/reports", async (req, res) => {
  let uploadedUrls: string[] = [];
  try {
    const reportBody = req.body;
    const { otId, ...data } = reportBody;

    if (!otId) {
      return res.status(400).json({ error: "otId es obligatorio" });
    }

    // Process and upload photos to S3
    const processed = await processReportPhotos(reportBody);
    uploadedUrls = processed.uploadedUrls;
    const finalReport = processed.report;
    const { otId: finalOtId, ...cleanData } = finalReport;

    const saved = await prisma.technicalReport.upsert({
      where: { otId: finalOtId },
      update: { ...cleanData, offlineDirty: false },
      create: { ...finalReport, offlineDirty: false }
    });

    res.status(201).json(saved);
  } catch (err: any) {
    console.error("Error al guardar reporte técnico:", err);
    // Rollback uploads if DB save fails
    for (const url of uploadedUrls) {
      await deleteFromS3(url);
    }
    res.status(500).json({ error: err.message || "Error al procesar el reporte técnico" });
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

// Bulk offline sync
app.post("/api/sync", async (req, res) => {
  console.log(">>> SYNC REQUEST RECEIVED");
  try {
    const { reports, ots, clients, contracts, ordenesTrabajo, contratosNuevos, users, logs } = req.body;

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
          where: { otId },
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
        const { n_factura, nro_guia_informe, observacion, seguimiento, tipo_contratacion, creadoPor, creadoEn, modificadoPor, modificadoEn, anio_factura, mes_factura, fecha_factura, ...rest } = sol;
        const insertData = { ...rest, factura: n_factura || null };
        const existing = await prisma.ordenTrabajoLinea.findUnique({ where: { id: sol.id } });
        if (existing) {
          if (existing.estado === 'FACTURADO' && insertData.estado !== 'FACTURADO') {
            insertData.estado = existing.estado;
            insertData.pendiente = existing.pendiente;
            insertData.factura = existing.factura;
          }
          await prisma.ordenTrabajoLinea.update({ where: { id: sol.id }, data: insertData });
        } else {
          await prisma.ordenTrabajoLinea.create({ data: insertData });
        }
      }
    }

    if (Array.isArray(contratosNuevos)) {
      for (const scc of contratosNuevos) {
        await prisma.contratoNuevo.upsert({ where: { id: scc.id }, update: scc, create: scc });
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
    
    // Helper to map Prisma field 'factura' to frontend field 'n_factura'
    const mapLineaToFrontend = (linea: any) => {
      const { factura, ...rest } = linea;
      return { ...rest, n_factura: factura || '', factura };
    };

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
    // Map Prisma field 'factura' to frontend field 'n_factura'
    const mapped = rawLineas.map((linea: any) => {
      const { factura, ...rest } = linea;
      return { ...rest, n_factura: factura || '', factura };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/ot-lineas", async (req, res) => {
  try {
    const newLinea = req.body;
    if (!newLinea.id) newLinea.id = `otl_${Date.now()}`;
    const { n_factura, nro_guia_informe, observacion, seguimiento, tipo_contratacion, creadoPor, creadoEn, modificadoPor, modificadoEn, ...rest } = newLinea;
    const insertData = { ...rest, factura: n_factura || null };
    const created = await prisma.ordenTrabajoLinea.create({ data: insertData });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.put("/api/ot-lineas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { n_factura, nro_guia_informe, observacion, seguimiento, tipo_contratacion, creadoPor, creadoEn, modificadoPor, modificadoEn, ...rest } = req.body;
    const insertData = { ...rest, factura: n_factura || undefined }; // undefined preserves existing
    
    const updatedLine = await prisma.ordenTrabajoLinea.update({
      where: { id },
      data: insertData
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

    res.json(updatedLine);
  } catch (err) {
    res.status(404).json({ error: "Línea no encontrada" });
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

app.get("/api/contracts/files/*", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const key = req.params[0];
  const pathRegex = /^contracts\/[\w-]+\/[\w.-]+$/;
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

    res.setHeader("Content-Type", s3Response.ContentType || "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (s3Response.ContentType === "application/pdf") {
      res.setHeader("Content-Disposition", `inline; filename="${key.split('/').pop()}"`);
    }
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(500).json({ error: "Archivo sin contenido" });
    }
  } catch (error: any) {
    console.error("Error retrieving contract document:", error);
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

// ----- Equipment endpoints -----
app.get("/api/equipos", async (req: any, res) => {
  try {
    const { contratoId, clienteId, estado, tipo, q } = req.query;
    const where: any = {};
    if (contratoId) where.contratoId = contratoId;
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (q) {
      where.OR = [
        { codigo: { contains: q, mode: 'insensitive' } },
        { serie: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { modelo: { contains: q, mode: 'insensitive' } },
      ];
    }
    const equipos = await prisma.equipo.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: { adensasOrigen: true }
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
      include: { adensasOrigen: true }
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
    const { fotos, ...data } = req.body;
      if (!data.codigo && data.contratoId) {
        data.codigo = await generateEquipoCodigo(data.contratoId);
      }
      if (!data.codigo) {
        data.codigo = `EQ-${Date.now()}`;
      }
    const created = await prisma.equipo.create({ data });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al crear equipo" });
  }
});

app.put("/api/equipos/:id", async (req: any, res) => {
  try {
    const { fotos, ...data } = req.body;
    const updated = await prisma.equipo.update({
      where: { id: req.params.id },
      data
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al actualizar equipo" });
  }
});

app.delete("/api/equipos/:id", async (req: any, res) => {
  try {
    await prisma.equipo.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al eliminar equipo" });
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
    const adenda = await prisma.contratoAmpliacion.findUnique({ where: { id: adendaId } });
    if (!adenda) {
      res.status(404).json({ error: "Adenda no encontrada" });
      return;
    }
    const pivote = await prisma.equipoAmpliacion.create({
      data: { adendaId, equipoId }
    });
    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
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

app.get("/api/tipo-contratos", async (req, res) => {
  try {
    res.json(await prisma.tipoContrato.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener tipos de contrato" });
  }
});

app.get("/api/contratos-comerciales", async (req, res) => {
  try {
    res.json(await prisma.contratoNuevo.findMany({ include: { ampliaciones: true } }));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/contratos-comerciales", async (req, res) => {
  try {
    const { pdf_base64, pdf_name, ...newContrato } = req.body;
    if (!newContrato.id) newContrato.id = `cont_${Date.now()}`;
    if (pdf_base64 && pdf_name) {
      newContrato.pdf_url = await uploadContractBase64ToS3(pdf_base64, newContrato.id, pdf_name);
    }
    const created = await prisma.contratoNuevo.create({ 
      data: newContrato,
      include: { ampliaciones: true }
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error" });
  }
});

app.put("/api/contratos-comerciales/:id", async (req, res) => {
  try {
    const { pdf_base64, pdf_name, ...body } = req.body;
    if (pdf_base64 && pdf_name) {
      body.pdf_url = await uploadContractBase64ToS3(pdf_base64, req.params.id, pdf_name);
    }
    const updated = await prisma.contratoNuevo.update({
      where: { id: req.params.id },
      data: body,
      include: { ampliaciones: true }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message || "No encontrado" });
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
      include: { ampliaciones: true }
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
      include: { ampliaciones: true }
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

async function startServer() {
  await seedTipoContratos();
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "dev") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
