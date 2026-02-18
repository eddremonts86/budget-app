# Plan Estratégico de Mejora y Escalabilidad: TanStack Template

**Fecha:** 17 de Febrero de 2026
**Estado:** Borrador Inicial
**Objetivo:** Transformar el prototipo actual en una plataforma SaaS empresarial escalable, segura y robusta.

---

## 1. Análisis de Estado Actual

La aplicación actual es una **Single Page Application (SPA)** moderna construida con el ecosistema TanStack, pero opera sobre una arquitectura de prototipo no apta para producción.

### Arquitectura y Tecnologías
*   **Frontend**: React 19, Vite, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS. *Estado: Excelente y moderno.*
*   **Backend**: Inexistente como servicio lógico. Se utiliza `json-server` para simular una API REST y persistencia básica en un archivo JSON.
*   **Base de Datos**: Archivo JSON local (`mocks/db.json`). No hay base de datos relacional ni integridad de datos.
*   **Autenticación**: Integración parcial con Clerk en el frontend, pero sin validación de seguridad en el backend (el token se envía pero no se verifica). Sincronización manual de usuarios propensa a errores.
*   **IA**: Integración avanzada con `@tanstack/ai`, `lmstudio` y `chromadb` para RAG local.

### Puntos Débiles Críticos
1.  **Seguridad Nula en Datos**: Al depender de `json-server` y no validar tokens en el servidor, cualquier usuario puede acceder o modificar datos si conoce los endpoints.
2.  **Escalabilidad Limitada**: `json-server` no soporta concurrencia real ni transacciones complejas.
3.  **Integridad de Datos**: No hay esquema de base de datos que fuerce relaciones (ej: tareas huérfanas si se borra un usuario).
4.  **Funcionalidad Básica**: El módulo de tareas es una lista simple sin capacidades de gestión de proyectos reales.

---

## 2. Sistema de Gestión de Tareas Mejorado

Transformaremos el módulo "Todos" en un **Gestor de Proyectos Profesional**.

### Nuevas Funcionalidades
*   **Vistas Múltiples**:
    *   *Tablero Kanban*: Columnas personalizables (To Do, In Progress, Review, Done) con Drag-and-Drop (usando `@dnd-kit`).
    *   *Calendario Interactivo*: Vista mensual/semanal para deadlines.
    *   *Lista Avanzada*: Tabla con filtros complejos, ordenamiento y agrupación.
*   **Modelo de Datos Extendido**:
    *   **Subtareas**: Estructura recursiva o lista anidada.
    *   **Dependencias**: Relaciones "Bloquea a" / "Bloqueado por".
    *   **Etiquetas/Tags**: Sistema global de categorización.
    *   **Archivos Adjuntos**: Subida de documentos (integración con S3/R2).
*   **Colaboración**:
    *   Comentarios en tareas.
    *   Historial de actividad (Audit Log).
    *   Notificaciones en tiempo real (WebSockets).

---

## 3. Arquitectura Multi-Usuario (Multi-Tenant)

Migración a un modelo SaaS real donde los recursos pertenecen a **Organizaciones**, no solo a usuarios individuales.

### Diseño del Sistema
1.  **Modelo de Datos**:
    *   Todas las tablas principales (`tasks`, `projects`, `tags`) tendrán una columna `organization_id`.
    *   Uso de **Clerk Organizations** para gestionar la pertenencia de usuarios a equipos.
2.  **Autenticación y Seguridad**:
    *   Validación estricta de `organization_id` en cada consulta a base de datos (Row Level Security o Middleware de Aplicación).
    *   Invitaciones por correo via Clerk.
3.  **Gestión de Planes**:
    *   Integración con Stripe.
    *   Límites por plan (ej: "Plan Free: máx 5 usuarios, 100 tareas").

---

## 4. Sistema de Permisos y Roles Granular (RBAC)

Implementación de un control de acceso robusto.

### Definición de Roles
*   **Owner**: Control total de la organización y facturación.
*   **Admin**: Gestión de usuarios y configuración, sin acceso a facturación.
*   **Editor**: Puede crear y editar contenido (tareas, proyectos).
*   **Viewer**: Solo lectura.

