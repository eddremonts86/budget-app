CREATE TYPE "public"."budget_import_status" AS ENUM('pending', 'analyzed', 'imported', 'failed');--> statement-breakpoint
CREATE TABLE "budget_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"budget_id" text,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_content" text NOT NULL,
	"status" "budget_import_status" DEFAULT 'pending' NOT NULL,
	"raw_transactions" text,
	"analysis" text,
	"account_meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_imports" ADD CONSTRAINT "budget_imports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_imports" ADD CONSTRAINT "budget_imports_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE cascade;