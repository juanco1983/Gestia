const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TecnicoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = "                            )}\n                          </div>\n                        )\n                      </>\n                    );";
const replacementStr = "                            )}\n                          </div>\n                        )}\n                      </>\n                    );";

if (content.indexOf(targetStr) === -1) {
  console.error("Target string not found in TecnicoView.tsx!");
  process.exit(1);
}

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched TecnicoView.tsx braces");
process.exit(0);
