# Outputs for Portify AWS ECS Fargate deployment

# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "application_url" {
  description = "URL of the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "http://${aws_lb.main.dns_name}/api/health"
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_id" {
  description = "ID of the ECS service"
  value       = aws_ecs_service.main.id
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

# ECR Outputs
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.app.arn
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_url" {
  description = "Database connection URL"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive   = true
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"
  sensitive   = true
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# IAM Outputs
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}

# Auto Scaling Outputs
output "autoscaling_target_resource_id" {
  description = "Resource ID of the autoscaling target"
  value       = aws_appautoscaling_target.ecs_target.resource_id
}

# SSM Parameter Outputs (ARNs only for security)
output "jwt_secret_parameter_arn" {
  description = "ARN of the JWT secret SSM parameter"
  value       = aws_ssm_parameter.jwt_secret.arn
}

output "openai_api_key_parameter_arn" {
  description = "ARN of the OpenAI API key SSM parameter"
  value       = aws_ssm_parameter.openai_api_key.arn
}

output "kite_api_key_parameter_arn" {
  description = "ARN of the Kite API key SSM parameter"
  value       = aws_ssm_parameter.kite_api_key.arn
}

output "kite_api_secret_parameter_arn" {
  description = "ARN of the Kite API secret SSM parameter"
  value       = aws_ssm_parameter.kite_api_secret.arn
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and next steps"
  value = {
    environment     = var.environment
    region         = var.aws_region
    project_name   = var.project_name
    application_url = "http://${aws_lb.main.dns_name}"
    health_check   = "http://${aws_lb.main.dns_name}/api/health"
    
    next_steps = [
      "1. Build and push Docker image to ECR: ${aws_ecr_repository.app.repository_url}",
      "2. Update ECS service to deploy the new image",
      "3. Run database migrations",
      "4. Configure domain name and SSL certificate (optional)",
      "5. Set up monitoring and alerting",
      "6. Configure messaging platform integrations"
    ]
    
    useful_commands = {
      ecr_login = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
      docker_build = "docker build -t ${var.project_name} ."
      docker_tag = "docker tag ${var.project_name}:latest ${aws_ecr_repository.app.repository_url}:latest"
      docker_push = "docker push ${aws_ecr_repository.app.repository_url}:latest"
      ecs_update = "aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.main.name} --force-new-deployment"
      logs = "aws logs tail /ecs/${var.project_name} --follow"
    }
  }
}

# Cost Estimation
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown (USD)"
  value = {
    fargate = "~$${var.fargate_cpu == 256 ? "15-30" : var.fargate_cpu == 512 ? "30-60" : var.fargate_cpu == 1024 ? "60-120" : "120+"} (${var.app_count} tasks)"
    rds = "~$${var.rds_instance_class == "db.t3.micro" ? "15-20" : var.rds_instance_class == "db.t3.small" ? "25-35" : "50+"}"
    redis = "~$${var.redis_node_type == "cache.t3.micro" ? "15-20" : var.redis_node_type == "cache.t3.small" ? "25-35" : "50+"}"
    alb = "~$20-25"
    nat_gateway = "~$45-50 (2 NAT gateways)"
    data_transfer = "~$10-50 (depends on usage)"
    cloudwatch = "~$5-15"
    total_estimate = "~$150-350/month (varies by usage)"
    
    cost_optimization_tips = [
      "Use Fargate Spot for non-critical workloads (50-70% savings)",
      "Enable RDS storage autoscaling",
      "Use CloudWatch log retention policies",
      "Consider single NAT gateway for development",
      "Monitor and optimize data transfer costs"
    ]
  }
}

# Integration URLs for messaging platforms
output "webhook_urls" {
  description = "Webhook URLs for messaging platform integrations"
  value = {
    slack = "http://${aws_lb.main.dns_name}/api/webhooks/slack"
    telegram = "http://${aws_lb.main.dns_name}/api/webhooks/telegram"
    whatsapp = "http://${aws_lb.main.dns_name}/api/webhooks/whatsapp"
    
    setup_instructions = {
      slack = "Configure this URL in your Slack app's Event Subscriptions"
      telegram = "Set this URL as webhook using: curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook -d url=<WEBHOOK_URL>"
      whatsapp = "Configure this URL in your WhatsApp Business API webhook settings"
    }
  }
}

# ChatGPT Integration Information
output "chatgpt_integration" {
  description = "Information for ChatGPT integration"
  value = {
    api_base_url = "http://${aws_lb.main.dns_name}"
    openapi_schema_url = "http://${aws_lb.main.dns_name}/api/docs/openapi.json"
    
    setup_steps = [
      "1. Create a custom GPT in ChatGPT",
      "2. Configure actions with the OpenAPI schema URL above",
      "3. Set authentication to API Key with Authorization header",
      "4. Test the integration with sample queries"
    ]
  }
} 