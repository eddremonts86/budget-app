# AI Connection Architecture

This document describes how AI connections (OpenAI, Anthropic, LM Studio) are managed in this application.

## Overview

The application supports three AI providers:
- **OpenAI**: Requires an API Key.
- **Anthropic**: Requires an API Key.
- **LM Studio**: Local agent, usually no authentication required.

## Configuration Store

The configuration is stored in the database (or `db.json` in mock environments) and can be modified via the Settings page.

- **Centralized Fetching**: All server-side AI requests use `getActiveAiConfig()` from `src/shared/lib/ai/server/config-store.ts`.
- **Validation**: Requests are validated using `validateAiConfig()` to ensure base URLs, endpoints, and authentication tokens are present before attempting a connection.

## Server-Side Implementation

### Providers Registry
Providers are registered in `src/shared/lib/ai/server/providers.ts`. Each provider defines how to build its adapter using the `@tanstack/ai` ecosystem.

### API Endpoints
- `/api/ai/chat`: Handles streaming chat completions.
- `/api/ai/search`: Handles non-streaming completions for the global search feature.
- `/api/ai/status`: Probes the active provider to check connectivity.

## Integration in Features

### Help Chat (`/dashboard/help`)
Uses the `useChat` hook from `@tanstack/ai-react` connected to the `/api/ai/chat` endpoint. It automatically uses the system-wide active AI agent.

### Global Search
Integrated into the sidebar, it sends queries to `/api/ai/search`, which uses the active AI agent to generate summaries and navigation targets.

## Error Handling
The API returns structured error codes:
- `CONFIG_INVALID`: The active provider is missing required configuration (e.g., API key).
- `NO_PROVIDER`: No provider could be detected or the active one is unreachable.
- `UNKNOWN_PROVIDER`: The configured provider ID is not registered.
