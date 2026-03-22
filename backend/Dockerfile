# ─────────────────────────────────────────────────────────────────────────────
# BACKEND DOCKERFILE
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage builds (if needed) keep the final image lean.
# This single-stage build is appropriate for a Node.js API.

# Use the official Node.js LTS Alpine image — Alpine is ~5MB vs ~900MB for full.
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests first — Docker layer caches this step.
# If package.json hasn't changed, Docker reuses the cached layer and skips npm install.
# This is a critical performance optimization for iterative development.
COPY package*.json ./

# Install production dependencies only (no devDependencies like nodemon)
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Document the port the app listens on (informational only — actual binding in docker-compose)
EXPOSE 5000

# Health check: Docker can monitor if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the Node.js server
CMD ["node", "server.js"]
