ALTER TYPE "public"."order_type" ADD VALUE 'takeaway';--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "guest_contact_required";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_street" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_postcode" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "guest_contact_required" CHECK ("orders"."user_id" IS NOT NULL OR "orders"."guest_email" IS NOT NULL OR "orders"."guest_phone" IS NOT NULL OR "orders"."guest_name" IS NOT NULL);