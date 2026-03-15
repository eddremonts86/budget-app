# Plan De Integracion: Better Auth + Clerk

## Objetivo

Preparar el proyecto para soportar dos modos de autenticacion sin empezar todavia la implementacion:

1. Login local gestionado por Better Auth.
2. Login externo opcional gestionado por Clerk.
3. Una sola capa de autenticacion consumida por la app.
4. Un solo usuario de negocio interno para todos los modulos funcionales.

## Decision Tecnica

La recomendacion para este repo es:

1. Mantener la tabla actual `users` como usuario de negocio interno de la aplicacion.
2. Introducir Better Auth con sus tablas propias de autenticacion, separadas de `users` para evitar colisiones y acoplamiento.
3. Mantener Clerk como proveedor externo opcional, pero fuera del flujo principal de autorizacion interna de la app.
4. Crear una capa propia de `AppAuth` que resuelva un `appUserId` unico independientemente del proveedor de login.

No se recomienda usar directamente el `id` de Clerk como `users.id`, porque ese patron ya existe parcialmente hoy y es justo lo que dificulta soportar multiples proveedores.

## Estado Actual Del Repo

El proyecto esta acoplado a Clerk en varios puntos clave:

1. El provider raiz rompe si no existe `VITE_CLERK_PUBLISHABLE_KEY` en `src/shared/providers/index.tsx`.
2. La proteccion del dashboard dependia de `useAuth()` de Clerk en el layout de dashboard, hoy movido a `src/modules/dashboard/ui/shell/DashboardLayout.tsx`.
3. La sincronizacion del usuario actual dependia de `useUser()` de Clerk en `src/modules/users/context/UserProvider.tsx`.
4. La capa server-side de auth es Clerk-first en `src/shared/lib/auth/server.ts`.
5. La UI publica usaba `SignedIn`, `SignedOut`, `SignInButton` y `UserButton` en la topbar, hoy movida a `src/modules/landing/ui/topbar/Topbar.tsx`.
6. La sidebar del usuario dependia de Clerk en la navegacion de dashboard, hoy ubicada en `src/modules/dashboard/ui/navigation/NavUser.tsx`.
7. El interceptor HTTP intenta extraer el token desde `window.Clerk` en `src/shared/lib/api/interceptors/auth.interceptor.ts`.
8. El error boundary raiz sigue leyendo `useAuth()` y `useUser()` de Clerk en `src/routes/-root-components/RootErrorContent.tsx`.
9. Hay componentes funcionales que leian `useUser()` directamente, por ejemplo `src/modules/ai/components/HelpChatPage.tsx`.
10. Existen puntos donde la autenticacion real aun no esta conectada y hay placeholders, por ejemplo `src/modules/tasks/api/todos.fn.ts`.

Conclusion: antes de implementar Better Auth hay que desacoplar la app de Clerk como dependencia primaria.

## Arquitectura Objetivo

### Capa De Autenticacion

La app consumira una sola abstraccion:

`AppAuthPrincipal`

Campos propuestos:

1. `appUserId: string | null`
2. `authProvider: 'better-auth' | 'clerk' | 'bypass' | 'none'`
3. `authSubjectId: string | null`
4. `role: 'admin' | 'user'`
5. `isAuthenticated: boolean`
6. `isLoaded: boolean`

### Resolucion De Identidad

1. Si existe sesion local valida de Better Auth, se resuelve el usuario de negocio por enlace a Better Auth.
2. Si no existe sesion local, pero existe sesion valida de Clerk, se resuelve el usuario de negocio por identidad externa `clerk`.
3. Si esta activo el bypass de desarrollo o E2E, se devuelve el usuario local de pruebas.
4. Si no hay ninguna sesion valida, la app queda en estado anonimo.

### Regla De Oro

Todas las funcionalidades de negocio seguiran usando `users.id` como id interno canonico. Ningun modulo de negocio debera depender del `user.id` de Better Auth ni del `user.id` de Clerk.

## Diseno De Datos

### Tablas De Better Auth

