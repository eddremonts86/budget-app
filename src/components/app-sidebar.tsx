import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Cpu,
  Loader2,
  Navigation,
  Search,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import type { AiProviderStatus } from '@/shared/lib/ai/server/providers'
import { useTQMutation, useTQuery } from '@/shared/lib/query'
import { cn } from '@/shared/utils'

type SearchResultPayload = {
  result: unknown
  providerId?: AiProviderId
}

type ProviderQueryData = {
  statuses: AiProviderStatus[]
  provider: AiProviderId | null
}

const extractSearchText = (result: unknown) => {
  if (!result) return ''
  if (typeof result === 'string') return result
  if (typeof result === 'object' && result !== null) {
    const record = result as Record<string, unknown>
    const message = record.message as Record<string, unknown> | undefined
    if (message && typeof message.content === 'string') return message.content
    if (typeof record.content === 'string') return record.content
    if (Array.isArray(record.output_text)) return record.output_text.join('\n')
  }
  return JSON.stringify(result)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResult, setSearchResult] = React.useState<SearchResultPayload | null>(null)
  const [selectedProvider, setSelectedProvider] = React.useState<'auto' | AiProviderId>('auto')
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const updateStatus = () => setIsOnline(window.navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return
      }
      event.preventDefault()
      setIsSearchOpen(true)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const providerQuery = useTQuery(
    ['ai', 'status'],
    async () => {
      const res = await fetch('/api/ai/status')
      if (!res.ok) {
        throw new Error('STATUS_FAILED')
      }
      return (await res.json()) as ProviderQueryData
    },
    { cache: 'realtime', refetchInterval: 20000 },
  )

  const searchMutation = useTQMutation<
    SearchResultPayload,
    Error,
    { query: string; providerId?: AiProviderId }
  >(
    ['ai', 'search'],
    async ({ query, providerId }) => {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, providerId }),
      })
      const data = (await res.json()) as SearchResultPayload & { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'SEARCH_FAILED')
      }
      return data
    },
    {
      showSuccessToast: false,
      retry: 1,
      onSuccess: (data) => setSearchResult(data),
    },
  )
  const navMain = [
    {
      title: t('sidebar.main.dashboard'),
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: t('sidebar.main.todos'),
      url: '/dashboard/todos',
      icon: IconListDetails,
    },
    {
      title: t('sidebar.main.analytics'),
      url: '/dashboard/analytics',
      icon: IconChartBar,
    },
    {
      title: t('sidebar.main.projects'),
      url: '/dashboard/projects',
      icon: IconFolder,
    },
    {
      title: t('sidebar.main.team'),
      url: '/dashboard/team',
      icon: IconUsers,
    },
    {
      title: t('sidebar.main.users'),
      url: '/dashboard/users',
      icon: IconUsers,
    },
    {
      title: t('sidebar.main.categories'),
      url: '/dashboard/categories',
      icon: IconListDetails,
    },
    {
      title: t('sidebar.main.transactions'),
      url: '/dashboard/transactions',
      icon: IconReport,
    },
    {
      title: t('sidebar.main.settings'),
      url: '/dashboard/settings',
      icon: IconSettings,
    },
  ]
  const navSecondary = [
    {
      title: t('sidebar.secondary.settings'),
      url: '/dashboard/settings',
      icon: IconSettings,
    },
    {
      title: t('sidebar.secondary.help'),
      url: '/dashboard/help',
      icon: IconHelp,
    },
    {
      title: t('sidebar.secondary.search'),
      icon: IconSearch,
      onClick: () => setIsSearchOpen(true),
    },
  ]

  const searchableLinks = [
    ...navMain,
    {
      title: t('sidebar.secondary.help'),
      url: '/dashboard/help',
      icon: IconHelp,
    },
  ]
  const filteredLinks = searchableLinks.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <Sheet
        open={isSearchOpen}
        onOpenChange={(open) => {
          setIsSearchOpen(open)
          if (!open && !searchQuery.trim()) {
            setSearchResult(null)
          }
        }}
      >
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-[560px]">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              {t('ai.search.title')}
            </SheetTitle>
            <SheetDescription>{t('ai.search.description')}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            <form
              className="flex shrink-0 flex-col gap-4 border-b bg-muted/20 p-6"
              onSubmit={(event) => {
                event.preventDefault()
                const trimmed = searchQuery.trim()
                if (!trimmed || !isOnline || searchMutation.isPending) return
                searchMutation.mutate({
                  query: trimmed,
                  providerId: selectedProvider === 'auto' ? undefined : selectedProvider,
                })
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('ai.search.placeholder')}
                    className="h-11 pl-10 pr-24"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    <kbd className="pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Select
                    value={selectedProvider}
                    onValueChange={(value) => setSelectedProvider(value as 'auto' | AiProviderId)}
                  >
                    <SelectTrigger className="h-9 w-[160px] bg-background">
                      <div className="flex items-center gap-2">
                        <Cpu className="size-3.5 text-muted-foreground" />
                        <SelectValue placeholder={t('ai.search.providerAuto')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('ai.search.providerAuto')}</SelectItem>
                      {(providerQuery.data?.statuses ?? []).map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <span className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-2 w-2 rounded-full p-0',
                                status.available ? 'bg-green-500' : 'bg-red-500',
                              )}
                            />
                            {status.id.toUpperCase()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    className="h-9 px-6"
                    disabled={!isOnline || searchMutation.isPending || !searchQuery.trim()}
                  >
                    {searchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('ai.search.searching')}
                      </>
                    ) : (
                      t('ai.search.cta')
                    )}
                  </Button>
                </div>

                {!isOnline && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <WifiOff className="size-3" />
                    {t('ai.search.offline')}
                  </div>
                )}
                {searchMutation.error && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="size-3" />
                    {t('ai.search.error')}
                  </div>
                )}
              </div>
            </form>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* AI Summary Section */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      {t('ai.search.resultsTitle')}
                    </h3>
                    {searchResult?.providerId && (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {searchResult.providerId.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="text-sm leading-relaxed text-foreground/90">
                      {searchResult?.result ? (
                        <div className="prose prose-sm dark:prose-invert">
                          {extractSearchText(searchResult.result)}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <div className="rounded-full bg-muted p-3 mb-3">
                            <Search className="size-5 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground italic">{t('ai.search.empty')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Suggestions Section */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
                    <Navigation className="size-4 text-primary" />
                    {t('ai.search.suggestions')}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(filteredLinks.length ? filteredLinks : searchableLinks)
                      .slice(0, 8)
                      .map((item) => (
                        <Link
                          key={item.title}
                          to={item.url as '/dashboard'}
                          onClick={() => setIsSearchOpen(false)}
                          className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                        >
                          <div className="flex size-8 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <item.icon className="size-4" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium group-hover:text-primary">
                              {item.title}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">
                              {item.url}
                            </span>
                          </div>
                          <ChevronRight className="ml-auto size-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </Link>
                      ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Sidebar>
  )
}
