import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
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

export const budgetScopeEnum = pgEnum('budget_scope', [
  'personal',
  'project',
  'department',
  'company',
])

export const budgetStatusEnum = pgEnum('budget_status', ['active', 'closed', 'archived'])

export const budgetPeriodTypeEnum = pgEnum('budget_period_type', [
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'one_time',
])

export const budgetMemberRoleEnum = pgEnum('budget_member_role', ['admin', 'contributor', 'viewer'])

export const budgetRecurrenceFrequencyEnum = pgEnum('budget_recurrence_frequency', [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
])

export const budgetRecurrenceStatusEnum = pgEnum('budget_recurrence_status', [
  'active',
  'paused',
  'completed',
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

// --- Authentication Tables ---

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    providerAccountUnique: unique('auth_accounts_provider_id_account_id_unique').on(
      t.providerId,
      t.accountId,
    ),
  }),
)

export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// --- Main Tables ---

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  roleId: text('role_id').references(() => roles.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  authUserId: text('auth_user_id')
    .unique()
    .references(() => authUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
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

export const externalIdentities = pgTable(
  'external_identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    provider: text('provider').notNull(),
    externalUserId: text('external_user_id').notNull(),
    email: text('email'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
  },
  (t) => ({
    providerExternalUserUnique: unique('external_identities_provider_external_user_id_unique').on(
      t.provider,
      t.externalUserId,
    ),
    userProviderUnique: unique('external_identities_user_id_provider_unique').on(
      t.userId,
      t.provider,
    ),
  }),
)

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

// --- Budget Tables ---

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  scope: budgetScopeEnum('scope').notNull(),
  projectId: text('project_id').references(() => projects.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  departmentId: text('department_id').references(() => departments.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  targetAmount: integer('target_amount'),
  currency: text('currency').default('USD').notNull(),
  periodType: budgetPeriodTypeEnum('period_type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: budgetStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const budgetMembers = pgTable(
  'budget_members',
  {
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    role: budgetMemberRoleEnum('role').default('contributor').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.budgetId, t.userId] }),
  }),
)

export const budgetCategoryLimits = pgTable(
  'budget_category_limits',
  {
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    allocatedAmount: integer('allocated_amount').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.budgetId, t.categoryId] }),
  }),
)

export const budgetRecurrenceRules = pgTable('budget_recurrence_rules', {
  id: text('id').primaryKey(),
  budgetId: text('budget_id')
    .notNull()
    .references(() => budgets.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  amount: integer('amount').notNull(),
  frequency: budgetRecurrenceFrequencyEnum('frequency').notNull(),
  interval: integer('interval').default(1).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  nextDate: timestamp('next_date').notNull(),
  lastRunAt: timestamp('last_run_at'),
  status: budgetRecurrenceStatusEnum('status').default('active').notNull(),
  pausedReason: text('paused_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
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
  budgetId: text('budget_id').references((): AnyPgColumn => budgets.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  isPrivate: boolean('is_private').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// --- Budget Import Tables ---

export const budgetImports = pgTable('budget_imports', {
  id: text('id').primaryKey(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  budgetId: text('budget_id').references((): AnyPgColumn => budgets.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // 'csv' | 'xlsx' | 'pdf'
  fileSize: integer('file_size').notNull(),
  fileContent: text('file_content').notNull(), // base64 encoded original file
  status: text('status')
    .$type<'pending' | 'analyzed' | 'imported' | 'failed'>()
    .default('pending')
    .notNull(),
  rawTransactions: text('raw_transactions'), // JSON string
  analysis: text('analysis'), // JSON string
  accountMeta: text('account_meta'), // JSON string: account number, date range, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
