import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.APP_URL || 'http://localhost:3000'

async function runIntegrationTest() {
  console.log('🤖 Starting AI Integration Test...')
  console.log(`📍 Target: ${BASE_URL}`)

  try {
    console.log('\n🔍 Checking /api/ai/status...')
    const statusRes = await axios.get(`${BASE_URL}/api/ai/status`)

    if (statusRes.status !== 200) {
      console.error('❌ Status endpoint failed:', statusRes.status, statusRes.statusText)
      process.exit(1)
    }

    const statuses = statusRes.data.statuses
    console.log('✅ Status endpoint reachable')
    console.log('📊 Provider Statuses:')

    let availableProviders = 0
    statuses.forEach((s: any) => {
      const icon = s.available ? '✅' : '❌'
      const models = s.modelCount !== undefined ? `(${s.modelCount} models)` : ''
      console.log(`   ${icon} ${s.label}: ${s.status} ${s.latencyMs}ms ${models}`)
      if (s.available) availableProviders++
    })

    if (availableProviders === 0) {
      console.error('❌ No AI providers are available. Cannot proceed with chat test.')
      process.exit(1)
    }

    console.log('\n💬 Testing /api/ai/chat (Smoke Test)...')

    const chatPayload = {
      messages: [{ role: 'user', content: 'Say "Hello World" in Spanish.' }],
    }

    const chatRes = await axios.post(`${BASE_URL}/api/ai/chat`, chatPayload, {
      responseType: 'stream',
    })

    if (chatRes.status !== 200) {
      console.error('❌ Chat endpoint failed:', chatRes.status)
      process.exit(1)
    }

    console.log('✅ Chat endpoint accepted request (200 OK)')

    const stream = chatRes.data
    let hasData = false

    stream.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      if (text.includes('data:')) {
        hasData = true
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
    stream.destroy()

    if (hasData) {
      console.log('✅ Received SSE data frames')
    } else {
      console.warn('⚠️ No data frames received in 2 seconds (might be slow generation)')
    }

    console.log('\n🎉 Integration Test Complete!')
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('   Status:', error.response.status)
      try {
        if (
          error.config?.responseType === 'stream' ||
          (error.response.data && typeof error.response.data.pipe === 'function')
        ) {
          console.error('   Data is a stream. Reading...')
          const stream = error.response.data
          const chunks: any[] = []
          stream.on('data', (chunk: any) => chunks.push(chunk))
          stream.on('end', () => {
            const body = Buffer.concat(chunks).toString()
            console.error('   Response Body:', body)
          })
          await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
          console.error('   Data:', JSON.stringify(error.response.data, null, 2))
        }
      } catch (responseError: any) {
        console.error('   Failed to read error response data:', responseError.message)
      }
    } else {
      console.error('   No response received')
    }
    process.exit(1)
  }
}

runIntegrationTest()
