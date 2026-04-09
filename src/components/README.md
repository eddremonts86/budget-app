# Components Folder

This folder now separates component concerns by ownership and stability.

## Layout

- `ui/`: reusable low-level primitives and design-system building blocks
- `composite/`: shared higher-level UI that is still app-wide and not owned by a single business module
- `legacy/`: legacy or demo-oriented components that still contain real implementation

## Rules

- New reusable primitives go into `ui/`
- New shared composites go into `composite/`
- Import module-owned components directly from their owning module instead of adding `src/components/*` passthrough files
- Do not move shared infrastructure or shared UI into `src/modules/core/*`
- Do not keep dead compatibility facades that only re-export another component

## Current Exceptions

- `legacy/data-table.tsx` and `legacy/data-table.schema.ts` still contain real legacy implementation
