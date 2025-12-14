# ------------ Base (tools shared) ------------
FROM node:20-slim AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NUXT_TELEMETRY_DISABLED=1

# Install curl and Bun as a more reliable package manager
RUN apt-get update && apt-get install -y curl unzip && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun && \
    rm -rf /var/lib/apt/lists/* && \
    bun --version

# ------------ Build stage ------------
FROM base AS builder
WORKDIR /app

# 1) Copy package files for dependency caching
COPY package.json pnpm-lock.yaml* ./

# 2) Copy all source code first to avoid layer conflicts
COPY . .

# 3) Configure build environment
ENV NODE_OPTIONS="--max-old-space-size=1024"

# 4) Install all dependencies with Bun (much faster and more reliable)
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install

# 6) Build with environment configuration
ENV NITRO_PRESET=node-server
RUN bun run build

# 7) Clean up build artifacts
RUN rm -rf node_modules .bun .nuxt

# ------------ Runtime (production) ------------
FROM node:20-slim AS production
WORKDIR /app

# copy output của Nuxt; runtime thường không cần node_modules
COPY --from=builder /app/.output ./.output

# (Tuỳ chọn) nếu bạn cần metadata/app version
COPY package.json ./

COPY .env* ./

# Tạo user không phải root (Debian syntax)
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nuxt
RUN chown -R nuxt:nodejs /app
USER nuxt

# Port app
EXPOSE 3005

# Env cơ bản
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3005

# Start
CMD ["node", ".output/server/index.mjs"]
