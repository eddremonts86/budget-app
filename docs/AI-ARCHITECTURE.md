# AI Connection Architecture

Esta guia antigua ahora apunta a la arquitectura consolidada de AI bajo `src/ai`.

## Referencia canonica

La documentacion actualizada vive en `docs/ai/architecture.md`.

## Resumen rapido

- El dominio AI ya no vive en `src/shared/lib/ai/server/*`.
- La configuracion ahora se centraliza en `src/modules/ai/config`.
- Los providers ahora se centralizan en `src/modules/ai/providers`.
- RAG, storage y audit ahora viven en `src/modules/ai/rag`, `src/modules/ai/storage` y `src/modules/ai/audit`.
- Las rutas `src/routes/api.ai.*` consumen ese dominio directamente.

Si necesitas detalles operativos o estructura por provider, usa `docs/ai/architecture.md` y `docs/ai/README.mdx`.
