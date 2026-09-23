FROM node:22-alpine AS base

# ---- deps stage: install production + dev dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN corepack enable && yarn install --immutable

# ---- builder stage: build the Next.js application ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env. The app reads DATABASE_URL at runtime, but Next may evaluate server
# modules during `next build`, so CI/Coolify builds should provide the same Postgres URL.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN test -n "$DATABASE_URL" || \
    (echo "ERROR: Docker build requires --build-arg DATABASE_URL" >&2; exit 1)

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# ---- runner stage: minimal production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL must be supplied at container runtime (Coolify Postgres connection string).

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/db/migrations ./db/migrations

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Custom server (`server.js`) calls `next()`; standalone tracing omits most of
# `next/dist/compiled` (including webpack), but the programmatic server still loads it.
# Without this, production fails with MODULE_NOT_FOUND for webpack-lib in the container.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/next/dist/compiled ./node_modules/next/dist/compiled

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