Para evitar colision con la tabla actual `users`, Better Auth debe usar tablas propias con prefijo `auth_`:

1. `auth_users`
2. `auth_sessions`
3. `auth_accounts`
4. `auth_verifications`

Esto encaja con el adaptador Drizzle y con la posibilidad de mapear nombres de tabla personalizados en Better Auth.

### Tabla Actual `users`

La tabla `users` sigue siendo la entidad de negocio y no debe renombrarse en esta fase.

Cambio recomendado:

1. Agregar columna nullable `auth_user_id`.
2. `auth_user_id` debe ser `unique`.
3. `auth_user_id` debe referenciar `auth_users.id`.

Uso:

1. Usuarios locales creados con Better Auth tendran `users.auth_user_id` poblado.
2. Usuarios que solo entren por Clerk podran seguir existiendo sin `auth_user_id` inicialmente.

### Nueva Tabla `external_identities`

Esta tabla mapea proveedores externos no gestionados por Better Auth directamente dentro del modelo de negocio.

Campos propuestos:

1. `id` PK
2. `user_id` FK a `users.id`
3. `provider` texto, inicialmente solo `clerk`
4. `external_user_id` texto
5. `email` texto nullable
6. `created_at`
7. `updated_at`
8. `last_login_at` nullable

Restricciones propuestas:

1. `unique(provider, external_user_id)`
2. `unique(user_id, provider)`

Uso:

1. Login por Clerk resuelve la sesion Clerk.
2. La app busca `external_identities(provider='clerk', external_user_id=clerkUserId)`.
3. Desde ahi obtiene el `users.id` canonico.

### Alternativa Rechazada

No se recomienda almacenar todos los ids externos directamente en `users` con columnas tipo `clerk_id`, `better_auth_id`, etc. porque escala mal y mezcla identidad con negocio.

## Diseno De Sesiones

### Sesion Local

1. Better Auth gestiona cookie, expiracion y persistencia en `auth_sessions`.
2. El cliente usa `authClient` de Better Auth.
3. El servidor valida la sesion a traves de Better Auth usando headers del request.
4. La app traduce `auth_users.id` a `users.id` por medio de `users.auth_user_id`.

### Sesion Clerk

1. Clerk sigue gestionando su sesion y su cookie propias.
2. La app resuelve el usuario de negocio via `external_identities`.
3. Clerk no sera la fuente primaria de autorizacion de negocio, solo un proveedor externo de identidad.

### Sesion De App

La app nunca debe tomar decisiones de negocio directas usando `clerkUser.id` o `betterAuthUser.id`. Siempre debe convertir eso a `appUserId` primero.

## Modos De Operacion

Se propone soportar tres modos configurables:

1. `local`
2. `clerk`
3. `hybrid`

Variable propuesta:

`VITE_AUTH_MODE=local|clerk|hybrid`

Comportamiento:

1. `local`: se renderiza solo login local con Better Auth.
2. `clerk`: se renderiza solo login Clerk.
3. `hybrid`: se renderizan ambas opciones y la app acepta cualquiera de las dos.

En servidor puede existir tambien:

`AUTH_MODE=local|clerk|hybrid`

## Dependencias Propuestas

Paquetes a introducir en la implementacion:

1. `better-auth`
2. `@better-auth/drizzle-adapter`

No se propone eliminar Clerk en esta fase.

## Variables De Entorno Propuestas

1. `BETTER_AUTH_SECRET`
2. `BETTER_AUTH_URL`
3. `AUTH_MODE`
4. `VITE_AUTH_MODE`
5. `VITE_CLERK_PUBLISHABLE_KEY` opcional si el modo incluye Clerk
6. `CLERK_SECRET_KEY` opcional si el modo incluye Clerk

## Paso 1: Plan De Convivencia Better Auth + Clerk

### Objetivo

Conseguir que Better Auth y Clerk puedan coexistir sin que la app dependa directamente de ninguno como unica fuente de verdad.

### Estrategia

