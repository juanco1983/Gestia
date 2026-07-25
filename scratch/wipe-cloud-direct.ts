import { Pool } from 'pg';

const connectionString = "postgresql://gestia_admin:GestiaDevPass2026!@gestia-dev-postgres.cmrsac8isuqs.us-east-1.rds.amazonaws.com:5432/gestia?sslmode=no-verify";

async function runDirectWipe() {
  console.log("🔌 Conectando directamente a AWS RDS PostgreSQL vía pool de PG...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Conexión establecida con éxito con AWS RDS PostgreSQL.");

    console.log("🧹 Ejecutando truncado/eliminación de datos operacionales...");

    // List of operational tables in dependency order
    const tables = [
      '"TechnicalReport"',
      '"OtEquipoAsignacion"',
      '"ServicioEquipo"',
      '"OT"',
      '"OrdenTrabajoLinea"',
      '"EquipoAmpliacion"',
      '"Equipo"',
      '"ContratoAmpliacion"',
      '"ContratoNuevo"',
      '"Client"'
    ];

    for (const table of tables) {
      try {
        const res = await client.query(`DELETE FROM ${table};`);
        console.log(`- Tabla ${table}: ${res.rowCount} filas eliminadas.`);
      } catch (err: any) {
        console.log(`- Tabla ${table}: error al limpiar (${err.message}).`);
      }
    }

    client.release();
    console.log("✅ Limpieza directa de la BD de la nube completada exitosamente.");
  } catch (err: any) {
    console.error("❌ Error de conexión/ejecución directo con AWS RDS:", err.message || err);
  } finally {
    await pool.end();
  }
}

runDirectWipe();
