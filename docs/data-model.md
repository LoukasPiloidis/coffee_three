# Data Model

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
- `users.emailVerified`: boolean, set to `true` by better-auth when the user
  clicks the verification link. Sign-in is blocked while `false`.
- `verification`: used internally by better-auth for email verification JWTs
  and password reset tokens. Do not query directly.
