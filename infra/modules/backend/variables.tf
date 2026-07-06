variable "project"                    { type = string }
variable "env"                        { type = string }
variable "region"                     { type = string }
variable "public_subnet_ids"          { type = list(string) }
variable "backend_sg_id"              { type = string }
variable "beanstalk_instance_profile" { type = string }
variable "beanstalk_service_role_arn" { type = string }
variable "db_host"                    { type = string }
variable "db_port"                    { type = number; default = 5432 }
variable "db_name"                    { type = string }
variable "db_username"                { type = string }
variable "db_password"                { type = string; sensitive = true }
variable "jwt_secret"                 { type = string; sensitive = true }
variable "photos_bucket_name"         { type = string }
variable "instance_type"              { type = string; default = "t3.micro" }
