/**
 * @fileoverview Configuration for LM Studio integration.
 * Defines supported models, server settings, and integration parameters.
 */

export const LM_STUDIO_CONFIG = {
  /**
   * Supported model versions and their identifiers in LM Studio.
   * Users must load these models manually in LM Studio or use `scripts/ai/lmstudio/load-model.sh`.
   */
  models: {
    'llama3.2-latest': {
      // As per user's previous request
      id: 'llama3.2:latest',
      name: 'Llama 3.2 Latest',
      description: 'Default model for LM Studio integration',
    },
    'qwen2.5-7b': {
      id: 'qwen2.5:7b',
      name: 'Qwen 2.5 7B',
      description: 'Qwen 2.5 7B model',
    },
    'glm4-9b': {
      id: 'glm4:9b',
      name: 'GLM 4 9B',
      description: 'GLM 4 9B model',
    },
  },

  /**
   * Server settings for LM Studio local server.
   */
  server: {
    host: 'localhost', // Or host.docker.internal if running in Docker container connecting to host
    port: 1234,
    api_version: 'v1',
    base_url: 'http://localhost:1234/v1',
  },

  /**
   * Integration parameters.
   */
  integration: {
    cors: {
      enabled: true,
      allowed_origins: ['*'],
    },
    timeout: 60000,
  },

  /**
   * Default inference parameters.
   */
  defaults: {
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    top_k: 50,
    repetition_penalty: 1.1,
  },

  /**
   * Hardware requirements.
   * LM Studio handles hardware acceleration internally.
   */
  hardware: {
    gpu_acceleration: 'auto', // LM Studio manages this
  },

  /**
   * Error handling configuration.
   */
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 'exponential',
    timeoutThresholds: {
      default: 30000,
      generation: 120000,
    },
  },

  /**
   * Logging configuration.
   */
  logging: {
    level: 'info',
  },
}