1. Introducir una capa `AppAuth` por encima de ambos proveedores.
2. Mantener Clerk como opcion actual para despliegues que ya lo necesiten.
3. Introducir Better Auth como la solucion para login local y sesiones propias.
4. Hacer que la UI y las server functions consuman `AppAuth`, no Clerk ni Better Auth directamente.

### Regla Operativa

1. Si el modo es `local`, Clerk no debe ser obligatorio para arrancar la app.
2. Si el modo es `hybrid`, ambas opciones de login deben estar disponibles.
3. Si el modo es `clerk`, la app puede mantener el comportamiento actual mientras se completa el refactor.

### Resultado Esperado

1. Un `AuthProvider` propio en cliente.
2. Un `getAppAuth()` unico en servidor.
3. Un `requireAppAuth()` unico para server functions.
4. Componentes y layouts consumiendo el usuario interno de la app.

## Paso 2: Diseno De Tablas Y Sesiones Para Implementacion

### Tablas Nuevas

#### Better Auth

1. `auth_users`
2. `auth_sessions`
3. `auth_accounts`
4. `auth_verifications`

#### Integracion De Identidades Externas

1. `external_identities`

### Cambios En Tablas Existentes

#### `users`

Agregar:

1. `auth_user_id` nullable, unique, FK a `auth_users.id`

### Orden Recomendado De Creacion

1. Crear tablas `auth_*` con Better Auth.
2. Crear `external_identities`.
3. Alterar `users` para agregar `auth_user_id`.
4. Poblar `external_identities` para usuarios Clerk existentes si hiciera falta.
5. En una fase posterior, enlazar usuarios locales con Better Auth al crear cuenta o primer login.

### Estrategia De Sincronizacion

#### Usuarios Locales

1. Better Auth crea `auth_users` y `auth_sessions`.
2. La app crea o enlaza un registro en `users`.
3. Se rellena `users.auth_user_id`.

#### Usuarios Clerk

1. Clerk autentica al usuario.
2. La app resuelve o crea `users`.
3. La app mantiene un registro en `external_identities` con `provider='clerk'`.

## Paso 3: Propuesta De Migracion Por Archivos

### Nuevos Archivos

#### Nucleo Better Auth

1. `src/shared/lib/auth/better-auth.ts`
   Contendra la instancia `auth` de Better Auth con Drizzle adapter y plugin `tanstackStartCookies()`.

2. `src/shared/lib/auth/better-auth-client.ts`
   Contendra `createAuthClient()` para cliente React.

3. `src/shared/lib/auth/app-auth.server.ts`
   Resolvera la identidad efectiva de la app a partir de Better Auth, Clerk o bypass.

4. `src/shared/lib/auth/app-auth.functions.ts`
   Expondra helpers server-side tipo `getSession`, `getAppAuth`, `ensureAppAuth` para TanStack Start.

5. `src/shared/lib/auth/app-auth.client.ts`
   Contendra helpers de cliente y tipos compartidos.

#### Rutas API

6. `src/routes/api/auth/$.ts`
   Handler catch-all recomendado por Better Auth para TanStack Start.

#### Capa UI/Auth

7. `src/shared/lib/auth/app-auth.tsx`
   Provider, contexto y hook propios de autenticacion de la app.

8. `src/modules/auth/ui/AuthPage.tsx`
   Pantalla principal de login con modo local, Clerk o hibrido.

9. `src/modules/auth/ui/components/AuthField.tsx`
   Componente base de campos para la UI auth.

10. `src/modules/auth/ui/components/InsightCard.tsx`
    Componente de apoyo visual para la experiencia de autenticacion.

### Archivos A Modificar

#### Base De Datos

1. `src/shared/lib/db/schema.ts`
   Agregar tablas `auth_*` si se mantienen en el mismo schema Drizzle del repo, agregar `external_identities` y la columna `users.auth_user_id`.

2. `drizzle/*`
   Generar migracion nueva para Better Auth, `external_identities` y cambio en `users`.

#### Providers Raiz

3. `src/shared/providers/index.tsx`
   Hacer Clerk opcional y envolver la app con `AppAuthProvider`.

#### Auth Server-Side

