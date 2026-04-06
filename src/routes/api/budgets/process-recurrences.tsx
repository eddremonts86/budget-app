import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/budgets/process-recurrences')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Verify cron secret to prevent unauthorized calls
          const cronSecret = process.env.CRON_SECRET
          if (cronSecret) {
            const auth = request.headers.get('authorization')
            if (auth !== `Bearer ${cronSecret}`) {
              return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              })
            }
          }

          const { processAllRecurrencesFn } =
            await import('@/modules/budgets/api/budget-recurrences.fn')
          const result = await processAllRecurrencesFn()
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
