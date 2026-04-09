CREATE TABLE "item_overrides" (
	"slug" text PRIMARY KEY NOT NULL,
	"available" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "option_overrides" (
	"item_slug" text NOT NULL,
	"group_key" text NOT NULL,
	"option_key" text NOT NULL,
	"available" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "option_overrides_item_slug_group_key_option_key_pk" PRIMARY KEY("item_slug","group_key","option_key")
);
