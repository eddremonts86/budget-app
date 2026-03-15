import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

// --- Enums ---
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

export const transactionStatusEnum = pgEnum('transaction_status', [
  'Approved',
  'Pending',
  'Rejected',
])

export const projectMemberRoleEnum = pgEnum('project_member_role', [
  'owner',
  'manager',
  'contributor',
  'viewer',
])

// --- Master Tables ---

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

export const experienceLevels = pgTable('experience_levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiTechnologies = pgTable('ai_technologies', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry').default('Advertising'),
  contactEmail: text('contact_email'),
  website: text('website'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  clientId: text('client_id').references(() => clients.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  budget: integer('budget').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// --- Main Tables ---

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  roleId: text('role_id').references(() => roles.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  jobTitleId: text('job_title_id').references(() => jobTitles.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  experienceLevelId: text('experience_level_id').references(() => experienceLevels.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  departmentId: text('department_id').references((): AnyPgColumn => departments.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  hireDate: timestamp('hire_date'),
  reportsTo: text('reports_to').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }), // Self-reference ID
  avatar: text('avatar'),
  salary: integer('salary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userSkills = pgTable(
  'user_skills',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.skillId] }),
  }),
)

export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  managerId: text('manager_id').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  budget: integer('budget').default(0),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: projectStatusEnum('status').default('active').notNull(),
  type: projectTypeEnum('type').default('internal').notNull(),
  priority: text('priority').default('medium'),
  budget: integer('budget').default(0),
  departmentId: text('department_id').references(() => departments.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  clientId: text('client_id').references(() => clients.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const projectSkills = pgTable(
  'project_skills',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.skillId] }),
  }),
)

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: todoStatusEnum('status').default('pending').notNull(),
  priority: todoPriorityEnum('priority').default('medium').notNull(),
  complexity: integer('complexity').default(1),
  estimatedTime: integer('estimated_time'),
  actualTime: integer('actual_time'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  acceptanceCriteria: text('acceptance_criteria'),
  createdBy: text('created_by').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  assignedTo: text('assigned_to').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  projectId: text('project_id').references(() => projects.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const todoDependencies = pgTable(
  'todo_dependencies',
  {
    todoId: text('todo_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    dependsOnId: text('depends_on_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.todoId, t.dependsOnId] }),
  }),
)

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  status: transactionStatusEnum('status').default('Pending').notNull(),
  date: timestamp('date').notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method'),
  description: text('description'),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  assignedAdminId: text('assigned_admin_id').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  approvedBy: text('approved_by').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
})

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id').references((): AnyPgColumn => categories.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  sla: integer('sla'),
  color: text('color').notNull(),
})

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  specialization: text('specialization'),
  leadId: text('lead_id').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.teamId, t.userId] }),
  }),
)

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
    role: projectMemberRoleEnum('role').default('contributor').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    projectUserUnique: unique('project_members_project_id_user_id_unique').on(
      t.projectId,
      t.userId,
    ),
  }),
)
