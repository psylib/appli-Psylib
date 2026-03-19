variable "aws_region" {
  description = "AWS region — eu-west-3 (Paris, HDS certifié)"
  type        = string
  default     = "eu-west-3"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "psyscale"
}

variable "domain_name" {
  description = "Main domain (ex: psylib.eu)"
  type        = string
  default     = "psylib.eu"
}

variable "api_domain" {
  description = "API subdomain"
  type        = string
  default     = "api.psylib.eu"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "psyscale"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password (use AWS Secrets Manager in prod)"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "psyscale"
}

variable "api_image_tag" {
  description = "Docker image tag for API"
  type        = string
  default     = "latest"
}

variable "api_cpu" {
  description = "ECS task CPU units (1 vCPU = 1024)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "ECS task memory (MB)"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Number of ECS task instances"
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (must exist before apply)"
  type        = string
  default     = ""
}
