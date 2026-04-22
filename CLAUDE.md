@AGENTS.md

# Coffee Three

Mobile-first bilingual (EL/EN) ordering site for a small cafeteria. Two flows:
in-store QR menu browsing, and delivery orders with cash/card selection (no
actual payment). Keystatic-managed menu, Postgres for dynamic data, staff
dashboard for personnel. See `requirements.md` for the original brief.

## Stack (pinned majors)

- **Next.js 16** (App Router, `output: "standalone"`) — note `AGENTS.md`: APIs differ from older Next
- **next-intl 4** — EL default + EN, `defaultLocale: "el"`, `localePrefix: "always"`
- **Keystatic 0.5** — local storage in dev, cloud in prod; menu in `content/`, no DB
- **Drizzle ORM 0.45 + postgres.js 3** — Postgres only
- **better-auth 1.x** — email + password, sessions in Postgres
- **Pure CSS** design system — **no Tailwind**, no component library
- **pnpm**, Node 22, Postgres 17

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
12. **Email in dev** — `RESEND_API_KEY` is optional; when unset, emails are
    logged to console. Check terminal output for verification/reset links
    during development.

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

## Reference docs (read when relevant)

- `docs/architecture.md` — architecture decisions, directory layout
- `docs/design-system.md` — CSS tokens, palette, class naming conventions
- `docs/data-model.md` — Drizzle schema field notes
- `docs/scope.md` — features deliberately not built (check before adding)
- `.env.example` / `.env.production.example` — environment variables
- `docs/code-requirements.md` - when writing or reviewing code, to adhere to project structure and code principles

## User context

The user is a senior TS/React/Node developer who prefers:

- **No Tailwind** — use pure CSS + CSS variables
- Terse, direct communication; no hand-holding
- Postgres over other DBs
- Contabo VPS as a known deploy target
