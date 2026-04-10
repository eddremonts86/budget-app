-- Performance indexes for the todos table
-- Speeds up: status filtering (Kanban), date-range queries (Calendar),
-- assignedTo filtering (My Tasks), projectId joins, and default list sort.

CREATE INDEX IF NOT EXISTS "todos_status_idx"      ON "todos" ("status");
CREATE INDEX IF NOT EXISTS "todos_due_date_idx"    ON "todos" ("due_date");
CREATE INDEX IF NOT EXISTS "todos_assigned_to_idx" ON "todos" ("assigned_to");
CREATE INDEX IF NOT EXISTS "todos_project_id_idx"  ON "todos" ("project_id");
CREATE INDEX IF NOT EXISTS "todos_created_at_idx"  ON "todos" ("created_at" DESC);

-- Composite index for the most common combined filter: status + assignedTo
CREATE INDEX IF NOT EXISTS "todos_status_assigned_idx" ON "todos" ("status", "assigned_to");

-- Composite index for calendar date-range + assignedTo filter
CREATE INDEX IF NOT EXISTS "todos_due_date_assigned_idx" ON "todos" ("due_date", "assigned_to");
