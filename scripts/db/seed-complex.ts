import { writeCorporateSnapshot } from './utils/corporate-dataset'

async function main() {
  const summary = await writeCorporateSnapshot()
  console.log('✅ Corporate dataset generated')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('❌ Failed to generate corporate dataset:', error)
  process.exit(1)
})
