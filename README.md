# clawproxy

A lightweight, self-hostable Next.js service that provides secure public webhook ingress and queued event delivery for private OpenClaw nodes that can only communicate outbound.

See [PLAN.md](./PLAN.md) for the full product specification and architectural decisions.

## Getting Started

### Prerequisites

- Node.js 22+
- A [Neon](https://neon.tech) Postgres database
- A [Neon Auth](https://neon.tech/docs/guides/neon-auth) project

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Yes | Neon Auth base URL (server-side) |
| `NEON_AUTH_COOKIE_SECRET` | Yes | Secret used to sign session cookies (min 32 chars) |
| `NEXT_PUBLIC_NEON_AUTH_BASE_URL` | Yes | Neon Auth base URL (embedded in the client bundle at build time) |

Copy `.env.example` (if present) to `.env.local` and fill in the values before running locally.

### Local development

Enable Corepack once (ships with Node 22) so the pinned Yarn version from `packageManager` is used:

```bash
corepack enable
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

```bash
yarn db:generate   # generate migrations from schema changes
yarn db:migrate    # apply migrations to the database
```

## Deployment

### Docker

The project ships with a multi-stage `Dockerfile` that produces a minimal production image using [Next.js standalone output](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-needed-files).

**Build the image**

`NEXT_PUBLIC_NEON_AUTH_BASE_URL` is baked into the client bundle at build time, so it must be passed as a build argument:

```bash
docker build \
  --build-arg NEXT_PUBLIC_NEON_AUTH_BASE_URL=https://<your-neon-auth-url> \
  -t clawproxy .
```

**Run the container**

Pass runtime secrets as environment variables:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEON_AUTH_BASE_URL="https://..." \
  -e NEON_AUTH_COOKIE_SECRET="..." \
  clawproxy
```

The app listens on port `3000` by default. Override with `-e PORT=<port>`.

### Nixpacks

The project includes a `nixpacks.toml` that configures the build for [Nixpacks-compatible platforms](https://nixpacks.com) (e.g. Railway, Render).

Set the following environment variables in your platform's dashboard before deploying:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Neon Auth base URL |
| `NEON_AUTH_COOKIE_SECRET` | Session cookie signing secret |
| `NEXT_PUBLIC_NEON_AUTH_BASE_URL` | Must be set **before** the build runs so it is inlined into the client bundle |

Deploy with the Nixpacks CLI:

```bash
nixpacks build . --name clawproxy
nixpacks run clawproxy
```

Or push to a connected platform (Railway, Render, etc.) and it will detect the `nixpacks.toml` automatically.

## Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn test` | Run tests in watch mode |
| `yarn test:run` | Run tests once |
| `yarn test:coverage` | Run tests with V8 coverage report (`coverage/`) |
| `yarn db:generate` | Generate Drizzle migrations |
| `yarn db:migrate` | Apply Drizzle migrations |
| `yarn db:push` | Push schema to DB (dev only) |

