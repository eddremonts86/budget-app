export const users = [
  {
    id: 'user_1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_2',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]

export const projects = [
  {
    id: 'proj_1',
    name: 'Website Redesign',
    description: 'Redesigning the corporate website for better UX',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-03-30T00:00:00.000Z',
    technologies: ['React', 'Tailwind', 'Next.js'],
    status: 'active',
    team: ['user_1', 'user_2'],
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
]

export const todos = [
  {
    id: 'todo_1',
    title: 'Setup Project Repository',
    description: 'Initialize git repo and install dependencies',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-01-20T00:00:00.000Z',
    createdBy: 'user_1',
    assignedTo: 'user_1',
    projectId: 'proj_1',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'todo_2',
    title: 'Design Home Page',
    description: 'Create Figma mockups for the home page',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2024-02-01T00:00:00.000Z',
    createdBy: 'user_1',
    assignedTo: 'user_2',
    projectId: 'proj_1',
    createdAt: '2024-01-16T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
  },
]

export const categories = [
  { id: 'cat_1', name: 'Development', color: '#3b82f6' },
  { id: 'cat_2', name: 'Design', color: '#ec4899' },
  { id: 'cat_3', name: 'Marketing', color: '#f59e0b' },
]

export const transactions = [
  {
    id: 'trans_1',
    customerName: 'Acme Corp',
    customerEmail: 'billing@acme.com',
    status: 'Approved',
    date: '2024-02-15T00:00:00.000Z',
    amount: 1500,
    userId: 'user_1',
    projectId: 'proj_1',
    createdAt: '2024-02-15T00:00:00.000Z',
  },
  {
    id: 'trans_2',
    customerName: 'Globex Inc',
    customerEmail: 'finance@globex.com',
    status: 'Pending',
    date: '2024-02-18T00:00:00.000Z',
    amount: 2500,
    userId: 'user_2',
    projectId: 'proj_1',
    createdAt: '2024-02-18T00:00:00.000Z',
  },
]

export const teams = [
  {
    id: 'team_1',
    name: 'Core Team',
    description: 'Main development team',
    members: ['user_1', 'user_2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]
