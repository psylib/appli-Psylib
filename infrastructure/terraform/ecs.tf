resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.app_name}-cluster" }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.app_name}/api"
  retention_in_days = 90  # 3 mois — HDS minimum
  tags              = { Name = "${var.app_name}-api-logs", HDS = "true" }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.app_name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}"
    essential = true

    portMappings = [{
      containerPort = 4000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT",     value = "4000" },
    ]

    secrets = [
      { name = "DATABASE_URL",           valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/DATABASE_URL" },
      { name = "REDIS_URL",              valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/REDIS_URL" },
      { name = "ENCRYPTION_KEY",         valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/ENCRYPTION_KEY" },
      { name = "JWT_SECRET",             valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/JWT_SECRET" },
      { name = "PATIENT_JWT_SECRET",     valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/PATIENT_JWT_SECRET" },
      { name = "STRIPE_SECRET_KEY",      valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/STRIPE_SECRET_KEY" },
      { name = "STRIPE_WEBHOOK_SECRET",  valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/STRIPE_WEBHOOK_SECRET" },
      { name = "ANTHROPIC_API_KEY",      valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/ANTHROPIC_API_KEY" },
      { name = "RESEND_API_KEY",         valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/RESEND_API_KEY" },
      { name = "KEYCLOAK_URL",           valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/KEYCLOAK_URL" },
      { name = "KEYCLOAK_REALM",         valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/KEYCLOAK_REALM" },
      { name = "KEYCLOAK_CLIENT_ID",     valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/KEYCLOAK_CLIENT_ID" },
      { name = "KEYCLOAK_CLIENT_SECRET", valueFrom = "arn:aws:ssm:${var.aws_region}:ACCOUNT:parameter/psyscale/KEYCLOAK_CLIENT_SECRET" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "api"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = { Name = "${var.app_name}-api-task" }
}

resource "aws_ecs_service" "api" {
  name            = "${var.app_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.http]
  tags       = { Name = "${var.app_name}-api-service" }
}

# Auto-scaling
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.app_name}-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
