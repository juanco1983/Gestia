import jwt from 'jsonwebtoken';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ENVS = [
  { name: 'dev', host: 'https://d24240l09ia1ef.cloudfront.net' },
  { name: 'qa', host: 'https://dxw5j68fci6ic.cloudfront.net' },
];

function secretFor(env: string): string {
  const f = path.join(os.tmpdir(), `jwt-gestia-backend-${env}.txt`);
  return fs.readFileSync(f, 'utf8').trim();
}

async function main() {
  for (const env of ENVS) {
    console.log(`\n===== ENTORNO ${env.name.toUpperCase()} =====`);
    const secret = secretFor(env.name);
    const token = jwt.sign(
      { id: 'admin-cli', email: 'admin-cli@mafort.pe', role: 'Administrador' },
      secret,
      { expiresIn: '5m' }
    );
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const beforeRes = await fetch(`${env.host}/api/db-dump`, { headers });
      if (beforeRes.status === 404) {
        console.log('no.api → aún sin endpoint /api (¿deploy no terminó?)');
        continue;
      }
      if (!beforeRes.ok) {
        console.log(`before falló: HTTP ${beforeRes.status}`);
        continue;
      }
      const before = await beforeRes.json();
      const countsBefore = {
        users: before.users?.length ?? 0,
        clients: before.clients?.length ?? 0,
        contractsLegacy: before.contracts?.length ?? 0,
        ots: before.ots?.length ?? 0,
        reports: before.reports?.length ?? 0,
        visitas: before.visitas?.length ?? 'n/a',
        targetVentas: before.targetVentas?.length ?? 0,
        logs: before.logs?.length ?? 0,
        contratosNuevos: before.contratosNuevos?.length ?? 0,
      };
      console.log('PRE  :', JSON.stringify(countsBefore));

      const wipeRes = await fetch(`${env.host}/api/admin/wipe-operational-db`, {
        method: 'POST',
        headers,
      });
      let wipeBody: any = null;
      try { wipeBody = await wipeRes.json(); } catch { wipeBody = await wipeRes.text(); }
      console.log(`wipe : HTTP ${wipeRes.status}`, JSON.stringify(wipeBody));

      const afterRes = await fetch(`${env.host}/api/db-dump`, { headers });
      const after = await afterRes.json();
      console.log('POST :', JSON.stringify({
        users: after.users?.length ?? 0,
        clients: after.clients?.length ?? 0,
        contractsLegacy: after.contracts?.length ?? 0,
        ots: after.ots?.length ?? 0,
        reports: after.reports?.length ?? 0,
        visitas: after.visitas?.length ?? 'n/a',
        targetVentas: after.targetVentas?.length ?? 0,
        logs: after.logs?.length ?? 0,
        contratosNuevos: after.contratosNuevos?.length ?? 0,
      }));
    } catch (err: any) {
      console.log(`ERROR ${env.name}:`, err?.message ?? err);
    }
  }
}

main();