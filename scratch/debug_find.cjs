const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

console.log("Searching for selectedOt...");
let pos = 0;
while (true) {
  const index = content.indexOf("selectedOt", pos);
  if (index === -1) break;
  console.log(`Found 'selectedOt' at index ${index}: ${content.substring(index - 20, index + 80)}`);
  pos = index + 1;
}
