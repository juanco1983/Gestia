#!/usr/bin/env pwsh
##############################################
# bootstrap.ps1
# Crea el backend de Terraform (S3 + DynamoDB)
# Ejecutar UNA sola vez antes del primer terraform init
##############################################

param(
  [string]$Region  = "us-east-1",
  [string]$Project = "gestia"
)

$StateBucket = "$Project-terraform-state"
$LockTable   = "$Project-terraform-locks"

Write-Host "`n🏗️  Bootstrap Terraform Backend" -ForegroundColor Cyan
Write-Host "Región:  $Region" -ForegroundColor Gray
Write-Host "Bucket:  $StateBucket" -ForegroundColor Gray
Write-Host "Tabla:   $LockTable`n" -ForegroundColor Gray

# ── 1. Verificar credenciales AWS ────────────────────────────────────────────
Write-Host "🔍 Verificando credenciales AWS..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Credenciales AWS inválidas. Ejecuta 'aws configure' primero." -ForegroundColor Red
    exit 1
}
$account = ($identity | ConvertFrom-Json).Account
Write-Host "✅ Cuenta AWS: $account`n" -ForegroundColor Green

# ── 2. Crear bucket S3 para el state ─────────────────────────────────────────
Write-Host "🪣 Creando bucket S3 para el state de Terraform..." -ForegroundColor Yellow
$bucketExists = aws s3api head-bucket --bucket $StateBucket 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ℹ️  El bucket '$StateBucket' ya existe." -ForegroundColor Gray
} else {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $StateBucket --region $Region | Out-Null
    } else {
        aws s3api create-bucket --bucket $StateBucket --region $Region `
            --create-bucket-configuration LocationConstraint=$Region | Out-Null
    }
    Write-Host "   ✅ Bucket creado: $StateBucket" -ForegroundColor Green
}

# Activar versionado
aws s3api put-bucket-versioning --bucket $StateBucket `
    --versioning-configuration Status=Enabled | Out-Null
Write-Host "   ✅ Versionado activado" -ForegroundColor Green

# Bloquear acceso público
aws s3api put-public-access-block --bucket $StateBucket `
    --public-access-block-configuration `
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" | Out-Null
Write-Host "   ✅ Acceso público bloqueado`n" -ForegroundColor Green

# ── 3. Crear tabla DynamoDB para locks ───────────────────────────────────────
Write-Host "🔒 Creando tabla DynamoDB para locks de Terraform..." -ForegroundColor Yellow
$tableExists = aws dynamodb describe-table --table-name $LockTable 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ℹ️  La tabla '$LockTable' ya existe." -ForegroundColor Gray
} else {
    aws dynamodb create-table `
        --table-name $LockTable `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region | Out-Null
    Write-Host "   ✅ Tabla DynamoDB creada: $LockTable`n" -ForegroundColor Green
}

# ── 4. Resumen ───────────────────────────────────────────────────────────────
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Bootstrap completado." -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host "  1. Configura los secrets en tu terminal:" -ForegroundColor Gray
Write-Host "     `$env:TF_VAR_db_password  = 'TuPasswordSeguro123!'" -ForegroundColor Yellow
Write-Host "     `$env:TF_VAR_jwt_secret   = 'UnJwtSecretLargoYSeguro'" -ForegroundColor Yellow
Write-Host "     `$env:TF_VAR_github_token = 'ghp_tuTokenDeGitHub'" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Inicializa Terraform:" -ForegroundColor Gray
Write-Host "     cd infra\environments\dev" -ForegroundColor Yellow
Write-Host "     terraform init" -ForegroundColor Yellow
Write-Host "     terraform plan" -ForegroundColor Yellow
Write-Host "     terraform apply" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan
