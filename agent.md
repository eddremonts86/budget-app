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

La arquitectura sigue un enfoque **Feature-Based**, donde cada funcionalidad principal (Proyectos, Usuarios, Tareas) reside en su propio directorio dentro de `src/features/`, encapsulando su lógica de negocio, componentes y llamadas a API.

---

## 2. Catálogo de Patrones de Diseño (Patterns.dev)

Basado en las recomendaciones de [Patterns.dev](https://www.patterns.dev/), se han identificado los siguientes patrones como fundamentales para este proyecto:

### A. Container/Presentational Pattern

- **Descripción**: Separa la lógica (Container) de la vista (Presentational). Los contenedores manejan datos y estado; los componentes presentacionales solo reciben props y renderizan UI.
- **Justificación**: Facilita la reutilización de componentes UI y simplifica las pruebas unitarias.
- **Implementación**: [ProjectsPage.tsx](file:///Volumes/Works/github/tanstack-template/src/features/Projects/components/ProjectsPage.tsx) actúa como contenedor, delegando el formulario a [ProjectForm.tsx](file:///Volumes/Works/github/tanstack-template/src/features/Projects/components/ProjectForm.tsx).

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
- **Implementación**: [useProjects.ts](file:///Volumes/Works/github/tanstack-template/src/features/Projects/api/projects.queries.ts) encapsula la lógica de fetching y caché.

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

- [ ] **Type Safety**: ¿Todos los datos tienen interfaces definidas? (Ver [model/types.ts](file:///Volumes/Works/github/tanstack-template/src/features/Projects/model/types.ts)).
- [ ] **Separación de Preocupaciones**: ¿La lógica de API está en `*.fn.ts` y las queries en `*.queries.ts`?
- [ ] **Reutilización**: ¿Se han extraído los Hooks comunes a `src/shared/hooks/` o a la carpeta `api/` de la feature?
- [ ] **Clean Code**: ¿Los componentes presentacionales son puros y fáciles de leer?
- [ ] **I18n**: ¿Todos los textos visibles están en los archivos JSON de `locales/`?
- [ ] **Performance**: ¿Se están usando los perfiles de caché adecuados en `useTQuery`?

---

## 5. Plan de Mantenimiento de Clean Code

1. **Revisión de Pares Automática**: Uso de linters (ESLint) y formateadores (Prettier) configurados.
2. **Estructura de Carpetas Estricta**: Prohibido mezclar lógica de diferentes "features" sin pasar por `shared`.
3. **Documentación Proactiva**: Actualizar este archivo `agent.md` cuando se introduzcan nuevos patrones arquitectónicos.
4. **Pruebas Continuas**: Validar flujos críticos con Playwright antes de cada despliegue.
