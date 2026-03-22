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

# Build-time env (Next inlines NEXT_PUBLIC_*; Neon Auth and DB modules load during `next build`).
ARG NEXT_PUBLIC_NEON_AUTH_BASE_URL
ARG DATABASE_URL
ARG NEON_AUTH_BASE_URL
ARG NEON_AUTH_COOKIE_SECRET

ENV NEXT_PUBLIC_NEON_AUTH_BASE_URL=$NEXT_PUBLIC_NEON_AUTH_BASE_URL \
    DATABASE_URL=$DATABASE_URL \
    NEON_AUTH_BASE_URL=$NEON_AUTH_BASE_URL \
    NEON_AUTH_COOKIE_SECRET=$NEON_AUTH_COOKIE_SECRET

RUN test -n "$NEXT_PUBLIC_NEON_AUTH_BASE_URL" && test -n "$DATABASE_URL" && \
    test -n "$NEON_AUTH_BASE_URL" && test -n "$NEON_AUTH_COOKIE_SECRET" || \
    (echo "ERROR: Docker build requires --build-arg NEXT_PUBLIC_NEON_AUTH_BASE_URL, DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET" >&2; exit 1)

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# ---- runner stage: minimal production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
