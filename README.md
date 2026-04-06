# Coffee Three

Mobile-first bilingual (EL/EN) ordering site for Coffee Three. Menu managed
via Keystatic (git), orders in Postgres, email magic-link auth via Resend.

## Stack

- Next.js 16 (App Router, standalone output)
- next-intl (EL default, EN)
- Keystatic (git-mode CMS)
- Drizzle ORM + PostgreSQL
- Auth.js v5 + Resend magic link
- Pure CSS design system (brand palette in `src/app/globals.css`)
- Docker Compose (app + postgres + Caddy) for Contabo VPS deploy

## Local development

```bash
# 1. install deps
pnpm install

# 2. spin up postgres (or use your own and set DATABASE_URL)
docker run -d --name coffee-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=coffee postgres:17-alpine

# 3. env
cp .env.example .env.local
# fill in DATABASE_URL, AUTH_SECRET, AUTH_RESEND_KEY, EMAIL_FROM, STAFF_EMAIL

# 4. run migrations
pnpm exec drizzle-kit generate   # regenerate if schema changed
node scripts/migrate.mjs          # apply to DATABASE_URL

# 5. dev server
pnpm dev
```

Open:

- `http://localhost:3000/el` — Greek menu (default locale)
- `http://localhost:3000/en` — English menu
- `http://localhost:3000/keystatic` — CMS admin (edits `content/`)
- `http://localhost:3000/staff` — staff dashboard (sign in with `STAFF_EMAIL`)

## Deploying to a VPS (Contabo / any Docker host)

1. Copy `.env.production.example` to `.env` on the VPS and fill in real values.
2. Point your domain's DNS to the VPS.
3. Set `CADDY_DOMAIN` in `.env` — Caddy will auto-provision TLS.
4. `docker compose up -d --build`

The `migrate` service runs once on startup to apply any new SQL files in
`drizzle/` before the app starts. Menu edits made through Keystatic write
to `content/` in the repo; rebuild + redeploy to publish them (CI can hook
into a push to the content branch).

## Repository layout

```
content/                 Keystatic-managed menu (committed)
drizzle/                 generated SQL migrations
messages/                next-intl translations (EL/EN)
public/                  static assets (logo.jpeg is the brand logo)
scripts/migrate.mjs      idempotent SQL migration runner
src/app/(frontend)/      customer-facing [locale] routes
src/app/staff/           staff dashboard (outside locale, EN)
src/app/keystatic/       CMS admin UI
src/app/api/             route handlers (auth, orders, staff, keystatic)
src/auth.ts              Auth.js config
src/components/          SiteHeader, LocaleSwitcher
src/db/                  Drizzle schema + client
src/i18n/                next-intl routing + navigation
src/lib/menu.ts          server-only Keystatic reader
src/lib/menu-types.ts    shared types + formatPrice (client-safe)
src/lib/cart.ts          localStorage cart store
src/lib/hours.ts         delivery hours check
src/lib/orders.ts        server actions: place / fetch / update orders
keystatic.config.ts      CMS schema (categories, items, settings)
Dockerfile, docker-compose.yml, Caddyfile
```

## Notes

- Menu prices and titles are **snapshotted** into `order_items` at checkout —
  editing a menu item later will not rewrite past orders.
- Guest orders require either email or phone (enforced by a CHECK constraint).
- Delivery hours, minimum order, and allowed postcodes live in the Keystatic
  `settings` singleton and are re-read at checkout time.
- The staff dashboard polls `/api/staff/orders` every 6 s; the customer order
  status page polls `/api/orders/[token]` every 7 s.
