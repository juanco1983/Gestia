import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "gestia-qa-photos";

async function testS3() {
  console.log(`Iniciando prueba de conexión y operaciones en S3 (Bucket QA: ${BUCKET_NAME})...`);
  
  const testKey = `test-qa-${Date.now()}.txt`;
  const testContent = "Este es un archivo de prueba para validar el ambiente QA.";

  try {
    // 1. Upload
    console.log(`1. Subiendo archivo de prueba (${testKey})...`);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: "text/plain",
      })
    );
    console.log("   ✅ Subida exitosa.");

    // 2. Download/Verify
    console.log(`2. Verificando lectura del archivo...`);
    const getRes = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey,
      })
    );
    console.log("   ✅ Lectura exitosa (El archivo existe en el bucket QA).");

    // 3. Delete
    console.log(`3. Limpiando archivo de prueba...`);
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey,
      })
    );
    console.log("   ✅ Eliminación exitosa.");

    console.log("\n✅ PRUEBA COMPLETADA EXITOSAMENTE. El bucket QA está funcionando correctamente para escritura, lectura y eliminación.");
  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA PRUEBA S3 QA:");
    console.error(error);
  }
}

testS3();
