export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  technologies: string[]
  status: 'active' | 'completed' | 'on_hold'
  team: string[]
  createdAt: string
  updatedAt: string
}
