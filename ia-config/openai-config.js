/**
 * @fileoverview Configuration for OpenAI integration.
 * Defines API keys, model versions, and connection settings.
 */

export const OPENAI_CONFIG = {
  /**
   * Supported model versions and their identifiers.
   * Using default models as requested.
   */
  models: {
    'gpt-4o': {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      description: 'OpenAI GPT-4o model',
    },
    'gpt-4o-mini': {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      contextWindow: 128000,
      description: 'OpenAI GPT-4o Mini model',
    }
  },

  /**
   * API connection parameters.
   */
  connection: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '', // Loaded from environment variables
    organizationId: process.env.OPENAI_ORG_ID || '', // Optional
  },

  /**
   * Default inference parameters.
   */
  defaults: {
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
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
