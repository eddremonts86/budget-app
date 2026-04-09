# Local auth bypass (Playwright / local dev)

## Objetivo

Permitir ejecución local y automatizada sin login manual, manteniendo bloqueo estricto en producción.

## Variables de entorno

- `SKIP_AUTH=true`
- `VITE_SKIP_AUTH=true`
- `TEST_USER_ID=mock_user_id`
- `VITE_TEST_USER_ID=mock_user_id`

Compatibilidad heredada:

- `VITE_E2E=true` (se mantiene soportado)

## Reglas de seguridad implementadas

El bypass solo se activa cuando se cumplen **todas**:

1. Entorno no productivo (`NODE_ENV !== production` en server, `import.meta.env.DEV` en client).
2. Host local (`localhost`, `127.0.0.1` o `::1` en client; host local/implícito en server).
3. Switch explícito de bypass activo (`SKIP_AUTH`/`VITE_SKIP_AUTH` o `VITE_E2E`).

## Archivos clave

- `src/shared/lib/auth/bypass.server.ts`
- `src/shared/lib/auth/bypass.client.ts`
- `src/shared/lib/auth/server.ts`
- `src/modules/dashboard/ui/shell/DashboardLayout.tsx`
- `src/modules/users/context/UserProvider.tsx`

## Activar

Ejemplo manual:

```bash
SKIP_AUTH=true VITE_SKIP_AUTH=true TEST_USER_ID=user_e2e_local VITE_TEST_USER_ID=user_e2e_local pnpm dev:server
```

Playwright lo activa automáticamente desde `playwright.config.ts`.

## Desactivar

No definir `SKIP_AUTH`/`VITE_SKIP_AUTH` (ni `VITE_E2E`) o ponerlos en `false`.

## Verificación rápida

1. Levantar app con bypass activo.
2. Abrir `/dashboard`.
3. Confirmar acceso sin redirección a `/`.
4. Apagar bypass y confirmar que vuelve el flujo normal de autenticación.
