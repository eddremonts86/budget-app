import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Activity, Clock, Cpu, Globe, MessageSquare, RefreshCw, Settings2 } from 'lucide-react'
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

  const logs = data?.logs
  const settings = data?.settings

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
    <Card className={cn("mt-8 overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md", className)}>
      <CardHeader className="border-b bg-muted/40 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Language Enforcement Audit</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Monitor and control AI language compliance in real-time.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 shadow-sm">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="force-locale" className="text-xs font-medium text-muted-foreground">
                Force Language:
              </Label>
              <Select
                value={settings?.forceLocale || 'auto'}
                onValueChange={(val) =>
                  mutation.mutate({ forceLocale: val === 'auto' ? undefined : val })
                }
              >
                <SelectTrigger className="h-7 w-[140px] border-none bg-transparent px-2 text-xs focus:ring-0">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (OS Detected)</SelectItem>
                  <SelectItem value="en-US">English (en-US)</SelectItem>
                  <SelectItem value="es-ES">Spanish (es-ES)</SelectItem>
                  <SelectItem value="fr-FR">French (fr-FR)</SelectItem>
                  <SelectItem value="zh-CN">Chinese (zh-CN)</SelectItem>
                  <SelectItem value="pt-BR">Portuguese (pt-BR)</SelectItem>
                  <SelectItem value="de-DE">German (de-DE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Timestamp
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Locale
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    Provider
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Query Snippet
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs
                ?.slice()
                .reverse()
                .map((log, i) => (
                  <TableRow key={i} className="group hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {tryFormatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px] uppercase tracking-wider"
                      >
                        {log.locale}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{log.providerId}</span>
                        <span className="text-[10px] text-muted-foreground">{log.model}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div
                        className="truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors"
                        title={log.query}
                      >
                        {log.query}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Activity className="h-8 w-8 opacity-20" />
                      <p className="text-sm">No audit logs found yet.</p>
                      <p className="text-xs opacity-60">Start chatting to see enforcement logs.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
