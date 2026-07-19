const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

console.log("Characters from 3520 to 3560:");
const slice = content.substring(3520, 3560);
console.log(JSON.stringify(slice));
for (let i = 0; i < slice.length; i++) {
  console.log(`${i} (${3520 + i}): ${slice[i]} -> ${slice.charCodeAt(i)}`);
}
