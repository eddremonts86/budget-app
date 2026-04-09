# i18n Deep — Translation Reference

## Real Locale File Structure

Source: `src/shared/lib/i18n/locales/`

```
src/shared/lib/i18n/locales/
├── en/
│   ├── common.json   ← main namespace (everything here by default)
│   └── errors.json   ← validation/network error messages
├── es/
│   ├── common.json
│   └── errors.json
└── dk/
    ├── common.json
    └── errors.json
```

---

## Real Key Inventory (from production `locales/en/common.json`)

### App Identity

```json
{
  "app": {
    "name": "TanStack Template",
    "brand": "AI Solutions",
    "description": "A modern full-stack template powered by TanStack"
  }
}
```

### Navigation

```json
{
  "nav": {
    "home": "Home",
    "services": "Solutions",
    "timeline": "Story",
    "contact": "Let's Talk",
    "settings": "Settings",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  }
}
```

### Auth Section (auth)

```json
{
  "auth": {
    "topbarCta": "Sign in",
    "workspaceAccess": "Workspace access",
    "eyebrow": "Hybrid authentication",
    "title": "Choose how you want to sign in.",
    "signInTab": "Sign in",
    "signUpTab": "Create account",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "nameLabel": "Full name",
    "emailPlaceholder": "you@company.com",
    "passwordPlaceholder": "Your password",
    "passwordRequirementHint": "Use at least {{min}} characters with letters, numbers, and a symbol.",
    "signInAction": "Enter workspace",
    "signUpAction": "Create account",
    "submitting": "Working...",
    "goDashboard": "Go to dashboard",
    "backHome": "Back to home"
  }
}
```

### Pattern for Feature Sections

Every feature follows this nesting pattern:

```json
{
  "featureName": {
    "title": "Feature Title",
    "subtitle": "Short description",
    "create": {
      "title": "Create Item",
      "description": "Add a new item to the workspace"
    },
    "edit": {
      "title": "Edit Item",
      "description": "Update the selected item"
    },
    "fields": {
      "name": "Name",
      "namePlaceholder": "Enter a name...",
      "status": "Status",
      "description": "Description"
    },
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save changes",
      "cancel": "Cancel"
    },
    "messages": {
      "created": "Item created successfully",
      "updated": "Item updated",
      "deleted": "Item deleted"
    },
    "errors": {
      "nameRequired": "Name is required",
      "nameTooLong": "Name must be under 100 characters"
    },
    "delete": {
      "confirmTitle": "Delete item?",
      "confirmDescription": "This action cannot be undone."
    }
  }
}
```

---

## Three-Language Parity (always update all 3)

When adding `myFeature.create.title`:

```json
// en/common.json
{ "myFeature": { "create": { "title": "Create Item" } } }

// es/common.json
{ "myFeature": { "create": { "title": "Crear elemento" } } }

// dk/common.json
{ "myFeature": { "create": { "title": "Opret element" } } }
```

---

## Interpolation Examples (real patterns)

```json
// en: password hint uses {{min}}
"passwordRequirementHint": "Use at least {{min}} characters with letters, numbers, and a symbol."
// es:
"passwordRequirementHint": "Usa al menos {{min}} caracteres con letras, números y un símbolo."
// dk:
"passwordRequirementHint": "Brug mindst {{min}} tegn med bogstaver, tal og et symbol."
```

```tsx
// Usage
t('auth.passwordRequirementHint', { min: 8 })
// → "Use at least 8 characters with letters, numbers, and a symbol."
```

---

## Sidebar Navigation Keys

Navigation items use `titleKey` in the manifest (NOT inline text):

```ts
// manifest.ts
items: [
  {
    id: 'projects',
    titleKey: 'sidebar.main.projects', // ← i18n key
    fallbackTitle: 'Projects', // ← shown if i18n fails
    to: '/dashboard/projects',
  },
]
```

```json
// en/common.json
{ "sidebar": { "main": { "projects": "Projects" } } }

// es/common.json
{ "sidebar": { "main": { "projects": "Proyectos" } } }

// dk/common.json
{ "sidebar": { "main": { "projects": "Projekter" } } }
```

---

## Zod + i18n Integration

In Zod schemas, use i18n key strings as error messages:

```ts
// model/schema.ts
export const createProjectSchema = z.object({
  name: z.string().min(1, 'projects.errors.nameRequired'),
  budget: z.number().min(0, 'projects.errors.budgetNegative'),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']),
})
```

TanStack Form auto-calls `t(errorKey)` when errors are displayed via:

```tsx
{
  field.state.meta.errors.map((err) => (
    <p key={err?.toString()} className="text-sm text-destructive">
      {t(err?.toString() ?? '')}
    </p>
  ))
}
```

---

## Mutation Success Messages

```ts
// queries.ts — always use i18n instance (not hook) for mutation messages
import { i18n } from '@/shared/lib/i18n'

export function useCreateProject() {
  return useTQMutation(['projects', 'create'], createProjectFn, {
    invalidateKeys: [projectsKeys.lists()],
    successMessage: i18n.t('projects.messages.created'), // ← i18n instance, not hook
  })
}
```

---

## Language Switcher (production code reference)

```tsx
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const languages = ['en', 'es', 'dk'] as const
  const labels = { en: 'English', es: 'Español', dk: 'Dansk' }

  return (
    <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {labels[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## E2E Test Locale Utilities

```ts
// tests/e2e/utils/i18n.ts — used in playwright tests
import { applyLanguage, getByLabelI18n, getByPlaceholderI18n, getByRoleI18n } from './utils/i18n'

// Apply locale from test project config
await applyLanguage(page, testInfo)

// Get form inputs by translated label
const nameInput = await getByLabelI18n(page, 'projects.form.nameLabel')
await nameInput.fill('My Project')
```

This makes tests locale-independent — they work across en/es/dk matrix.

---

## Common Mistakes

| Mistake                                   | Fix                                                 |
| ----------------------------------------- | --------------------------------------------------- |
| `<h1>Projects</h1>` (hardcoded)           | `<h1>{t('projects.title')}</h1>`                    |
| Adding key to `en` only                   | Always add to `en`, `es`, and `dk` simultaneously   |
| `successMessage: 'Created!'` (raw string) | `successMessage: i18n.t('entity.messages.created')` |
| Zod error `z.string().min(1, 'Required')` | `z.string().min(1, 'entity.errors.nameRequired')`   |
| Using hook `t()` outside a component      | Use `i18n.t()` from `@/shared/lib/i18n` instead     |
