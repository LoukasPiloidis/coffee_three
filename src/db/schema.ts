import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const orderStatus = pgEnum("order_status", [
  "received",
  "preparing",
  "on_its_way",
  "completed",
  "cancelled",
]);

export const orderType = pgEnum("order_type", ["delivery", "store"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "card"]);

// Auth.js required tables (users, accounts, sessions, verification_tokens)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // 'customer' | 'staff'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicToken: text("public_token").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
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
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Guest orders must carry either email or phone
    check(
      "guest_contact_required",
      sql`${t.userId} IS NOT NULL OR ${t.guestEmail} IS NOT NULL OR ${t.guestPhone} IS NOT NULL`
    ),
  ]
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
