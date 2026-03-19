output "alb_dns_name" {
  description = "ALB DNS name — à pointer avec un CNAME vers api.psylib.eu"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR URL pour docker push"
  value       = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint (privé — accès via ECS uniquement)"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "s3_patients_bucket" {
  description = "S3 bucket nom — documents patients"
  value       = aws_s3_bucket.patients.bucket
}

output "s3_courses_bucket" {
  description = "S3 bucket nom — vidéos cours"
  value       = aws_s3_bucket.courses.bucket
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.api.name
}
