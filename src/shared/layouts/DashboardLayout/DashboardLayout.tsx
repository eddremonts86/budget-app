import { useAuth } from '@clerk/tanstack-react-start'
import { Outlet, redirect, useLocation } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AiSearchProvider } from '@/features/Ai/context/AiSearchContext'
import { useAiSearch } from '@/features/Ai/context/useAiSearch'
import { UserProvider } from '@/features/Users/context/UserProvider'
import { isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass.client'
import { cn } from '@/shared/utils'
import { NotificationBell } from './NotificationBell'

export function DashboardLayout() {
  const { isLoaded, userId } = useAuth()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  // Get current page title from pathname
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || 'dashboard'
  const pageTitle = t(`sidebar.main.${lastSegment}`, {
    defaultValue: lastSegment
      ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
      : 'Dashboard',
  })

  if (!isAuthBypassEnabled && isLoaded && !userId) {
    throw redirect({
      to: '/',
    })
  }

  if (!isAuthBypassEnabled && !isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <UserProvider>
      <AiSearchProvider>
        <SidebarProvider>
          <AppSidebar />
          <DashboardContent>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">{t('sidebar.main.dashboard')}</BreadcrumbLink>
              </BreadcrumbItem>
              {segments.length > 1 && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {segments.length === 1 && segments[0] === 'dashboard' && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t('sidebar.main.dashboard')}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </DashboardContent>
        </SidebarProvider>
      </AiSearchProvider>
    </UserProvider>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isPinned, isOpen } = useAiSearch()
  const { t } = useTranslation()

  return (
    <SidebarInset className="flex flex-col h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 justify-between pr-4">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>{children}</Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href="/">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">{t('common.backToHome')}</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.backToHome')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      <div
        className={cn(
          'flex-1 flex flex-col min-h-0 overflow-y-auto p-4 transition-all duration-300 ease-in-out',
          isPinned && isOpen && 'mr-[560px]',
        )}
      >
        <Outlet />
      </div>
    </SidebarInset>
  )
}
