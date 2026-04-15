@AGENTS.md

# Coffee Three

Mobile-first bilingual (EL/EN) ordering site for a small cafeteria. Two flows:
in-store QR menu browsing, and delivery orders with cash/card selection (no
actual payment). Keystatic-managed menu, Postgres for dynamic data, staff
dashboard for personnel. See `requirements.md` for the original brief.

## Stack (pinned majors)

- **Next.js 16** (App Router, `output: "standalone"`) — note `AGENTS.md`: APIs differ from older Next
- **next-intl 4** — EL default + EN, `defaultLocale: "el"`, `localePrefix: "always"`
- **Keystatic 0.5** — local storage in dev, **cloud storage** in prod when
  `NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT` is set; menu lives in `content/`, no DB
- **Drizzle ORM 0.45 + postgres.js 3** — Postgres only
- **better-auth 1.x** with its Drizzle adapter — email + password, sessions in Postgres
- **Pure CSS** design system — **no Tailwind**, no component library
- **pnpm** package manager
- Runtime: Node 22, Postgres 17

## Critical architecture decisions

1. **Menu is NOT in Postgres.** It lives in `content/` as JSON, edited via
   Keystatic at `/keystatic`. In dev the reader hits the local filesystem;
   in prod, if `KEYSTATIC_GITHUB_REPO` is set, `src/lib/menu.ts` switches to
   Keystatic's GitHub reader and all reads are wrapped in `unstable_cache`
   tagged `keystatic-menu`. `POST /api/keystatic-webhook` (HMAC-verified via
   `KEYSTATIC_WEBHOOK_SECRET`) calls `revalidateTag` so CMS "Save" appears
   on the live site within a second or two — no redeploy. See
   `deployment.md` §15 for the setup flow.
2. **Order items snapshot `titleSnapshot` + `unitPriceCents`** at checkout
   (`src/lib/orders.ts` → `placeOrder`). Never derive a past order from current
   menu state — editing a menu item must not corrupt history.
3. **Cart lives in localStorage** (`src/lib/cart.ts`, `useSyncExternalStore`).
   No server-side cart, works for guests, zero DB pressure.
4. **Polling over websockets** for real-time — staff dashboard polls
   `/api/staff/orders` every 6s, customer status page polls
   `/api/orders/[token]` every 7s. Sufficient for a few hundred orders/day.
5. **Options may have a surcharge.** Each option has an optional `priceCents`
   field (defaults to 0). The surcharge is displayed in the item accordion,
   included in the cart line total, and snapshotted into `unitPriceCents`
   at checkout using the authoritative Keystatic price (never the client value).
6. **Guest contact constraint.** `orders` has a CHECK: every order must have
   either `user_id`, `guest_email`, or `guest_phone`. Enforced at DB + form.
7. **Delivery rules from Keystatic.** `settings` singleton holds
   `minOrderCents`, `allowedPostcodes`, `deliveryHours`. Re-read at every
   checkout in `placeOrder`. No delivery fee (by design, for now).
8. **Staff dashboard lives OUTSIDE the locale tree** at `/staff` (EN only).
   Customer-facing routes are under `(frontend)/[locale]/`.

## Directory layout