4. `src/shared/lib/auth/server.ts`
   Convertirlo en adaptador o wrapper temporal hacia `app-auth.server.ts`.

5. `src/shared/lib/api/interceptors/auth.interceptor.ts`
   Dejar de depender exclusivamente de `window.Clerk`.

#### Proteccion De Rutas

6. `src/routes/_dashboard.tsx`
   Mover la proteccion auth a `beforeLoad` con server function propia, siguiendo el patron recomendado para TanStack Start.

7. `src/modules/dashboard/ui/shell/DashboardLayout.tsx`
   Eliminar dependencia directa de `useAuth()` de Clerk.

#### Estado De Usuario Actual

8. `src/modules/users/context/UserProvider.tsx`
   Dejar de sincronizar exclusivamente desde `useUser()` de Clerk.

9. `src/modules/users/context/UserContext.tsx`
   Ajustar para depender de `AppAuth` y del usuario de negocio resuelto.

#### UI Publica Y Navegacion

10. `src/modules/landing/ui/topbar/Topbar.tsx`
    Sustituir `SignedIn`, `SignedOut`, `SignInButton`, `UserButton` por wrappers propios controlados por `AppAuth`.

11. `src/modules/dashboard/ui/navigation/NavUser.tsx`
    Sustituir `useUser()` y `useClerk()` por `useAppAuth()` y accion de logout unificada.

12. `src/routes/-root-components/RootErrorContent.tsx`
    Dejar de depender directamente de hooks Clerk.

13. `src/modules/ai/components/HelpChatPage.tsx`
    Sustituir lectura directa de usuario Clerk por la capa `AppAuth` o por `useCurrentUser()` ya resuelto desde `AppAuth`.

#### Tipos Y Funciones De Usuarios

14. `src/modules/users/api/users.fn.ts`
    Añadir funciones auxiliares para resolver usuario por `auth_user_id` o por `external_identities`.

15. `src/modules/users/model/types.ts`
    Extender tipos si se expone metadata de auth en cliente.

#### Server Functions Y Puntos Deuda

16. `src/modules/tasks/api/todos.fn.ts`
    Reemplazar placeholders de usuario fijo por `requireAppAuth()` una vez exista la nueva capa.

### Archivos A Mantener Temporalmente

1. `src/shared/lib/auth/bypass.client.ts`
2. `src/shared/lib/auth/bypass.server.ts`

Se mantienen durante la primera fase para no romper flujos de desarrollo y E2E.

## Fases De Implementacion Recomendadas

### Fase 1

1. Instalar Better Auth.
2. Crear tablas `auth_*` y `external_identities`.
3. Agregar `users.auth_user_id`.
4. Montar handler `/api/auth/$`.

### Fase 2

1. Crear capa `AppAuth` server y client.
2. Hacer opcional el provider de Clerk.
3. Refactorizar proteccion de rutas.

### Fase 3

1. Crear UI de login local.
2. Añadir logout unificado.
3. Refactorizar `Topbar`, `NavUser` y `UserProvider`.

### Fase 4

1. Enlazar usuarios Clerk existentes a `external_identities`.
2. Ajustar auditoria, tests y seeds.
3. Validar modo `local`, `clerk` y `hybrid`.

## Lista De Tareas Operativa

Esta es la secuencia recomendada de trabajo para implementar el plan con el menor riesgo posible.

### Bloque 0: Preparacion

1. Confirmar decision final sobre modo objetivo inicial: `local`, `clerk` o `hybrid`.
2. Confirmar si Better Auth vivira en el schema principal Drizzle actual o en un modulo de schema separado.
3. Confirmar convencion de nombres para tablas Better Auth: se recomienda prefijo `auth_`.
4. Confirmar si la app permitira auto-link por email entre Clerk y Better Auth o si ese linking sera manual.

### Bloque 1: Infraestructura Auth

1. Agregar dependencias `better-auth` y `@better-auth/drizzle-adapter`.
2. Crear `src/shared/lib/auth/better-auth.ts` con adapter Drizzle `pg` y plugin `tanstackStartCookies()`.
3. Crear `src/shared/lib/auth/better-auth-client.ts` con `createAuthClient()`.
4. Definir variables de entorno nuevas y documentarlas en `.env.example`.
5. Crear el handler `src/routes/api/auth/$.ts`.

