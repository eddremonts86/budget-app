# AI Language System Architecture

## Overview

This system guarantees that the AI Chat Assistant always responds in the user's Operating System language. It is designed to be immutable, verifiable, and auditable.

## 1. Architecture

### Client-Side (Language Detection)

- **Source**: `navigator.language` (Browser/OS API).
- **Transmission**: Passed as a URL query parameter (`?locale=xx-XX`) to the `/api/ai/chat` endpoint.
- **Resilience**: The locale is determined at the component mount time and persists for the session.

### Server-Side (Enforcement)

- **Endpoint**: `src/routes/api.ai.chat.tsx`
- **Mechanism**:
  1.  **Extraction**: Reads `locale` from request URL.
  2.  **Prompt Construction**: Builds the language-aware system prompt through `src/modules/ai/prompts/chat.ts`.
  3.  **Injection**: Prepends this instruction before provider execution, while contextual data injection is handled through `src/modules/ai/server/chat-messages.ts`.
- **Validation**:
  - A "Language Guard" logic (audit) checks the response metadata (in a real production system, this would analyze the text).
  - For this implementation, we rely on the Strong System Prompt + Logging.

### Audit System

- **Storage**: `src/modules/ai/data/audit-logs.json` and `src/modules/ai/data/ai-settings.json`.
- **Events Logged**: Timestamp, User Locale, Detected Intent, and Response Metadata.

## 2. Implementation Details

### System Prompt Template

```text
You are a helpful, knowledgeable AI assistant.
RULES:
1. LANGUAGE: Always respond in the resolved user language.
2. Answer the user's question directly and concisely.
3. If dashboard context is provided, use it accurately.
```

## 3. Administration

- The system defaults to `navigator.language`.
- Overrides can be implemented via `localStorage` settings if needed (future scope).

## 4. Testing

- **Unit**: Verify prompt construction strings.
- **Integration**: Mock request to chat endpoint with `?locale=fr-FR` and verify prompt contains instructions.

## 5. Current Placement

- Prompt helpers: `src/modules/ai/prompts/chat.ts`
- Route adapter: `src/routes/api.ai.chat.tsx`
- Context injection helpers: `src/modules/ai/server/chat-messages.ts`
