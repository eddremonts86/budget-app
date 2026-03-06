---
name: crud-sheet-standard
description: Estandariza y audita sheets de creación/edición CRUD con el protocolo visual y funcional del proyecto. Usar cuando se creen/refactoricen sheets de Todos, Teams, Categories, Projects, Transactions o Users.
---

# Objetivo

Aplicar un patrón único para todos los sheets CRUD con consistencia visual, de UX y de estructura.

# Protocolo

1. Usar `CrudSheetContent` como contenedor principal.
2. Usar `CrudSheetHeader` con:
   - título
   - descripción
   - ping de conectividad
   - botón close explícito
   - `actionsSlot` opcional (pin/unpin u otras acciones)
3. Usar `CrudSheetBody` para contenido scrolleable.
4. Dividir formulario en bloques jerárquicos con `CrudSheetSection`.
5. Usar `CrudSheetActions` para botonera inferior full-width.

# Reglas de diseño

- Mantener layout `p-0`, blur y borde lateral.
- Mantener header en una sola fila tipo Search Header.
- Mantener separadores visuales entre header/body/footer.
- Evitar estilos ad hoc por módulo cuando el protocolo ya cubre el caso.

# Flujo recomendado

1. Auditar sheet actual y mapear diferencias contra protocolo.
2. Refactorizar estructura del sheet (header/body/footer).
3. Ajustar formularios para botonera final consistente.
4. Verificar interacción de `onClose`, `onCancel`, `onSubmit`.
5. Ejecutar lint en archivos modificados.

# Referencia interna

Consultar [crud-sheet-protocol.md](../../../docs/crud-sheet-protocol.md) para auditoría e implementación.