Dependencia: este bloque debe completarse antes de cualquier UI local de login.

### Bloque 2: Modelo De Datos

1. Añadir tablas `auth_users`, `auth_sessions`, `auth_accounts` y `auth_verifications` al modelo Drizzle o integrarlas desde el esquema generado por Better Auth.
2. Crear tabla `external_identities`.
3. Alterar tabla `users` para agregar `auth_user_id`.
4. Añadir constraints e indices necesarios:
   1. `users.auth_user_id` unique.
   2. `external_identities(provider, external_user_id)` unique.
   3. `external_identities(user_id, provider)` unique.
5. Generar migracion Drizzle.
6. Verificar que el schema generado y el SQL queden alineados.

Dependencia: este bloque debe completarse antes de resolver identidad de negocio desde Better Auth.

### Bloque 3: Capa De Auth De La App

1. Crear `src/shared/lib/auth/app-auth.server.ts`.
2. Crear `src/shared/lib/auth/app-auth.functions.ts` con `getAppAuth()`, `getAppSession()` y `requireAppAuth()`.
3. Crear `src/shared/lib/auth/app-auth.client.ts`.
4. Definir el tipo `AppAuthPrincipal` como contrato unico de la app.
5. Integrar prioridad de resolucion:
   1. bypass
   2. Better Auth
   3. Clerk
   4. anonimo
6. Implementar resolucion de `appUserId` desde `auth_user_id` o `external_identities`.

Dependencia: este bloque debe completarse antes de refactorizar rutas y componentes.

### Bloque 4: Providers Y Proteccion De Rutas

1. Modificar `src/shared/providers/index.tsx` para que Clerk sea opcional.
2. Consolidar `src/shared/lib/auth/app-auth.tsx` como provider, contexto y hook unificados.
3. Mantener `src/shared/providers/index.tsx` envolviendo la app con `AppAuthProvider`.
4. Mover la proteccion de dashboard a la capa de rutas y layout actual.
5. Simplificar `src/modules/dashboard/ui/shell/DashboardLayout.tsx` para que deje de depender de Clerk.

Dependencia: este bloque debe completarse antes de cambiar la UI publica y el menu de usuario.

### Bloque 5: Integracion Con El Usuario De Negocio

1. Refactorizar `src/modules/users/context/UserProvider.tsx` para consumir `AppAuth` y no `useUser()` de Clerk.
2. Ajustar `src/modules/users/context/UserContext.tsx` si hacen falta nuevos flags o metadata.
3. Añadir funciones en `src/modules/users/api/users.fn.ts`:
   1. resolver usuario por `auth_user_id`
   2. resolver usuario por identidad externa Clerk
   3. crear o enlazar usuario local al primer sign-up/sign-in
4. Revisar tipado en `src/modules/users/model/types.ts`.

Dependencia: este bloque debe completarse antes de conectar permisos y acciones de negocio al usuario autenticado real.

### Bloque 6: UI De Login Y Logout

1. Crear pantalla de login propia.
2. Crear formulario local con Better Auth.
3. Añadir botones por modo `local`, `clerk` y `hybrid`.
4. Refactorizar `src/modules/landing/ui/topbar/Topbar.tsx`.
5. Refactorizar `src/modules/dashboard/ui/navigation/NavUser.tsx`.
6. Refactorizar `src/routes/-root-components/RootErrorContent.tsx`.

Dependencia: este bloque debe completarse antes de considerar terminado el cambio de experiencia de usuario.

### Bloque 7: Eliminacion De Acoplamiento Directo A Clerk

1. Revisar y reemplazar imports directos de Clerk en todo `src/`.
2. Refactorizar `src/modules/ai/components/HelpChatPage.tsx`.
3. Refactorizar `src/shared/lib/api/interceptors/auth.interceptor.ts` para soportar modo Better Auth o desactivar la logica de token cuando no aplique.
4. Revisar cualquier otro componente que lea `useUser()`, `useAuth()` o `useClerk()` directamente.

