CREATE TYPE "public"."budget_member_role" AS ENUM('admin', 'contributor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."budget_period_type" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."budget_recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."budget_recurrence_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."budget_scope" AS ENUM('personal', 'project', 'department', 'company');--> statement-breakpoint
CREATE TYPE "public"."budget_status" AS ENUM('active', 'closed', 'archived');--> statement-breakpoint
CREATE TABLE "budget_category_limits" (
	"budget_id" text NOT NULL,
	"category_id" text NOT NULL,
	"allocated_amount" integer NOT NULL,
	CONSTRAINT "budget_category_limits_budget_id_category_id_pk" PRIMARY KEY("budget_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "budget_members" (
	"budget_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "budget_member_role" DEFAULT 'contributor' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budget_members_budget_id_user_id_pk" PRIMARY KEY("budget_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "budget_recurrence_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"category_id" text,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"frequency" "budget_recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"next_date" timestamp NOT NULL,
	"last_run_at" timestamp,
	"status" "budget_recurrence_status" DEFAULT 'active' NOT NULL,
	"paused_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scope" "budget_scope" NOT NULL,
	"project_id" text,
	"department_id" text,
	"owner_id" text NOT NULL,
	"target_amount" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"period_type" "budget_period_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" "budget_status" DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "customer_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "customer_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "budget_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_category_limits" ADD CONSTRAINT "budget_category_limits_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_category_limits" ADD CONSTRAINT "budget_category_limits_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_members" ADD CONSTRAINT "budget_members_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_members" ADD CONSTRAINT "budget_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_recurrence_rules" ADD CONSTRAINT "budget_recurrence_rules_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_recurrence_rules" ADD CONSTRAINT "budget_recurrence_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_recurrence_rules" ADD CONSTRAINT "budget_recurrence_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE cascade;