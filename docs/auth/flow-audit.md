# Auditoría Completa: Flujo de Login Local (Better Auth) y Clerk

> Fecha: 2026-03-16  
> Alcance: Revisión exhaustiva del flujo de autenticación dual (Better Auth + Clerk), redirecciones post-login, sincronización de usuario de negocio, y protección de rutas.

---

## Tabla de Contenido

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Actual del Flujo](#2-arquitectura-actual-del-flujo)
3. [Flujo Detallado: Login Local (Better Auth)](#3-flujo-detallado-login-local-better-auth)
4. [Flujo Detallado: Login con Clerk](#4-flujo-detallado-login-con-clerk)
5. [Flujo de Bypass (Dev/E2E)](#5-flujo-de-bypass-deve2e)
6. [Protección de Rutas y Redirecciones](#6-protección-de-rutas-y-redirecciones)
7. [Sincronización de Usuario de Negocio](#7-sincronización-de-usuario-de-negocio)
8. [Errores y Problemas Encontrados](#8-errores-y-problemas-encontrados)
9. [Riesgos Futuros](#9-riesgos-futuros)
10. [Plan de Acción](#10-plan-de-acción)

---

## 1. Resumen Ejecutivo

El sistema tiene tres modos de autenticación controlados por `AUTH_MODE` / `VITE_AUTH_MODE`:

| Modo     | Better Auth (local) | Clerk (externo) |
| -------- | ------------------- | --------------- |
| `local`  | ✅ Activo           | ❌ Inactivo     |
| `clerk`  | ❌ Inactivo         | ✅ Activo       |
| `hybrid` | ✅ Activo           | ✅ Activo       |

**Default actual: `clerk`** (en `config.ts` línea de DEFAULT_AUTH_MODE).

La capa de abstracción `AppAuth` unifica ambos proveedores bajo una sola interfaz consumida por toda la app.

### Veredicto General

La arquitectura es sólida conceptualmente pero tiene **14 problemas concretos** que van desde bugs activos hasta riesgos de regresión. Los más críticos son:

- El modo `clerk` (que es el default) importa incondicionalmente el módulo de Clerk en `server.ts`, lo que crasheará sin `CLERK_SECRET_KEY`.
- Clerk `SignInButton mode="modal"` no tiene redirect post-login configurado; tras cerrar el modal el usuario queda en `/auth` sin navegar a `/dashboard`.
- El `_dashboard/route.tsx` llama `ensureAppAuthSession()` en `beforeLoad`, lo cual ejecuta una importación dinámica de `server.ts` que SIEMPRE importa `@clerk/tanstack-react-start/server` — incluso en modo `local`.
- La `DashboardLayout` tiene un doble-guard redundante con `throw redirect` que usa una ruta diferente (`/` vs `/auth`) a la de `beforeLoad`.

---

## 2. Arquitectura Actual del Flujo

### Archivos Clave

| Archivo                                              | Responsabilidad                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/shared/lib/auth/config.ts`                      | Lee `AUTH_MODE` y expone helpers (`isBetterAuthEnabled`, `isClerkEnabled`)        |
| `src/shared/lib/auth/better-auth.ts`                 | Instancia de Better Auth con Drizzle adapter                                      |
| `src/shared/lib/auth/better-auth-client.ts`          | Cliente de Better Auth para el browser                                            |
| `src/shared/lib/auth/app-auth.tsx`                   | Contexto React `AppAuthProvider` + hook `useAppAuth()`                            |
| `src/shared/lib/auth/app-auth.functions.ts`          | Server functions: `getAppAuthSession`, `ensureAppAuthSession`                     |
| `src/shared/lib/auth/server.ts`                      | Resolución server-side: `getAuthUser`, `requireAuthUser`                          |
| `src/shared/lib/auth/form-actions.server.ts`         | Helpers para form POST: `performBetterAuthJsonRequest`, `redirectWithAuthCookies` |
| `src/shared/lib/auth/sign-up-validation.ts`          | Validación de signup                                                              |
| `src/shared/lib/auth/bypass.server.ts`               | Bypass server-side                                                                |
| `src/shared/lib/auth/bypass.client.ts`               | Bypass client-side                                                                |
| `src/shared/providers/index.tsx`                     | `AppProviders` con `ClerkProvider` condicional                                    |
| `src/routes/auth/route.tsx`                          | Renderiza `AuthPage`                                                              |
| `src/routes/auth/sign-in.tsx`                        | POST handler para login local                                                     |
| `src/routes/auth/sign-up.tsx`                        | POST handler para signup local                                                    |
| `src/routes/api/auth/$.ts`                           | Catch-all para Better Auth API endpoints                                          |
| `src/routes/_dashboard/route.tsx`                    | Guard con `ensureAppAuthSession` en `beforeLoad`                                  |
| `src/modules/auth/ui/AuthPage.tsx`                   | UI de login/signup + Clerk SignInButton                                           |
| `src/modules/users/context/UserProvider.tsx`         | Sync de auth user → business user                                                 |
| `src/modules/dashboard/ui/shell/DashboardLayout.tsx` | Layout del dashboard con doble-guard                                              |
| `src/modules/dashboard/ui/navigation/NavUser.tsx`    | User menu con sign-out                                                            |
| `src/modules/landing/ui/topbar/Topbar.tsx`           | Topbar con auth link y sign-out                                                   |

### Cadena de Providers

```
ClerkProvider (si clerk enabled + key presente)
  └── I18nProvider
       └── ThemeProvider
            └── QueryProvider
                 └── AppAuthProvider    ← unifica auth
                      └── TooltipProvider + Toaster
                           └── [Rutas]
                                └── _dashboard/route → beforeLoad guard
                                     └── DashboardLayout → doble-guard
                                          └── UserProvider → sync business user
```

---

## 3. Flujo Detallado: Login Local (Better Auth)

### Precondiciones

- `AUTH_MODE=local` o `AUTH_MODE=hybrid`
- Base de datos Postgres con tablas `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`
- `BETTER_AUTH_URL` apuntando al server (default `http://localhost:3000`)
- `BETTER_AUTH_SECRET` definido

### Flujo Sign-Up

```
1. Usuario llega a /auth?tab=sign-up
2. Completa formulario HTML nativo (name, email, password)
3. <form action="/auth/sign-up" method="post"> envía POST
4. Server handler en sign-up.tsx:
   a. Lee formData
   b. Valida con validateSignUpPayload() (nombre no vacío, password ≥8 chars + letters+numbers+symbol)
   c. Si validación falla → redirect a /auth?tab=sign-up&errorCode=...
   d. Si pasa → performBetterAuthJsonRequest({ endpointPath: '/api/auth/sign-up/email', payload, request })
   e. Better Auth crea auth_user + auth_session + auth_account
   f. Si ok → redirectWithAuthCookies({ to: '/dashboard' }) con cookie de sesión
   g. Si falla → redirect a /auth?tab=sign-up con error code/message
5. Browser sigue redirect 303 a /dashboard
6. _dashboard/route.tsx beforeLoad llama ensureAppAuthSession()
7. ensureAppAuthSession lee cookie → Better Auth valida sesión → ok
8. Dashboard se renderiza
9. DashboardLayout verifica auth.isAuthenticated (doble-guard)
10. UserProvider sync:
    a. useAppAuth() devuelve provider='better-auth', user={id, email, name}
    b. Llama syncAuthenticatedUserFn() que:
       - Busca users.authUserId = auth_users.id
       - O busca users.email = auth.email
       - Crea o actualiza users + enlaza authUserId
```

### Flujo Sign-In

```
1. Usuario llega a /auth (tab default: sign-in)
2. Completa email + password
3. <form action="/auth/sign-in" method="post"> envía POST
4. Server handler en sign-in.tsx:
   a. Lee formData
   b. performBetterAuthJsonRequest({ endpointPath: '/api/auth/sign-in/email', payload, request })
   c. Better Auth valida credenciales → crea sesión
   d. Si ok → redirectWithAuthCookies({ to: '/dashboard' })
   e. Si falla → redirect a /auth con error
5. Idéntico a sign-up desde paso 5 en adelante
```

### Flujo Sign-Out (Local)

```
1. Usuario hace click en "Log out" (NavUser o Topbar)
2. auth.signOut() ejecuta:
   a. authClient.signOut() → Better Auth invalida sesión server-side
   b. redirectToHomeAfterSignOut() → window.location.replace('/')
3. Browser navega a / (landing)
4. AppAuth recarga → betterAuth.data = null → isAuthenticated = false
```

---

## 4. Flujo Detallado: Login con Clerk

### Precondiciones

- `AUTH_MODE=clerk` o `AUTH_MODE=hybrid`
- `VITE_CLERK_PUBLISHABLE_KEY` definido
- `CLERK_SECRET_KEY` definido (para server-side)

### Flujo Sign-In via Clerk

```
1. Usuario llega a /auth
2. Ve la card de Clerk con "Sign in with Clerk" button
3. <SignInButton mode="modal"> abre modal de Clerk
4. Usuario completa auth en modal de Clerk (email/social/etc)
5. Clerk establece sesión via cookies
6. Modal se cierra
7. ⚠️ PROBLEMA: No hay redirect configurado. El usuario queda en /auth.
8. AuthPage tiene un useEffect que detecta auth.isAuthenticated:
   a. Si auth.isLoaded && auth.isAuthenticated → verifyServerSession()
   b. verifyServerSession() llama ensureAppAuthSession() (con hasta 4 reintentos, 150-600ms delay)
   c. Si server confirma → navigate({ to: '/dashboard' })
   d. Si falla → setRuntimeFormError('session verification error')
9. Si llega a /dashboard:
   a. beforeLoad → ensureAppAuthSession() → server.ts → clerkAuth() valida
   b. DashboardLayout doble-guard
   c. UserProvider sync con provider='clerk'
```

### Flujo Sign-Out (Clerk)

```
1. auth.signOut() ejecuta:
   a. clerk.signOut() → Clerk invalida sesión
   b. redirectToHomeAfterSignOut() → window.location.replace('/')
```

---

## 5. Flujo de Bypass (Dev/E2E)

```
1. Variables: SKIP_AUTH=true + VITE_SKIP_AUTH=true (o VITE_E2E=true)
2. Condiciones: NODE_ENV !== 'production' + localhost
3. Client: isClientAuthBypassEnabled() → true
4. Server: isServerAuthBypassEnabled() → true
5. AppAuth: provider='bypass', isAuthenticated=true, canSignOut=false
6. Server: getAuthUser() devuelve mock admin user
7. UserProvider: detecta bypass → crea usuario mock local sin sync
8. Dashboard accesible sin login real
```

---

## 6. Protección de Rutas y Redirecciones

### Guard Primario: `_dashboard/route.tsx` (beforeLoad)

```typescript
beforeLoad: async () => {
  try {
    await ensureAppAuthSession() // server function
  } catch {
    throw redirect({
      to: isBetterAuthEnabled() ? '/auth' : '/',
    })
  }
}
```

**Análisis:**

- Ejecuta en server antes de renderizar
- `ensureAppAuthSession` → server fn → `requireAuthUser()` → getAuthUser()
- Si no hay sesión → redirect a `/auth` (si better-auth activo) o `/` (si solo clerk)

### Guard Secundario: `DashboardLayout` (component-level)

```typescript
if (!isAuthBypassEnabled && auth.isLoaded && !auth.isAuthenticated) {
  throw redirect({ to: '/' })
}
```

**Análisis:**

- Es un guard REDUNDANTE a nivel de componente
- Redirige SIEMPRE a `/` (no a `/auth`)
- Nunca debería ejecutarse si `beforeLoad` funciona correctamente
- Usa `throw redirect` dentro de un render, lo cual es un patrón atípico

### Redirect Post-Login

| Escenario                               | Destino                           | Mecanismo                              |
| --------------------------------------- | --------------------------------- | -------------------------------------- |
| Sign-in local exitoso                   | `/dashboard`                      | HTTP 303 redirect con cookies          |
| Sign-up local exitoso                   | `/dashboard`                      | HTTP 303 redirect con cookies          |
| Sign-in Clerk exitoso                   | `/dashboard`                      | `useEffect` → `navigate()` en AuthPage |
| Sign-in local falla                     | `/auth?errorCode=...`             | HTTP 303 redirect                      |
| Sign-up local falla                     | `/auth?tab=sign-up&errorCode=...` | HTTP 303 redirect                      |
| Intento de acceder a dashboard sin auth | `/auth` o `/`                     | `beforeLoad` redirect                  |

---

## 7. Sincronización de Usuario de Negocio

### Tabla Relación

```
auth_users (Better Auth) ──1:1──→ users.authUserId
users ──1:N──→ external_identities (Clerk y otros)
```

### Flujo de `syncAuthenticatedUserFn`

**Para Better Auth (`provider === 'better-auth'`):**

1. Busca `users` donde `authUserId = providerUserId`
2. Si no → busca por `email`
3. Si existe → UPDATE (name, email, avatar, authUserId)
4. Si no existe → INSERT nuevo user con `roleId = 'role_user'`

**Para Clerk (`provider !== 'better-auth'`):**

1. Busca `external_identities` por `(provider, externalUserId)`
2. Si existe → busca `users` por `identity.userId`
3. Si no → busca `users` por `email`
4. Si existe → UPDATE user
5. Si no → INSERT nuevo user
6. Upsert en `external_identities`

### Observaciones

- No hay transacciones DB explícitas — race conditions posibles si el mismo usuario hace login concurrente
- El `syncedUser` del UserProvider NO tiene `roleName` del rol de la tabla `roles`, solo tiene el `roleId`
- El sync se dispara por `useEffect` — si `auth` cambia rápido, `lastSyncedIdentity.current` previene duplicados

---

## 8. Errores y Problemas Encontrados

### P01 — CRÍTICO: `server.ts` importa Clerk incondicionalmente

**Archivo:** `src/shared/lib/auth/server.ts:1`

```typescript
import { auth as clerkAuth } from '@clerk/tanstack-react-start/server'
```

Este import es top-level y se ejecuta SIEMPRE, incluso cuando `AUTH_MODE=local`. Si `CLERK_SECRET_KEY` no está definido, Clerk puede lanzar errores en tiempo de carga del módulo server-side.

**Impacto:** En modo `local` sin keys de Clerk, cualquier llamada a `getAuthUser()` puede crashear.

**Fix:** Hacer import dinámico de Clerk solo cuando `isClerkEnabled()`:

```typescript
if (isClerkEnabled()) {
  const { auth: clerkAuth } = await import('@clerk/tanstack-react-start/server')
  const user = await clerkAuth()
  // ...
}
```

---

### P02 — CRÍTICO: Clerk SignInButton sin redirect post-auth

**Archivo:** `src/modules/auth/ui/AuthPage.tsx:459`

```tsx
<SignInButton mode="modal">
```

No se pasa `forceRedirectUrl` ni `afterSignInUrl`. Tras completar el login en el modal, el usuario queda en `/auth` y depende enteramente del `useEffect` de la línea 114 para navegarlo a `/dashboard`.

**Problema:** Si la sesión tarda en propagarse (hidratación), el effect puede fallar o mostrar un error temporal "session verification error" antes de poder navegar.

**Fix:** Añadir `forceRedirectUrl="/dashboard"` o `afterSignInUrl="/dashboard"`:

```tsx
<SignInButton mode="modal" forceRedirectUrl="/dashboard">
```

---

### P03 — ALTO: Doble-guard en DashboardLayout con redirect inconsistente

**Archivo:** `src/modules/dashboard/ui/shell/DashboardLayout.tsx:39-42`

```typescript
if (!isAuthBypassEnabled && auth.isLoaded && !auth.isAuthenticated) {
  throw redirect({ to: '/' }) // ← redirige a landing
}
```

Mientras que `_dashboard/route.tsx` redirige a `/auth` si better auth está activo. Esto crea inconsistencia: si por alguna razón el `beforeLoad` no captura al usuario (edge case de hidratación), el component-level guard manda a `/` en vez de `/auth`.

**Además:** Usar `throw redirect()` dentro de un render de componente es un antipatrón en TanStack Router. El redirect debería ocurrir solo en `beforeLoad` o `loader`.

**Fix:** Eliminar el doble-guard del component o unificarlo con el `beforeLoad`.

---

### P04 — ALTO: `app-auth.functions.ts` usa import dinámico @vite-ignore

**Archivo:** `src/shared/lib/auth/app-auth.functions.ts:5-6`

```typescript
async function loadServerAuthModule() {
  const modulePath = './server'
  return await import(/* @vite-ignore */ modulePath)
}
```

Este import dinámico con variable NO se analiza estáticamente por Vite. Esto impide:

- Tree-shaking correcto
- Errores de tipo en compilación (el import devuelve `any`)
- Pre-bundling correcto en producción

**Impacto:** Si el path cambia o el módulo no se incluye en el bundle final, falla silenciosamente en runtime.

**Fix:** Usar import directo, o al menos una referencia estática para que Vite pueda analizarla:

```typescript
import { getAuthUser, requireAuthUser } from './server'
```

Nota: Si se hizo así para evitar cargar Clerk en el cliente, la solución correcta es asegurar que `server.ts` solo se ejecute en el server via la configuración de TanStack Start, no con `@vite-ignore`.

---

### P05 — ALTO: `verifyServerSession` retry loop con timing frágil

**Archivo:** `src/modules/auth/ui/AuthPage.tsx:103-113`

```typescript
const verifyServerSession = React.useCallback(async () => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await ensureAppAuthSession()
      return
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => window.setTimeout(resolve, 150 * (attempt + 1)))
    }
  }
}, [])
```

Este retry loop existe porque tras Clerk sign-in modal, la sesión puede no estar lista inmediatamente en el server. Pero:

- Depende de tiempos arbitrarios (150ms, 300ms, 450ms, 600ms)
- En conexiones lentas o servers fríos, 4 intentos (~1.5s total) puede no ser suficiente
- Si falla, muestra "session verification error" que confunde al usuario
- No hay backoff exponencial real

**Fix:** Mejor usar un polling con timeout máximo, o esperar al evento de Clerk `session.created` antes de verificar.

---

### P06 — MEDIO: AuthPage puede quedar en loop si hay sesión pero sync falla

**Archivo:** `src/modules/auth/ui/AuthPage.tsx:115-132`

```typescript
React.useEffect(() => {
  if (!auth.isLoaded || !auth.isAuthenticated) return
  // ...
  void (async () => {
    try {
      await verifyServerSession()
      if (!cancelled) void navigate({ to: '/dashboard' })
    } catch {
      if (!cancelled) setRuntimeFormError(t('auth.sessionVerificationError'))
    }
  })()
}, [auth.isAuthenticated, auth.isLoaded, navigate, t, verifyServerSession])
```

Si el usuario ya está autenticado (ej: abrió `/auth` estando logueado), este effect intenta verificar y navegar. Pero:

- Si la verificación server falla repetidamente (DB down, etc), queda el error infinitamente
- No hay botón para reintentar ni forma de limpiar el estado
- Si el usuario navega a `/auth` estando logueado (bookmark, link directo), debería ser redirigido inmediatamente sin verificación

**Fix:** Añadir una verificación rápida (sin retry) y redirect inmediato si ya hay sesión válida.

---

### P07 — MEDIO: `DEFAULT_AUTH_MODE` es `clerk` pero `.env.example` también tiene `AUTH_MODE=clerk`

**Archivo:** `src/shared/lib/auth/config.ts:3`

```typescript
const DEFAULT_AUTH_MODE: AuthMode = 'clerk'
```

Si alguien clona el repo sin `.env`, el default es `clerk`. Pero sin `VITE_CLERK_PUBLISHABLE_KEY` ni `CLERK_SECRET_KEY`, Clerk no funciona. El sistema debería fallar de forma más clara o el default debería ser `local`.

**El `console.warn` en `providers/index.tsx` es pasivo** — no aparece en la consola de forma prominente y la app queda en estado incoherente (modo clerk sin clerk runtime).

**Fix:** Cambiar `DEFAULT_AUTH_MODE` a `local` o agregar un error explícito si `AUTH_MODE=clerk` sin keys.

---

### P08 — MEDIO: `_dashboard/route.tsx` redirect a `/` en modo clerk-only no lleva al login

**Archivo:** `src/routes/_dashboard/route.tsx`

```typescript
throw redirect({
  to: isBetterAuthEnabled() ? '/auth' : '/',
})
```

En modo `clerk`, si el usuario intenta acceder a `/dashboard` sin sesión, es redirigido a `/` (landing). Pero la landing no tiene un Clerk sign-in prominente — solo un link "Access workspace" hacia `/auth`. Sería mejor redirigir siempre a `/auth`.

**Fix:**

```typescript
throw redirect({ to: '/auth' })
```

Siempre, independientemente del modo. `/auth` ya maneja ambos modos.

---

### P09 — MEDIO: `syncAuthenticatedUserFn` sin transacción DB

**Archivo:** `src/modules/users/api/users.fn.ts:497-660`

Las operaciones de sync (SELECT → UPDATE/INSERT) no están en una transacción. Si dos requests concurrentes llegan para el mismo usuario:

- Ambos pueden hacer SELECT y encontrar que no existe
- Ambos intentan INSERT → uno falla con unique constraint error
- El error se propaga con `throw error` → el UserProvider lo atrapa y pone `lastSyncedIdentity.current = null`, causando un re-intento

**Fix:** Envolver en `db.transaction()` o usar `INSERT ... ON CONFLICT ... DO UPDATE`.

---

### P10 — MEDIO: AuthPage navega con `navigate()` pero sign-in/sign-up local usa form POST con redirect

**La inconsistencia:**

- **Login local:** `<form method="post" action="/auth/sign-in">` → server redirect 303 → browser navega (full page)
- **Login Clerk:** Modal → useEffect → `navigate({ to: '/dashboard' })` → client-side navigation (SPA)

Esto significa:

- Tras login local, la app se rehidrata completamente (full page load) — más lento pero más confiable
- Tras login Clerk, es una navigation SPA — más rápido pero puede tener estado stale

**No es un bug**, pero genera UX inconsistente y puede causar problemas si el AppAuthProvider no se actualiza correctamente tras una SPA navigation.

---

### P11 — BAJO: Sign-out redirige con `window.location.replace('/')` en lugar de router navigation

**Archivo:** `src/shared/lib/auth/app-auth.tsx:63-67`

```typescript
function redirectToHomeAfterSignOut() {
  if (typeof window === 'undefined') return
  window.location.replace('/')
}
```

Esto causa un full page reload al hacer logout, lo cual es lento pero predecible. Si se requiere UX más fluido, debería usar `router.navigate()`. Sin embargo, el full reload garantiza que todo estado de autenticación se limpia, lo cual es correcto para seguridad.

**Veredicto:** Aceptable. Dejarlo como está.

---

### P12 — BAJO: Hardcoded strings en `NavUser.tsx`

**Archivo:** `src/modules/dashboard/ui/navigation/NavUser.tsx:93-108`

```typescript
Account
Billing
Notifications
Log out
```

Estos strings no usan i18n. Debería usarse `t('...')`.

---

### P13 — BAJO: `UserProvider` sync catch silencia todos los errores

**Archivo:** `src/modules/users/context/UserProvider.tsx:76-78`

```typescript
} catch {
  lastSyncedIdentity.current = null
  // Ignore sync failures; auth state can still render unauthenticated UI.
```

Si sync falla (DB down, network error), el error se ignora silenciosamente. El usuario queda autenticado en auth pero sin business user sincronizado. Esto puede causar funcionalidades rotas downstream que esperan un `syncedUser`.

**Fix:** Al menos loguear el error y/o mostrar un toast al usuario.

---

### P14 — BAJO: Archivos residuales en `src/routes/-auth-components/`

**Archivos:**

- `src/routes/-auth-components/auth-field.tsx`
- `src/routes/-auth-components/insight-card.tsx`

Estos parecen ser versiones antiguas de los componentes que ahora viven en `src/modules/auth/ui/components/`. Verificar si están en uso o eliminarlos.

---

## 9. Riesgos Futuros

### R01 — Clerk SDK Breaking Changes

- Versión actual: `@clerk/tanstack-react-start@^0.29.1`
- Esta versión es `0.x` (pre-1.0), lo que significa que minor versions pueden tener breaking changes
- `SignInButton` API puede cambiar entre versiones

### R02 — Better Auth Session Expiry

- No hay lógica de refresh de sesión ni detección de sesión expirada en el cliente
- Si la sesión expira mientras el usuario está en el dashboard, la siguiente server function falla con "Unauthorized" y no hay handling graceful

### R03 — Modo Hybrid no está testeado en E2E

- Los tests E2E solo cubren `AUTH_MODE=local` (con bypass para la mayoría, y tests específicos de auth local)
- No hay tests para modo `clerk` ni `hybrid`
- Un cambio en la lógica de resolución de `buildAppAuthValue()` podría romper el modo hybrid sin ser detectado

### R04 — Race Condition en AuthPage useEffect

- Si `auth.isAuthenticated` cambia varias veces durante hidratación (false → true → recheck → true), el effect puede dispararse múltiples veces
- El flag `cancelled` mitiga pero no elimina el riesgo

### R05 — Business User sin Role

- Usuarios nuevos se crean con `roleId: 'role_user'`
- Si `role_user` no existe en la tabla `roles`, el INSERT falla con FK constraint error
- No hay seed automático que garantice la existencia de este role

---

## 10. Plan de Acción

### Fase 1 — Fixes Críticos (P01, P02)

| #   | Acción                                                  | Archivo                            | Esfuerzo |
| --- | ------------------------------------------------------- | ---------------------------------- | -------- |
| 1   | Hacer import dinámico de Clerk en `server.ts`           | `src/shared/lib/auth/server.ts`    | Bajo     |
| 2   | Añadir `forceRedirectUrl="/dashboard"` a `SignInButton` | `src/modules/auth/ui/AuthPage.tsx` | Bajo     |

### Fase 2 — Fixes Altos (P03, P04, P05)

| #   | Acción                                                            | Archivo                                              | Esfuerzo |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| 3   | Eliminar doble-guard en DashboardLayout o unificar redirect       | `src/modules/dashboard/ui/shell/DashboardLayout.tsx` | Bajo     |
| 4   | Reemplazar `@vite-ignore` por import estático en server functions | `src/shared/lib/auth/app-auth.functions.ts`          | Medio    |
| 5   | Mejorar retry loop o usar polling con timeout                     | `src/modules/auth/ui/AuthPage.tsx`                   | Medio    |

### Fase 3 — Fixes Medios (P06-P10)

| #   | Acción                                                                    | Archivo                                                          | Esfuerzo |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| 6   | Redirect inmediato si usuario ya autenticado llega a `/auth`              | `src/modules/auth/ui/AuthPage.tsx` o `src/routes/auth/route.tsx` | Bajo     |
| 7   | Cambiar `DEFAULT_AUTH_MODE` a `local` o hacer fail-fast si clerk sin keys | `src/shared/lib/auth/config.ts`                                  | Bajo     |
| 8   | Unificar redirect unauthenticated siempre a `/auth`                       | `src/routes/_dashboard/route.tsx`                                | Bajo     |
| 9   | Envolver sync en transacción o usar `ON CONFLICT`                         | `src/modules/users/api/users.fn.ts`                              | Medio    |
| 10  | Normalizar UX post-login (considerar client-side submit para local auth)  | Diseño                                                           | Alto     |

### Fase 4 — Cleanup (P12-P14)

| #   | Acción                                              | Archivo                        | Esfuerzo |
| --- | --------------------------------------------------- | ------------------------------ | -------- |
| 11  | Internacionalizar strings de NavUser                | `NavUser.tsx`                  | Bajo     |
| 12  | Loguear errores de sync en UserProvider             | `UserProvider.tsx`             | Bajo     |
| 13  | Eliminar archivos residuales en `-auth-components/` | `src/routes/-auth-components/` | Bajo     |

### Fase 5 — Tests y Prevención (R01-R05)

| #   | Acción                                                             | Esfuerzo |
| --- | ------------------------------------------------------------------ | -------- |
| 14  | Añadir E2E test para modo Clerk (al menos smoke test)              | Alto     |
| 15  | Añadir E2E test para modo Hybrid                                   | Alto     |
| 16  | Implementar session refresh / expired session detection            | Medio    |
| 17  | Verificar que `role_user` existe como seed obligatorio             | Bajo     |
| 18  | Pinear versión de `@clerk/tanstack-react-start` a minor específico | Bajo     |

---

## Apéndice: Diagrama de Flujo Completo

```
┌──────────────────────────────────────────────────────────────────┐
│                         LANDING (/)                              │
│                                                                  │
│  [Access Workspace] ──────────────────────────────→ /auth        │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        AUTH PAGE (/auth)                         │
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐ │
│  │   LOCAL AUTH CARD       │  │   CLERK CARD                   │ │
│  │                         │  │                                │ │
│  │ [Sign In] [Sign Up]     │  │ [Sign in with Clerk] (modal)   │ │
│  │                         │  │                                │ │
│  │ form POST /auth/sign-in │  │ Clerk SDK handles auth         │ │
│  │ form POST /auth/sign-up │  │                                │ │
│  └──────────┬──────────────┘  └──────────────┬─────────────────┘ │
│             │                                │                   │
│   Server validates                 Modal completes               │
│   Better Auth handles              Clerk sets cookies            │
│   Sets session cookie              useEffect detects             │
│   HTTP 303 redirect                auth.isAuthenticated          │
│             │                      verifyServerSession()         │
│             │                      navigate('/dashboard')        │
│             │                                │                   │
└─────────────┼────────────────────────────────┼───────────────────┘
              │                                │
              └───────────────┬────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              DASHBOARD GUARD (_dashboard/route.tsx)               │
│                                                                  │
│  beforeLoad:                                                     │
│    ensureAppAuthSession()  ──→  server.ts:getAuthUser()         │
│      │                                                           │
│      ├─ bypass? → mock admin user ✅                             │
│      ├─ better-auth session? → auth_sessions lookup ✅           │
│      ├─ clerk session? → clerk.auth() ✅                         │
│      └─ none → throw redirect('/auth' or '/')  ❌               │
│                                                                  │
│  Si ✅:                                                          │
│    DashboardLayout renders                                       │
│    └── UserProvider                                              │
│         └── syncAuthenticatedUserFn()                            │
│              └── users table ← auth user synced                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
