# Configuración de Inteligencia Artificial (Multi-Plataforma)

Este proyecto soporta múltiples proveedores de IA con un sistema de fallback automático y gestión de modelos locales.

## Proveedores Soportados

El sistema intenta conectar con los proveedores en el siguiente orden de prioridad:

1.  **Llama.cpp** (Local, Alta eficiencia) - _Por defecto_
2.  **Ollama** (Local, Fácil uso)
3.  **LM Studio** (Local, Interfaz gráfica)
4.  **OpenAI** (Remoto, Requiere API Key)
5.  **Anthropic** (Remoto, Requiere API Key)

## Requisitos Previos

- **Docker Desktop** instalado y ejecutándose.
- **Recursos del Sistema**: Se recomiendan al menos 8GB de RAM para ejecutar modelos locales (Llama 3.2 1B/3B).

## Instalación y Puesta en Marcha

El sistema incluye scripts automatizados para descargar y configurar los modelos necesarios.

### 1. Inicialización Automática

Para levantar todo el sistema con configuración automática de IA:

```bash
pnpm docker:up:full
```

Este comando realizará las siguientes acciones:

1.  Descargará el modelo GGUF para **Llama.cpp** (Llama-3.2-1B-Instruct).
2.  Iniciará los contenedores de Docker (App, DB, Ollama, Llama.cpp).
3.  Descargará el modelo para **Ollama** (llama3.2).
4.  Verificará la salud de los servicios.

### 2. Verificación de Estado

Puede verificar el estado de los servicios de IA en la interfaz web:

- Vaya a **Configuración > Inteligencia Artificial**.
- El sistema mostrará el proveedor activo y el estado de conexión.

## Gestión Manual de Modelos

### Llama.cpp

El modelo se descarga en `./.docker_data/llm-models/llama-cpp/llama-3.2-1b-instruct-q4_k_m.gguf`.
Si desea cambiar el modelo:

1.  Detenga el servicio: `docker compose stop llama-cpp`
2.  Reemplace el archivo `.gguf` en `./.docker_data/llm-models/llama-cpp/`.
3.  Actualice el comando en `docker-compose.yml` si el nombre del archivo cambia.
4.  Reinicie: `docker compose up -d llama-cpp`

### Ollama

Puede gestionar modelos de Ollama mediante CLI:

```bash
docker exec -it tanstack-template-ollama ollama pull mistral
```

Luego actualice la configuración en la interfaz web para usar el nuevo modelo.

### LM Studio

En Docker, LM Studio persiste modelos en `./.docker_data/llm-models/lmstudio`.

### Almacenamiento unificado de modelos

Los proveedores locales ahora comparten la raíz `./.docker_data/llm-models/`:

- `llama-cpp` → `./.docker_data/llm-models/llama-cpp`
- `ollama` → `./.docker_data/llm-models/ollama`
- `lmstudio` → `./.docker_data/llm-models/lmstudio`

Esto centraliza persistencia en un único volumen lógico y evita descargas repetidas al reiniciar el stack.

> Nota: cada runtime mantiene su propio formato interno de caché/modelos, por lo que no todos los archivos son deduplicables byte a byte entre proveedores.

## Solución de Problemas

- **El servicio no inicia**: Verifique que Docker tenga asignados suficientes recursos (RAM/CPU).
- **Error de descarga**: Si la descarga automática falla, puede descargar manualmente el modelo GGUF y colocarlo en la carpeta `.docker_data/llm-models/llama-cpp`.
- **Puertos ocupados**: Asegúrese de que los puertos 8080 (Llama.cpp), 11434 (Ollama) y 3000 (App) estén libres.
