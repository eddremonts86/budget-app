# Configuración de Inteligencia Artificial (Multi-Plataforma)

Este proyecto soporta múltiples proveedores de IA con un sistema de fallback automático y gestión de modelos locales.

## Proveedores Soportados

El sistema intenta conectar con los proveedores en el siguiente orden de prioridad:

1.  **Llama.cpp** (Local, Alta eficiencia) - *Por defecto*
2.  **Ollama** (Local, Fácil uso)
3.  **LM Studio** (Local, Interfaz gráfica)
4.  **OpenAI** (Remoto, Requiere API Key)
5.  **Anthropic** (Remoto, Requiere API Key)

## Requisitos Previos

-   **Docker Desktop** instalado y ejecutándose.
-   **Recursos del Sistema**: Se recomiendan al menos 8GB de RAM para ejecutar modelos locales (Llama 3.2 1B/3B).

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
-   Vaya a **Configuración > Inteligencia Artificial**.
-   El sistema mostrará el proveedor activo y el estado de conexión.

## Gestión Manual de Modelos

### Llama.cpp
El modelo se descarga en `./models/llama-3.2-1b-instruct-q4_k_m.gguf`.
Si desea cambiar el modelo:
1.  Detenga el servicio: `docker compose stop llama-cpp`
2.  Reemplace el archivo `.gguf` en `./models/`.
3.  Actualice el comando en `docker-compose.yml` si el nombre del archivo cambia.
4.  Reinicie: `docker compose up -d llama-cpp`

### Ollama
Puede gestionar modelos de Ollama mediante CLI:
```bash
docker exec -it tanstack-template-ollama ollama pull mistral
```
Luego actualice la configuración en la interfaz web para usar el nuevo modelo.

### LM Studio
Para usar LM Studio:
1.  Inicie LM Studio en su host.
2.  Active el "Local Inference Server" en el puerto `1234`.
3.  Asegúrese de que "Cross-Origin-Resource-Sharing (CORS)" esté habilitado.
4.  El sistema detectará LM Studio automáticamente si Llama.cpp y Ollama no están disponibles, o si lo selecciona manualmente.

## Solución de Problemas

-   **El servicio no inicia**: Verifique que Docker tenga asignados suficientes recursos (RAM/CPU).
-   **Error de descarga**: Si la descarga automática falla, puede descargar manualmente el modelo GGUF y colocarlo en la carpeta `models`.
-   **Puertos ocupados**: Asegúrese de que los puertos 8080 (Llama.cpp), 11434 (Ollama) y 3000 (App) estén libres.
