const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
console.log("Line 126:", JSON.stringify(lines[125]));
console.log("Line 127:", JSON.stringify(lines[126]));
console.log("Line 128:", JSON.stringify(lines[127]));
