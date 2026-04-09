import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "received",
  "preparing",
  "on_its_way",
  "completed",
  "cancelled",
]);

export const orderType = pgEnum("order_type", ["delivery", "store"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "card"]);

// ─────────────────────────────────────────────────────────────────────
// better-auth tables (singular names — these are the names better-auth
// expects by default). The `role` and `phone` columns are extra fields
// declared on the auth config via `user.additionalFields`.
// ─────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("customer"), // 'customer' | 'staff'
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────
// App tables
// ─────────────────────────────────────────────────────────────────────

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicToken: text("public_token").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),
    deliveryStreet: text("delivery_street").notNull(),
    deliveryCity: text("delivery_city").notNull(),
    deliveryPostcode: text("delivery_postcode").notNull(),
    deliveryNotes: text("delivery_notes"),
    type: orderType("type").notNull().default("delivery"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    status: orderStatus("status").notNull().default("received"),
    totalCents: integer("total_cents").notNull(),
    tipCents: integer("tip_cents").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Guest orders must carry either email or phone
    check(
      "guest_contact_required",
      sql`${t.userId} IS NOT NULL OR ${t.guestEmail} IS NOT NULL OR ${t.guestPhone} IS NOT NULL`
    ),
  ]
);

// ─────────────────────────────────────────────────────────────────────
// Availability overrides
//
// The menu itself lives in Keystatic (git-tracked JSON). Editorial state
// (titles, prices, descriptions) belongs there. But availability is
// *operational* state — staff flip it dozens of times a day — and we don't
// want every toggle to become a git commit. So availability is stored in
// these two tables and applied over the Keystatic data when the menu is
// read in `src/lib/menu.ts`.
//
// Rows only exist when staff have actively overridden the default. Absent
// row ⇒ fall back to the Keystatic value (`item.available` or
// `option.available`, both defaulting to true).
// ─────────────────────────────────────────────────────────────────────

export const itemOverrides = pgTable("item_overrides", {
  slug: text("slug").primaryKey(),
  available: boolean("available").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const optionOverrides = pgTable(
  "option_overrides",
  {
    itemSlug: text("item_slug").notNull(),
    groupKey: text("group_key").notNull(),
    optionKey: text("option_key").notNull(),
    available: boolean("available").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.itemSlug, t.groupKey, t.optionKey] })]
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuSlug: text("menu_slug").notNull(),
  titleSnapshot: jsonb("title_snapshot").notNull(), // { en, el }
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
  optionsJson: jsonb("options_json").notNull().default(sql`'[]'::jsonb`),
  comment: text("comment"),
});
