import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Activity, Clock, Cpu, Globe, MessageSquare, RefreshCw, Settings2 } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/shared/lib/utils'
import {
  VirtualTable,
  useDebouncedSearch,
  TableSearchBar,
  TableEmptyState,
} from '@/shared/ui/tables'

interface AuditLog {
  timestamp: string
  locale: string
  query: string
  providerId: string
  model: string
}

interface AiLanguageAuditProps {
  className?: string
}

function tryFormatDate(iso: string) {
  try {
    return format(new Date(iso), 'MMM d, HH:mm:ss')
  } catch {
    return iso
  }
}

export function AiLanguageAudit({ className }: AiLanguageAuditProps) {
  const queryClient = useQueryClient()
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['ai-audit'],
    queryFn: async () => {
      const res = await fetch('/api/ai/audit')
      if (!res.ok) return { logs: [], settings: {} }
      const json = await res.json()
      if (Array.isArray(json)) return { logs: json, settings: { forceLocale: undefined } }
      return json as { logs: AuditLog[]; settings: { forceLocale?: string } }
    },
    refetchInterval: 5000,
  })

  const settings = data?.settings

  const sortedLogs = React.useMemo(() => {
    return [...(data?.logs ?? [])].reverse()
  }, [data?.logs])

  const filteredLogs = React.useMemo(() => {
    if (!activeSearch) return sortedLogs
    const q = activeSearch.toLowerCase()
    return sortedLogs.filter(
      (log) =>
        log.query.toLowerCase().includes(q) ||
        log.providerId.toLowerCase().includes(q) ||
        log.model.toLowerCase().includes(q) ||
        log.locale.toLowerCase().includes(q),
    )
  }, [sortedLogs, activeSearch])

  const mutation = useMutation({
    mutationFn: async (newSettings: { forceLocale?: string }) => {
      await fetch('/api/ai/audit', {
        method: 'POST',
        body: JSON.stringify(newSettings),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-audit'] })
    },
  })

  const columns: ColumnDef<AuditLog>[] = React.useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: () => (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Timestamp
          </div>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {tryFormatDate(row.original.timestamp)}
          </span>
        ),
      },
      {
        accessorKey: 'locale',
        header: () => (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            Locale
          </div>
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn(
              'font-mono text-[10px] uppercase tracking-wider shadow-sm border-transparent',
              row.original.locale === 'en'
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20'
                : row.original.locale === 'es'
                  ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20'
                  : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20',
            )}
          >
            {row.original.locale}
          </Badge>
        ),
      },
      {
        accessorKey: 'providerId',
        header: () => (
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5" />
            Provider
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium text-foreground">{row.original.providerId}</span>
            <span className="text-[10px] text-muted-foreground font-mono opacity-80">
              {row.original.model}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'query',
        header: () => (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Query Snippet
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="truncate max-w-75 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-md border border-transparent hover:border-border/50 hover:bg-background shadow-sm transition-colors"
            title={row.original.query}
          >
            {row.original.query}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card
      className={cn(
        'mt-8 overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md bg-card',
        className,
      )}
    >
      <CardHeader className="border-b bg-muted/40 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Language Enforcement Audit
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Monitor and control AI language compliance in real-time.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label
                htmlFor="force-locale"
                className="whitespace-nowrap text-xs font-medium text-muted-foreground"
              >
                Force Language:
              </Label>
              <Select
                value={settings?.forceLocale || 'auto'}
                onValueChange={(val) =>
                  mutation.mutate({ forceLocale: val === 'auto' ? undefined : val })
                }
              >
                <SelectTrigger
                  id="force-locale"
                  className="h-7 w-35 border-none bg-transparent px-2 text-xs font-medium focus:ring-0 hover:bg-muted/50 transition-colors"
                >
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="auto">Auto (OS Detected)</SelectItem>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="es">Spanish (es)</SelectItem>
                  <SelectItem value="dk">Danish (dk)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 shadow-sm active:scale-95 transition-all"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-4 h-150">
        <TableSearchBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClear={clearSearch}
          loadedCount={filteredLogs.length}
          totalCount={sortedLogs.length}
          showSpinner={isRefetching}
          placeholderKey="common.search"
        />
        {filteredLogs.length > 0 ? (
          <VirtualTable
            columns={columns}
            data={filteredLogs}
            hasNextPage={false}
            isFetchingNextPage={false}
            onFetchNextPage={() => {}}
            scrollResetKey={activeSearch}
            rowHeight={52}
          />
        ) : (
          <TableEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
        )}
      </CardContent>
    </Card>
  )
}
