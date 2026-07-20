const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/otDefaults.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

const target1 = "export const INITIAL_CONTRATOS_NUEVOS: Contrato[] =";
const replacement1 = "export const INITIAL_CONTRATOS_NUEVOS: any[] =";

if (!content.includes(target1)) {
  console.error("Target INITIAL_CONTRATOS_NUEVOS not found in otDefaults.ts!");
  process.exit(1);
}

content = content.replace(target1, replacement1);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched otDefaults.ts (INITIAL_CONTRATOS_NUEVOS to any[])");
process.exit(0);
