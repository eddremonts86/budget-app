# Drizzle DB — Schema & Query Reference

## Real Schema File Structure

Source: `src/shared/lib/db/schema.ts` (ALL tables in one file)

### Enum Definitions (must come before tables that use them)

```ts
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

export const todoStatusEnum = pgEnum('todo_status', [
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
  'on_hold',
  'testing',
])

export const todoPriorityEnum = pgEnum('todo_priority', ['low', 'medium', 'high'])

export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'completed',
  'on_hold',
  'cancelled',
])

export const projectTypeEnum = pgEnum('project_type', [
  'internal',
  'external',
  'research',
  'maintenance',
])

export const projectMemberRoleEnum = pgEnum('project_member_role', [
  'owner',
  'manager',
  'contributor',
  'viewer',
])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'Approved',
  'Pending',
  'Rejected',
])
```

### Master Tables (no FK dependencies)

```ts
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const skills = pgTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const jobTitles = pgTable('job_titles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Users Table (references master tables)

```ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  roleId: text('role_id').references(() => roles.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  jobTitleId: text('job_title_id').references(() => jobTitles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Projects Table

```ts
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: projectStatusEnum('status').notNull().default('planning'),
  type: projectTypeEnum('type').notNull().default('internal'),
  priority: text('priority'),
  budget: integer('budget').notNull().default(0),
  departmentId: text('department_id').references(
    (): AnyPgColumn => departments.id, // forward ref needs AnyPgColumn
    { onDelete: 'set null', onUpdate: 'cascade' },
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Junction Table Pattern (project_members)

```ts
export const projectMembers = pgTable(
  'project_members',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    role: projectMemberRoleEnum('role').notNull().default('contributor'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => ({
    uniqueMembership: unique('project_members_project_user_unique').on(t.projectId, t.userId),
  }),
)
```

### Todos Table

```ts
export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: todoStatusEnum('status').notNull().default('pending'),
  priority: todoPriorityEnum('priority').notNull().default('medium'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

---

## Real Query Examples (from projects.fn.ts)

```ts
import { createServerFn } from '@tanstack/react-start'
import { desc, eq, and, inArray, count, like } from 'drizzle-orm'
import { z } from 'zod'
import { projects, projectMembers, users, departments } from '@/shared/lib/db/schema'
import { db } from '@/shared/lib/db'

// Paginated list with search
export const getProjectsFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      pageParam: z.number().optional(),
      limit: z.number().optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { pageParam = 1, limit = 10, search } = data
    const offset = (pageParam - 1) * limit

    const where = search ? like(projects.name, `%${search}%`) : undefined

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(where)
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(projects).where(where),
    ])

    return {
      data: rows,
      total: Number(total),
      nextPage: offset + limit < Number(total) ? pageParam + 1 : undefined,
    }
  })

// Single record with join
export const getProjectByIdFn = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    return project ?? null
  })

// Create with UUID
export const createProjectFn = createServerFn({ method: 'POST' })
  .validator(projectSchema)
  .handler(async ({ data }) => {
    const [project] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(), // ← ALWAYS use crypto.randomUUID()
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    return project
  })

// Update
export const updateProjectFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), data: projectSchema.partial() }))
  .handler(async ({ data: { id, data } }) => {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
    return updated
  })

// Delete
export const deleteProjectFn = createServerFn({ method: 'POST' })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    await db.delete(projects).where(eq(projects.id, id))
    return { success: true }
  })
```

---

## Migration Workflow (step by step)

```bash
# 1. Edit src/shared/lib/db/schema.ts (add table / column / enum)

# 2. Generate (creates a new file in drizzle/)
pnpm drizzle-kit generate

# 3. Inspect the generated SQL in drizzle/<timestamp>_<name>.sql
# Verify it matches your intention - never edit it

# 4. Apply to running DB
pnpm drizzle-kit migrate

# 5. Seed if needed
pnpm tsx scripts/db/seed-complex.ts
```

---

## Auth Tables (Better Auth — do not modify directly)

```
auth_users         — managed by Better Auth
auth_sessions      — managed by Better Auth
auth_accounts      — OAuth account links
auth_verifications — email verification tokens
```

These tables have FK relationships. Better Auth creates/manages them via `better-auth.ts`.
Never `INSERT`, `UPDATE`, `DELETE` directly — always go through Better Auth's API.

---

## Import Conventions

```ts
// ✅ Correct
import { db } from '@/shared/lib/db'
import { projects, users, todos } from '@/shared/lib/db/schema'
import { eq, and, desc, ilike, count, like } from 'drizzle-orm'

// ❌ Never import db in client-side code
// db must only appear in server functions (.fn.ts, API routes, scripts)
```
