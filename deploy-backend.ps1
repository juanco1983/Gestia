#!/usr/bin/env pwsh
##############################################
# deploy-backend.ps1
# [DEPRECATED] - Despliegues manuales
# Por favor NO USAR este script. Todos los despliegues de la aplicacion (Front, Back, BD)
# ahora estan completamente automatizados via GitHub Actions (.github/workflows/app-deploy.yml)
# Solo se mantiene como referencia temporal.
##############################################

Write-Host "`n[WARNING] ESTE SCRIPT ESTA DEPRECADO." -ForegroundColor Red
Write-Host "Realice sus despliegues haciendo merge o push a las ramas 'dev' o 'main' en GitHub." -ForegroundColor Yellow
Write-Host "GitHub Actions automatizara el proceso completo.`n" -ForegroundColor Yellow

$EnvName = "gestia-backend-dev"
$AppName = "gestia-backend"
$S3Bucket = "elasticbeanstalk-us-east-1-325580897755"
$VersionLabel = "v-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$ZipFile = "dist/backend-deploy.zip"
$DeployDir = "eb-deploy-temp"

Write-Host "`n[INFO] Iniciando despliegue de backend a AWS Elastic Beanstalk..." -ForegroundColor Cyan
Write-Host "Ambiente:      $EnvName" -ForegroundColor Gray
Write-Host "Version:       $VersionLabel" -ForegroundColor Gray
Write-Host "Bucket S3:     $S3Bucket`n" -ForegroundColor Gray

# ── 1. Preparar dependencias y build ──────────────────────────────────────────
Write-Host "[BUILD] Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error en npm install" -ForegroundColor Red; exit 1 }

Write-Host "[BUILD] Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error en prisma generate" -ForegroundColor Red; exit 1 }

Write-Host "[BUILD] Compilando servidor con esbuild..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error en npm run build" -ForegroundColor Red; exit 1 }

# ── 2. Crear paquete de despliegue ──────────────────────────────────────────
Write-Host "[PACK] Preparando archivos para empaquetado..." -ForegroundColor Yellow
if (Test-Path $DeployDir) { Remove-Item -Recurse -Force $DeployDir }
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }

New-Item -ItemType Directory -Path "$DeployDir/prisma" -Force | Out-Null

Copy-Item -Path "dist" -Destination "$DeployDir" -Recurse -Force
Copy-Item -Path "prisma" -Destination "$DeployDir" -Recurse -Force
$ProdPackage = @{
    name = "gestia-backend-prod"
    version = "1.0.0"
    private = $true
    type = "module"
    scripts = @{
        start = "node dist/server.cjs"
    }
    dependencies = @{
        "@aws-sdk/client-s3" = "^3.712.0"
        "@aws-sdk/s3-request-presigner" = "^3.1105.0"
        "@google/genai" = "^2.4.0"
        "@prisma/adapter-pg" = "^7.8.0"
        "@prisma/client" = "^7.8.0"
        "bcryptjs" = "^3.0.3"
        "cors" = "^2.8.6"
        "dotenv" = "^17.2.3"
        "express" = "^4.21.2"
        "express-rate-limit" = "^8.7.0"
        "jsonwebtoken" = "^9.0.3"
        "pg" = "^8.22.0"
        "prisma" = "^7.8.0"
        "ubigeo-peru" = "^2.0.2"
    }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$DeployDir/package.json", $ProdPackage, (New-Object System.Text.UTF8Encoding $false))
[System.IO.File]::WriteAllText("$DeployDir/Procfile", "web: npx prisma generate && npx prisma db push && node dist/server.cjs", (New-Object System.Text.UTF8Encoding $false))
Copy-Item "prisma.config.js" "$DeployDir/prisma.config.js"
if (Test-Path ".ebextensions") { Copy-Item -Recurse ".ebextensions" "$DeployDir/.ebextensions" }

Write-Host "[PACK] Comprimiendo paquete de despliegue en $ZipFile..." -ForegroundColor Yellow
tar -a -c -f "$ZipFile" -C "$DeployDir" .
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error al comprimir" -ForegroundColor Red; exit 1 }

# ── 3. Subir a S3 ───────────────────────────────────────────────────────────
Write-Host "[AWS] Subiendo paquete $ZipFile a S3..." -ForegroundColor Yellow
aws s3 cp $ZipFile "s3://$S3Bucket/$VersionLabel.zip"
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error al subir a S3" -ForegroundColor Red; exit 1 }

# ── 4. Registrar version en Beanstalk ───────────────────────────────────────
Write-Host "[AWS] Creando nueva version de aplicacion en Elastic Beanstalk..." -ForegroundColor Yellow
aws elasticbeanstalk create-application-version `
    --application-name $AppName `
    --version-label $VersionLabel `
    --source-bundle "S3Bucket=$S3Bucket,S3Key=$VersionLabel.zip" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error al registrar version" -ForegroundColor Red; exit 1 }

# ── 5. Actualizar entorno ───────────────────────────────────────────────────
Write-Host "[AWS] Actualizando entorno $EnvName con la version $VersionLabel..." -ForegroundColor Yellow
aws elasticbeanstalk update-environment `
    --environment-name $EnvName `
    --version-label $VersionLabel | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Error al actualizar el entorno" -ForegroundColor Red; exit 1 }

# Limpieza
Remove-Item -Recurse -Force $DeployDir

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "[OK] Despliegue iniciado correctamente." -ForegroundColor Green
Write-Host "AWS Beanstalk esta actualizando el servidor en la nube." -ForegroundColor Gray
Write-Host "El proceso tomara de 2 a 3 minutos." -ForegroundColor Gray
Write-Host "======================================================= `n" -ForegroundColor Cyan
