import { useAuth } from '@clerk/tanstack-react-start'
import { redirect } from '@tanstack/react-router'
import { Topbar } from '@/components/composite/Topbar'
import { FooterBlock } from '@/features/Home'

export function DashboardPage() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-grow flex items-center justify-center pt-16">
          <p>Loading...</p>
        </main>
        <FooterBlock />
      </div>
    )
  }

  if (!userId) {
    throw redirect({
      to: '/',
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <p className="text-muted-foreground">
              Welcome to your dashboard! This page is only visible to logged-in users.
            </p>
          </div>
        </div>
      </main>
      <FooterBlock />
    </div>
  )
}
