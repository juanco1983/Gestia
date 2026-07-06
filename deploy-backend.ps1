#!/usr/bin/env pwsh
##############################################
# deploy-backend.ps1
# Compila y despliega el backend Node.js a AWS Elastic Beanstalk
# Utiliza las credenciales de AWS configuradas localmente.
##############################################

$Project = "gestia"
$EnvName = "gestia-backend-dev"
$AppName = "gestia-backend"
$S3Bucket = "elasticbeanstalk-us-east-1-325580897755"
$VersionLabel = "v-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$ZipFile = "dist/backend-deploy.zip"
$DeployDir = "dist/eb-deploy"

Write-Host "`n🚀 Iniciando despliegue de backend a AWS Elastic Beanstalk..." -ForegroundColor Cyan
Write-Host "Ambiente:      $EnvName" -ForegroundColor Gray
Write-Host "Versión:       $VersionLabel" -ForegroundColor Gray
Write-Host "Bucket S3:     $S3Bucket`n" -ForegroundColor Gray

# ── 1. Preparar dependencias y build ──────────────────────────────────────────
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en npm install" -ForegroundColor Red; exit 1 }

Write-Host "⚙️ Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en prisma generate" -ForegroundColor Red; exit 1 }

Write-Host "🔨 Compilando servidor con esbuild..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en npm run build" -ForegroundColor Red; exit 1 }

# ── 2. Crear paquete de despliegue ──────────────────────────────────────────
Write-Host "📂 Preparando archivos para empaquetado..." -ForegroundColor Yellow
if (Test-Path $DeployDir) { Remove-Item -Recurse -Force $DeployDir }
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }

New-Item -ItemType Directory -Path "$DeployDir/dist" -Force | Out-Null
New-Item -ItemType Directory -Path "$DeployDir/prisma" -Force | Out-Null

Copy-Item "dist/server.cjs" "$DeployDir/dist/server.cjs"
Copy-Item "prisma/schema.prisma" "$DeployDir/prisma/schema.prisma"
Copy-Item "package.json" "$DeployDir/package.json"
Copy-Item "Procfile" "$DeployDir/Procfile"

Write-Host "🔩 Comprimiendo paquete de despliegue en $ZipFile..." -ForegroundColor Yellow
Compress-Archive -Path "$DeployDir/*" -DestinationPath $ZipFile -Force
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error al comprimir" -ForegroundColor Red; exit 1 }

# ── 3. Subir a S3 ───────────────────────────────────────────────────────────
Write-Host "☁️ Subiendo paquete $ZipFile a S3..." -ForegroundColor Yellow
aws s3 cp $ZipFile "s3://$S3Bucket/$VersionLabel.zip"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error al subir a S3" -ForegroundColor Red; exit 1 }

# ── 4. Registrar versión en Beanstalk ───────────────────────────────────────
Write-Host "🏷️ Creando nueva versión de aplicación en Elastic Beanstalk..." -ForegroundColor Yellow
aws elasticbeanstalk create-application-version `
    --application-name $AppName `
    --version-label $VersionLabel `
    --source-bundle "S3Bucket=$S3Bucket,S3Key=$VersionLabel.zip" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error al registrar versión" -ForegroundColor Red; exit 1 }

# ── 5. Actualizar entorno ───────────────────────────────────────────────────
Write-Host "🔄 Actualizando entorno $EnvName con la versión $VersionLabel..." -ForegroundColor Yellow
aws elasticbeanstalk update-environment `
    --environment-name $EnvName `
    --version-label $VersionLabel | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error al actualizar el entorno" -ForegroundColor Red; exit 1 }

# Limpieza
Remove-Item -Recurse -Force $DeployDir

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "✅ Despliegue iniciado correctamente." -ForegroundColor Green
Write-Host "AWS Beanstalk está actualizando el servidor en la nube." -ForegroundColor Gray
Write-Host "El proceso tomará de 2 a 3 minutos." -ForegroundColor Gray
Write-Host "=======================================================`n" -ForegroundColor Cyan
