# VS Code Setup

## Recommended Extensions

### Prettier (`esbenp.prettier-vscode`)

**Required** - Code formatter.

### ESLint (`dbaeumer.vscode-eslint`)

**Required** - Linter with auto-fix on save.

### TanStack Router Devtools (`tanstack.vscode-router-devtools`)

Optional - Adds TanStack Router integration.

## What the Settings Do

1. **Format on save** - Prettier formats every file on save
2. **ESLint auto-fix** - Lint fixes (unused imports, type imports, etc.) apply on save
3. **Language-scoped formatters** - Prettier is set for all file types
4. **Generated files** - `routeTree.gen.ts` is read-only and excluded from search

## Troubleshooting

### ESLint not working?

1. Verify the ESLint extension is installed and enabled
2. Run `pnpm install` to ensure dependencies are installed
3. Check the ESLint output panel for errors

### Formatting not working on save?

1. Verify Prettier extension is installed
2. Check that `editor.formatOnSave` is `true` in settings
3. Make sure no other formatter is overriding Prettier
