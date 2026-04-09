import { exec as childProcessExec } from 'node:child_process'
import { lookup } from 'node:dns'
import os from 'node:os'
import { promisify } from 'node:util'

const execAsync = promisify(childProcessExec)
const lookupAsync = promisify(lookup)

export interface PreFlightStatus {
  gpu: {
    available: boolean
    driver?: string
    memory?: string
    error?: string
  }
  memory: {
    total: string
    free: string
    status: 'OK' | 'WARNING' | 'CRITICAL'
  }
  network: {
    internet: boolean
    local_dns: boolean
    latency_ms: number
  }
}

async function checkGpu(): Promise<PreFlightStatus['gpu']> {
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=driver_version,memory.total --format=csv,noheader',
    )
    const [driver, memory] = stdout.trim().split(',')

    return {
      available: true,
      driver: driver?.trim(),
      memory: memory?.trim(),
    }
  } catch {
    if (os.platform() === 'darwin' && os.cpus()[0].model.includes('Apple')) {
      return {
        available: true,
        driver: 'Apple Metal',
        memory: 'Shared System Memory',
      }
    }

    return {
      available: false,
      error:
        'No NVIDIA GPU detected or nvidia-smi not found. (If on Mac, Metal is used automatically)',
    }
  }
}

function checkMemory(): PreFlightStatus['memory'] {
  const total = os.totalmem()
  const free = os.freemem()
  const usedPercent = ((total - free) / total) * 100
  const status = usedPercent > 90 ? 'CRITICAL' : usedPercent > 75 ? 'WARNING' : 'OK'

  return {
    total: `${(total / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    free: `${(free / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    status,
  }
}

async function checkNetwork(): Promise<PreFlightStatus['network']> {
  const start = Date.now()
  let internet = false
  let local_dns = false

  try {
    await lookupAsync('google.com')
    internet = true
  } catch {
    // Ignore transient internet lookup failures.
  }

  try {
    await lookupAsync('localhost')
    local_dns = true
  } catch {
    // Ignore transient local DNS lookup failures.
  }

  return {
    internet,
    local_dns,
    latency_ms: Date.now() - start,
  }
}

export async function runPreFlightChecks(): Promise<PreFlightStatus> {
  const [gpu, network] = await Promise.all([checkGpu(), checkNetwork()])
  const memory = checkMemory()

  return {
    gpu,
    memory,
    network,
  }
}
