# GitHub Copilot Skills

## UI Component Standards

**ALWAYS use Shadcn UI components when building UI elements:**

### Available Components

- `Button` - from `@/shared/ui/button`
- `Input` - from `@/shared/ui/input`
- `Label` - from `@/shared/ui/label`
- `Textarea` - from `@/shared/ui/textarea`
- `Select` - from `@/shared/ui/select`

### Component Usage Pattern

```typescript
import { Button, Input, Label } from '@/shared/ui'

// Instead of raw HTML:
<button className="...">Click</button>

// Use Shadcn components:
<Button variant="default" size="default">Click</Button>

// Forms:
<Label htmlFor="field">Label</Label>
<Input id="field" value={value} onChange={handler} />
```

### When Creating New Components

1. Check if Shadcn UI has a pre-built component
2. Import from `@/shared/ui` instead of creating raw HTML
3. Use variant props instead of manual className strings
4. Follow the existing component patterns in `src/shared/ui/`

### Missing Components

If a needed Shadcn component doesn't exist:

1. Create it in `src/shared/ui/[component-name].tsx`
2. Follow the Shadcn UI v0 patterns (forwardRef, className merging with `cn()`)
3. Export from `src/shared/ui/index.ts`

---

## Code Quality Enforcement

**ALWAYS run ESLint + Prettier after code modifications:**

### VS Code Setup

The project uses ESLint for linting and Prettier for formatting:

- Install: `esbenp.prettier-vscode` + `dbaeumer.vscode-eslint`
- Auto-format on save is enabled in `.vscode/settings.json`
- ESLint auto-fix runs on save via code actions

### Automatic Linting Workflow

After ANY code change (create, edit, refactor):

1. Save the file (Prettier formats + ESLint fixes apply automatically)
2. If errors remain after save, run `pnpm lint:fix` manually
3. For final validation, run `pnpm type-check`

### When to Run Manually

- ✅ When working outside VS Code
- ✅ Before committing changes (use `pnpm lint:fix && pnpm format`)
- ✅ In CI/CD pipelines
- ✅ When batch-processing multiple files

### Commands

```bash
pnpm lint          # Check for lint issues (no fixes)
pnpm lint:fix      # Auto-fix lint issues
pnpm format        # Format all files with Prettier
pnpm format:check  # Check formatting without writing
pnpm type-check    # TypeScript validation
```

### Common ESLint Fixes

- Unused variables/imports removal
- Consistent type imports (`import type { ... }`)
- Import sorting and deduplication
- React hooks dependency corrections
- Strict equality enforcement

### Error Handling

If ESLint reports unfixable errors:

1. Read the error message carefully
2. Apply manual fixes
3. Re-run `pnpm lint:fix` or save in VS Code
4. Update `eslint.config.js` if rule needs adjustment (rare)

---

## Implementation Checklist

### For Every Code Change:

- [ ] Use Shadcn UI components (not raw HTML)
- [ ] Save file in VS Code (Prettier formats + ESLint fixes)
- [ ] Fix any remaining ESLint errors manually if needed
- [ ] Run `pnpm type-check` for TS validation
- [ ] Verify no compilation errors

### For New Features:

- [ ] Check for existing Shadcn components
- [ ] Create missing components in `src/shared/ui/`
- [ ] Export from barrel files (`index.ts`)
- [ ] Save files (Prettier + ESLint auto-apply)
- [ ] Test TypeScript compilation

---

## Configuration

### VS Code Settings

`.vscode/settings.json` - Prettier format on save + ESLint auto-fix on save

### Lint Config Location

`eslint.config.js` - project linting rules (ESLint 9 flat config)

### Format Config Location

`.prettierrc` - Prettier formatting rules

### Required Extensions

`.vscode/extensions.json` - Recommended extensions (Prettier + ESLint)

### Shadcn UI Standards

All UI components follow:

- Radix UI primitives patterns
- `cn()` utility for className merging
- React forwardRef for accessibility
- Consistent variant/size prop APIs
