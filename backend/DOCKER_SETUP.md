# Development Docker Compose Setup Guide

## Quick Start

### 1. Create `.env.local` file (if not exists)

Create `backend/.env.local`:
```env
# Database (will be auto-configured by docker-compose)
DATABASE_URL=postgresql://portify:portify_dev_password@postgres:5432/portify

# Kite API (REQUIRED)
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret

# Optional APIs
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. Update `kite-config.json`

Create/update `backend/kite-config.json`:
```json
{
  "apiKey": "your_kite_api_key",
  "apiSecret": "your_kite_api_secret",
  "accessToken": ""
}
```

### 3. Start the services

```bash
cd backend
docker-compose -f docker-compose.dev.yml up --build
```

Or in detached mode:
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### 4. Run database migrations

In a new terminal:
```bash
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate
```

Or if you prefer to run locally:
```bash
cd backend
npm install
export DATABASE_URL="postgresql://portify:portify_dev_password@localhost:5432/portify"
npm run prisma:migrate
```

### 5. Access the application

- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **PostgreSQL**: localhost:5432
  - Database: `portify`
  - User: `portify`
  - Password: `portify_dev_password`

## Useful Commands

### View logs
```bash
docker-compose -f docker-compose.dev.yml logs -f app
```

### Stop services
```bash
docker-compose -f docker-compose.dev.yml down
```

### Stop and remove volumes (fresh start)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Rebuild after code changes
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Access PostgreSQL CLI
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U portify -d portify
```

### Run Prisma Studio
```bash
docker-compose -f docker-compose.dev.yml exec app npm run prisma:studio
```

### Access app shell
```bash
docker-compose -f docker-compose.dev.yml exec app sh
```

## Environment Variables

You can override environment variables in a `.env.local` file or create `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  app:
    environment:
      KITE_API_KEY: "your_actual_key"
      KITE_API_SECRET: "your_actual_secret"
```

## Troubleshooting

### Port already in use
If port 3000 or 5432 is already in use:
```bash
# Change ports in docker-compose.dev.yml
ports:
  - "3001:3000"  # Use 3001 instead
  - "5433:5432"  # Use 5433 instead
```

### Database connection errors
```bash
# Check if postgres is running
docker-compose -f docker-compose.dev.yml ps

# Check postgres logs
docker-compose -f docker-compose.dev.yml logs postgres

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Prisma errors
```bash
# Generate Prisma client
docker-compose -f docker-compose.dev.yml exec app npm run prisma:generate

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate
```

### Hot reload not working
Make sure volumes are mounted correctly:
```yaml
volumes:
  - .:/app
  - /app/node_modules
  - /app/.next
```

## Production-like Setup

For production-like setup with Redis, monitoring, etc., use:
```bash
docker-compose up
```

This uses the main `docker-compose.yml` file.

