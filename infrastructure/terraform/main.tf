terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # Backend S3 — stocke l'état Terraform (à configurer avant apply)
  # backend "s3" {
  #   bucket         = "psyscale-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "eu-west-3"
  #   encrypt        = true
  #   dynamodb_table = "psyscale-tf-locks"
  # }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "psyscale"
      Environment = var.environment
      ManagedBy   = "terraform"
      HDS         = "true"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
