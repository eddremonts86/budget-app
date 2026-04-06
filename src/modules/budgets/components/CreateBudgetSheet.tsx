import { useTranslation } from 'react-i18next'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useCreateBudget } from '../api/budgets.queries'
import type { CreateBudgetInput } from '../model/schema'
import { BudgetForm } from './BudgetForm'

interface CreateBudgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBudgetSheet({ open, onOpenChange }: CreateBudgetSheetProps) {
  const { t } = useTranslation()
  const createBudget = useCreateBudget()

  const handleSubmit = async (values: Record<string, unknown>) => {
    await createBudget.mutateAsync(values as CreateBudgetInput)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('budgets.create.title')}
          description={t('budgets.create.description')}
          onClose={() => onOpenChange(false)}
          showPing
        />
        <CrudSheetBody>
          <CrudSheetSection>
            <BudgetForm
              onSubmit={handleSubmit}
              isSubmitting={createBudget.isPending}
              mode="create"
            />
          </CrudSheetSection>
        </CrudSheetBody>
      </CrudSheetContent>
    </Sheet>
  )
}
