# Scope — What's deliberately NOT built

Check here before building any of these — they were explicitly scoped out:

- **Payment processing** — requirements say "no payments", cash/card selection
  is informational only.
- **Customer notifications** (SMS/email on order status change) — skipped for
  now. Note: transactional auth emails (verification, password reset) ARE
  implemented via Resend.
- **Multiple staff accounts UI** — only `STAFF_EMAIL` is promoted; add more
  staff manually via SQL or a future admin view.
- **Store QR flow beyond menu browsing** — users scan, look, walk to cashier.
  The `orders.type = 'store'` enum value exists but is unused.
- ~~**Instant menu updates**~~ — now supported in prod via the GitHub reader
  + webhook flow (see architecture.md §1 and `deployment.md` §15).
  Text/price/availability edits go live within ~1s of hitting Save in the CMS,
  no redeploy required. **Caveat:** images added through Keystatic live at
  `public/menu-images/` and are served by Next's static file handler from the
  baked container filesystem — uploading a new image still requires a redeploy
  to be visible. Swapping an existing image URL or editing JSON does not.
- **Delivery fee** — no fee, by requirement.
- **Delivery area polygon** — simple postcode allow-list in settings.
