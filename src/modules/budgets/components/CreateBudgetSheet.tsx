import { useTranslation } from 'react-i18next'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useCreateBudget } from '../api/budgets.queries'
import { useApplyImportTransactions } from '../api/budget-import.queries'
import type { ImportOverride } from './BudgetImportWizard'
import type { CreateBudgetInput } from '../model/schema'
import { BudgetForm } from './BudgetForm'

interface CreateBudgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importId?: string | null
  importOverrides?: ImportOverride[]
}

export function CreateBudgetSheet({
  open,
  onOpenChange,
  importId,
  importOverrides,
}: CreateBudgetSheetProps) {
  const { t } = useTranslation()
  const createBudget = useCreateBudget()
  const applyImport = useApplyImportTransactions()

  const handleSubmit = async (values: Record<string, unknown>) => {
    const budget = await createBudget.mutateAsync(values as CreateBudgetInput)
    if (importId && budget?.id) {
      await applyImport.mutateAsync({
        importId,
        budgetId: budget.id,
        overrides: importOverrides ?? [],
      })
    }
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
              isSubmitting={createBudget.isPending || applyImport.isPending}
              mode="create"
            />
          </CrudSheetSection>
        </CrudSheetBody>
      </CrudSheetContent>
    </Sheet>
  )
}
