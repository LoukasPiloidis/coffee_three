ALTER TABLE "order_items" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "offers_json" jsonb DEFAULT '[]'::jsonb NOT NULL;