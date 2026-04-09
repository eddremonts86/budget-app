# CRUD Sheet Protocol

## Objetivo

Estandarizar los sheets de creación/edición de CRUDs para mantener consistencia visual, funcional y de mantenimiento entre módulos.

Referencia de diseño base: encabezado de AI Search en [app-sidebar.tsx](file:///Volumes/Works/github/tanstack-template/src/components/app-sidebar.tsx#L339-L369).

## Estructura estándar obligatoria

1. `CrudSheetContent`
   - `showCloseButton={false}`
   - Layout: `flex flex-col p-0`
   - Efecto visual: `border-l border-border/40 backdrop-blur-3xl bg-background/80`
2. `CrudSheetHeader`
   - Título + descripción en una sola fila
   - Ping de conectividad con latencia y estado offline
   - Acción de cierre explícita
   - Slot opcional para acciones adicionales (ej. pin/unpin)
3. `CrudSheetBody`
   - Área scrolleable principal (`overflow-y-auto`)
   - Padding uniforme (`p-6`)
4. Bloques jerárquicos con `CrudSheetSection`
   - Contenedores visuales por sección funcional
   - Separación clara por propósito
5. Botonera final con `CrudSheetActions`
   - Ubicada al fondo
   - Botones en dos columnas ocupando ancho completo
   - Patrón: cancelar + confirmar

## Componentes reutilizables

Implementados en [crud-sheet.tsx](file:///Volumes/Works/github/tanstack-template/src/components/ui/crud-sheet.tsx):

- `CrudSheetContent`
- `CrudSheetHeader`
- `CrudSheetBody`
- `CrudSheetSection`
- `CrudSheetActions`
- `useSheetPing` (interno)

## Auditoría de inconsistencias detectadas

### 1) Estructura de componentes

- Headers con estructuras distintas entre módulos (alineación, tamaños, bordes, jerarquía visual).
- Uso inconsistente de `SheetContent` (anchos distintos, paddings diferentes, blur no homogéneo).
- Botoneras finales con layouts mixtos (`justify-end`, anchos fijos, sin ancho completo).

### 2) Patrones de diseño visual

- Variantes no unificadas de header (algunos con icon card, otros minimalistas).
- Diferencias en tipografía de título/description.
- Diferentes estilos de separación entre header, body y acciones.

### 3) Flujo de usuario

- Cierre por botón explícito no siempre visible/consistente.
- Algunos sheets sin señal visible de conectividad.
- Comportamiento de acciones superiores distinto por módulo.

### 4) Disposición de elementos

- Form blocks sin jerarquía consistente en algunos módulos.
- Contenido con padding y scroll distintos.
- Botones de acción en posiciones y proporciones diferentes.

### 5) Terminología

- Títulos y descripciones con variaciones de tono y longitud.
- Etiquetas de acciones finales no siempre alineadas con patrón global de CRUD.

## Estado de adopción

- **Todos**: Header estandarizado con ping + close y slot de pin/unpin.
- **Teams**: Sheet completo alineado (header, body por secciones, footer estándar).
- **Categories**: Header/body estandarizados.
- **Projects**: Create/Edit headers estandarizados.
- **Transactions**: Create/Edit estandarizados.
- **Users**: Create/Edit estandarizados.

## Reglas de implementación para futuros CRUDs

1. Crear sheet con `CrudSheetContent`.
2. Definir título/description desde i18n.
3. Usar `CrudSheetHeader` con `onClose` explícito.
4. Organizar formulario en `CrudSheetBody` con bloques por `CrudSheetSection`.
5. Finalizar con `CrudSheetActions` y botones full-width.
6. Evitar lógica de estilos ad hoc en cada módulo; usar el protocolo.

## Validación de regresión mínima

1. Abrir/cerrar create y edit sheet en cada CRUD.
2. Verificar ping visible y actualización de estado.
3. Confirmar scroll en body sin romper header/footer.
4. Confirmar botones full-width en footer y callbacks (`onCancel`, `onSubmit`).
5. Ejecutar lint en archivos modificados.
