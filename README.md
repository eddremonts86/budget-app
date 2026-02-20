# TanStack Template (SaaS Boilerplate)

## Requisitos Previos

- **Node.js**: v20+
- **pnpm**: v9+
- **Docker Desktop**: Requerido para la base de datos PostgreSQL local.

## Configuración Inicial (Database)

Este proyecto utiliza PostgreSQL y Drizzle ORM. Para comenzar:

1.  **Iniciar Base de Datos**:
    ```bash
    pnpm db:up
    ```
    *Asegúrate de que Docker Desktop esté corriendo antes de ejecutar este comando.*

2.  **Sincronizar Esquema**:
    ```bash
    pnpm db:push
    ```

3.  **Cargar Datos de Ejemplo (Seed)**:
    ```bash
    pnpm db:seed
    ```
    *Esto migrará los datos desde `mocks/db.json` a tu base de datos local.*

## Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo y el servidor mock (json-server).
- `pnpm db:up`: Levanta el contenedor de PostgreSQL.
- `pnpm db:down`: Detiene y elimina los contenedores.
- `pnpm db:generate`: Genera migraciones SQL con Drizzle Kit.
- `pnpm db:seed`: Ejecuta el script de seed.

---

## 17. Gestión de Proyectos y Tareas
...
