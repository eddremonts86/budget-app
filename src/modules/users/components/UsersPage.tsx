import { motion } from 'framer-motion'
import { Trash2, UserPlus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/shared/lib/toast'
import { useCreateUser, useDeleteUser, useInfiniteUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'
import { UserTable } from './UserTable'

export function UsersPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteUsers(10)

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const handleDelete = (user: User) => {
    toast.error(t('users.confirm.delete'), {
      description: t('common.confirm'),
      action: {
        label: t('common.delete'),
        onClick: () => deleteMutation.mutate(user.id),
      },
      duration: 10000,
    })
  }

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
            <h2 className="text-xl font-bold tracking-tight">{t('users.error.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('users.error.description')}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('users.error.retry')}
          </Button>
        </div>
      </motion.div>
    )
  }

  const allUsers = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t('users.title')}
          </h2>
          <p className="text-muted-foreground font-medium">
            {t('users.subtitlePrefix')}
            <span className="text-foreground">{totalCount}</span>
            {t('users.subtitleSuffix')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          {t('users.actions.new')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
        </div>
      ) : (
        <div className="relative group flex-1 min-h-0 flex flex-col">
          <UserTable
            users={allUsers}
            onEdit={setEditingUser}
            onDelete={handleDelete}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollRef={ref}
          />
        </div>
      )}

      {/* Sheets with custom styling */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="sm:max-w-[540px] bg-background/95 backdrop-blur-xl shadow-2xl">
          <CrudSheetHeader
            title={t('users.sheet.createTitle')}
            description={t('users.sheet.createDescription')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
            <UserForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <CrudSheetContent className="sm:max-w-[540px] bg-background/95 backdrop-blur-xl shadow-2xl">
          <CrudSheetHeader
            title={t('users.sheet.editTitle')}
            description={t('users.sheet.editDescription')}
            onClose={() => setEditingUser(null)}
          />
          <CrudSheetBody className="p-6">
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
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
