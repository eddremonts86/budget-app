import fs from 'node:fs/promises'
import path from 'node:path'

type AiProvider = 'openai' | 'anthropic' | 'lm-studio'

type AiConfigStore = {
  activeProvider: AiProvider
  providers: Record<string, unknown>
}

const providerAliases: Record<string, AiProvider> = {
  openai: 'openai',
  anthropic: 'anthropic',
  'lm-studio': 'lm-studio',
  lmstudio: 'lm-studio',
  lm: 'lm-studio',
}

const usage = () => {
  process.stdout.write('Usage: pnpm ai:switch <openai|anthropic|lm-studio|lmstudio>\n')
}

const readStore = async (filePath: string): Promise<AiConfigStore> => {
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as AiConfigStore
}

const main = async () => {
  const providerArg = process.argv[2]?.trim().toLowerCase()
  if (!providerArg) {
    usage()
    process.exit(1)
  }

  const provider = providerAliases[providerArg]
  if (!provider) {
    process.stderr.write(`Unsupported provider: ${providerArg}\n`)
    usage()
    process.exit(1)
  }

  const workspaceRoot = process.cwd()
  const storePath = path.join(workspaceRoot, 'src/modules/ai/data', 'ai-config-store.json')

  const store = await readStore(storePath)
  store.activeProvider = provider

  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf-8')

  process.stdout.write(`activeProvider set to ${provider}\n`)
}

void main()
