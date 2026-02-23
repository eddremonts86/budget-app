/**
 * @fileoverview Configuration for Ollama agent integration.
 * Defines supported models, connection parameters, and runtime settings.
 */

export const OLLAMA_CONFIG = {
  /**
   * Supported model versions and their specifications.
   * Focus on GLM4 and Qwen families as requested.
   */
  models: {
    'qwen-7b': {
      id: 'qwen2.5:7b', // Using qwen2.5 as it's current best practice for Qwen
      family: 'qwen',
      size: '7b',
      digest: 'sha256:...', // Placeholder, would need real digest from `ollama list`
      contextWindow: 32768,
    },
    'qwen-14b': {
      id: 'qwen2.5:14b',
      family: 'qwen',
      size: '14b',
      contextWindow: 32768,
    },
    'qwen-72b': {
      id: 'qwen2.5:72b',
      family: 'qwen',
      size: '72b',
      contextWindow: 32768,
      hardwareRequirements: {
        gpuMemory: '48GB', // Approximate
      }
    },
    'glm4': {
      id: 'glm4',
      family: 'glm',
      size: '9b', // Typical for GLM-4-9B
      contextWindow: 128000,
    }
  },

  /**
   * Connection parameters for the Ollama API.
   */
  connection: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    timeout: 60000, // 60s default
    headers: {
      'Content-Type': 'application/json',
    },
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
   * Hardware requirements and optimization settings.
   */
  hardware: {
    gpuLayers: -1, // Offload all to GPU if possible
    threads: 8, // Default CPU threads
  },

  /**
   * Error handling configuration.
   */
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 'exponential', // exponential backoff
    timeoutThresholds: {
      default: 30000,
      longRunning: 120000,
    },
  },

  /**
   * Logging configuration.
   */
  logging: {
    level: 'info',
    format: 'json',
  },

  /**
   * Health check endpoint.
   */
  healthCheck: {
    endpoint: '/', // Ollama root returns 200 OK
    interval: 30000,
  }
};