```
content/                       Keystatic menu (committed to git)
  categories/*/index.json      category definitions
  items/*/index.json           menu items
  settings/index.json          shop settings singleton
drizzle/                       generated SQL migrations
messages/{en,el}.json          next-intl translations
public/logo.jpeg               brand logo (drives color palette)
scripts/migrate.mjs            idempotent migration runner (tracks _migrations)
src/
  app/
    (frontend)/[locale]/       customer UI: /, /item/[slug], /cart,
                                 /checkout, /order/[token], /profile,
                                 /signin, /signin/verify
    staff/                     staff dashboard (outside locale)
    keystatic/                 CMS admin UI mount
    api/
      auth/[...all]/           better-auth handler
      keystatic/[...params]/   Keystatic route handler
      keystatic-webhook/       GitHub webhook → revalidateTag('keystatic-menu')
      orders/[token]/          public order status (GET)
      staff/orders/            staff orders list (GET, role-gated)
    globals.css                full design system (CSS variables, all classes)
  auth.ts                      better-auth config (email/password, role promotion via databaseHooks)
  components/
    SiteHeader.tsx             header w/ logo + locale switcher + cart link
    LocaleSwitcher.tsx         client component, preserves pathname
  db/
    schema.ts                  Drizzle schema (+ enums, CHECK constraint)
    index.ts                   postgres.js client w/ HMR-safe global
  i18n/
    routing.ts                 locales, defaultLocale, localePrefix
    request.ts                 getRequestConfig for server components
    navigation.ts              Link/useRouter/usePathname wrappers
  lib/
    menu.ts                    SERVER-ONLY Keystatic reader (uses node:fs)
    menu-types.ts              client-safe types + formatPrice
    cart.ts                    localStorage cart store
    hours.ts                   parseRange + isWithinDeliveryHours
    orders.ts                  placeOrder, getOrderByToken,
                                 updateOrderStatus, getRecentUserOrders
  middleware.ts                next-intl locale middleware
keystatic.config.ts            CMS schema (bilingual helpers, singletons)
next.config.ts                 withNextIntl + output: standalone
drizzle.config.ts
Dockerfile                     multi-stage standalone build
docker-compose.yml             app + postgres + caddy + migrate service
Caddyfile                      auto-TLS reverse proxy
```

## Gotchas — read before editing

1. **NEVER import `@/lib/menu` from a client component.** It pulls in
   Keystatic's Node fs reader and will break turbopack's client chunking.
   Use `@/lib/menu-types` for shared types + `formatPrice`. `menu.ts` begins
   with `import "server-only"` to fail loudly if misused.
2. **next-intl `Link` and `router.push` take plain strings**, not
   `{ pathname, params }` objects — that form doesn't compile against
   next-intl 4's pathname types. Use template literals:
   `href={\`/item/${slug}\`}`.
3. **Route groups isolate `<html>` layouts.** There is NO
   `src/app/layout.tsx`. Each top-level segment (`(frontend)/[locale]`,
   `staff/`, `keystatic/`) has its own root layout with `<html>` and `<body>`.
   If you add another top-level area, give it its own layout.
4. **Middleware matcher excludes `api`, `_next`, `keystatic`, `staff`, and
   static assets** — any new top-level route that lives outside the locale
   tree MUST be added to this exclusion list or next-intl will rewrite it
   to `/{defaultLocale}/...` and 404.
5. **Standalone output** needs `content/`, `messages/`, `keystatic.config.ts`,
   `drizzle/`, and `scripts/` copied explicitly in the Dockerfile. If you add
   runtime-read files elsewhere, copy them too.
6. **Geist font does not include Greek.** Subsets are `["latin", "latin-ext"]`.
   Browser falls back for Greek characters — acceptable for MVP.
7. **Drizzle `displayOrder`/`order` are nullable from Keystatic's reader** —
   `menu.ts` coalesces with `?? 0`. Preserve that pattern.
8. **Staff role promotion** is triggered in `auth.ts`'s `events.signIn`
   callback: the first user to sign in with `STAFF_EMAIL` gets `role: 'staff'`.
   There is currently no admin UI to manage additional staff.
9. **Order status transitions are linear**: `received → preparing →
   on_its_way → completed`. Plus `cancelled` from any non-terminal state.
   `NEXT_STATUS` in `StaffDashboard.tsx` is the source of truth.
10. **Cart `useCart` hook renders empty on server + first client render** to
    avoid hydration mismatches, then mounts the real state.
11. **Do NOT define inline server actions that close over `session` (or any
    object returned by `auth()`) and then pass them as props to a client
    component.** Next 16's closure serialization breaks on null session
    objects with `Cannot read properties of null (reading 'user')`. Put the
    action in a sibling `actions.ts` file with `"use server"` at the top and
    have it call `auth()` itself — see `checkout/actions.ts` for the pattern.

