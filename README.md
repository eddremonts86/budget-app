# TanStack Template

Plantilla full-stack moderna basada en TanStack Start + React 19 + TypeScript, con stack local completo para producto, datos mock, RAG con ChromaDB y asistentes de IA multi-provider.

---

## Tabla de contenido

- [1. Objetivo del proyecto](#1-objetivo-del-proyecto)
- [2. Stack tecnológico](#2-stack-tecnológico)
- [3. Arquitectura del sistema](#3-arquitectura-del-sistema)
- [4. Estructura de carpetas](#4-estructura-de-carpetas)
- [5. Requisitos previos](#5-requisitos-previos)
- [6. Puesta en marcha rápida](#6-puesta-en-marcha-rápida)
- [7. Configuración de entorno](#7-configuración-de-entorno)
- [8. Flujo Docker + IA (recomendado)](#8-flujo-docker--ia-recomendado)
- [9. Flujo local sin Docker (rápido para desarrollo UI)](#9-flujo-local-sin-docker-rápido-para-desarrollo-ui)
- [10. Catálogo completo de comandos](#10-catálogo-completo-de-comandos)
- [11. Sistema de configuración IA multi-provider](#11-sistema-de-configuración-ia-multi-provider)
- [12. Convenciones de código](#12-convenciones-de-código)
- [13. Guía para contribuir](#13-guía-para-contribuir)
- [14. Testing y validación](#14-testing-y-validación)
- [15. Troubleshooting](#15-troubleshooting)
- [16. Documentación adicional](#16-documentación-adicional)

---

## 1. Objetivo del proyecto

Este repositorio sirve como base para aplicaciones web empresariales con:

- Frontend SSR + SPA con TanStack Start y TanStack Router.
- Estado de servidor con TanStack Query y wrappers internos.
- API mock con `json-server` para desarrollo rápido.
- Capa de IA integrada (OpenAI, Anthropic, LM Studio local).
- RAG sobre documentación y datos internos usando ChromaDB.
- Docker Compose para levantar todo el ecosistema con un comando.

---

## 2. Stack tecnológico

### Núcleo

- TanStack Start
- React 19
- TypeScript (strict)
- Vite 7

### TanStack ecosystem

- TanStack Router (file-based routing)
- TanStack Query (con wrappers del proyecto)
- TanStack Form
- TanStack Table
- TanStack Virtual
- TanStack AI (`@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-anthropic`)

### UI / DX

- Tailwind CSS 4
- base-ui / Radix patterns
- Sonner (toasts)
- ESLint + Prettier
- Vitest + Playwright

### IA / Datos

- LM Studio headless (`lmstudio/llmster-preview:cpu`)
- ChromaDB
- `json-server` sobre `mocks/db.json`

---

## 3. Arquitectura del sistema

### 3.1 Visión general

```text
Browser
  -> TanStack App (3000)
      -> API routes /api/ai/*
          -> Active provider (OpenAI | Anthropic | LM Studio)
          -> RAG context (ChromaDB + app knowledge)
      -> Mock API (3001) [json-server / mocks/db.json]
      -> ChromaDB (8000)
      -> LM Studio (1234)
```

### 3.2 Capas lógicas

- **UI Layer**: páginas, componentes, formularios y tablas.
- **Feature Layer**: módulos de dominio (`src/features/*`) con `api/`, `model/`, `ui/`, `hooks/`.
- **Shared Layer**: clientes HTTP, i18n, query wrappers, utilidades transversales.
- **Server Route Layer**: endpoints `src/routes/api.*` para IA y servicios server-only.
- **Data Layer**: mocks JSON + ChromaDB + configuración IA multi-provider.

### 3.3 Arquitectura IA

- Configuración central en `ai-config-store` con:
  - `activeProvider`
  - configuración individual por provider.
- Selección de provider activa en runtime desde el store.
- Rutas principales:
  - `POST /api/ai/search`
  - `POST /api/ai/chat`
  - `POST /api/ai/chat/completions`
  - `GET /api/ai/status`
- Chat streaming vía SSE (Server Sent Events).

### 3.4 Arquitectura de mocks por categorías

Fuentes de verdad por categoría:

- `mocks/ai-config-store.json`
- `mocks/ai-settings.json`
- `mocks/app-knowledge.json`
- `mocks/audit-logs.json`

Consolidación automática:

- Script `scripts/sync-mocks.ts`
- Salida consolidada en `mocks/db.json`
- `pnpm mock` y `pnpm dev:mock` ejecutan sync previo.

---

## 4. Estructura de carpetas

```text
src/
  app/
  components/
  features/
  hooks/
  routes/
  shared/
docs/
  AI-AGENTS.md
  AI-ARCHITECTURE.md
  AI-LANGUAGE-SYSTEM.md
  docker-ai-stack-guide.mdx
mocks/
  ai-config-store.json
  ai-settings.json
  app-knowledge.json
  audit-logs.json
  db.json
scripts/
  sync-mocks.ts
  ai-switch-provider.ts
  bootstrap-lmstudio.sh
  lmstudio-load-model.sh
  lmstudio-status.sh
  lmstudio-enable-cors.sh
  verify-docker-stack.sh
  smoke-ai.sh
  smoke-ai-chat.sh
  reset-docker-stack.sh
```

---

## 5. Requisitos previos

- Node.js 22+
- pnpm 10+
- Docker + Docker Compose

Opcional:

- Cuenta y credenciales para OpenAI/Anthropic
- LM Studio (si quieres usar stack local de modelos)

---

## 6. Puesta en marcha rápida

### Opción A (recomendada): todo con Docker + IA

```bash
pnpm docker:up:full
pnpm docker:check
```

### Opción B: desarrollo local app + mocks

```bash
pnpm install
pnpm dev
```

---

## 7. Configuración de entorno

Variables típicas usadas en local/contenedor:

- `VITE_API_URL`
- `API_URL_INTERNAL`
- `VITE_AI_BASE_URL`
- `VITE_AI_LMSTUDIO_BASE_URL`
- `AI_BASE_URL_INTERNAL`
- `AI_LMSTUDIO_MODEL`
- `LMSTUDIO_IDENTIFIER`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_SENTRY_DSN`

Sugerencia: usar `.env.development` y `.env.docker` según el flujo.

---

## 8. Flujo Docker + IA (recomendado)

Servicios incluidos:

- App: `http://localhost:3000`
- Mock API: `http://localhost:3001`
- ChromaDB: `http://localhost:8000`
- LM Studio: `http://localhost:1234`

Comando principal:

```bash
pnpm docker:up:full
```

Este flujo:

1. Construye y levanta contenedores.
2. Habilita CORS server-side en LM Studio.
3. Bootstrap de modelo en LM Studio.
4. Deja el stack listo para pruebas AI.

---

## 9. Flujo local sin Docker (rápido para desarrollo UI)

```bash
pnpm install
pnpm dev
```

Para usar solo API mock:

```bash
pnpm mock
```

---

## 10. Catálogo completo de comandos

### 10.1 Mocks y providers

| Comando                     | Descripción                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm mocks:sync`           | Sincroniza JSON por categoría a `mocks/db.json`.                                                     |
| `pnpm ai:switch <provider>` | Cambia provider activo (`openai`, `anthropic`, `lm-studio`, `lmstudio`, `lm`) y re-sincroniza mocks. |

### 10.2 Desarrollo

| Comando           | Descripción                                       |
| ----------------- | ------------------------------------------------- |
| `pnpm dev`        | App + mock en paralelo.                           |
| `pnpm dev:all`    | Levanta Docker base (`db:up`) y luego app + mock. |
| `pnpm dev:server` | Solo servidor Vite en puerto 3000.                |
| `pnpm dev:mock`   | Solo `json-server` en puerto 3001.                |
| `pnpm mock`       | Alias de mock server.                             |

### 10.3 Build / calidad

| Comando             | Descripción                          |
| ------------------- | ------------------------------------ |
| `pnpm build`        | Build de producción.                 |
| `pnpm preview`      | Preview del build.                   |
| `pnpm type-check`   | Chequeo TypeScript (`tsc --noEmit`). |
| `pnpm lint`         | ESLint.                              |
| `pnpm lint:fix`     | ESLint con autofix.                  |
| `pnpm format`       | Prettier write.                      |
| `pnpm format:check` | Prettier check.                      |

### 10.4 Testing

| Comando            | Descripción              |
| ------------------ | ------------------------ |
| `pnpm test`        | Unit tests (Vitest run). |
| `pnpm test:unit`   | Unit tests (alias).      |
| `pnpm test:e2e`    | Playwright e2e.          |
| `pnpm test:e2e:ui` | Playwright UI mode.      |
| `pnpm test:visual` | Percy + Playwright.      |

### 10.5 Datos / RAG

| Comando           | Descripción                               |
| ----------------- | ----------------------------------------- |
| `pnpm rag:ingest` | Ingesta de documentos para RAG.           |
| `pnpm db:up`      | `docker compose up -d`.                   |
| `pnpm db:down`    | `docker compose down`.                    |
| `pnpm setup:rag`  | Levanta stack base y ejecuta ingesta RAG. |

### 10.6 Docker stack completo

| Comando                   | Descripción                                   |
| ------------------------- | --------------------------------------------- |
| `pnpm docker:up`          | Levanta stack con build en foreground.        |
| `pnpm docker:up:detached` | Levanta stack con build en background.        |
| `pnpm docker:up:full`     | Stack completo + CORS + bootstrap LM Studio.  |
| `pnpm docker:down`        | Baja stack.                                   |
| `pnpm docker:logs`        | Logs en vivo del compose.                     |
| `pnpm docker:check`       | Verificación de salud de servicios/endpoints. |
| `pnpm docker:reset`       | Reset soft.                                   |
| `pnpm docker:reset:hard`  | Reset hard (elimina volúmenes).               |
| `pnpm docker:verify`      | `docker:check` + smoke AI + smoke chat.       |

### 10.7 Operación LM Studio

| Comando                     | Descripción                                    |
| --------------------------- | ---------------------------------------------- |
| `pnpm docker:ai:cors`       | Reinicia server LM Studio con CORS habilitado. |
| `pnpm docker:ai:init`       | Bootstrap de modelo(s) en LM Studio.           |
| `pnpm docker:ai:status`     | Estado de servicio y modelos LM Studio.        |
| `pnpm docker:ai:load`       | Descarga/carga de modelo específico.           |
| `pnpm docker:ai:smoke`      | Smoke de estado + búsqueda AI.                 |
| `pnpm docker:ai:smoke:chat` | Smoke SSE de chat AI.                          |

---

## 11. Sistema de configuración IA multi-provider

### 11.1 Cómo funciona

- `ai-config-store` guarda simultáneamente la configuración de todos los providers.
- `activeProvider` define cuál usa el backend para chat/search/status.
- Cambiar provider no borra settings de los demás.

### 11.2 Cambiar provider rápido

```bash
pnpm ai:switch openai
pnpm ai:switch anthropic
pnpm ai:switch lmstudio
```

### 11.3 Estado esperado por provider

- OpenAI sin key: error de configuración (faltan credenciales).
- Anthropic sin key: `auth_required` o `MISSING_API_KEY`.
- LM Studio levantado y con modelo: `available`.

---

## 12. Convenciones de código

- TypeScript estricto, evitando `any`.
- Módulos por feature con límites claros (`api/`, `model/`, `ui/`, `hooks/`).
- Exponer APIs públicas vía `index.ts` de cada feature.
- Usar wrappers de query del proyecto, no `useQuery`/`useMutation` crudos donde haya wrappers definidos.
- Strings de UI vía i18n siempre que aplique.
- Mantener cambios pequeños, focalizados y consistentes con estilo existente.

---

## 13. Guía para contribuir

### 13.1 Flujo recomendado

1. Sincroniza rama y dependencias.
2. Ejecuta `pnpm mocks:sync`.
3. Implementa cambios en feature correspondiente.
4. Valida localmente (`type-check`, `lint`, tests relevantes).
5. Si tocas IA o Docker, corre `pnpm docker:verify`.
6. Actualiza docs si cambia comportamiento o comandos.

### 13.2 Checklist pre-PR

- [ ] `pnpm type-check` en verde
- [ ] `pnpm lint` en verde
- [ ] tests relevantes en verde
- [ ] mocks sincronizados
- [ ] docs actualizadas (README/docs)

### 13.3 Qué evitar

- Mezclar refactors grandes con fixes críticos.
- Cambiar APIs públicas sin actualizar consumidores.
- Hardcodear secretos o endpoints productivos.

---

## 14. Testing y validación

Validación mínima recomendada por tipo de cambio:

- UI: `pnpm dev` + test unitario/e2e focalizado.
- Data/API: `pnpm type-check` + `pnpm test:unit`.
- IA/provider: `pnpm docker:ai:smoke` + `pnpm docker:ai:smoke:chat`.
- Infra Docker: `pnpm docker:check` o `pnpm docker:verify`.

---

## 15. Troubleshooting

### `ai-config-store` no refleja cambios

- Ejecuta `pnpm mocks:sync`.
- Reinicia mock: `pnpm dev:mock` o `pnpm mock`.

### LM Studio no responde

- `pnpm docker:ai:status`
- `pnpm docker:ai:init`
- `pnpm docker:ai:cors`

### App o mock caídos

- `pnpm docker:check`
- `pnpm docker:logs`
- Reset soft: `pnpm docker:reset`
- Reset hard: `pnpm docker:reset:hard`

### Errores de imports/paquetes en contenedor

- Rebuild completo: `pnpm docker:up:detached`
- Si persiste: reset hard y volver a levantar.

---

## 16. Documentación adicional

- `docs/AI-ARCHITECTURE.md`
- `docs/AI-AGENTS.md`
- `docs/AI-LANGUAGE-SYSTEM.md`
- `docs/docker-ai-stack-guide.mdx`
- `mocks/README.md`

---

## Estado actual recomendado para trabajar

1. Levantar stack completo:

```bash
pnpm docker:up:full
```

1. Verificar salud:

```bash
pnpm docker:check
```

1. Elegir provider activo:

```bash
pnpm ai:switch lmstudio
```

1. Validar IA:

```bash
pnpm docker:ai:smoke
pnpm docker:ai:smoke:chat
```

Con esto tendrás entorno reproducible, datos mock consistentes y pipeline IA listo para desarrollar y contribuir.
