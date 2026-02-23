import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])
export const todoStatusEnum = pgEnum('todo_status', [
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
])
export const todoPriorityEnum = pgEnum('todo_priority', ['low', 'medium', 'high'])
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'completed',
  'on_hold',
  'cancelled',
])
export const transactionStatusEnum = pgEnum('transaction_status', [
  'Approved',
  'Pending',
  'Rejected',
])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').default('user').notNull(),
  jobTitle: text('job_title'),
  department: text('department'),
  hireDate: timestamp('hire_date'),
  experienceLevel: text('experience_level'),
  skills: text('skills').array(),
  reportsTo: text('reports_to'), // Self-reference ID
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  managerId: text('manager_id').references(() => users.id),
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
  technologies: text('technologies').array(),
  status: projectStatusEnum('status').default('active').notNull(),
  priority: text('priority').default('medium'),
  budget: integer('budget').default(0),
  departmentId: text('department_id').references(() => departments.id),
  team: text('team').array(), // Array of Team IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: todoStatusEnum('status').default('pending').notNull(),
  priority: todoPriorityEnum('priority').default('medium').notNull(),
  complexity: integer('complexity').default(1), // 1-5 or hours
  estimatedTime: integer('estimated_time'), // in minutes/hours
  actualTime: integer('actual_time'), // in minutes/hours
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  dependencies: text('dependencies').array(), // Array of Todo IDs
  acceptanceCriteria: text('acceptance_criteria'),
  createdBy: text('created_by').references(() => users.id),
  assignedTo: text('assigned_to').references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  status: transactionStatusEnum('status').default('Pending').notNull(),
  date: timestamp('date').notNull(),
  amount: integer('amount').notNull(), // Storing as integer (cents) or keeping as number? JSON uses number. Let's use integer for safety or doublePrecision.
  userId: text('user_id').references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
  assignedAdminId: text('assigned_admin_id').references(() => users.id),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
})

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'), // Self-reference ID
  sla: integer('sla'), // in hours
  color: text('color').notNull(),
})

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  specialization: text('specialization'),
  leadId: text('lead_id').references(() => users.id),
  members: text('members').array(), // Array of user IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
