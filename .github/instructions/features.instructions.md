---
applyTo: 'src/features/**/*'
---

# Feature Module Guidelines

When working in feature modules, follow these patterns:

## Structure

Each feature should have:

- `api/` - API calls (`*.api.ts`) and query hooks (`*.queries.ts`)
- `model/` - Types (`*.types.ts`) and schemas (`*.schema.ts`)
- `ui/` - React components
- `hooks/` - Feature-specific hooks (optional)
- `index.ts` - Barrel file with public exports only

## API Pattern

```typescript
// api/feature.api.ts
import { apiClient } from '@/shared/lib/api'
import type { Entity, CreateInput, UpdateInput } from '../model'

export const featureApi = {
  getAll: (filters?) =>
    apiClient.get<Entity[]>('/endpoint', { params: filters }).then((r) => r.data),
  getById: (id) => apiClient.get<Entity>(`/endpoint/${id}`).then((r) => r.data),
  create: (data: CreateInput) => apiClient.post<Entity>('/endpoint', data).then((r) => r.data),
  update: ({ id, ...data }: UpdateInput) =>
    apiClient.patch<Entity>(`/endpoint/${id}`, data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/endpoint/${id}`),
}
```

## Query Hooks Pattern

```typescript
// api/feature.queries.ts
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import { featureApi } from './feature.api'

// Keys factory for consistency
export const featureKeys = {
  all: ['feature'] as const,
  lists: () => [...featureKeys.all, 'list'] as const,
  list: (filters) => [...featureKeys.lists(), filters] as const,
  details: () => [...featureKeys.all, 'detail'] as const,
  detail: (id) => [...featureKeys.details(), id] as const,
}

export function useFeatures(filters) {
  return useTQuery(featureKeys.list(filters), () => featureApi.getAll(filters), {
    cache: 'standard',
  })
}

export function useCreateFeature() {
  return useTQMutation(['feature', 'create'], featureApi.create, {
    invalidateKeys: [featureKeys.lists()],
    successMessage: 'feature.messages.created', // i18n key
  })
}
```

## Component Pattern

```typescript
// ui/FeatureComponent.tsx
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import type { Entity } from '../model'

interface FeatureComponentProps {
  item: Entity
  onAction?: () => void
}

export function FeatureComponent({ item, onAction }: FeatureComponentProps) {
  const { t } = useTranslation()
  // ...
}
```

## Barrel File Pattern

```typescript
// index.ts - Only export public API
export { FeatureList, FeatureForm } from './ui'
export { useFeatures, useCreateFeature } from './api'
export type { Entity, CreateInput } from './model'
```

## Rules

- Never import from internal paths outside the feature
- Always use i18n keys for user-facing text
- Validate mutations with Zod schemas
- Use the query wrappers, not raw useQuery/useMutation
