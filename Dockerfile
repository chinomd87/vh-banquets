# Dockerfile for React frontend (production optimized)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts \
    && npm audit --production --audit-level=high || true
COPY . .
RUN npm run build

FROM nginx:alpine
# Update Alpine packages to latest security patches
RUN apk --no-cache upgrade \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
# Drop privileges: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html \
    && chmod -R 0755 /usr/share/nginx/html \
    && chmod +x /entrypoint.sh
USER appuser
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --spider -q http://localhost || exit 1
# Harden container: no shell, no package manager, no build tools
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
