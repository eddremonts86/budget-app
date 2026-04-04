---
name: i18n-deep
description: Sistema de internacionalización trilingual (ES/EN/DK) de TanStack Template con react-i18next. Usar cuando se agreguen strings nuevas a la UI, se creen nuevas claves de traducción, se necesite cambiar el idioma, se configuren namespaces, se usen interpolaciones/plurales, o se integre i18n con el sistema de idioma del AI chat. También aplica para validar que todos los textos de una feature estén traducidos.
---

# i18n Deep Skill

## Setup Overview

```
src/shared/lib/i18n/
├── i18n.ts               ← i18next init, language detector, resource bundling
├── index.ts              ← barrel: exports i18n instance + types
└── locales/
    ├── en/
    │   ├── common.json   ← main namespace
    │   └── errors.json   ← error messages
    ├── es/
    │   ├── common.json
    │   └── errors.json
    └── dk/
        ├── common.json
        └── errors.json
```

## Supported Languages

| Code | Name    | Native  |
| ---- | ------- | ------- |
| `en` | English | English |
| `es` | Español | Spanish |
| `dk` | Dansk   | Danish  |

Default namespace: `common`. Fallback: `en`.

## Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()
  // t() uses 'common' namespace by default

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.description')}</p>
      <Button>{t('common.save')}</Button>
    </div>
  )
}

// For errors namespace:
const { t } = useTranslation('errors')
// t('validation.required')
```

## Key Naming Convention

```
namespace.section.key
```

Examples:

```
common.auth.signInAction         → "Enter workspace"
common.projects.create.title     → "Create Project"
common.task.fields.name          → "Task Name"
common.task.messages.created     → "Task created successfully"
common.task.errors.titleRequired → "Title is required"
common.sidebar.main.projects     → "Projects"
errors.validation.required       → "This field is required"
errors.network.timeout           → "Request timed out"
```

## Adding New Keys (ALL 3 LANGUAGES)

When a feature has new user-facing text, add to ALL locale files simultaneously:

```json
// locales/en/common.json
{
  "myFeature": {
    "title": "My Feature",
    "create": {
      "title": "Create Item",
      "description": "Add a new item to the workspace"
    },
    "fields": {
      "name": "Name",
      "namePlaceholder": "Enter a name..."
    },
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete"
    },
    "messages": {
      "created": "Item created successfully",
      "updated": "Item updated",
      "deleted": "Item deleted"
    },
    "errors": {
      "nameRequired": "Name is required",
      "nameTooLong": "Name must be under 100 characters"
    }
  }
}
```

```json
// locales/es/common.json
{
  "myFeature": {
    "title": "Mi Funcionalidad",
    "create": {
      "title": "Crear Elemento",
      "description": "Agregar un nuevo elemento al espacio de trabajo"
    },
    "fields": {
      "name": "Nombre",
      "namePlaceholder": "Escribe un nombre..."
    },
    "actions": {
      "create": "Crear",
      "edit": "Editar",
      "delete": "Eliminar"
    },
    "messages": {
      "created": "Elemento creado exitosamente",
      "updated": "Elemento actualizado",
      "deleted": "Elemento eliminado"
    },
    "errors": {
      "nameRequired": "El nombre es requerido",
      "nameTooLong": "El nombre debe tener máximo 100 caracteres"
    }
  }
}
```

```json
// locales/dk/common.json
{
  "myFeature": {
    "title": "Min Funktion",
    "create": {
      "title": "Opret element",
      "description": "Tilføj et nyt element til arbejdsområdet"
    },
    "fields": {
      "name": "Navn",
      "namePlaceholder": "Skriv et navn..."
    },
    "actions": {
      "create": "Opret",
      "edit": "Rediger",
      "delete": "Slet"
    },
    "messages": {
      "created": "Element oprettet",
      "updated": "Element opdateret",
      "deleted": "Element slettet"
    },
    "errors": {
      "nameRequired": "Navn er påkrævet",
      "nameTooLong": "Navn må maks være 100 tegn"
    }
  }
}
```

## Advanced Patterns

### Interpolation

```json
{ "greeting": "Hello, {{name}}!" }
```

```tsx
t('greeting', { name: user.name }) // → "Hello, Ada!"
```

### Pluralization

```json
{
  "item_one": "{{count}} item",
  "item_other": "{{count}} items"
}
```

```tsx
t('item', { count: 3 }) // → "3 items"
```

### Trans Component (HTML in translations)

```tsx
import { Trans } from 'react-i18next'
// en: "Click <1>here</1> to continue"
;<Trans i18nKey="clickHere">
  Click <a href="/continue">here</a> to continue
</Trans>
```

## Language Switcher

```tsx
import { useTranslation } from 'react-i18next'
import { supportedLanguages, languageNames } from '@/shared/lib/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
      {supportedLanguages.map((lang) => (
        <SelectItem key={lang} value={lang}>
          {languageNames[lang]}
        </SelectItem>
      ))}
    </Select>
  )
}
```

## AI Chat Language Integration

The AI chat uses `navigator.language` passed as `?locale=xx-XX` to the chat API.
The system prompt enforces response language server-side. No client-side wiring needed
beyond reading `navigator.language` at component mount.

## Environment Variable

```bash
VITE_DEFAULT_LOCALE=en    # en | es | dk
```

## Zod Error Keys with i18n

In Zod schemas, use i18n key strings as error messages:

```ts
z.string().min(1, 'myFeature.errors.nameRequired')
```

The TanStack Form adapter will pass these keys to `t()` automatically when connected
via the form's error display pattern.

## Checklist (New Feature i18n)

- [ ] All user-facing text uses `t('namespace.key')` — no hardcoded strings
- [ ] Keys added to `locales/en/common.json`
- [ ] Keys added to `locales/es/common.json`
- [ ] Keys added to `locales/dk/common.json`
- [ ] Zod schema errors use i18n key strings
- [ ] Mutation `successMessage` uses i18n key
- [ ] Sidebar navigation uses `titleKey` (i18n key) and `fallbackTitle`
- [ ] No duplicate keys across namespaces

---

## References

Load these files for real translation keys and patterns from the production codebase:

- `references/translation-examples.md` — Real locale file structure (`src/shared/lib/i18n/locales/`), full key inventory (nav, auth, todo, categories, projects, AI, settings), i18n config setup, `useTranslation` patterns, module manifest titleKey convention, language detection logic
