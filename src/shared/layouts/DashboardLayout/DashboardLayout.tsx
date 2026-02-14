import { useAuth } from '@clerk/tanstack-react-start'
import { Outlet, redirect, useLocation } from '@tanstack/react-router'
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
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function DashboardLayout() {
  const { isLoaded, userId } = useAuth()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isE2E = import.meta.env.VITE_E2E === 'true'

  // Get current page title from pathname
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || 'dashboard'
  const pageTitle = t(`sidebar.main.${lastSegment}`, {
    defaultValue: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1),
  })

  if (!isE2E && isLoaded && !userId) {
    throw redirect({
      to: '/',
    })
  }

  if (!isE2E && !isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
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
                      <BreadcrumbPage>Overview</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
