# Module Patterns — Deep Reference

## Full Module Example: Tasks

```
src/modules/tasks/
├── manifest.ts
├── index.ts
├── model/
│   ├── types.ts        ← Task, CreateTaskInput, UpdateTaskInput
│   ├── schema.ts       ← Zod schemas (taskSchema, createTaskSchema)
│   └── index.ts
├── api/
│   ├── tasks.fn.ts     ← server functions / axios calls
│   ├── tasks.queries.ts ← TanStack Query hooks
│   └── index.ts
├── components/
│   ├── TasksPage.tsx
│   ├── TaskList.tsx
│   └── TaskForm.tsx
└── index.ts            ← public barrel
```

## Model Layer

```ts
// model/types.ts
export interface Task {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'done'
  projectId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  status?: Task['status']
  projectId: string
  assigneeId?: string
}

export type UpdateTaskInput = Partial<CreateTaskInput> & { id: string }
```

```ts
// model/schema.ts
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1, 'task.errors.titleRequired'),
  status: z.enum(['pending', 'in-progress', 'done']).default('pending'),
  projectId: z.string().uuid('task.errors.invalidProject'),
  assigneeId: z.string().uuid().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
})
```

## API Layer

```ts
// api/tasks.fn.ts — axios-based API calls
import { apiClient } from '@/shared/lib/api'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../model'

export const tasksApi = {
  getAll: (filters?: { projectId?: string; status?: string }) =>
    apiClient.get<Task[]>('/tasks', { params: filters }).then((r) => r.data),

  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: CreateTaskInput) => apiClient.post<Task>('/tasks', data).then((r) => r.data),

  update: ({ id, ...data }: UpdateTaskInput) =>
    apiClient.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
}
```

```ts
// api/tasks.queries.ts — TanStack Query hooks
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import { tasksApi } from './tasks.fn'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (f?: object) => [...taskKeys.lists(), f] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

export function useTasks(filters?: { projectId?: string; status?: string }) {
  return useTQuery(taskKeys.list(filters), () => tasksApi.getAll(filters), { cache: 'standard' })
}

export function useTask(id: string) {
  return useTQuery(taskKeys.detail(id), () => tasksApi.getById(id), {
    cache: 'stable',
    enabled: Boolean(id),
  })
}

export function useCreateTask() {
  return useTQMutation(['tasks', 'create'], tasksApi.create, {
    invalidateKeys: [taskKeys.lists()],
    successMessage: 'task.messages.created',
  })
}

export function useUpdateTask() {
  return useTQMutation(['tasks', 'update'], tasksApi.update, {
    invalidateKeys: [taskKeys.lists()],
    successMessage: 'task.messages.updated',
  })
}

export function useDeleteTask() {
  return useTQMutation(['tasks', 'delete'], tasksApi.delete, {
    invalidateKeys: [taskKeys.lists()],
    successMessage: 'task.messages.deleted',
  })
}
```

## Anti-Patterns to Avoid

```ts
// ❌ Cross-module internal import
import { ProjectInternalUtils } from '@/modules/projects/utils/internal'

// ✅ Use the public barrel only
import { useProjects } from '@/modules/projects'

// ❌ Business logic in route file
export const Route = createFileRoute('/tasks')({
  component: () => {
    const { data } = useQuery(['tasks'], fetchTasks)  // ← DON'T
    return <div>{data.map(...)}</div>
  }
})

// ✅ Thin route adapter
export const Route = createFileRoute('/tasks')({
  component: TasksPage   // ← TasksPage owns its data fetching
})

// ❌ Shared logic in core
// src/modules/core/utils.ts ← NEVER

// ✅ If shared by 2+ modules → src/modules/shared/
// src/modules/shared/formatting/date.ts
```

## Module Dependencies Pattern

When module B needs data from module A:

```ts
// src/modules/analytics/manifest.ts
export const analyticsModule: AppModuleManifest = {
  id: 'analytics',
  dependencies: ['projects', 'tasks'], // analytics depends on both
  // ...
}
```

Module A exports via its barrel, B imports from the barrel:

```ts
// src/modules/analytics/components/AnalyticsPage.tsx
import { useProjects } from '@/modules/projects'
import { useTasks } from '@/modules/tasks'
```

## Server-Only Code

```ts
// src/modules/projects/server/projects.server.ts
// ← Only imported from API route handlers, NEVER from client components

import { db } from '@/shared/lib/db'
import { projects } from '@/shared/lib/db/schema'

export async function getProjectsFromDb(userId: string) {
  return db.select().from(projects).where(eq(projects.ownerId, userId))
}
```

TanStack Start route handlers load server code:

```ts
// src/routes/api.projects.tsx
import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { getProjectsFromDb } from '@/modules/projects/server/projects.server'
```
