# ──────────────────────────────────────────────────────────────────────────────
# terraform.tfvars — Valores NO sensibles del ambiente DEV
#
# ⚠️  NUNCA COMMITEAR: db_password, jwt_secret, github_token
#     Esos se pasan vía variables de entorno o GitHub Actions Secrets:
#       export TF_VAR_db_password="tu_password_aqui"
#       export TF_VAR_jwt_secret="tu_jwt_secret_aqui"
#       export TF_VAR_github_token="ghp_tu_token_aqui"
# ──────────────────────────────────────────────────────────────────────────────

aws_region  = "us-east-1"
project     = "gestia"
env         = "dev"
github_repo = "juanco1983/Gestia"
