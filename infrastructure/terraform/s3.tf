# Bucket documents patients (privé, chiffré KMS — HDS)
resource "aws_s3_bucket" "patients" {
  bucket        = "${var.app_name}-patients-docs-prod"
  force_destroy = false
  tags          = { Name = "${var.app_name}-patients-docs", HDS = "true", Sensitivity = "high" }
}

resource "aws_s3_bucket_versioning" "patients" {
  bucket = aws_s3_bucket.patients.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "patients" {
  bucket = aws_s3_bucket.patients.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "patients" {
  bucket                  = aws_s3_bucket.patients.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "patients" {
  bucket = aws_s3_bucket.patients.id
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    filter {}
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# Bucket vidéos cours (+ CloudFront CDN)
resource "aws_s3_bucket" "courses" {
  bucket        = "${var.app_name}-courses-videos-prod"
  force_destroy = false
  tags          = { Name = "${var.app_name}-courses-videos" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "courses" {
  bucket = aws_s3_bucket.courses.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "courses" {
  bucket                  = aws_s3_bucket.courses.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
