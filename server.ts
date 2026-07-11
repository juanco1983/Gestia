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
    if (!newClient.id) newClient.id = `client_${Date.now()}`;
    const created = await prisma.client.create({ data: newClient });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error" });
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

// Process and upload report photos (both labeled and flat arrays, and customer signature)
async function processReportPhotos(report: any): Promise<{ report: any; uploadedUrls: string[] }> {
  const uploadedUrls: string[] = [];
  const clonedReport = JSON.parse(JSON.stringify(report));
  const otId = clonedReport.otId || "UNKNOWN";

  try {
    // 1. Process Labeled Photos
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

    // 2. Process Flat Photos Array
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

    // 3. Process Customer Signature
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
    const { clientReportId, otId } = reportBody;

    if (!otId) {
      return res.status(400).json({ error: "otId es obligatorio" });
    }

    // Idempotency check: verify if report with same clientReportId was already sync'd
    if (clientReportId) {
      const existing = await prisma.technicalReport.findUnique({
        where: { clientReportId }
      });
      if (existing) {
        console.log(`[Idempotency] Reporte ${clientReportId} ya registrado en el servidor.`);
        return res.status(200).json(existing);
      }
    }

    // 1. S3 image upload before DB operations
    const processed = await processReportPhotos(reportBody);
    uploadedUrls = processed.uploadedUrls;
    const finalReport = processed.report;

    // 2. Prisma Database operations inside transaction
    const { otId: finalOtId, ...cleanData } = finalReport;

    const savedReport = await prisma.$transaction(async (tx) => {
      const r = await tx.technicalReport.upsert({
        where: { otId: finalOtId },
        update: { ...cleanData, offlineDirty: false },
        create: { ...finalReport, offlineDirty: false }
      });

      // Update OT status
      await tx.oT.updateMany({
        where: { id: finalOtId },
        data: { estado: 'En Revisión' }
      });

      // Sync with financial line status
      const lines = await tx.ordenTrabajoLinea.findMany({
        where: {
          OR: [
            { ot: finalOtId },
            { ot: finalOtId.replace('OT-', '') }
          ]
        }
      });
      for (const line of lines) {
        const statusArray: any[] = Array.isArray(line.estatus) ? line.estatus : [];
        const alreadyHasLog = statusArray.some((e: any) => e.texto && e.texto.includes("Informe Técnico enviado"));
        if (!alreadyHasLog) {
          statusArray.push({
            fecha: new Date().toISOString().split("T")[0],
            autor: "Sistema Automatizado",
            texto: `Informe Técnico enviado para revisión. OT Técnica ${finalOtId}.`
          });
        }
        await tx.ordenTrabajoLinea.update({
          where: { id: line.id },
          data: { estatus: statusArray }
        });
      }

      return r;
    });

    res.status(201).json(savedReport);
  } catch (err: any) {
    console.error("Error al guardar reporte técnico:", err);
    for (const url of uploadedUrls) {
      await deleteFromS3(url);
    }
    res.status(500).json({ error: err.message || "Error al procesar el reporte técnico" });
  }
});

