# Portify Quick Start Guide

Get Portify up and running in minutes! This guide covers both local development and AWS deployment.

## 🚀 Local Development (5 minutes)

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Quick Setup

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd portify/backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your API keys
   ```

3. **Start Services**
   ```bash
   docker-compose up -d postgres redis
   npm run migrate
   npm run dev
   ```

4. **Verify Installation**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"healthy"}
   ```

🎉 **You're ready!** Visit http://localhost:3000/api/docs for API documentation.

---

## ☁️ AWS Deployment (15 minutes)

### Prerequisites
- AWS CLI configured
- Terraform installed
- Docker installed

### One-Command Deployment

1. **Configure Variables**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Deploy Everything**
   ```bash
   chmod +x ../scripts/deploy.sh
   ../scripts/deploy.sh --environment production --force
   ```

3. **Get Your URLs**
   ```bash
   terraform output application_url
   terraform output webhook_urls
   ```

### Manual Step-by-Step

If you prefer manual control:

1. **Infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

2. **Application**
   ```bash
   # Get ECR URL
   ECR_URL=$(terraform output -raw ecr_repository_url)
   
   # Build and push
   cd ..
   docker build -t portify .
   docker tag portify:latest $ECR_URL:latest
   docker push $ECR_URL:latest
   
   # Update service
   aws ecs update-service --cluster portify-cluster --service portify-service --force-new-deployment
   ```

---

## 🤖 Messaging Platform Setup

### Slack Integration

1. **Create Slack App**
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Add Bot Token Scopes: `chat:write`, `commands`

2. **Configure Webhook**
   ```bash
   # Your webhook URL (from terraform output)
   https://your-alb-dns.amazonaws.com/api/webhooks/slack
   ```

3. **Set Environment Variables**
   ```bash
   SLACK_BOT_TOKEN=xoxb-your-token
   SLACK_SIGNING_SECRET=your-signing-secret
   ```

### Telegram Integration

1. **Create Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get your bot token

2. **Set Webhook**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-alb-dns.amazonaws.com/api/webhooks/telegram"}'
   ```

### WhatsApp Business Integration

1. **Meta Developer Setup**
   - Create app at https://developers.facebook.com
   - Add WhatsApp Business API
   - Get access token and verify token

2. **Configure Webhook**
   ```bash
   # Webhook URL
   https://your-alb-dns.amazonaws.com/api/webhooks/whatsapp
   
   # Verify token (set in your environment)
   WHATSAPP_VERIFY_TOKEN=your-verify-token
   ```

---

## 🧠 ChatGPT Integration

### Option 1: Custom GPT (Recommended)

1. **Create Custom GPT**
   - Go to https://chat.openai.com/gpts/editor
   - Name: "Portify Trading Assistant"
   - Description: "AI-powered trading assistant for portfolio management"

2. **Configure Actions**
   ```json
   {
     "openapi": "3.0.0",
     "info": {
       "title": "Portify Trading API",
       "version": "1.0.0"
     },
     "servers": [
       {
         "url": "https://your-alb-dns.amazonaws.com/api"
       }
     ]
   }
   ```

3. **Add Authentication**
   - Type: Bearer Token
   - Token: Your JWT token from `/api/auth/login`

### Option 2: API Integration

```javascript
// Example: Integrate with your own ChatGPT interface
const response = await fetch('https://your-alb-dns.amazonaws.com/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What's my portfolio performance?",
    user_id: "user123"
  })
});
```

---

## 🔧 Essential Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/portify

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Trading API
KITE_API_KEY=your-kite-api-key
KITE_API_SECRET=your-kite-api-secret

# AI
OPENAI_API_KEY=your-openai-api-key
```

### Optional Integrations

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-token

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

---

## 🧪 Testing Your Setup

### Health Checks

```bash
# Basic health
curl https://your-domain.com/api/health

# Database connectivity
curl https://your-domain.com/api/health/db

# Redis connectivity
curl https://your-domain.com/api/health/redis
```

### API Testing

```bash
# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get portfolio
curl https://your-domain.com/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Webhook Testing

```bash
# Test Slack webhook
curl -X POST https://your-domain.com/api/webhooks/slack \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Portify!"}'
```

---

## 🚨 Troubleshooting

### Common Issues

**Service won't start**
```bash
# Check logs
docker-compose logs app
# or for AWS
aws logs tail /ecs/portify --follow
```

**Database connection failed**
```bash
# Check database status
docker-compose ps postgres
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**API returns 500 errors**
```bash
# Check environment variables
env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)"
```

**Webhook not receiving messages**
```bash
# Verify webhook URL is accessible
curl -I https://your-domain.com/api/webhooks/slack
# Should return 200 or 405 (method not allowed)
```

### Getting Help

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discord Community](https://discord.gg/your-invite)
- 📧 [Email Support](mailto:support@portify.com)

---

## 🎯 Next Steps

1. **Customize Trading Strategies**
   - Edit `src/services/trading/strategies/`
   - Add your own indicators and signals

2. **Enhance AI Responses**
   - Modify `src/services/ai/prompts/`
   - Train on your trading data

3. **Add Monitoring**
   - Set up CloudWatch alerts
   - Configure Grafana dashboards

4. **Scale Your Deployment**
   - Increase ECS task count
   - Add auto-scaling policies

5. **Security Hardening**
   - Enable WAF
   - Set up VPN access
   - Implement MFA

---

**🎉 Congratulations!** You now have a fully functional AI-powered trading assistant. Start trading smarter with Portify! 