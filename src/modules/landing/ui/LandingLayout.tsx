import { Outlet } from '@tanstack/react-router'
import { Topbar } from './topbar/Topbar'
import { FooterBlock } from '@/modules/landing'

export function LandingLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <FooterBlock />
    </div>
  )
}
