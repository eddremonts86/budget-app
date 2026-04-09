import { IconUsers } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useTeams } from '@/modules/team'

const TOP_N = 5

export function TeamOverviewWidget() {
  const { t } = useTranslation()
  const { data: teams = [], isLoading, isFetching, refetch } = useTeams()

  const stats = useMemo(() => {
    if (teams.length === 0) return null
    const withCounts = teams.map((team) => ({
      ...team,
      memberCount: Array.isArray(team.members) ? team.members.length : 0,
    }))
    const totalMembers = withCounts.reduce((sum, t) => sum + t.memberCount, 0)
    const avgSize = totalMembers > 0 ? Math.round(totalMembers / teams.length) : 0
    const top = [...withCounts].sort((a, b) => b.memberCount - a.memberCount).slice(0, TOP_N)
    const maxCount = top[0]?.memberCount ?? 1
    return { totalMembers, avgSize, top, maxCount }
  }, [teams])

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {Array.from({ length: TOP_N }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle>{t('dashboard.widgets.teamOverview', 'Team Overview')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.teamOverviewDesc', 'Workforce distribution across teams.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => {
            void refetch()
          }}
          label={t('dashboard.actions.refreshTeamOverview', 'Refresh teams')}
        />
      </CardHeader>
      <CardContent>
        {!stats ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('common.noData', 'No data available')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-xl font-bold tabular-nums">{teams.length}</span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.widgets.totalTeams', 'Teams')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-xl font-bold tabular-nums">
                  {stats.totalMembers.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.widgets.totalMembers', 'Members')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-xl font-bold tabular-nums">{stats.avgSize}</span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.widgets.avgTeamSize', 'Avg size')}
                </span>
              </div>
            </div>

            {/* Top N */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <IconUsers className="h-3 w-3" />
                {t('dashboard.widgets.largestTeams', 'Largest teams')}
              </p>
              {stats.top.map((team) => {
                const pct = Math.round((team.memberCount / stats.maxCount) * 100)
                return (
                  <div key={team.id} className="flex items-center gap-2">
                    <span className="text-sm truncate min-w-0 w-32 shrink-0">{team.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-8 text-right">
                      {team.memberCount}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
