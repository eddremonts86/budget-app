export const departments = [
  {
    id: 'dept_1',
    name: 'Engineering',
    managerId: 'user_1',
    budget: 5000000,
    location: 'Remote',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'dept_2',
    name: 'Product',
    managerId: 'user_1',
    budget: 2000000,
    location: 'Remote',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

export const users = [
  {
    id: 'user_1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    jobTitle: 'CTO',
    departmentId: 'dept_1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_2',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    jobTitle: 'Senior Developer',
    departmentId: 'dept_1',
    reportsTo: 'user_1',
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
    priority: 'high',
    budget: 50000,
    departmentId: 'dept_1',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
]

export const projectMembers = [
  {
    id: 'pm_1',
    projectId: 'proj_1',
    userId: 'user_1',
    role: 'owner',
    joinedAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'pm_2',
    projectId: 'proj_1',
    userId: 'user_2',
    role: 'contributor',
    joinedAt: '2024-01-11T00:00:00.000Z',
    updatedAt: '2024-01-11T00:00:00.000Z',
  },
]

export const categories = [
  { id: 'cat_1', name: 'Development', color: '#3b82f6', description: 'Software development tasks' },
  { id: 'cat_2', name: 'Design', color: '#ec4899', description: 'UI/UX design tasks' },
  { id: 'cat_3', name: 'Marketing', color: '#f59e0b', description: 'Product marketing tasks' },
]

export const todos = [
  {
    id: 'todo_1',
    title: 'Setup Project Repository',
    description: 'Initialize git repo and install dependencies',
    status: 'completed',
    priority: 'high',
    complexity: 2,
    estimatedTime: 120,
    actualTime: 90,
    dueDate: '2024-01-20T00:00:00.000Z',
    createdBy: 'user_1',
    assignedTo: 'user_1',
    projectId: 'proj_1',
    categoryId: 'cat_1',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'todo_2',
    title: 'Design Home Page',
    description: 'Create Figma mockups for the home page',
    status: 'in_progress',
    priority: 'medium',
    complexity: 3,
    estimatedTime: 240,
    dueDate: '2024-02-01T00:00:00.000Z',
    createdBy: 'user_1',
    assignedTo: 'user_2',
    projectId: 'proj_1',
    categoryId: 'cat_2',
    createdAt: '2024-01-16T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
  },
]

export const transactions = [
  {
    id: 'trans_1',
    customerName: 'Acme Corp',
    customerEmail: 'billing@acme.com',
    status: 'Approved',
    date: '2024-02-15T00:00:00.000Z',
    amount: 150000,
    paymentMethod: 'Credit Card',
    userId: 'user_1',
    projectId: 'proj_1',
    categoryId: 'cat_1',
    createdAt: '2024-02-15T00:00:00.000Z',
  },
  {
    id: 'trans_2',
    customerName: 'Globex Inc',
    customerEmail: 'finance@globex.com',
    status: 'Pending',
    date: '2024-02-18T00:00:00.000Z',
    amount: 250000,
    paymentMethod: 'Wire Transfer',
    userId: 'user_2',
    projectId: 'proj_1',
    categoryId: 'cat_1',
    createdAt: '2024-02-18T00:00:00.000Z',
  },
]

export const teams = [
  {
    id: 'team_1',
    name: 'Core Team',
    description: 'Main development team',
    specialization: 'Fullstack',
    leadId: 'user_1',
    members: ['user_1', 'user_2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]
