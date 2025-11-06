# Variables for Portify AWS ECS Fargate deployment

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "portify"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ECS Configuration
variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 512
  
  validation {
    condition = contains([256, 512, 1024, 2048, 4096], var.fargate_cpu)
    error_message = "Fargate CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  type        = number
  default     = 1024
  
  validation {
    condition = var.fargate_memory >= 512 && var.fargate_memory <= 30720
    error_message = "Fargate memory must be between 512 and 30720 MiB."
  }
}

variable "app_count" {
  description = "Number of docker containers to run"
  type        = number
  default     = 2
  
  validation {
    condition     = var.app_count >= 1 && var.app_count <= 10
    error_message = "App count must be between 1 and 10."
  }
}

# Database Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "portify"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "portify_user"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username))
    error_message = "Database username must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

# Redis Configuration
variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# Application Secrets
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters long."
  }
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^sk-", var.openai_api_key))
    error_message = "OpenAI API key must start with 'sk-'."
  }
}

variable "kite_api_key" {
  description = "Kite API key"
  type        = string
  sensitive   = true
}

variable "kite_api_secret" {
  description = "Kite API secret"
  type        = string
  sensitive   = true
}

# Optional: Slack Integration
variable "slack_bot_token" {
  description = "Slack bot token for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "slack_signing_secret" {
  description = "Slack signing secret for webhook verification"
  type        = string
  default     = ""
  sensitive   = true
}

# Optional: Telegram Integration
variable "telegram_bot_token" {
  description = "Telegram bot token"
  type        = string
  default     = ""
  sensitive   = true
}

# Optional: WhatsApp Integration
variable "whatsapp_phone_number_id" {
  description = "WhatsApp phone number ID"
  type        = string
  default     = ""
}

variable "whatsapp_access_token" {
  description = "WhatsApp access token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "whatsapp_webhook_verify_token" {
  description = "WhatsApp webhook verify token"
  type        = string
  default     = ""
  sensitive   = true
}

# Domain Configuration (Optional)
variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

# Backup Configuration
variable "backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days."
  }
}

# Auto Scaling Configuration
variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
  
  validation {
    condition     = var.min_capacity >= 1
    error_message = "Minimum capacity must be at least 1."
  }
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_capacity >= var.min_capacity
    error_message = "Maximum capacity must be greater than or equal to minimum capacity."
  }
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
  
  validation {
    condition     = var.target_cpu_utilization >= 10 && var.target_cpu_utilization <= 90
    error_message = "Target CPU utilization must be between 10 and 90 percent."
  }
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable Fargate Spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "spot_allocation_strategy" {
  description = "Allocation strategy for Spot instances"
  type        = string
  default     = "diversified"
  
  validation {
    condition     = contains(["diversified", "binpack"], var.spot_allocation_strategy)
    error_message = "Spot allocation strategy must be 'diversified' or 'binpack'."
  }
}

# Security Configuration
variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
} 