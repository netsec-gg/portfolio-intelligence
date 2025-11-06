# Portify AWS ECS Fargate Deployment Guide

This guide provides step-by-step instructions for deploying Portify to AWS ECS Fargate and making it available through various messaging platforms and ChatGPT.

## Prerequisites

### Required Tools
1. AWS CLI (v2.0+)
2. Terraform (v1.0+)
3. Docker (v20.0+)
4. Node.js (v18+) and npm
5. jq (for JSON processing)

### AWS Account Setup
1. Create AWS Account
2. Set up IAM User with appropriate permissions
3. Configure AWS CLI with credentials

### Required API Keys
- OpenAI API Key
- Kite API Credentials
- Slack Bot Token (optional)
- Telegram Bot Token (optional)
- WhatsApp Business API (optional)

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/portify.git
cd portify/backend
npm install
```

### 2. Configure Variables
```bash
cp infrastructure/terraform/terraform.tfvars.example infrastructure/terraform/terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Deploy Infrastructure
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Messaging Platform Integration

### Slack Setup
1. Create Slack App at api.slack.com
2. Configure bot permissions and slash commands
3. Set webhook URL to your ALB endpoint

### Telegram Setup
1. Create bot via @BotFather
2. Set webhook using Telegram API
3. Configure bot commands

### WhatsApp Setup
1. Set up Meta for Developers app
2. Configure WhatsApp Business API
3. Set webhook URL and verify token

## ChatGPT Integration

### Create Custom GPT
1. Go to ChatGPT and create new GPT
2. Configure with Portify API schema
3. Set up authentication with JWT tokens
4. Test trading commands and portfolio queries

## Monitoring and Maintenance

- CloudWatch monitoring and alarms
- Health check endpoints
- Automated backups
- Scaling configuration
- Cost optimization

## Troubleshooting

Common issues and solutions:
- ECS task failures
- Database connectivity
- Load balancer health checks
- Webhook configuration

For detailed instructions, see the full deployment guide sections above. 