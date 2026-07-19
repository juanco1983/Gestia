const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

console.log("File length:", content.length);

const regex = /const\s+(handle\w+)\s*=/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found function: ${match[1]} at index ${match.index}`);
}
