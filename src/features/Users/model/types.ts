export interface User {
  id: string
  name: string
  email: string
  roleId: string | null
  roleName?: string | null
  jobTitleId?: string | null
  jobTitleName?: string | null
  experienceLevelId?: string | null
  experienceLevelName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  reportsTo?: string | null
  reportsToName?: string | null
  avatar: string | null
  salary?: number | null
  skills?: string[] // Skill names
  createdAt: string
  updatedAt?: string
}

export interface Role {
  id: string
  name: string
  description?: string | null
}

export interface Skill {
  id: string
  name: string
}

export interface JobTitle {
  id: string
  name: string
  description?: string | null
}

export interface ExperienceLevel {
  id: string
  name: string
}
