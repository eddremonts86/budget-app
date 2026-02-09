import { type ColumnDef } from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Mail,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useCreateUser, useDeleteUser, useInfiniteUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'

export function UsersPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteUsers(10)

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Usuario',
      cell: ({ row }) => {
        const avatar = row.original.avatar
        const name = row.original.name
        const email = row.original.email
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground leading-none">{name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" /> {email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol / Acceso',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        const isAdmin = role === 'admin'
        return (
          <Badge
            variant="outline"
            className={cn(
              'capitalize px-3 py-1 rounded-full border-none font-medium',
              isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <div className="flex items-center gap-1.5">
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
              {role}
            </div>
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

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
                onClick={() => setEditingUser(user)}
                className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                className="text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar este usuario?')) {
                    deleteMutation.mutate(user.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Cuenta
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
            <h2 className="text-xl font-bold tracking-tight">Error de Conexión</h2>
            <p className="text-muted-foreground text-sm">
              No pudimos sincronizar la lista de usuarios. Por favor, reintenta en unos momentos.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar Carga
          </Button>
        </div>
      </motion.div>
    )
  }

  const allUsers = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Usuarios
          </h2>
          <p className="text-muted-foreground font-medium">
            Gestiona los niveles de acceso de <span className="text-foreground">{totalCount}</span>{' '}
            miembros del equipo.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
        </div>
      ) : (
        <div className="relative group">
          <DataTable columns={columns} data={allUsers} filterColumn="name" />

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
                      Sincronizando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold">
                      Cargar más usuarios
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sheets with custom styling */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80">
          <SheetHeader className="pb-6 border-b border-border/40">
            <SheetTitle className="text-2xl font-bold tracking-tight">
              Registro de Usuario
            </SheetTitle>
            <SheetDescription className="text-base">
              Crea un nuevo perfil de acceso para tu equipo.
            </SheetDescription>
          </SheetHeader>
          <div className="py-8">
            <UserForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80">
          <SheetHeader className="pb-6 border-b border-border/40">
            <SheetTitle className="text-2xl font-bold tracking-tight">Perfil de Usuario</SheetTitle>
            <SheetDescription className="text-base">
              Actualiza la información de contacto y permisos.
            </SheetDescription>
          </SheetHeader>
          <div className="py-8">
            {editingUser && (
              <UserForm
                defaultValues={editingUser}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingUser.id, data: values })
                  setEditingUser(null)
                }}
                onCancel={() => setEditingUser(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
