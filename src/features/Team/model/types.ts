import type { User } from '@/features/Users/model/types'

export interface Team {
  id: string
  name: string
  description: string
  members: string[]
  createdAt: string
  updatedAt: string
}

export interface TeamWithUsers extends Omit<Team, 'members'> {
  members: User[]
}
