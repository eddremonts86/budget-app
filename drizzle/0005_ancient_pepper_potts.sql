CREATE TYPE "public"."tracker_assignee" AS ENUM('openCode', 'openClaw', 'human');--> statement-breakpoint
CREATE TYPE "public"."tracker_task_status" AS ENUM('todo', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "tracker_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"repo" text,
	"domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracker_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tracker_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "tracker_task_status" DEFAULT 'todo' NOT NULL,
	"assignee" "tracker_assignee" DEFAULT 'openCode' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"phase" text,
	"depends_on" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_imports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "budget_imports" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "tracker_tasks" ADD CONSTRAINT "tracker_tasks_project_id_tracker_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
DROP TYPE "public"."budget_import_status";