## Design system

All styles live in `src/app/globals.css`. Two root layouts (`[locale]` and
`staff`) both import it. The palette and tokens are derived from
`public/logo.jpeg`:

- `--color-green-900` through `--color-green-600` — brand greens
- `--color-cream-50` through `--color-cream-300` — backgrounds/surfaces
- `--font-display: Georgia` (serif, for headings), `--font-body: Geist`

Classes are hand-written, BEM-ish (`.site-header__brand`, `.item-row__title`,
`.btn--primary`, `.status-pill--on_its_way`). Use existing classes before
inventing new ones. Inline `style={{}}` is fine for one-offs.

## Data model notes

- `users.role`: `'customer' | 'staff'` (text, not an enum — intentional, easy
  to extend)
- `orders.publicToken`: opaque url-safe base64, used for the public status
  page (`/order/[token]`). Not a secret but unguessable.
- `orders.type`: `'delivery' | 'store'` — only `'delivery'` is used currently;
  store flow is QR-scan-and-order-at-cashier, no DB involvement.
- `order_items.titleSnapshot`: jsonb `{ en, el }` — the menu title at the
  moment of ordering
- `order_items.optionsJson`: jsonb array of `{ groupName, optionName }` where
  both are `{ en, el }` bilingual objects

## Environment variables

See `.env.example` (local dev) and `.env.production.example` (deploy):

- `DATABASE_URL` — postgres connection string (required)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_URL` — site URL (required in production)
- `STAFF_EMAIL` — email address auto-promoted to `staff` role the first time
  it signs up (handled in `databaseHooks.user.create.after` in `src/auth.ts`)
- `DEV_STAFF_BYPASS` — set to `1` in `.env` to skip all staff auth on
  `/staff`, `/api/staff/*`, and `updateStatusAction`. Only honored when
  `NODE_ENV !== "production"`. Lets you work on the dashboard without
  creating an account. Centralized in `src/lib/staff-auth.ts`.
- `CADDY_DOMAIN` — prod domain for the Caddy reverse proxy
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — docker-compose db

## Common commands

```bash
pnpm dev                          # dev server
pnpm build                        # production build (needs DATABASE_URL set)
pnpm lint

pnpm exec drizzle-kit generate    # regenerate migrations from schema.ts
node scripts/migrate.mjs          # apply pending migrations

docker compose up -d --build      # full prod stack (app + db + caddy)
docker compose logs -f app

# sanity-check a build without a real DB (for type checking)
DATABASE_URL=postgres://fake:fake@localhost:5432/fake pnpm build
```

## What's deliberately NOT built

These were explicitly scoped out — check before building them:

- **Payment processing** — requirements say "no payments", cash/card selection
  is informational only.
- **Customer notifications** (SMS/email on status change) — skipped for now.
- **Multiple staff accounts UI** — only `STAFF_EMAIL` is promoted; add more
  staff manually via SQL or a future admin view.
- **Store QR flow beyond menu browsing** — users scan, look, walk to cashier.
  The `orders.type = 'store'` enum value exists but is unused.
- ~~**Instant menu updates**~~ — now supported in prod via the GitHub reader
  + webhook flow (see §1 of "Critical architecture decisions" and
  `deployment.md` §15). Text/price/availability edits go live within ~1s of
  hitting Save in the CMS, no redeploy required. **Caveat:** images added
  through Keystatic live at `public/menu-images/` and are served by Next's
  static file handler from the baked container filesystem — uploading a
  new image still requires a redeploy to be visible. Swapping an existing
  image URL or editing JSON does not.
- **Delivery fee** — no fee, by requirement.
- **Delivery area polygon** — simple postcode allow-list in settings.

## User context

The user is a senior TS/React/Node developer who prefers:

- **No Tailwind** — use pure CSS + CSS variables
- Terse, direct communication; no hand-holding
- Postgres over other DBs
- Contabo VPS as a known deploy target
