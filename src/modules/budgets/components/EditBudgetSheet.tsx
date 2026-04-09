import { useTranslation } from 'react-i18next'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useUpdateBudget } from '../api/budgets.queries'
import type { UpdateBudgetInput } from '../model/schema'
import type { Budget } from '../model/types'
import { BudgetForm } from './BudgetForm'

interface EditBudgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: Budget
}

export function EditBudgetSheet({ open, onOpenChange, budget }: EditBudgetSheetProps) {
  const { t } = useTranslation()
  const updateBudget = useUpdateBudget()

  const handleSubmit = async (values: Record<string, unknown>) => {
    await updateBudget.mutateAsync({ id: budget.id, ...values } as UpdateBudgetInput)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('budgets.edit.title')}
          description={t('budgets.edit.description')}
          onClose={() => onOpenChange(false)}
          showPing
        />
        <CrudSheetBody>
          <CrudSheetSection>
            <BudgetForm
              defaultValues={budget}
              onSubmit={handleSubmit}
              isSubmitting={updateBudget.isPending}
              mode="edit"
            />
          </CrudSheetSection>
        </CrudSheetBody>
      </CrudSheetContent>
    </Sheet>
  )
}
