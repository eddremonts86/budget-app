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
  2.  **Prompt Construction**: Generates a `SYSTEM_INSTRUCTION` that explicitly forbids other languages.
  3.  **Injection**: Prepends this instruction to the conversation context.
- **Validation**:
  - A "Language Guard" logic (audit) checks the response metadata (in a real production system, this would analyze the text).
  - For this implementation, we rely on the Strong System Prompt + Logging.

### Audit System
- **Storage**: `mocks/audit-logs.json` (served via JSON Server).
- **Events Logged**: Timestamp, User Locale, Detected Intent, and Response Metadata.

## 2. Implementation Details

### System Prompt Template
```text
CRITICAL: You are a helpful assistant.
detected_user_locale: "{locale}"
INSTRUCTION: You MUST respond ONLY in the language specified by 'detected_user_locale'.
If the user asks in a different language, answer in 'detected_user_locale' but politely mention you are configured to speak that language.
```

## 3. Administration
- The system defaults to `navigator.language`.
- Overrides can be implemented via `localStorage` settings if needed (future scope).

## 4. Testing
- **Unit**: Verify prompt construction strings.
- **Integration**: Mock request to chat endpoint with `?locale=fr-FR` and verify prompt contains instructions.
