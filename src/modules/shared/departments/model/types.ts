export interface Department {
  id: string
  name: string
  managerId?: string | null
  budget?: number | null
  location?: string | null
  createdAt: string
  updatedAt: string
}
