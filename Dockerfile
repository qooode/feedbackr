# =============================================================================
# Feedbackr — Single Container Dockerfile
# =============================================================================
# Builds the React frontend and packages it with PocketBase in one container.
# All collections are auto-created on first boot via migrations.
# =============================================================================

# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./

# Vite bakes VITE_* at build time — pass via --build-arg or compose
ARG VITE_APP_NAME
ARG VITE_LOGO_URL
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_LOGO_URL=${VITE_LOGO_URL}

RUN npm run build

# --- Stage 2: Final image ---
FROM alpine:3.19

ARG POCKETBASE_VERSION=0.25.9
ARG TARGETARCH=amd64

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    wget

# Download PocketBase
RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_${TARGETARCH}.zip" \
    && unzip pocketbase_*.zip -d /pb \
    && rm pocketbase_*.zip \
    && chmod +x /pb/pocketbase

# Copy server-side hooks and migrations
COPY pocketbase/pb_hooks /pb/pb_hooks
COPY pocketbase/pb_migrations /pb/pb_migrations

# Copy built frontend as PocketBase static files
COPY --from=frontend-build /app/frontend/dist /pb/pb_public

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

EXPOSE 8090

# Persistent data volume (SQLite DB, uploaded files)
VOLUME /pb/pb_data

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
