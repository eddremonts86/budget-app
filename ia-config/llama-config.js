/**
 * @fileoverview Configuration for llama.cpp integration.
 * Defines supported models, runtime settings, and performance parameters.
 */

export const LLAMA_CPP_CONFIG = {
  /**
   * Supported model versions and their GGUF URLs.
   * Currently focused on Qwen and GLM families.
   */
  models: {
    'qwen2.5-7b-instruct-q4_k_m': {
      id: 'qwen2.5-7b-instruct-q4_k_m',
      path: '/models/qwen2.5-7b-instruct-q4_k_m.gguf',
      url: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf',
      checksum: 'sha256:...',
      size: '7b',
    },
    'qwen2.5-14b-instruct-q4_k_m': {
      id: 'qwen2.5-14b-instruct-q4_k_m',
      path: '/models/qwen2.5-14b-instruct-q4_k_m.gguf',
      url: 'https://huggingface.co/Qwen/Qwen2.5-14B-Instruct-GGUF/resolve/main/qwen2.5-14b-instruct-q4_k_m.gguf',
      checksum: 'sha256:...',
      size: '14b',
    },
    'glm4-9b-chat-q4_k_m': {
      id: 'glm4-9b-chat-q4_k_m',
      path: '/models/glm4-9b-chat-q4_k_m.gguf',
      url: 'https://huggingface.co/THUDM/glm-4-9b-chat-gguf/resolve/main/glm-4-9b-chat.Q4_K_M.gguf', // Example URL
      checksum: 'sha256:...',
      size: '9b',
    }
  },

  /**
   * Runtime settings for llama.cpp server.
   */
  runtime: {
    host: '0.0.0.0',
    port: 8080,
    n_ctx: 32768, // Context window
    n_gpu_layers: -1, // Use all GPU layers if available
    n_threads: 8, // CPU threads
    seed: -1, // Random seed
    flash_attn: true, // Use Flash Attention
  },

  /**
   * Performance optimization parameters.
   */
  performance: {
    batch_size: 512,
    f16_kv: true, // Use f16 for KV cache
    mlock: false, // Don't lock memory (unless on dedicated server)
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
   */
  hardware: {
    gpu: {
      required: true,
      min_memory: '8GB', // For 7B model
    },
    cpu: {
      min_cores: 4,
    },
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
};
