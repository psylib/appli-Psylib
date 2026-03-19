resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.app_name}-db-subnet" }
}

resource "aws_db_instance" "main" {
  identifier = "${var.app_name}-postgres"

  engine               = "postgres"
  engine_version       = "16.2"
  instance_class       = "db.t3.medium"
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true  # HDS obligatoire

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = true   # HA pour production
  publicly_accessible    = false  # Jamais public (HDS)

  backup_retention_period    = 30      # 30 jours de backup (HDS)
  backup_window              = "03:00-04:00"
  maintenance_window         = "Mon:04:00-Mon:05:00"
  delete_automated_backups   = false
  deletion_protection        = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${var.app_name}-final-snapshot"

  performance_insights_enabled = true
  monitoring_interval          = 60
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = { Name = "${var.app_name}-postgres", HDS = "true" }
}
