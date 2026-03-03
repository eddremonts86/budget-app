export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  jobTitle?: string | null
  departmentId?: string | null
  departmentName?: string | null
  reportsTo?: string | null
  avatar: string | null
  createdAt: string
}
