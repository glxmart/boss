# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm support
RUN corepack enable

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# Production stage - distroless for minimal attack surface
FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose application port
EXPOSE ${port}

# Health check endpoint (requires curl in distroless - use grpc_health_probe instead if needed)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:${port}/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["dist/${entrypoint}"]