### Bloque 8: Server Functions Y Seguridad

1. Reemplazar placeholders de auth en server functions por `requireAppAuth()`.
2. Arreglar `src/modules/tasks/api/todos.fn.ts`.
3. Revisar otras funciones que hoy asumen usuario hardcodeado o no protegido.
4. Definir politica de errores: `Unauthorized`, redireccion y fallback de UI.

### Bloque 9: Datos, Seeds Y Compatibilidad

1. Ajustar seeds para poblar roles y usuarios compatibles con login local.
2. Ajustar scripts de auditoria si hace falta incluir tablas `auth_*` y `external_identities`.
3. Decidir si se migran o no usuarios Clerk existentes a `external_identities` desde el primer despliegue.
4. Validar que el bypass E2E siga funcionando.

### Bloque 10: Validacion

1. Validar arranque en modo `local` sin variables de Clerk.
2. Validar arranque en modo `clerk` sin Better Auth activo para UI local.
3. Validar arranque en modo `hybrid`.
4. Validar login local, logout local y sesion persistente.
5. Validar login Clerk, logout Clerk y resolucion correcta de `appUserId`.
6. Validar permisos de negocio en Todos, Transactions, AI y Dashboard.
7. Validar `pnpm type-check`.
8. Validar que las migraciones Drizzle queden consistentes.

## Checklist De Aprobacion Antes De Implementar

Antes de empezar el desarrollo, conviene dejar aprobados estos puntos:

1. Se acepta que `users` siga siendo la entidad de negocio canonica.
2. Se acepta introducir tablas `auth_*` separadas de `users`.
3. Se acepta introducir `external_identities` para Clerk.
4. Se acepta que Clerk pase a ser opcional a nivel de provider raiz.
5. Se acepta usar Better Auth como solucion de login local y sesion propia.
6. Se acepta mover la proteccion de rutas hacia `beforeLoad` y server functions propias.

## Criterios De Aceptacion

1. La app arranca en modo `local` sin keys de Clerk.
2. La app arranca en modo `clerk` con el comportamiento esperado actual.
3. En modo `hybrid` se pueden usar ambos flujos de login.
4. Todos los modulos funcionales siguen usando `users.id` como referencia interna.
5. Ningun componente de negocio depende ya directamente de Clerk.
6. `requireAppAuth()` protege rutas y server functions sin conocimiento del proveedor concreto.
7. No quedan imports directos de Clerk fuera de los wrappers o adaptadores permitidos.
8. No quedan ids de proveedor usados como ids de negocio en logica funcional.

## Riesgos Y Mitigaciones

### Riesgo 1

Confusion entre `auth_users.id`, `clerk user id` y `users.id`.

Mitigacion:

1. Introducir el tipo `AppAuthPrincipal` desde el primer commit.
2. Prohibir usar ids de proveedor en logica de negocio.

### Riesgo 2

Que Clerk siga siendo obligatorio por un provider raiz o un hook importado accidentalmente.

Mitigacion:

1. Hacer Clerk opcional en `src/shared/providers/index.tsx`.
2. Reemplazar imports directos de Clerk por wrappers internos.

### Riesgo 3

Duplicar usuarios de negocio al entrar por Better Auth y Clerk.

Mitigacion:

1. Enlazar por email solo con reglas claras y confirmacion si se implementa linking automatico.
2. Mantener `external_identities` como capa de trazabilidad.

## No Se Implementa Todavia

Este documento prepara la implementacion, pero no introduce aun:

1. Dependencias nuevas.
2. Cambios de schema.
3. Nuevas rutas de auth.
4. Refactor de providers o layouts.

## Siguiente Paso Recomendado

Cuando se apruebe este plan, el orden de trabajo deberia ser:

1. Crear schema y migracion de Better Auth mas `external_identities`.
2. Montar Better Auth y el handler `/api/auth/$`.
3. Crear `AppAuth` server/client.
4. Hacer Clerk opcional y refactorizar la UI.
