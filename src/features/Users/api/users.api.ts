import { apiClient } from '@/shared/lib/api'
import type { User } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const usersApi = {
  getAll: async ({ pageParam = 1, limit = 10 }: { pageParam?: number; limit?: number } = {}) => {
    const { data: response } = await apiClient.get<JsonServerResponse<User>>('/users', {
      params: {
        _page: pageParam,
        _per_page: limit,
      },
    })
    return {
      data: response.data,
      nextPage: response.next ?? undefined,
      totalCount: response.items,
    }
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<User>(`/users/${id}`)
    return data
  },
  getByEmail: async (email: string): Promise<User | null> => {
    const { data } = await apiClient.get<User[]>('/users', {
      params: { email },
    })
    return data.length > 0 ? data[0] : null
  },
  upsertFromAuth: async (authUser: {
    id: string
    name: string
    email: string
    avatar: string
  }): Promise<User> => {
    // Check if user already exists by email
    const existing = await usersApi.getByEmail(authUser.email)
    if (existing) {
      // Update name/avatar if changed
      if (existing.name !== authUser.name || existing.avatar !== authUser.avatar) {
        return usersApi.update(existing.id, {
          name: authUser.name,
          avatar: authUser.avatar,
        })
      }
      return existing
    }
    // Create new user from auth data
    return usersApi.create({
      name: authUser.name,
      email: authUser.email,
      role: 'user',
      avatar: authUser.avatar,
      createdAt: new Date().toISOString(),
    })
  },
  create: async (user: Omit<User, 'id'>) => {
    const { data } = await apiClient.post<User>('/users', {
      ...user,
      createdAt: user.createdAt || new Date().toISOString(),
    })
    return data
  },
  update: async (id: string, user: Partial<User>) => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, user)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`)
  },
}
