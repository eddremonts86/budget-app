# PLAN DE IMPLEMENTACIÓN: SISTEMA RAG + CONTEXT INJECTION (ADAPTADO A TANSTACK START)

## Para aplicación React (TanStack Start) + LMStudio (Qwen2.5)

Este plan ha sido adaptado específicamente para el proyecto `tanstack-template`, aprovechando las librerías existentes como `@tanstack/ai`, `@tanstack/react-query` y la estructura de archivos basada en rutas.

### FASE 1: ARQUITECTURA Y SELECCIÓN DE COMPONENTES

#### Tarea 1.1: Selección de Base de Datos Vectorial

**Objetivo:** Almacenar embeddings de documentación y esquema de BD.
**Recomendación:** **ChromaDB** (vía Docker) para desarrollo local robusto.
**Alternativa Ligera:** **Voy** (WASM) si se desea evitar Docker, pero Chroma escala mejor para RAG.

**Integración en TanStack Start:**

- Crear cliente en `src/modules/ai/rag/chroma-client.ts`.
- No requiere microservicio separado; se consume directamente desde las Server Functions o API Routes.

#### Tarea 1.2: Modelo de Embeddings

**Objetivo:** Vectorizar documentación y consultas.
**Recomendación:** **BGE-M3** (Ejecutado en LMStudio o localmente).

- LMStudio permite endpoints de embeddings compatibles con OpenAI.
- Configurar en `src/modules/ai/providers`.

#### Tarea 1.3: Estrategia de Chunking

- **Documentación API:** Un chunk por endpoint.
- **Esquema BD:** Un chunk por tabla (incluyendo columnas y relaciones).
- **Código:** Chunks por función/componente clave.

### FASE 2: INFRAESTRUCTURA Y CONECTIVIDAD

#### Tarea 2.1: Configuración de LMStudio y @tanstack/ai

**Objetivo:** Usar la infraestructura existente de `@tanstack/ai`.

- **Verificar:** `src/modules/ai/providers/lmstudio` debe tener el adaptador para "LM Studio" apuntando a `http://localhost:1234/v1`.
- **Modelo:** Cargar Qwen2.5-Coder en LMStudio.
- **CORS:** Habilitar en LMStudio para permitir peticiones desde `localhost:3000`.

#### Tarea 2.2: Pipeline de Ingesta (ETL)

**Objetivo:** Script automatizado para poblar la DB vectorial.

- **Script:** Crear `scripts/ai/ingest-rag.ts`.
- **Fuentes:**
  - `src/` (Código fuente relevante)
  - `docs/` (Documentación Markdown)
  - `mocks/db.json` (Esquema de datos actual)
- **Comando:** Agregar `"rag:ingest": "tsx scripts/ai/ingest-rag.ts"` al `package.json`.

#### Tarea 2.3: Servicios Backend (Server Functions)

**Objetivo:** Lógica de negocio en el backend de TanStack Start.

- **Retrieval Service (`src/modules/ai/rag/retrieval.ts`):**
  - `retrieveContext(query)`: Consulta ChromaDB.
- **Context Injection Service (`src/modules/ai/rag/context.ts`):**
  - `injectDynamicContext(query)`: Detecta intenciones y consulta `mocks/db.json` (o DB real).
- **Modificación de Ruta API (`src/routes/api.ai.chat.tsx`):**
  - Interceptar POST.
  - Ejecutar Retrieval + Injection.
  - Construir System Prompt enriquecido.
  - Pasar a `chat()` de `@tanstack/ai`.

### FASE 3: IMPLEMENTACIÓN DEL SISTEMA RAG

#### Tarea 3.1: Indexación

- Ejecutar script de ingesta sobre `docs/` y `mocks/db.json`.
- Validar que los embeddings se guarden correctamente en ChromaDB.

#### Tarea 3.2: Motor de Búsqueda Semántica

- Implementar búsqueda en `src/routes/api.ai.search.tsx`.
- Actualmente es un placeholder; conectar con ChromaDB.

#### Tarea 3.3: Optimización de Prompts

- Definir System Prompt en `src/routes/api.ai.chat.tsx`:

  ```typescript
  const systemPrompt = `
  Eres un asistente experto en el proyecto TanStack Template.
  Usa el siguiente contexto técnico para responder:
  ${ragContext}
  
  Datos en tiempo real:
  ${dynamicContext}
  
  Si no sabes la respuesta, dilo.
  `
  ```

### FASE 4: IMPLEMENTACIÓN DE CONTEXT INJECTION

#### Tarea 4.1: Detección de Intenciones

- Implementar lógica simple en `src/modules/ai/rag/context.ts`.
- Ejemplo: Si la query contiene "usuarios" o "estadísticas", consultar DB.

#### Tarea 4.2: Conexión a Datos

- Crear adaptadores para leer de `mocks/db.json` de forma segura.
- Exponer funciones como `getSystemStats()`.
