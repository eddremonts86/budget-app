export const PROJECT_MEMBER_ROLES = ['owner', 'manager', 'contributor', 'viewer'] as const
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number]

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  userName: string
  userEmail: string
  role: ProjectMemberRole
  joinedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  startDate: string
  endDate: string
  technologies: string[] | null
  status: 'active' | 'completed' | 'on_hold' | 'planning' | 'cancelled'
  type: 'internal' | 'external' | 'research' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | string | null
  budget: number | null
  departmentId?: string | null
  team: { userId: string; role: ProjectMemberRole }[] | null
  createdAt: string
  updatedAt: string
}
