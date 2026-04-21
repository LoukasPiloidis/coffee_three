# Architecture

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
