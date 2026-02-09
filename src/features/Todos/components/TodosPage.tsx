import { type ColumnDef } from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  Clock,
  Flag,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup } from '@/components/ui/field'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { DataTable } from '@/shared/ui/DataTable'
import { useCreateTodo, useDeleteTodo, useInfiniteTodos, useUpdateTodo } from '../api/todos.queries'
import type { Todo } from '../model/types'
import { TodoForm } from './TodoForm'

export function TodosPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteTodos(10)

  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()

  const columns: ColumnDef<Todo>[] = [
    {
      accessorKey: 'title',
      header: 'Tarea',
      cell: ({ row }) => {
        const title = row.getValue('title') as string
        const dueDate = row.original.dueDate
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground leading-tight">{title}</span>
            {dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants: Record<string, string> = {
          completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        }
        const labels: Record<string, string> = {
          completed: 'Completada',
          in_progress: 'En Progreso',
          pending: 'Pendiente',
        }
        return (
          <Badge
            variant="outline"
            className={cn('capitalize px-3 py-1 rounded-full border font-medium', variants[status])}
          >
            {labels[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        const variants: Record<string, string> = {
          high: 'bg-destructive/10 text-destructive border-destructive/20',
          medium: 'bg-primary/10 text-primary border-primary/20',
          low: 'bg-secondary text-secondary-foreground border-transparent',
        }
        return (
          <Badge
            variant="outline"
            className={cn(
              'capitalize px-3 py-1 rounded-full border font-medium',
              variants[priority],
            )}
          >
            <div className="flex items-center gap-1.5">
              <Flag className="w-3 h-3" />
              {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
            </div>
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 opacity-50" />
            <span className="text-xs font-medium">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const todo = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-secondary/80">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 p-2 rounded-2xl shadow-2xl backdrop-blur-xl border-border/40"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Opciones
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setEditingTodo(todo)}
                className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar Tarea
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                className="text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                    deleteMutation.mutate(todo.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-[400px]"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Error de Carga</h2>
            <p className="text-muted-foreground text-sm">
              No pudimos recuperar tus tareas. Revisa tu conexión e intenta de nuevo.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </motion.div>
    )
  }

  const allTodos = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <FieldGroup className="space-y-8 animate-in fade-in duration-500">
      <Field className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Tareas
          </h2>
          <p className="text-muted-foreground font-medium">
            Gestiona tu flujo de trabajo. Tienes{' '}
            <span className="text-foreground">{totalCount}</span> tareas activas.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Tarea
        </Button>
      </Field>

      {isLoading ? (
        <FieldGroup className="space-y-4">
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
        </FieldGroup>
      ) : (
        <Field className="relative group">
          <DataTable columns={columns} data={allTodos} filterColumn="title" />

          <AnimatePresence>
            {hasNextPage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-12 pb-12"
              >
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="h-12 px-10 rounded-2xl border-dashed border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Cargando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold">
                      Ver más tareas
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Field>
      )}

      {/* Sheets with custom styling and proper padding */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 overflow-y-auto">
          <SheetHeader className="pb-6 border-b border-border/40">
            <SheetTitle className="text-2xl font-bold tracking-tight">Crear Tarea</SheetTitle>
            <SheetDescription className="text-base">
              Añade una nueva tarea a tu lista. Completa los detalles a continuación.
            </SheetDescription>
          </SheetHeader>
          <Field className="py-8 px-4">
            <TodoForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </Field>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 overflow-y-auto">
          <SheetHeader className="pb-6 border-b border-border/40">
            <SheetTitle className="text-2xl font-bold tracking-tight">Editar Tarea</SheetTitle>
            <SheetDescription className="text-base">
              Actualiza los detalles de tu tarea. Los cambios se guardarán inmediatamente.
            </SheetDescription>
          </SheetHeader>
          <Field className="py-8 px-4">
            {editingTodo && (
              <TodoForm
                defaultValues={editingTodo}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingTodo.id, data: values })
                  setEditingTodo(null)
                }}
                onCancel={() => setEditingTodo(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </Field>
        </SheetContent>
      </Sheet>
    </FieldGroup>
  )
}