### Implementación Técnica
*   **Base de Datos**: Tabla `permissions` y `role_permissions` (o usar metadatos de Clerk).
*   **Frontend**: Componente `<Can I="create" a="Task">` para renderizado condicional.
*   **Backend**: Middleware `requirePermission('create:task')` en Server Functions.

---

## 5. Estructura de Navegación por Acceso

Navegación dinámica basada en el rol del usuario.

*   **TanStack Router Guards**: Uso de `beforeLoad` en las rutas para verificar permisos. Si falla, redirigir a `/403` o `/login`.
*   **Menú Dinámico**: El sidebar filtrará las opciones según los permisos del usuario actual.
*   **Dashboards Personalizados**:
    *   *Admins*: Vista de métricas de equipo y uso.
    *   *Usuarios*: Vista de "Mis Tareas" y "Próximos Vencimientos".

---

## 6. Plan de Responsividad 100%

Estrategia **Mobile-First** utilizando Tailwind CSS.

*   **Breakpoints**:
    *   `sm`: 640px (Móviles grandes)
    *   `md`: 768px (Tablets)
    *   `lg`: 1024px (Laptops)
    *   `xl`: 1280px (Desktops)
*   **Componentes Adaptables**:
    *   Tablas complejas se transforman en tarjetas (Cards) en móvil.
    *   El Sidebar se convierte en Drawer (Sheet) en móvil.
    *   Botones y áreas táctiles de mínimo 44px.
*   **Testing**: Pruebas automatizadas con Playwright en viewports móviles (iPhone, Pixel).

---

## 7. Mejoras de Performance y Escalabilidad

### Infraestructura
*   **Backend Real**: Migrar a **TanStack Start (Server Functions)** o **Node.js (NestJS)**. Recomendamos TanStack Start para mantener el stack unificado.
*   **Base de Datos**: **PostgreSQL** (Neon/Supabase) con **Drizzle ORM**.
*   **Caching**:
    *   *Server*: Redis para datos de sesión y query caching costoso.
    *   *Client*: Optimización de `staleTime` y `gcTime` en TanStack Query.
*   **Assets**: Imágenes optimizadas (WebP) y servidas via CDN.

---

## 8. Roadmap de Implementación

### Fase 1: Cimientos (Mes 1)
*   [ ] Configurar TanStack Start (Server Functions).
*   [ ] Configurar PostgreSQL + Drizzle.
*   [ ] Migrar Auth a validación servidor (Clerk Backend SDK).
*   [ ] Migrar datos de `db.json` a Postgres.

### Fase 2: Core Features (Mes 2)
*   [ ] Implementar modelo Multi-tenant (`organization_id`).
*   [ ] Desarrollar nuevo módulo de Tareas (Subtareas, Dependencias).
*   [ ] Implementar Drag-and-Drop.

### Fase 3: Seguridad y Roles (Mes 3)
*   [ ] Implementar sistema RBAC completo.
*   [ ] Auditoría de seguridad y tests de penetración básicos.

### Fase 4: Optimización y UI (Mes 4)
*   [ ] Refinamiento de UI/UX y Responsividad.
*   [ ] Optimizaciones de performance (LCP, CLS).
*   [ ] Lanzamiento Beta.

---

## 9. Consideraciones de Seguridad

1.  **OWASP Top 10**:
    *   Sanitización de inputs (Zod).
    *   Protección CSRF/XSS (headers de seguridad).
2.  **Datos Sensibles**: Encriptación en reposo (BD) y en tránsito (TLS).
3.  **Backups**: Configurar backups diarios automáticos en PostgreSQL (PITR).
4.  **Compliance**: Auditoría de logs para GDPR.

---

## 10. Métricas y KPIs

Monitorización continua post-lanzamiento.

*   **Técnicas**:
    *   Uptime del servicio (99.9%).
    *   Tiempo de respuesta API (<200ms p95).
    *   Errores 5xx (<0.1%).
*   **Negocio**:
    *   DAU/MAU (Usuarios Activos Diarios/Mensuales).
    *   Conversión de Free a Paid.
    *   Churn Rate.
