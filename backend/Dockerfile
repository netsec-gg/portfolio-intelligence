# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory and user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S portify -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Development dependencies stage
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies
COPY --from=deps --chown=portify:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=portify:nodejs /app/dist ./dist
COPY --from=build --chown=portify:nodejs /app/prisma ./prisma
COPY --from=build --chown=portify:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown portify:nodejs /app/logs

# Switch to non-root user
USER portify

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"] 