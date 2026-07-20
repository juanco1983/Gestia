import('./src/types.js').then(({ OTStatus }) => {
  console.log("OTStatus in src/types:", OTStatus);
}).catch(err => {
  console.error("Error importing src/types:", err);
});

import('@prisma/client').then((prismaClient) => {
  console.log("OTStatus in @prisma/client:", prismaClient.OTStatus);
}).catch(err => {
  console.error("Error importing @prisma/client:", err);
});
