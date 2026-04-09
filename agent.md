# Agent.md - Guía de Arquitectura y Patrones de Diseño

Este documento sirve como referencia técnica para el proyecto **TanStack Template**, detallando su arquitectura, los patrones de diseño aplicados y los estándares de calidad requeridos.

## 1. Descripción Técnica del Proyecto

El proyecto es una plantilla full-stack moderna diseñada para aplicaciones empresariales escalables. Utiliza un stack tecnológico de vanguardia:

- **Frontend**: React 18 con TypeScript, Vite como bundler.
- **Routing & State**: TanStack Router para navegación tipo-segura y TanStack Query para la gestión del estado del servidor.
- **Backend**: TanStack Start (Server Functions) integradas directamente con el frontend.
- **Base de Datos**: PostgreSQL gestionado a través de Drizzle ORM.
- **UI/UX**: Tailwind CSS con componentes de shadcn/ui y Radix UI, siguiendo principios de accesibilidad y diseño responsivo.
- **Internacionalización**: i18next con soporte para múltiples idiomas (ES, EN, DK).

La arquitectura sigue un enfoque **Module-Based**, donde cada capacidad principal (Proyectos, Usuarios, Tareas, AI, Auth) reside en su propio directorio dentro de `src/modules/`, encapsulando su lógica de negocio, UI y runtime.

---

## 2. Catálogo de Patrones de Diseño (Patterns.dev)

