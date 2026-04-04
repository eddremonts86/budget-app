---
name: drizzle-db
description: Drizzle ORM + PostgreSQL en TanStack Template. Usar cuando se modifique el schema de base de datos, se creen migraciones, se escriban queries con el ORM, se haga seed de datos, o se gestionen relaciones entre tablas. El schema source-of-truth está en src/shared/lib/db/schema.ts y las migraciones en drizzle/*.sql.
---

# Drizzle DB Skill

## Schema Source of Truth

**Single file**: `src/shared/lib/db/schema.ts`  
**Never** write raw SQL migrations manually — always generate via `drizzle-kit`.

```bash
# Generate migration after schema change
pnpm drizzle-kit generate

# Apply migration to database
pnpm drizzle-kit migrate

# Push schema directly (dev only, no migration file)
pnpm drizzle-kit push

# Introspect existing DB
pnpm drizzle-kit introspect
```

## DB Client

```ts
import { db } from '@/shared/lib/db'
// OR for server-only code:
import { db } from '@/shared/lib/db/index'
```

## Schema Conventions

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

// ✅ Column naming: camelCase in TS → snake_case in SQL
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey(), // text PK (not serial/uuid)
  name: text('name').notNull(),
  status: myStatusEnum('status').notNull().default('active'),
  parentId: text('parent_id').references((): AnyPgColumn => myTable.id, {
    // self-ref needs AnyPgColumn
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ✅ Enums: always define before tables that use them
export const myStatusEnum = pgEnum('my_status', ['active', 'inactive', 'archived'])

// ✅ Composite unique constraints
export const junction = pgTable(
  'junction',
  {
    aId: text('a_id')
      .notNull()
      .references(() => tableA.id, { onDelete: 'cascade' }),
    bId: text('b_id')
      .notNull()
      .references(() => tableB.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.aId, t.bId] }), // composite PK
    uniqueIdx: unique('junction_a_b_unique').on(t.aId, t.bId), // explicit unique
  }),
)
```

## Existing Schema Overview

| Group      | Tables                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| Auth       | `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`    |
| Core Users | `users`, `external_identities`, `user_skills`                           |
| Master     | `roles`, `skills`, `job_titles`, `experience_levels`, `ai_technologies` |
| Org        | `departments`, `teams`, `team_members`                                  |
| Work       | `projects`, `project_members`, `categories`, `todos`                    |
| Finance    | `transactions`, `clients`, `campaigns`                                  |

## Query Patterns

```ts
import { db } from '@/shared/lib/db'
import { projects, projectMembers, users } from '@/shared/lib/db/schema'
import { eq, and, desc, ilike, count } from 'drizzle-orm'

// Simple select
const allProjects = await db.select().from(projects)

// Filtered query
const activeProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.status, 'active'))
  .orderBy(desc(projects.createdAt))

// Join
const projectsWithOwner = await db
  .select({
    id: projects.id,
    name: projects.name,
    ownerName: users.name,
  })
  .from(projects)
  .leftJoin(users, eq(projects.ownerId, users.id))

// Search (case-insensitive)
const results = await db
  .select()
  .from(projects)
  .where(ilike(projects.name, `%${search}%`))

// Count
const [{ total }] = await db
  .select({ total: count() })
  .from(projects)
  .where(eq(projects.status, 'active'))

// Insert
const [newProject] = await db
  .insert(projects)
  .values({
    id: crypto.randomUUID(),
    name: 'My Project',
    status: 'planning',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .returning()

// Update
await db
  .update(projects)
  .set({ name: 'Updated', updatedAt: new Date() })
  .where(eq(projects.id, projectId))

// Delete
await db.delete(projects).where(eq(projects.id, projectId))
```

## Foreign Key Conventions

| Relationship                         | `onDelete` | `onUpdate` |
| ------------------------------------ | ---------- | ---------- |
| Cascade (child owned by parent)      | `cascade`  | `cascade`  |
| Soft link (reference, not ownership) | `set null` | `cascade`  |
| Protect (prevent orphan deletion)    | `restrict` | `cascade`  |

## Drizzle Config (`drizzle.config.ts`)

```ts
export default defineConfig({
  schema: './src/shared/lib/db/schema.ts', // single file
  out: './drizzle', // migration folder
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

## Migration Workflow

```bash
# 1. Modify src/shared/lib/db/schema.ts
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review generated SQL in drizzle/*.sql
# 4. Apply
pnpm drizzle-kit migrate

# ⚠️ NEVER modify drizzle/*.sql files after generation
# ⚠️ Compare schema.ts against drizzle/*.sql if migration history drifts
```

## Seed Scripts

```bash
# Full seed (complex data with relations)
pnpm tsx scripts/db/seed-complex.ts

# Simple seed
pnpm tsx scripts/db/seed-db.ts

# Random transactions
pnpm tsx scripts/db/seed-transactions-random.ts
```

## Integrity Check

```bash
# Quickest repo-native integrity check for orphaned references
pnpm tsx scripts/audit-db.ts
```

## ID Convention

Always use `text('id').primaryKey()` with `crypto.randomUUID()` at insert time.
Never use `serial` or auto-increment — UUIDs prevent ID enumeration attacks.

## Checklist (New Table)

- [ ] Added to `src/shared/lib/db/schema.ts`
- [ ] Enums defined before tables that use them
- [ ] All FKs have explicit `onDelete`/`onUpdate` behavior
- [ ] Junction tables have composite PK + unique constraint
- [ ] `createdAt` + `updatedAt` timestamp columns included
- [ ] Migration generated with `pnpm drizzle-kit generate`
- [ ] Migration reviewed and applied
- [ ] Seed script updated if needed

---

## References

Load these files for real schema patterns and migration examples from the codebase:

- `references/schema-examples.md` — Full production schema (`users`, `todos`, `categories`, `projects`, `transactions`, `sessions`, auth tables), enums, junction tables, seed patterns, Drizzle config, migration journal, query examples with joins and filters
