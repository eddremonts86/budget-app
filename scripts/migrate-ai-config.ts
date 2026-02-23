
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the config store
const CONFIG_PATH = path.resolve(__dirname, '../src/server/data/ai-config-store.json')
const BACKUP_PATH = path.resolve(__dirname, `../src/server/data/ai-config-store.backup-${Date.now()}.json`)

// New standard models mapping
const MODEL_MIGRATION_MAP: Record<string, string> = {
  'local-model': 'llama3.2:latest',
  'default-model': 'llama3.2:latest',
  'gpt-3.5-turbo': 'gpt-4o', // Upgrade default
  'claude-2': 'claude-3-5-sonnet-20240620', // Upgrade default
}

interface AiConfigStore {
  activeProvider: string
  providers: Record<string, any>
}

async function migrateConfig() {
  console.log('🚀 Starting AI Configuration Migration...')

  try {
    // 1. Check if config exists
    try {
      await fs.access(CONFIG_PATH)
    } catch {
      console.log('⚠️ No existing configuration found at:', CONFIG_PATH)
      console.log('✅ Skipping migration (nothing to migrate).')
      return
    }

    // 2. Read config
    const content = await fs.readFile(CONFIG_PATH, 'utf-8')
    const config: AiConfigStore = JSON.parse(content)

    // 3. Backup existing config
    await fs.writeFile(BACKUP_PATH, content)
    console.log(`💾 Backup created at: ${BACKUP_PATH}`)

    let changesMade = false

    // 4. Iterate and migrate
    for (const [providerKey, providerConfig] of Object.entries(config.providers)) {
      // Check for deprecated model names
      if (providerConfig.parameters && providerConfig.parameters.model) {
        const currentModel = providerConfig.parameters.model
        if (MODEL_MIGRATION_MAP[currentModel]) {
          const newModel = MODEL_MIGRATION_MAP[currentModel]
          console.warn(`⚠️ [Deprecation Warning] Provider '${providerKey}' uses deprecated model '${currentModel}'.`)
          console.log(`   ➜ Migrating to '${newModel}'...`)
          
          providerConfig.parameters.model = newModel
          changesMade = true
        }
      }

      // Ensure 'endpoints' structure exists
      if (!providerConfig.endpoints) {
        console.warn(`⚠️ [Structure Warning] Provider '${providerKey}' missing 'endpoints' object.`)
        console.log(`   ➜ Adding default endpoints structure...`)
        providerConfig.endpoints = {
          chat: '/chat/completions',
          models: '/models'
        }
        changesMade = true
      }
    }

    // 5. Save if changes made
    if (changesMade) {
      await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
      console.log('✅ Migration completed successfully. Configuration updated.')
    } else {
      console.log('✅ Configuration is already up to date. No changes made.')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrateConfig()
