import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/dashboard/settings/')({
  beforeLoad: () => {
    throw redirect({
      to: '/dashboard/settings/system',
    })
  },
})
