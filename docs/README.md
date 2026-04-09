# Documentation

## AI

Everything related to the multi-provider AI system (Llama.cpp, Ollama, LM Studio, OpenAI, Anthropic).

- [Architecture](ai/architecture.md) — provider layout, domain structure
- [Agents](ai/agents.md) — agent configurations for IDE tools
- [Setup](ai/setup.md) — provider setup and bootstrap commands
- [Language system](ai/language-system.md) — OS locale detection, prompt construction
- [Docker + AI stack](ai/docker-stack-guide.mdx) — Docker operations guide
- [RAG implementation plan](ai/implementation-plan.md) — ChromaDB, embeddings, context injection
- [Reorganization plan](ai/reorganization-plan.mdx) — consolidation into `src/modules/ai/`

## Architecture

Application structure, module conventions, and UI protocols.

- [Modular architecture plan](architecture/modular-architecture-plan.md) — routes → modules → shared layering
- [Module ownership audit](architecture/module-ownership-audit.md) — folder ownership rules per module
- [CRUD sheet protocol](architecture/crud-sheet-protocol.md) — standard for CRUD sheet UI components

## Auth

Dual authentication system (Better Auth + Clerk).

- [Better Auth + Clerk plan](auth/better-auth-clerk-plan.md) — integration architecture and migration steps
- [Flow audit](auth/flow-audit.md) — login flow audit across local/Clerk/hybrid modes

## Modules

Feature-specific implementation plans.

- [Budget module plan](modules/budget-module-plan.mdx) — DB schema, AI integration, multi-scope budgets

## Planning

High-level strategic documents.

- [Strategic plan](planning/strategic-plan.md) — roadmap from SPA prototype to enterprise SaaS

## Testing

E2E testing infrastructure, auth bypass, and route inventories.

- [Fixes report](testing/fixes-report.md) — changelog of testing infrastructure fixes
- [Local auth bypass](testing/local-auth-bypass.md) — bypass mechanism for Playwright/dev
- [MCP automation](testing/mcp-automation.yaml) — workflow definitions for route discovery and test generation
- [Routes inventory](testing/routes-inventory.yaml) — all UI and API routes with metadata
