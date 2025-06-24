# Dockerfile for Express backend (production optimized)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts \
    && npm audit --production --audit-level=high || true
COPY . .
ENV NODE_ENV=production
# Drop privileges: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app \
    && chmod -R 0755 /app
USER appuser
# Update Alpine packages to latest security patches
RUN apk --no-cache upgrade
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --spider -q http://localhost:3001/api/health || exit 1
CMD ["node", "server.js"]
