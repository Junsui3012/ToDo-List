# ─────────────────────────────────────────────────────────────────────────────
# FRONTEND DOCKERFILE  (multi-stage)
# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: installs all deps and runs `vite build`
# Stage 2 — Server:  serves the static output via nginx (tiny Alpine image)
#
# Why multi-stage?
#   The build stage needs node_modules (~200MB). The final image only needs
#   the compiled HTML/CSS/JS files + nginx (~5MB). Multi-stage = lean images.

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the Vite production bundle
RUN npm run build
# Output is in /app/dist

# ── Stage 2: Serve with nginx ──────────────────────────────────────────────
FROM nginx:alpine

# Copy the compiled frontend from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config: handle React Router's client-side routing
# Without this, refreshing /dashboard returns a 404 from nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
