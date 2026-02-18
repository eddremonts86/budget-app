
---

## 17. Gestión de Proyectos y Tareas

El sistema incluye un módulo completo de gestión de proyectos y tareas con las siguientes características:

### 17.1 Funcionalidades
- **Proyectos**: CRUD completo de proyectos con estados (Activo, Completado, En espera).
- **Tareas**: Asignación obligatoria de tareas a proyectos.
- **Validaciones**:
  - No se pueden crear tareas sin proyecto.
  - No se pueden eliminar proyectos que tengan tareas asociadas.
  - Solo se pueden asignar tareas a proyectos activos.

### 17.2 Modelo de Datos
Las tareas (`Todo`) ahora incluyen una referencia obligatoria `projectId`.

```typescript
interface Todo {
  // ...
  projectId: string // Obligatorio
  // ...
}
```

### 17.3 Migración de Datos
Para actualizar datos existentes (asignar proyectos aleatoriamente a tareas huérfanas y renombrar tareas de ejemplo), ejecutar:

```bash
npx tsx scripts/migrate-todos.ts
```

Este script:
1. Asigna todas las tareas existentes a los 5 proyectos base de manera equitativa.
2. Renombra tareas genéricas ("Tarea de ejemplo...") a nombres realistas de desarrollo de software.
3. Genera un reporte de distribución.
