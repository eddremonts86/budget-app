---
applyTo: src/components/ui/**
---

# 🚫 ZONA DE SOLO LECTURA — Componentes gestionados por shadcn/ui CLI

Los archivos en `src/components/ui/` son instalados y actualizados automáticamente por la CLI de shadcn/ui:

```bash
pnpm dlx shadcn@latest add <component>
```

## PROHIBIDO

- Editar cualquier archivo dentro de `src/components/ui/`
- Añadir lógica, estilos o props directamente a estos componentes
- Crear nuevos archivos manualmente dentro de esta carpeta

## PERMITIDO — Patrón wrapper obligatorio

Crea siempre un wrapper en `src/shared/ui/` o `src/components/composite/`:

```tsx
// src/shared/ui/MiWrapper.tsx  ← aquí va la lógica custom
import { ComponenteDeShadcn } from '@/components/ui/componente-de-shadcn'

export function MiWrapper(props) {
  return (
    <div className="mis-estilos-custom">
      <ComponenteDeShadcn {...props} />
    </div>
  )
}
```

Consulta la skill `shadcn-first` para el catálogo completo de componentes disponibles.
