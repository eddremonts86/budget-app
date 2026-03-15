import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Activity, Clock, Cpu, Globe, MessageSquare, RefreshCw, Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/shared/lib/utils'

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

export function AiLanguageAudit({ className }: AiLanguageAuditProps) {
  const queryClient = useQueryClient()
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['ai-audit'],
    queryFn: async () => {
      const res = await fetch('/api/ai/audit')
      if (!res.ok) return { logs: [], settings: {} }
      const json = await res.json()
      // Handle legacy format (array only) or new format ({ logs, settings })
      if (Array.isArray(json)) return { logs: json, settings: { forceLocale: undefined } }
      return json as { logs: AuditLog[]; settings: { forceLocale?: string } }
    },
    refetchInterval: 5000, // Refresh every 5s
  })

  const settings = data?.settings

  // Memoize sorted logs to prevent re-sorting on every render
  const sortedLogs = useMemo(() => {
    return [...(data?.logs ?? [])].reverse()
  }, [data?.logs])

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

      <CardContent className="p-0">
        <ScrollArea className="h-100 w-full">
          <Table>
            <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-45 pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Timestamp
                  </div>
                </TableHead>
                <TableHead className="w-30 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    Locale
                  </div>
                </TableHead>
                <TableHead className="w-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5" />
                    Provider
                  </div>
                </TableHead>
                <TableHead className="pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Query Snippet
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log, i) => (
                  <TableRow
                    key={i}
                    className="group border-b last:border-0 hover:bg-muted/30 transition-colors data-[state=selected]:bg-muted"
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground pl-6">
                      {tryFormatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-mono text-[10px] uppercase tracking-wider shadow-sm border-transparent',
                          log.locale === 'en'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20'
                            : log.locale === 'es'
                              ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20'
                              : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20',
                        )}
                      >
                        {log.locale}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          {log.providerId}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono opacity-80">
                          {log.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-75 pr-6">
                      <div
                        className="truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors bg-muted/20 px-2.5 py-1.5 rounded-md border border-transparent group-hover:border-border/50 group-hover:bg-background shadow-sm"
                        title={log.query}
                      >
                        {log.query}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground animate-in fade-in-50 duration-500">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/30 ring-1 ring-border/50">
                        <Activity className="h-8 w-8 opacity-40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          No audit logs found yet
                        </p>
                        <p className="mx-auto max-w-60 text-xs opacity-60">
                          Start chatting with the AI to see language enforcement logs appear here in
                          real-time.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function tryFormatDate(iso: string) {
  try {
    return format(new Date(iso), 'MMM d, HH:mm:ss')
  } catch {
    return iso
  }
}
