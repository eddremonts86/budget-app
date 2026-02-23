import { IconSearch } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { projectPerformanceQueryOptions } from '../api/analytics.queries'

export function ProjectPerformance() {
  const { data, isLoading } = useQuery(projectPerformanceQueryOptions)
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  const filteredData = data?.filter(
    (project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.status.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>Overview of project progress and budget usage</CardDescription>
          </div>
          <InputGroup className="max-w-[200px]">
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search projects..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget Used</TableHead>
              <TableHead className="w-[300px]">Task Completion</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  ${project.spent.toLocaleString()} / ${project.budget?.toLocaleString() ?? '0'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="w-[60%]" />
                    <span className="text-xs text-muted-foreground">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {project.completedTaskCount} / {project.taskCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
