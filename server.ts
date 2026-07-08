import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const JWT_SECRET = process.env.JWT_SECRET || "gestia_secret_token_key_123456";

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

app.post("/api/reports", async (req, res) => {
  try {
    const report = req.body;
    const { otId, ...data } = report;
    const saved = await prisma.technicalReport.upsert({
      where: { otId: report.otId },
      update: data,
      create: report
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Error" });
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
        const { otId, ...data } = sr;
        await prisma.technicalReport.upsert({
          where: { otId },
          update: { ...data, offlineDirty: false },
          create: { ...sr, offlineDirty: false }
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
        await prisma.oT.upsert({ where: { id: so.id }, update: so, create: so });
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
        await prisma.ordenTrabajoLinea.upsert({ where: { id: sol.id }, update: insertData, create: insertData });
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
    
    // Return all data
    res.json({
      success: true,
      ots: await prisma.oT.findMany(),
      reports: await prisma.technicalReport.findMany(),
      clients: await prisma.client.findMany(),
      contracts: await prisma.contract.findMany(),
      ordenesTrabajo: await prisma.ordenTrabajoLinea.findMany(),
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
    res.json(await prisma.ordenTrabajoLinea.findMany());
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
    const newContrato = req.body;
    if (!newContrato.id) newContrato.id = `cont_${Date.now()}`;
    const created = await prisma.contratoNuevo.create({ data: newContrato });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error" });
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

app.post("/api/config", (req, res) => {
  res.json({ tipoCambio: req.body.tipoCambio || 3.75 });
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