// Image S3 Proxy Endpoint with authorization validation and path-traversal prevention
app.get("/api/photos/*", async (req, res) => {
  if (!(req as any).user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const user = (req as any).user;
  const key = req.params[0];

  // Regex check for safety
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
    // 1. Fetch OT to validate permissions
    const ot = await prisma.oT.findUnique({
      where: { id: otId }
    });

    if (!ot) {
      return res.status(404).json({ error: "Orden de trabajo asociada no encontrada" });
    }

    // 2. Role-based access validation
    const isAllowed = 
      ["Administrador", "Ventas", "Supervisor"].includes(user.role) ||
      (user.role === "Tecnico" && (ot.tecnicoTitularId === user.id || ot.tecnicoApoyoId === user.id)) ||
      (user.role === "Cliente" && ot.clientId === user.clientId);

    if (!isAllowed) {
      return res.status(403).json({ error: "Acceso denegado a este recurso" });
    }

    // 3. Fetch file stream from AWS S3
    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );

    // 4. Pipe stream response
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

app.get("/api/contratos-comerciales", async (req, res) => {
  try {
    res.json(await prisma.contratoNuevo.findMany());
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/contratos-comerciales", async (req, res) => {
  try {
    const { tarifa_hora_tecnico, ...contratoData } = req.body;
    if (!contratoData.id) contratoData.id = `cont_${Date.now()}`;

    const totalUsd = typeof contratoData.presupuesto_total_usd === "number" 
      ? contratoData.presupuesto_total_usd 
      : (contratoData.presupuesto_total_usd ? parseFloat(contratoData.presupuesto_total_usd) : 0);

    contratoData.presupuesto_total_usd = totalUsd;
    contratoData.saldo_disponible_usd = totalUsd;
    contratoData.saldo_actual_contrato = totalUsd;
    contratoData.sobregiro = false;

    const created = await prisma.$transaction(async (tx) => {
      const c = await tx.contratoNuevo.create({ data: contratoData });
      
      const rateVal = typeof tarifa_hora_tecnico === "number" 
        ? tarifa_hora_tecnico 
        : (tarifa_hora_tecnico ? parseFloat(tarifa_hora_tecnico) : 0);

      if (rateVal > 0) {
        await tx.tarifarioContrato.create({
          data: {
            id: `tar_mo_init_${Date.now()}`,
            contratoId: c.id,
            concepto: "Hora Técnico",
            precioUnitario: rateVal
          }
        });
      }
      return c;
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error("Error al crear contrato comercial:", err.message);
    res.status(500).json({ error: err.message || "Error al crear contrato comercial" });
  }
});

app.put("/api/contratos-comerciales/:id", async (req, res) => {
  try {
    const updated = await prisma.contratoNuevo.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "No encontrado" });
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

app.post("/api/admin/backfill-photos", async (req, res) => {
  if (!(req as any).user || (req as any).user.role !== "Administrador") {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }

  console.log(">>> [BACKFILL ENDPOINT] Iniciando migración de imágenes a AWS S3...");
  try {
    const reports = await prisma.technicalReport.findMany();
    let migratedCount = 0;
    const details = [];

    for (const r of reports) {
      let changed = false;
      let clonedFotos: any[] = Array.isArray(r.fotos) ? [...(r.fotos as any[])] : [];
      let clonedFotosLabeled: any[] = Array.isArray(r.fotosLabeled) ? [...(r.fotosLabeled as any[])] : [];
      let clonedFirma = r.firmaCliente;

      // 1. Labeled Photos
      for (let i = 0; i < clonedFotosLabeled.length; i++) {
        const item = clonedFotosLabeled[i];
        if (item && typeof item.base64 === "string" && item.base64.startsWith("data:image/")) {
          try {
            const s3Url = await uploadBase64ToS3(item.base64, r.otId, `labeled-${i}`);
            item.base64 = s3Url;
            changed = true;
          } catch (e: any) {
            console.error(`Error migrando foto labeled ${i} para OT ${r.otId}:`, e.message);
          }
        }
      }

      // 2. Flat Photos
      for (let i = 0; i < clonedFotos.length; i++) {
        const img = clonedFotos[i];
        if (typeof img === "string" && img.startsWith("data:image/")) {
          try {
            if (clonedFotosLabeled[i] && typeof clonedFotosLabeled[i].base64 === "string" && clonedFotosLabeled[i].base64.startsWith("/api/photos/")) {
              clonedFotos[i] = clonedFotosLabeled[i].base64;
            } else {
              const s3Url = await uploadBase64ToS3(img, r.otId, `flat-${i}`);
              clonedFotos[i] = s3Url;
            }
            changed = true;
          } catch (e: any) {
            console.error(`Error migrando foto plana ${i} para OT ${r.otId}:`, e.message);
          }
        }
      }

      // 3. Firma Cliente
      if (typeof clonedFirma === "string" && clonedFirma.startsWith("data:image/")) {
        try {
          const s3Url = await uploadBase64ToS3(clonedFirma, r.otId, "firma");
          clonedFirma = s3Url;
          changed = true;
        } catch (e: any) {
          console.error(`Error migrando firma para OT ${r.otId}:`, e.message);
        }
      }

      if (changed) {
        await prisma.technicalReport.update({
          where: { id: r.id },
          data: {
            fotos: clonedFotos,
            fotosLabeled: clonedFotosLabeled,
            firmaCliente: clonedFirma
          }
        });
        migratedCount++;
        details.push({ otId: r.otId, status: "Migrado" });
      }
    }

    res.json({ success: true, message: `Migración completada. ${migratedCount} reportes actualizados.`, details });
  } catch (err: any) {
    console.error("Fallo durante la migración HTTP de fotos:", err);
    res.status(500).json({ error: "Error interno al ejecutar la migración", details: err.message });
  }
});

app.post("/api/reports/liquidar", async (req, res) => {
  const { idInforme } = req.body;
  if (!idInforme) {
    return res.status(400).json({ error: "idInforme es requerido" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.technicalReport.findUnique({
        where: { id: idInforme }
      });
      if (!report) {
        throw new Error("Informe técnico no encontrado");
      }

      const ots: any[] = await tx.$queryRawUnsafe(
        `SELECT id, estado, "contratoId", "potenciaKva" FROM "OT" WHERE id = $1 FOR UPDATE`,
        report.otId
      );
      const ot = ots[0];
      if (!ot) {
        throw new Error("Orden de Trabajo asociada no encontrada");
      }

      if (ot.estado === "Cerrada") {
        return { status: "already_closed", message: "La Orden de Trabajo ya se encuentra cerrada" };
      }

      if (!ot.contratoId) {
        throw new Error("La Orden de Trabajo no tiene un contrato asociado");
      }

      const contracts: any[] = await tx.$queryRawUnsafe(
        `SELECT id, "saldo_actual_contrato", sobregiro FROM "ContratoNuevo" WHERE id = $1 FOR UPDATE`,
        ot.contratoId
      );
      const contract = contracts[0];
      if (!contract) {
        throw new Error("Contrato asociado no encontrado en la base de datos");
      }

      const tarifarios = await tx.tarifarioContrato.findMany({
        where: { contratoId: ot.contratoId }
      });
      const tarifaHoraMo = tarifarios.find(t => t.concepto === "Hora Técnico")?.precioUnitario || 0;

      const horasTrabajadas = ot.potenciaKva || 0;
      const costoManoObra = (horasTrabajadas || 8) * tarifaHoraMo;

      const repuestos = await tx.repuestoUtilizado.findMany({
        where: { reportId: idInforme }
      });
      const costoRepuestos = repuestos.reduce((acc, r) => acc + (r.cantidad * r.precioUnitarioSnapshot), 0);
      const costoTotal = costoManoObra + costoRepuestos;

      const saldoActual = contract.saldo_actual_contrato !== null ? contract.saldo_actual_contrato : 0;
      const nuevoSaldo = saldoActual - costoTotal;
      const esSobregiro = nuevoSaldo < 0;

      await tx.$executeRawUnsafe(
        `UPDATE "ContratoNuevo" SET "saldo_actual_contrato" = $1, sobregiro = $2 WHERE id = $3`,
        nuevoSaldo,
        esSobregiro,
        ot.contratoId
      );

      await tx.oT.update({
        where: { id: report.otId },
        data: { estado: "Cerrada" }
      });

      return {
        status: "success",
        montoTotal: costoTotal,
        nuevoSaldo,
        sobregiro: esSobregiro
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error("Error al liquidar reporte técnico:", err.message);
    res.status(500).json({ error: err.message || "Error al liquidar el reporte técnico" });
  }
});

app.post("/api/contratos/:id/ampliaciones", async (req, res) => {
  const contratoId = req.params.id;
  const { montoAmpliacion } = req.body;

  if (typeof montoAmpliacion !== "number" || montoAmpliacion <= 0) {
    return res.status(400).json({ error: "montoAmpliacion debe ser un número positivo" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.contratoNuevo.findUnique({
        where: { id: contratoId }
      });
      if (!contract) {
        throw new Error("Contrato no encontrado");
      }

      const idAmpliacion = `amp_${Date.now()}`;
      await tx.ampliacionContrato.create({
        data: {
          id: idAmpliacion,
          contratoId,
          montoAmpliacion,
          creadoEn: new Date().toISOString()
        }
      });

      const saldoActual = contract.saldo_actual_contrato !== null ? contract.saldo_actual_contrato : 0;
      const nuevoSaldo = saldoActual + montoAmpliacion;
      const presupuestoTotal = contract.presupuesto_total_usd !== null ? contract.presupuesto_total_usd : 0;
      const nuevoPresupuesto = presupuestoTotal + montoAmpliacion;

      await tx.contratoNuevo.update({
        where: { id: contratoId },
        data: {
          saldo_actual_contrato: nuevoSaldo,
          presupuesto_total_usd: nuevoPresupuesto,
          sobregiro: nuevoSaldo >= 0 ? false : contract.sobregiro
        }
      });

      return { success: true, nuevoSaldo, nuevoPresupuesto };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ots/validar-creacion", async (req, res) => {
  const { contratoId, equipoModelo, serie } = req.body;

  if (!contratoId || !equipoModelo || !serie) {
    return res.status(400).json({ error: "contratoId, equipoModelo y serie son requeridos" });
  }

  try {
    const contract = await prisma.contratoNuevo.findUnique({
      where: { id: contratoId }
    });

    if (!contract) {
      return res.json({ valido: false, motivo: "Contrato no encontrado" });
    }

    if (contract.saldo_actual_contrato !== null && contract.saldo_actual_contrato <= 0) {
      return res.json({ valido: false, motivo: "El contrato no cuenta con saldo disponible" });
    }

    const equipo = await prisma.equipoContratado.findFirst({
      where: {
        contratoId,
        equipoModelo,
        serie
      }
    });

    if (!equipo) {
      return res.json({ valido: false, motivo: "El equipo no se encuentra bajo la cobertura de este contrato" });
    }

    res.json({ valido: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contratos/:id/tarifario", async (req, res) => {
  try {
    const list = await prisma.tarifarioContrato.findMany({
      where: { contratoId: req.params.id }
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contratos/:id/tarifario", async (req, res) => {
  const { concepto, precioUnitario } = req.body;
  if (!concepto || typeof precioUnitario !== "number") {
    return res.status(400).json({ error: "concepto y precioUnitario son requeridos" });
  }
  try {
    const item = await prisma.tarifarioContrato.create({
      data: {
        id: `tar_${Date.now()}`,
        contratoId: req.params.id,
        concepto,
        precioUnitario
      }
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contratos/:id/equipos", async (req, res) => {
  try {
    const list = await prisma.equipoContratado.findMany({
      where: { contratoId: req.params.id }
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contratos/:id/equipos", async (req, res) => {
  const { equipoModelo, serie } = req.body;
  if (!equipoModelo || !serie) {
    return res.status(400).json({ error: "equipoModelo y serie son requeridos" });
  }
  try {
    const item = await prisma.equipoContratado.create({
      data: {
        id: `eq_${Date.now()}`,
        contratoId: req.params.id,
        equipoModelo,
        serie
      }
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------
// VITE OR STATIC FILE FALLBACK
// ----------------------------------------

async function startServer() {
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
