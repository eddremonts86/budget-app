/**
 * @fileoverview Master configuration index.
 * Aggregates all agent configurations and provides a unified interface.
 * Implements configuration validation and runtime updates.
 */

// import { exec } from 'node:child_process';
// import dns from 'node:dns/promises';
// import os from 'node:os';
// import util from 'node:util';
import { ANTHROPIC_CONFIG } from './anthropic-config.js'
import { LLAMA_CPP_CONFIG } from './llama-config.js'
import { LM_STUDIO_CONFIG } from './lmstudio-config.js'
import { OLLAMA_CONFIG } from './ollama-config.js'
import { OPENAI_CONFIG } from './openai-config.js'

/**
 * Helper to dynamically import node modules safely
 */
async function getNodeModules() {
  if (typeof window !== 'undefined') {
    return null
  }
  try {
    const childProcessModule = 'node:child_process'
    const dnsModule = 'node:dns/promises'
    const osModule = 'node:os'
    const utilModule = 'node:util'
    const childProcess = await import(/* @vite-ignore */ childProcessModule)
    const dns = await import(/* @vite-ignore */ dnsModule)
    const os = await import(/* @vite-ignore */ osModule)
    const util = await import(/* @vite-ignore */ utilModule)
    return { childProcess, dns, os, util }
  } catch {
    return null
  }
}

/**
 * Validates the configuration for a given provider.
 * @param {string} provider - The provider name (ollama, llama-cpp, etc.)
 * @param {object} config - The configuration object to validate.
 * @returns {boolean} True if valid, throws error otherwise.
 */
function validateConfig(provider, config) {
  if (!config) {
    throw new Error(`Configuration for ${provider} is missing.`)
  }
  // Basic validation logic - extend as needed
  if (!config.models || Object.keys(config.models).length === 0) {
    console.warn(`Warning: No models configured for ${provider}.`)
  }
  return true
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
    const config = this[providerId]
    if (config) {
      validateConfig(providerId, config)
      return config
    }
    throw new Error(`Provider ${providerId} not found in AI_CONFIG.`)
  },

  /**
   * Updates configuration at runtime (in-memory).
   * Note: This does not persist changes to disk.
   * @param {string} providerId - The ID of the provider.
   * @param {object} newConfig - Partial configuration to merge.
   */
  update(providerId, newConfig) {
    if (this[providerId]) {
      this[providerId] = { ...this[providerId], ...newConfig }
      console.log(`Configuration for ${providerId} updated.`)
    } else {
      throw new Error(`Provider ${providerId} not found.`)
    }
  },
}

/**
 * Pre-flight checks for hardware and connectivity.
 * Validates GPU drivers, available memory, and network connectivity.
 * @returns {Promise<{gpu: object, memory: object, network: object}>}
 */
export async function runPreFlightChecks() {
  console.log('Running pre-flight checks...')

  const modules = await getNodeModules()
  if (!modules) {
    return {
      gpu: { available: false, info: 'Not available in browser' },
      memory: { total: '0 GB', free: '0 GB', status: 'UNKNOWN' },
      network: { internet: false, local: false, latency: 0 },
    }
  }

  const { childProcess, os, util, dns } = modules
  const execAsync = util.promisify(childProcess.exec)

  const results = {
    gpu: { available: false, info: 'Unknown' },
    memory: { total: '0 GB', free: '0 GB', status: 'UNKNOWN' },
    network: { internet: false, local: false, latency: 0 },
  }

  // 1. Check GPU (NVIDIA or Apple Silicon)
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=driver_version,memory.total --format=csv,noheader',
    )
    results.gpu = { available: true, info: `NVIDIA Driver: ${stdout.trim()}` }
  } catch {
    if (os.platform() === 'darwin') {
      results.gpu = { available: true, info: 'Apple Silicon / Metal (Assumed)' }
    } else {
      results.gpu = { available: false, info: 'No NVIDIA GPU detected.' }
    }
  }

  // 2. Check Memory
  const totalMem = os.totalmem() / (1024 * 1024 * 1024)
  const freeMem = os.freemem() / (1024 * 1024 * 1024)
  results.memory = {
    total: `${totalMem.toFixed(1)} GB`,
    free: `${freeMem.toFixed(1)} GB`,
    status: totalMem > 16 ? 'OPTIMAL' : totalMem > 8 ? 'ADEQUATE' : 'LOW',
  }

  // 3. Check Network Connectivity
  try {
    await dns.lookup('google.com')
    results.network.internet = true
  } catch {
    // Ignore error
  }

  try {
    await dns.lookup('localhost')
    results.network.local = true
  } catch {
    // Ignore error
  }

  return results
}

export default AI_CONFIG
