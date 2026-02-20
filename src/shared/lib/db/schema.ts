import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])
export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'completed'])
export const todoPriorityEnum = pgEnum('todo_priority', ['low', 'medium', 'high'])
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed', 'on_hold'])
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
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  technologies: text('technologies').array(),
  status: projectStatusEnum('status').default('active').notNull(),
  team: text('team').array(), // Array of user IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: todoStatusEnum('status').default('pending').notNull(),
  priority: todoPriorityEnum('priority').default('medium').notNull(),
  dueDate: timestamp('due_date'),
  createdBy: text('created_by').references(() => users.id),
  assignedTo: text('assigned_to').references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
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
  color: text('color').notNull(),
})

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  members: text('members').array(), // Array of user IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
