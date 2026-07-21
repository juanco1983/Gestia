const { Pool } = require('pg');

async function main() {
  const connectionString = "postgresql://gestia_admin:GestiaDevPass2026!@gestia-dev-postgres.cmrsac8isuqs.us-east-1.rds.amazonaws.com:5432/gestia?schema=public&sslmode=require";
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT count(*) FROM "User"');
    console.log('Total users in DB:', res.rows[0].count);

    const users = await pool.query('SELECT id, username, email, role FROM "User" LIMIT 10');
    console.log('Users:', users.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
