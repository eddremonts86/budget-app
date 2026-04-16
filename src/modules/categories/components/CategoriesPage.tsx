import { Plus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useInfiniteCategories } from '../api/categories.queries'
import { useCreateCategory, useUpdateCategory } from '../api/categories.queries'
import type { Category } from '../model/types'
import { CategoriesListView } from '../ui/views/CategoriesListView'
import { CategoryForm } from './CategoryForm'

export function CategoriesPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const { data: catData } = useInfiniteCategories()
  const totalCount = catData?.pages[0]?.totalCount ?? 0

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('categories.title')}
            {totalCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal text-2xl">
                ({totalCount})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {t('categories.subtitle', 'Organize and manage your project categories.')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('categories.add')}
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <CategoriesListView onEdit={setEditingCategory} />
      </div>

      {/* Create Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="sm:max-w-[540px]">
          <CrudSheetHeader
            title={t('categories.add')}
            description={t('categories.description.create')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
            <CategoryForm
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

      {/* Edit Sheet */}
      <Sheet open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <CrudSheetContent className="sm:max-w-[540px]">
          <CrudSheetHeader
            title={t('common.edit')}
            description={t('categories.description.edit')}
            onClose={() => setEditingCategory(null)}
          />
          <CrudSheetBody className="p-6">
            {editingCategory && (
              <CategoryForm
                defaultValues={editingCategory}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingCategory.id, data: values })
                  setEditingCategory(null)
                }}
                onCancel={() => setEditingCategory(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
