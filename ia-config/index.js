/**
 * @fileoverview Master configuration index.
 * Aggregates all agent configurations and provides a unified interface.
 * Implements configuration validation and runtime updates.
 */

import { exec } from 'node:child_process';
import dns from 'node:dns/promises';
import os from 'node:os';
import util from 'node:util';
import { ANTHROPIC_CONFIG } from './anthropic-config.js';
import { LLAMA_CPP_CONFIG } from './llama-config.js';
import { LM_STUDIO_CONFIG } from './lmstudio-config.js';
import { OLLAMA_CONFIG } from './ollama-config.js';
import { OPENAI_CONFIG } from './openai-config.js';

/**
 * Validates the configuration for a given provider.
 * @param {string} provider - The provider name (ollama, llama-cpp, etc.)
 * @param {object} config - The configuration object to validate.
 * @returns {boolean} True if valid, throws error otherwise.
 */
function validateConfig(provider, config) {
  if (!config) {
    throw new Error(`Configuration for ${provider} is missing.`);
  }
  // Basic validation logic - extend as needed
  if (!config.models || Object.keys(config.models).length === 0) {
    console.warn(`Warning: No models configured for ${provider}.`);
  }
  return true;
}

/**
 * Unified configuration object.
 */
export const AI_CONFIG = {
  ollama: OLLAMA_CONFIG,
  'llama-cpp': LLAMA_CPP_CONFIG,
  'lm-studio': LM_STUDIO_CONFIG,
  openai: OPENAI_CONFIG,
  anthropic: ANTHROPIC_CONFIG,

  /**
   * Retrieves configuration for a specific provider.
   * @param {string} providerId - The ID of the provider.
   * @returns {object} The configuration object.
   */
  get(providerId) {
    const config = this[providerId];
    if (config) {
      validateConfig(providerId, config);
      return config;
    }
    throw new Error(`Provider ${providerId} not found in AI_CONFIG.`);
  },

  /**
   * Updates configuration at runtime (in-memory).
   * Note: This does not persist changes to disk.
   * @param {string} providerId - The ID of the provider.
   * @param {object} newConfig - Partial configuration to merge.
   */
  update(providerId, newConfig) {
    if (this[providerId]) {
      this[providerId] = { ...this[providerId], ...newConfig };
      console.log(`Configuration for ${providerId} updated.`);
    } else {
      throw new Error(`Provider ${providerId} not found.`);
    }
  }
};

/**
 * Pre-flight checks for hardware and connectivity.
 * Validates GPU drivers, available memory, and network connectivity.
 * @returns {Promise<{gpu: object, memory: object, network: object}>}
 */
export async function runPreFlightChecks() {
  console.log('Running pre-flight checks...');

  const execAsync = typeof exec === 'function' ? util.promisify(exec) : async () => { throw new Error('exec not available'); };

  const results = {
    gpu: { available: false, info: 'Unknown' },
    memory: { total: '0 GB', free: '0 GB', status: 'UNKNOWN' },
    network: { internet: false, local: false, latency: 0 }
  };

  // 1. Check GPU (NVIDIA or Apple Silicon)
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=driver_version,memory.total --format=csv,noheader');
    results.gpu = { available: true, info: `NVIDIA Driver: ${stdout.trim()}` };
  } catch (e) {
    if (os.platform() === 'darwin') {
      results.gpu = { available: true, info: 'Apple Silicon / Metal (Assumed)' };
    } else {
      results.gpu = { available: false, info: 'No NVIDIA GPU detected.' };
    }
  }

  // 2. Check Memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  results.memory = {
    total: `${(totalMem / 1024 ** 3).toFixed(2)} GB`,
    free: `${(freeMem / 1024 ** 3).toFixed(2)} GB`,
    status: (freeMem / totalMem) < 0.1 ? 'CRITICAL' : (freeMem / totalMem) < 0.2 ? 'WARNING' : 'OK'
  };

  // 3. Check Network
  const start = Date.now();
  try {
    await dns.lookup('google.com');
    results.network.internet = true;
  } catch {}

  try {
    await dns.lookup('localhost');
    results.network.local = true;
  } catch {}
  results.network.latency = Date.now() - start;

  return results;
}

export default AI_CONFIG;
