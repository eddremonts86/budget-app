
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.APP_URL || 'http://localhost:3000'

async function runIntegrationTest() {
  console.log('🤖 Starting AI Integration Test...')
  console.log(`📍 Target: ${BASE_URL}`)

  try {
    // 1. Check Status Endpoint
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

    // 2. Test Chat Endpoint with Fallback
    console.log('\n💬 Testing /api/ai/chat (Smoke Test)...')

    // We'll test the default fallback mechanism by NOT specifying a providerId
    const chatPayload = {
      messages: [
        { role: 'user', content: 'Say "Hello World" in Spanish.' }
      ]
    }

    // Note: This endpoint returns SSE, so axios might buffer it.
    // For a simple integration test, getting a 200 OK and some data is enough.
    // We use responseType: 'stream' to handle SSE if needed, but for simple check:
    const chatRes = await axios.post(`${BASE_URL}/api/ai/chat`, chatPayload, {
      responseType: 'stream'
    })

    if (chatRes.status !== 200) {
      console.error('❌ Chat endpoint failed:', chatRes.status)
      process.exit(1)
    }

    console.log('✅ Chat endpoint accepted request (200 OK)')

    // Read the stream briefly to ensure we get data
    const stream = chatRes.data
    let hasData = false

    stream.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      if (text.includes('data:')) {
        hasData = true
        // console.log('   (Received chunk)')
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
          // If it's a stream, we can't JSON.stringify it directly
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
            // Wait briefly for stream to end or data to arrive
            await new Promise((resolve) => setTimeout(resolve, 500))
          } else {
            console.error('   Data:', JSON.stringify(error.response.data, null, 2))
          }
        } catch (e: any) {
          console.error('   Failed to read error response data:', e.message)
        }
      } else {
        console.error('   No response received')
      }
    process.exit(1)
  }
}

runIntegrationTest()
