# ══ STAGE 1: Builder ════════════════════════════════════════════════
# Purpose: install all deps (including devDeps) and run tests.
# If "RUN npm test" fails, Docker stops here.
# No image is produced. Nothing gets pushed to GHCR.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files FIRST.
# Docker caches layers. If package.json does not change,
# Docker reuses the cached npm ci layer on the next build.
# This makes subsequent builds much faster.
COPY package*.json ./

# npm ci = reproducible install using package-lock.json exactly.
# NEVER use npm install in Docker or CI — it can silently change versions.
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run tests INSIDE the build.
# Test failure = build failure = no image produced.
RUN npm test

# ══ STAGE 2: Production ══════════════════════════════════════════════
# Purpose: create the smallest possible image for deployment.
# This stage starts fresh from the base image.
# It does NOT inherit the node_modules from Stage 1.
FROM node:20-alpine AS production

WORKDIR /app

# Tell Node.js and Express we are in production mode
ENV NODE_ENV=production

# Install ONLY production dependencies
# devDependencies (jest, eslint, supertest) are NOT installed
COPY package*.json ./
RUN npm ci --only=production

# Copy only the application source from Stage 1
# (not node_modules, not test files)
COPY --from=builder /app/src ./src

# Security: run as a non-root user
# If an attacker exploits the app, they get a low-privilege user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Document the exposed port (informational only, does not publish it)
EXPOSE 3000

# Docker health check: runs every 30s, restarts unhealthy containers
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/app.js"]