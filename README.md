# clawproxy

clawproxy is a public webhook relay for private OpenClaw nodes.
It accepts inbound webhook traffic, stores it durably in Postgres, and lets private nodes pull queued events over authenticated outbound requests.

## Requirements

- Node.js 22+
- npm
- Postgres / Neon database

## Local development

Install dependencies:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm run test:run
```

Build for production:

```bash
npm run build
```

## Required environment variables

clawproxy currently expects these environment variables at runtime:

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- `NEXT_PUBLIC_NEON_AUTH_BASE_URL`

Optional deployment variables:

- `HOSTNAME` (default `0.0.0.0` for container/server platforms)
- `PORT` (default `3000`)
- `NODE_ENV` (set to `production` in deployed environments)
- `NEXT_TELEMETRY_DISABLED=1` to disable Next.js telemetry in deployments

## Standalone production build

This repo uses Next.js standalone output for deployment builds.

Build the deployable artifact:

```bash
npm run build:standalone
```

Start the standalone server directly:

```bash
node .next/standalone/server.js
```

## Docker deployment

Build the image:

```bash
docker build -t clawproxy .
```

Run it:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  -e NEON_AUTH_BASE_URL=https://example-auth.neon.tech \
  -e NEON_AUTH_COOKIE_SECRET=replace-me \
  -e NEXT_PUBLIC_NEON_AUTH_BASE_URL=https://example-auth.neon.tech \
  clawproxy
```

The container starts with:

```bash
node server.js
```

## Nixpacks deployment

A `nixpacks.toml` file is included for Nixpacks-compatible platforms.

Configured build command:

```bash
npm run build:standalone
```

Configured start command:

```bash
node .next/standalone/server.js
```

Make sure the platform provides the required runtime environment variables listed above.
