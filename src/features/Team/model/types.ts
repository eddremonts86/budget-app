import type { User } from '@/features/Users/model/types'

export interface Team {
  id: string
  name: string
  description: string | null
  members: string[] | null
  createdAt: string
  updatedAt: string
}

export interface TeamWithUsers extends Omit<Team, 'members'> {
  members: User[]
}
