# KMS Key for SSM Parameter Store
resource "aws_kms_key" "ssm" {
  description             = "KMS key for SSM Parameter Store encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-ssm-kms"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "ssm" {
  name          = "alias/${var.project_name}-ssm"
  target_key_id = aws_kms_key.ssm.key_id
}

# Database URL
resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/database_url"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}:5432/${var.db_name}?schema=public"
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-database-url"
    Environment = var.environment
  }
}

# Redis URL
resource "aws_ssm_parameter" "redis_url" {
  name  = "/${var.project_name}/redis_url"
  type  = "SecureString"
  value = "rediss://:${var.redis_auth_token}@${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-redis-url"
    Environment = var.environment
  }
}

# JWT Secret
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-jwt-secret"
    Environment = var.environment
  }
}

# OpenAI API Key
resource "aws_ssm_parameter" "openai_api_key" {
  name  = "/${var.project_name}/openai_api_key"
  type  = "SecureString"
  value = var.openai_api_key
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-openai-api-key"
    Environment = var.environment
  }
}

# Kite API Key
resource "aws_ssm_parameter" "kite_api_key" {
  name  = "/${var.project_name}/kite_api_key"
  type  = "SecureString"
  value = var.kite_api_key
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-kite-api-key"
    Environment = var.environment
  }
}

# Kite API Secret
resource "aws_ssm_parameter" "kite_api_secret" {
  name  = "/${var.project_name}/kite_api_secret"
  type  = "SecureString"
  value = var.kite_api_secret
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-kite-api-secret"
    Environment = var.environment
  }
}

# Slack Bot Token
resource "aws_ssm_parameter" "slack_bot_token" {
  name  = "/${var.project_name}/slack_bot_token"
  type  = "SecureString"
  value = var.slack_bot_token
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-slack-bot-token"
    Environment = var.environment
  }
}

# Telegram Bot Token
resource "aws_ssm_parameter" "telegram_bot_token" {
  name  = "/${var.project_name}/telegram_bot_token"
  type  = "SecureString"
  value = var.telegram_bot_token
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-telegram-bot-token"
    Environment = var.environment
  }
}

# WhatsApp Access Token
resource "aws_ssm_parameter" "whatsapp_access_token" {
  name  = "/${var.project_name}/whatsapp_access_token"
  type  = "SecureString"
  value = var.whatsapp_access_token
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-whatsapp-access-token"
    Environment = var.environment
  }
}

# WhatsApp Phone Number ID
resource "aws_ssm_parameter" "whatsapp_phone_number_id" {
  name  = "/${var.project_name}/whatsapp_phone_number_id"
  type  = "SecureString"
  value = var.whatsapp_phone_number_id
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-whatsapp-phone-number-id"
    Environment = var.environment
  }
}

# WhatsApp Verify Token
resource "aws_ssm_parameter" "whatsapp_verify_token" {
  name  = "/${var.project_name}/whatsapp_verify_token"
  type  = "SecureString"
  value = var.whatsapp_verify_token
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-whatsapp-verify-token"
    Environment = var.environment
  }
}

# Slack Signing Secret
resource "aws_ssm_parameter" "slack_signing_secret" {
  name  = "/${var.project_name}/slack_signing_secret"
  type  = "SecureString"
  value = var.slack_signing_secret
  key_id = aws_kms_key.ssm.arn

  tags = {
    Name        = "${var.project_name}-slack-signing-secret"
    Environment = var.environment
  }
} 