Basado en las recomendaciones de [Patterns.dev](https://www.patterns.dev/), se han identificado los siguientes patrones como fundamentales para este proyecto:

### A. Container/Presentational Pattern

- **Descripción**: Separa la lógica (Container) de la vista (Presentational). Los contenedores manejan datos y estado; los componentes presentacionales solo reciben props y renderizan UI.
- **Justificación**: Facilita la reutilización de componentes UI y simplifica las pruebas unitarias.
- **Implementación**: la UI y lógica de proyectos viven en `src/modules/projects/*`, con páginas y componentes definidos dentro del módulo dueño.

### B. Higher-Order Components (HOC)

- **Descripción**: Funciones que reciben un componente y devuelven un nuevo componente con funcionalidades extendidas.
- **Justificación**: Ideal para lógica transversal como autenticación o logging.
- **Implementación**: Utilizado indirectamente en wrappers de TanStack para inyectar capacidades de consulta.

### C. Compound Components Pattern

- **Descripción**: Componentes que trabajan juntos para realizar una tarea, compartiendo estado implícito (normalmente vía Context).
- **Justificación**: Proporciona una API de componentes más limpia y flexible.
- **Implementación**: [Combobox.tsx](file:///Volumes/Works/github/tanstack-template/src/components/ui/combobox.tsx) y otros componentes de shadcn/ui.

### D. Hooks Pattern

- **Descripción**: Encapsulación de lógica de estado y efectos en funciones reutilizables.
- **Justificación**: Reemplaza patrones antiguos como Render Props y HOCs para lógica de negocio, mejorando la legibilidad.
- **Implementación**: los hooks de datos viven dentro del módulo dueño, por ejemplo en `src/modules/projects/api/*`.

### E. Provider Pattern

- **Descripción**: Utiliza React Context para pasar datos a través del árbol de componentes sin "prop drilling".
- **Justificación**: Esencial para temas (Themes), autenticación (Clerk) e internacionalización (i18next).
- **Implementación**: [UserProvider.tsx](file:///Volumes/Works/github/tanstack-template/src/shared/providers/UserProvider.tsx).

---

## 3. Guía de Implementación por Patrón

| Patrón        | Cuándo usar                                                         | Ejemplo en el Proyecto                                                     |
| :------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------- |
| **Hooks**     | Siempre que haya lógica de estado o efectos reutilizables.          | `useCreateProject()` en `projects.queries.ts`.                             |
| **Compound**  | Para componentes complejos como Tabs, Selects o Modales.            | Estructura `<Sheet><SheetTrigger>...</Sheet>` en `CreateProjectSheet.tsx`. |
| **Provider**  | Para datos globales (Usuario, Configuración).                       | `ClerkProvider` en el layout principal.                                    |
| **Container** | En páginas de características para separar fetching de renderizado. | `TodosPage.tsx` manejando la query y pasando datos a `TodoList.tsx`.       |

---

## 4. Checklist de Validación de Calidad

Para cada nueva funcionalidad o refactorización, verificar:

- [ ] **Type Safety**: ¿Todos los datos tienen interfaces definidas dentro del módulo dueño?
- [ ] **Separación de Preocupaciones**: ¿La lógica de API está en `*.fn.ts` y las queries en `*.queries.ts`?
- [ ] **Reutilización**: ¿Se han extraído los Hooks comunes a `src/shared/hooks/` o a la carpeta `api/` de la feature?
- [ ] **Clean Code**: ¿Los componentes presentacionales son puros y fáciles de leer?
- [ ] **I18n**: ¿Todos los textos visibles están en los archivos JSON de `locales/`?
- [ ] **Performance**: ¿Se están usando los perfiles de caché adecuados en `useTQuery`?

---

## 5. Plan de Mantenimiento de Clean Code

1. **Revisión de Pares Automática**: Uso de linters (ESLint) y formateadores (Prettier) configurados.
2. **Estructura de Carpetas Estricta**: Prohibido mezclar lógica de diferentes módulos sin pasar por `shared` o por un módulo explícitamente compartido.
3. **Documentación Proactiva**: Actualizar este archivo `agent.md` cuando se introduzcan nuevos patrones arquitectónicos.
4. **Pruebas Continuas**: Validar flujos críticos con Playwright antes de cada despliegue.

---

## 6. Skills y Agentes de IA

Las skills viven en `.github/skills/vendor/` y están divididas en dos categorías:

- **`app/`** — Skills propias del proyecto. Contienen código real, rutas reales, patrones de producción de este repo.
- **`vendor/` (raíz)** — Skills de terceros instaladas vía `skills-lock.json`. Conocimiento genérico del ecosistema.

---

### App Skills — `.github/skills/app/` ★ CARGAR PRIMERO

> Creadas para este proyecto. Tienen `references/` con código fuente real.
> **Regla**: Si el dominio coincide, leer el SKILL.md ANTES de generar cualquier código.

| Skill                 | Ruta                                              | Cuándo usarla                                               |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `module-architecture` | `.github/skills/app/module-architecture/SKILL.md` | Crear/mover módulos, manifests, registry, barrels, routing  |
| `feature-crud`        | `.github/skills/app/feature-crud/SKILL.md`        | CRUDs nuevos/existentes, CrudSheet Protocol, TanStack Form  |
| `ai-providers`        | `.github/skills/app/ai-providers/SKILL.md`        | Módulo AI, proveedores, streaming, config-store, RAG, audit |
| `auth-dual-provider`  | `.github/skills/app/auth-dual-provider/SKILL.md`  | Auth (Clerk + Better Auth), rutas protegidas, bypass dev    |
| `drizzle-db`          | `.github/skills/app/drizzle-db/SKILL.md`          | Schema DB, migraciones, queries Drizzle, seed scripts       |
| `i18n-deep`           | `.github/skills/app/i18n-deep/SKILL.md`           | Traducciones (ES/EN/DK), namespaces, claves i18n            |
| `e2e-testing-auth`    | `.github/skills/app/e2e-testing-auth/SKILL.md`    | Tests Playwright, auth bypass E2E, fixtures, CI             |
| `docker-ai-stack`     | `.github/skills/app/docker-ai-stack/SKILL.md`     | Docker Compose, AI local (llama-cpp/Ollama), modelos GGUF   |

---

### Third-Party Skills — `.github/skills/vendor/` (raíz)

> Instaladas vía `skills-lock.json`. Conocimiento del ecosistema, no específico de este repo.
> Combinar con las App Skills cuando aplica (ej: `e2e-testing-auth` + `playwright-skill`).

| Skill                                 | Dominio                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| `tanstack-router-best-practices`      | Routing type-safe, loaders, search params                   |
| `tanstack-query-best-practices`       | Server state, cache, mutations, keys                        |
| `tanstack-start-best-practices`       | Server functions, SSR, middleware                           |
| `tanstack-integration-best-practices` | Integración Router + Query + Start                          |
| `shadcn-ui` / `shadcn`                | Componentes Shadcn/Radix, formularios, temas                |
| `typescript-advanced-types`           | Tipos genéricos, condicionales, mapped types                |
| `react-doctor`                        | Diagnóstico post-cambio: score 0-100, security, performance |
| `frontend-design`                     | UI de alta calidad, producción, sin estética genérica AI    |
| `playwright-skill`                    | Automatización completa de browser, screenshots, forms      |
| `clerk-setup` / `clerk-orgs`          | Configuración Clerk, multi-tenant, RBAC                     |
| `vercel-react-best-practices`         | Performance React/Next.js desde Vercel Engineering          |
| `web-design-guidelines`               | Revisión accesibilidad, UX, best practices                  |
| `code-simplifier`                     | Refactorizar, limpiar, mejorar legibilidad                  |

### Agentes Configurados

Agentes especializados en el proyecto (ver `.github/agents/` y `docs/ai/agents.md`):

#### 1. Feature Creator Agent

**Propósito**: Generar estructura completa de módulos de feature.

- Carga automáticamente: `module-architecture` + `feature-crud` + `i18n-deep`
- Genera: manifest.ts, model/, api/, components/, index.ts, traducciones EN/ES/DK

**Prompt de sistema**:

```
You are an expert TypeScript/React developer on a TanStack Start project.
When creating a feature module, load and follow:
1. .github/skills/app/module-architecture/SKILL.md — module structure and ownership rules
2. .github/skills/app/feature-crud/SKILL.md — CRUD + CrudSheet Protocol
3. .github/skills/app/i18n-deep/SKILL.md — add all text to EN/ES/DK locales

Generate the complete structure: manifest.ts, model/types.ts, model/schema.ts,
api/*.fn.ts, api/*.queries.ts, components/*, index.ts (barrel).
Register the manifest in src/modules/core/registry.ts.
Never hardcode UI strings — use i18n keys.
```

#### 2. Component Generator Agent

**Propósito**: Crear componentes UI siguiendo los patrones del proyecto.

- Carga automáticamente: `feature-crud` + `shadcn-ui` + `i18n-deep`

**Prompt de sistema**:

```
You are a React UI developer on a TanStack Start project.
Load .github/skills/app/feature-crud/SKILL.md for CrudSheet Protocol.
Rules:
- Functional components, named exports only
- Props interface above component
- cn() for conditional Tailwind classes
- useTranslation() for ALL user-facing text (no hardcoded strings)
- Follow CrudSheet Protocol for create/edit sheets
- Use animate-in, fade-in for transitions
```

#### 3. Query Builder Agent

**Propósito**: Crear TanStack Query hooks con los wrappers del proyecto.

- Carga automáticamente: `tanstack-query-best-practices` + `feature-crud`

**Prompt de sistema**:

```
You are a data fetching specialist on a TanStack Start project.
Load .github/skills/app/feature-crud/SKILL.md for query key patterns.
Always use:
- useTQuery / useTQMutation / useTQSuspense from @/shared/lib/query
- Cache profiles: 'realtime' | 'standard' | 'stable' | 'static'
- entityKeys factory for all query keys
- invalidateKeys on every mutation
- successMessage with i18n keys (not raw strings)
```

#### 4. AI Integration Agent

**Propósito**: Integrar o modificar el sistema multi-proveedor de IA.

- Carga automáticamente: `ai-providers` + `docker-ai-stack`

**Prompt de sistema**:

```
You are an AI systems engineer on a TanStack Start project.
Load .github/skills/app/ai-providers/SKILL.md FIRST.
The project supports 5 providers: llama-cpp, ollama, lm-studio, openai, anthropic.
Provider code lives in src/modules/ai/providers/<name>/.
Config resolution order: ia-config → env vars → config-store session.
API routes are thin adapters consuming src/modules/ai/server/* helpers.
Never expose server-only code (file-store, audit) to the client bundle.
```

#### 5. Auth & Security Agent

**Propósito**: Implementar auth, proteger rutas, gestionar sesiones.

- Carga automáticamente: `auth-dual-provider` + `drizzle-db`

**Prompt de sistema**:

```
You are a security-focused engineer on a TanStack Start project.
Load .github/skills/app/auth-dual-provider/SKILL.md FIRST.
Auth modes: local (Better Auth only) | clerk (Clerk only) | hybrid (both).
Always use useAppAuth() — never raw Clerk/Better Auth hooks.
Gate signOut on auth.canSignOut (false in bypass mode).
Server-side: requireAuthUser() or ensureAppAuthSession() for protected endpoints.
Never enable SKIP_AUTH/VITE_SKIP_AUTH in production.
```

#### 6. Database Agent

**Propósito**: Diseñar schema, generar migraciones, escribir queries Drizzle.

- Carga automáticamente: `drizzle-db`

**Prompt de sistema**:

```
You are a database engineer on a TanStack Start project with Drizzle ORM + PostgreSQL.
Load .github/skills/app/drizzle-db/SKILL.md FIRST.
Schema source of truth: src/shared/lib/db/schema.ts (single file).
Always use text('id').primaryKey() with crypto.randomUUID() — never serial.
Generate migrations with: pnpm drizzle-kit generate && pnpm drizzle-kit migrate
Never write raw SQL migrations manually.
Set explicit onDelete/onUpdate on all foreign keys.
```

#### 7. E2E Test Agent

**Propósito**: Escribir y mantener tests Playwright con auth.

- Carga automáticamente: `e2e-testing-auth` + `playwright-skill`

**Prompt de sistema**:

```
You are an E2E testing engineer on a TanStack Start project using Playwright.
Load .github/skills/app/e2e-testing-auth/SKILL.md FIRST.
Tests run across 3 locales (en/es/dk) × multiple browsers.
For auth: use bypass (SKIP_AUTH=true) or provisionAccount() utility.
All selectors must use data-testid attributes (not text or CSS).
Assertions must be locale-independent (regex, role, testid).
```

#### 8. React Doctor Agent (Post-cambio)

**Propósito**: Diagnóstico de calidad después de cualquier cambio React.

- Ejecutar siempre después de terminar una feature o fix

```bash
npx -y react-doctor@latest . --verbose --diff
```

Fix errores primero, luego re-ejecutar hasta conseguir score aceptable.

### Cuándo cargar qué skill

```
Crear nuevo módulo           → module-architecture + feature-crud + i18n-deep
Agregar CRUD a módulo        → feature-crud + drizzle-db + i18n-deep
Modificar AI providers       → ai-providers + docker-ai-stack
Trabajo de auth/sesiones     → auth-dual-provider
Cambiar DB schema            → drizzle-db
Agregar traducciones         → i18n-deep
Escribir tests E2E           → e2e-testing-auth + playwright-skill
Levantar stack Docker        → docker-ai-stack
Review de UI/accesibilidad   → web-design-guidelines + react-doctor
```
