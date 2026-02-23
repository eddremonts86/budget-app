/**
 * @fileoverview Configuration for Anthropic integration.
 * Defines API keys, model versions, and connection settings.
 */

export const ANTHROPIC_CONFIG = {
  /**
   * Supported model versions and their identifiers.
   * Using default models as requested.
   */
  models: {
    'claude-3-5-sonnet-latest': {
      id: 'claude-3-5-sonnet-latest',
      name: 'Claude 3.5 Sonnet',
      contextWindow: 200000,
      description: 'Anthropic Claude 3.5 Sonnet model',
    },
    'claude-3-haiku-20240307': {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      contextWindow: 200000,
      description: 'Anthropic Claude 3 Haiku model',
    }
  },

  /**
   * API connection parameters.
   */
  connection: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY || '', // Loaded from environment variables
    apiVersion: '2023-06-01',
  },

  /**
   * Default inference parameters.
   */
  defaults: {
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 50,
  },

  /**
   * Error handling configuration.
   */
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 'exponential',
    timeoutThresholds: {
      default: 30000,
      generation: 60000,
    },
  },

  /**
   * Logging configuration.
   */
  logging: {
    level: 'info',
  },
};
