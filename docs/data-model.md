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
