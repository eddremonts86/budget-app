import { Outlet, redirect, useLocation } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { AiSearchProvider } from '@/modules/ai'
import { useAiSearch } from '@/modules/ai'
import { UserProvider } from '@/modules/users'
import { getDashboardPageTitle } from '@/modules'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass.client'
import { cn } from '@/shared/utils'
import { AppSidebar } from '../navigation/AppSidebar'
import { NotificationBell } from './NotificationBell'

export function DashboardLayout() {
  const auth = useAppAuth()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  // Get current page title from pathname
  const segments = pathname.split('/').filter(Boolean)
  const pageTitle = getDashboardPageTitle(pathname, t)

  if (!isAuthBypassEnabled && auth.isLoaded && !auth.isAuthenticated) {
    throw redirect({
      to: '/',
    })
  }

  if (!isAuthBypassEnabled && !auth.isLoaded) {
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
    <SidebarInset data-testid="dashboard-shell" className="flex flex-col h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b pr-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
          isPinned && isOpen && 'mr-140',
        )}
      >
        <Outlet />
      </div>
    </SidebarInset>
  )
}
