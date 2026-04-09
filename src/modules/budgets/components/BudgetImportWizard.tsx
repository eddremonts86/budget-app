import {
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFileTypeXls,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconDownload,
  IconRepeat,
  IconRepeatOff,
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
  CrudSheetActions,
} from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { cn } from '@/shared/lib/utils'
import type { AiSuggestion, DetectedRecurrence } from '../api/budget-import.analyzer'
import type { BudgetImport } from '../api/budget-import.fn'
import type { SupportedFileType } from '../api/budget-import.parser'
import { useUploadAndAnalyzeImport } from '../api/budget-import.queries'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BudgetImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: (importResult: BudgetImport, overrides: ImportOverride[]) => void
}

export interface ImportOverride {
  description: string
  action: 'make_recurring' | 'make_direct'
  frequency?: string
}

type WizardStep = 'upload' | 'analysis' | 'confirm'

const ACCEPTED_TYPES: Record<SupportedFileType, string> = {
  csv: '.csv',
  xlsx: '.xlsx,.xls',
  pdf: '.pdf',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// File type icon
// ─────────────────────────────────────────────────────────────────────────────

function FileTypeIcon({ type, className }: { type: SupportedFileType; className?: string }) {
  switch (type) {
    case 'csv':
      return <IconFileTypeCsv className={cn('size-8 text-green-500', className)} />
    case 'xlsx':
      return <IconFileTypeXls className={cn('size-8 text-emerald-600', className)} />
    case 'pdf':
      return <IconFileTypePdf className={cn('size-8 text-red-500', className)} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiannual: 'Every 6 months',
    annual: 'Annual',
  }
  return map[freq] ?? freq
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Upload
// ─────────────────────────────────────────────────────────────────────────────

interface StepUploadProps {
  onFileSelected: (file: File) => void
}

function StepUpload({ onFileSelected }: StepUploadProps) {
  const { t } = useTranslation()
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const acceptedExtensions = Object.values(ACCEPTED_TYPES).join(',')

  function validateAndSelect(file: File) {
    setError(null)
    if (file.size > MAX_FILE_SIZE) {
      setError(t('budgets.import.errors.fileTooLarge'))
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['csv', 'xlsx', 'xls', 'pdf'].includes(ext)) {
      setError(t('budgets.import.errors.unsupportedType'))
      return
    }
    onFileSelected(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  return (
    <div className="flex flex-col gap-4 justify-center h-full">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <IconUpload className="size-7 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{t('budgets.import.upload.dropLabel')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('budgets.import.upload.dropSub')}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) validateAndSelect(file)
          }}
        />
      </div>

      {/* Supported formats */}
      <div className="flex items-center gap-3 justify-center">
        {(['csv', 'xlsx', 'pdf'] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileTypeIcon type={type} className="size-4" />
            <span className="uppercase font-mono">{type}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground">
          · {t('budgets.import.upload.maxSize', { size: '10 MB' })}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <IconAlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Info box */}
      <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">{t('budgets.import.upload.supportedHint')}</p>
        <p>{t('budgets.import.upload.supportedDesc')}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────────────────────────────────────

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Processing / Analysis result
// ─────────────────────────────────────────────────────────────────────────────

interface StepAnalysisProps {
  file: File
  result: BudgetImport | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
  reclassifications: Map<string, 'recurring' | 'direct'>
  onToggle: (description: string, currentClass: 'recurring' | 'direct') => void
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const variant = pct >= 75 ? 'default' : pct >= 50 ? 'secondary' : 'outline'
  return (
    <Badge variant={variant} className="text-xs shrink-0">
      {pct}%
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reclassifiable recurring row
// ─────────────────────────────────────────────────────────────────────────────

function RecurringRow({
  rec,
  aiSuggestion,
  onMakeDirect,
}: {
  rec: DetectedRecurrence
  aiSuggestion?: AiSuggestion
  onMakeDirect: () => void
}) {
  const isIncome = rec.type === 'income'
  const absAvg = Math.abs(rec.averageAmount)
  const minAmt = Math.min(...rec.amounts.map(Math.abs))
  const maxAmt = Math.max(...rec.amounts.map(Math.abs))
  const hasVariance = maxAmt - minAmt > absAvg * 0.05 // >5% variance

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card text-sm group">
      <div
        className={cn(
          'mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
          isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600',
        )}
      >
        {isIncome ? (
          <IconTrendingUp className="size-3.5" />
        ) : (
          <IconTrendingDown className="size-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-xs">{rec.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <IconClock className="size-2.5" />
            {frequencyLabel(rec.frequency)}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span
            className={cn(
              'text-[10px] font-mono font-semibold',
              isIncome ? 'text-emerald-600' : 'text-red-500',
            )}
          >
            {isIncome ? '+' : '-'} {formatAmount(absAvg)}
            {hasVariance && (
              <span className="text-muted-foreground font-normal ml-0.5">
                ({formatAmount(minAmt)}–{formatAmount(maxAmt)})
              </span>
            )}
          </span>
          <span className="text-[10px] text-muted-foreground">· {rec.occurrences}×</span>
        </div>
        {aiSuggestion && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-0.5">
            <IconSparkles className="size-2.5 shrink-0" />
            AI: {aiSuggestion.reason}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <ConfidenceBadge confidence={rec.confidence} />
        <button
          type="button"
          onClick={onMakeDirect}
          title="Mark as one-time (not recurring)"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
        >
          <IconRepeatOff className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reclassifiable direct row
// ─────────────────────────────────────────────────────────────────────────────

function DemotedRecurringRow({
  rec,
  onRestoreRecurring,
}: {
  rec: DetectedRecurrence
  onRestoreRecurring: () => void
}) {
  const isIncome = rec.type === 'income'
  const absAvg = Math.abs(rec.averageAmount)

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10 text-sm group">
      <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <IconRepeatOff className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-xs">{rec.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground line-through flex items-center gap-0.5">
            <IconClock className="size-2.5" />
            {frequencyLabel(rec.frequency)}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span
            className={cn(
              'text-[10px] font-mono font-semibold',
              isIncome ? 'text-emerald-600' : 'text-amber-600',
            )}
          >
            {isIncome ? '+' : '-'} {formatAmount(absAvg)}
          </span>
          <span className="text-[10px] text-muted-foreground">· {rec.occurrences}×</span>
        </div>
        <p className="text-[10px] text-amber-500 mt-0.5">Reclassified as one-time</p>
      </div>
      <button
        type="button"
        onClick={onRestoreRecurring}
        title="Restore as recurring"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0"
      >
        <IconRepeat className="size-3.5" />
      </button>
    </div>
  )
}

function DirectRow({
  tx,
  aiSuggestion,
  onMakeRecurring,
}: {
  tx: { description: string; amount: number; date: string }
  aiSuggestion?: AiSuggestion
  onMakeRecurring: () => void
}) {
  const isIncome = tx.amount > 0

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10 text-sm group">
      <div
        className={cn(
          'mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
          isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600',
        )}
      >
        <IconAlertTriangle className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-xs">{tx.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{tx.date}</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span
            className={cn(
              'text-[10px] font-mono font-semibold',
              isIncome ? 'text-emerald-600' : 'text-amber-600',
            )}
          >
            {isIncome ? '+' : '-'} {formatAmount(Math.abs(tx.amount))}
          </span>
        </div>
        {aiSuggestion && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
            <IconSparkles className="size-2.5 shrink-0" />
            AI suggests recurring: {aiSuggestion.reason}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onMakeRecurring}
        title="Mark as recurring"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0"
      >
        <IconRepeat className="size-3.5" />
      </button>
    </div>
  )
}

function StepAnalysis({
  file,
  result,
  isLoading,
  error,
  onRetry,
  reclassifications,
  onToggle,
}: StepAnalysisProps) {
  const { t } = useTranslation()
  const analysis = result?.analysis ?? null
  const [showAllDirect, setShowAllDirect] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <IconLoader2 className="size-7 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{t('budgets.import.analysis.processing')}</p>
          <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <IconAlertTriangle className="size-7 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{t('budgets.import.errors.parseFailed')}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
          <IconRefresh className="size-4" />
          {t('budgets.import.actions.retry')}
        </Button>
      </div>
    )
  }

  if (!analysis) return null

  const { summary, recurrences, aiSuggestions } = analysis

  // Build the effective lists respecting user reclassifications
  const aiSuggestionByDesc = new Map((aiSuggestions ?? []).map((s) => [s.description, s]))

  const effectiveRecurring = recurrences
    .filter((r) => r.confidence >= 0.5)
    .filter((r) => reclassifications.get(r.description) !== 'direct')

  const userPromotedToRecurring = Array.from(reclassifications.entries())
    .filter(([, cls]) => cls === 'recurring')
    .map(([desc]) => analysis.oneTimers.find((t) => t.description === desc))
    .filter(Boolean) as typeof analysis.oneTimers

  const effectiveDirect = analysis.oneTimers.filter(
    (t) => reclassifications.get(t.description) !== 'recurring',
  )
  // Also add any recurring rules the user demoted to direct
  const demotedToDirectDesc = new Set(
    Array.from(reclassifications.entries())
      .filter(([, cls]) => cls === 'direct')
      .map(([desc]) => desc),
  )
  const demotedRecurringItems = recurrences.filter(
    (r) => r.confidence >= 0.5 && demotedToDirectDesc.has(r.description),
  )
  const displayDirect = effectiveDirect.slice(0, showAllDirect ? undefined : 10)

  // Deduplicate direct by description (show one representative per description)
  const dedupedDirect = Array.from(new Map(displayDirect.map((t) => [t.description, t])).values())

  const hasAiSuggestions = (aiSuggestions ?? []).length > 0

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* File info */}
      <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
        <FileTypeIcon
          type={file.name.split('.').pop()?.toLowerCase() as SupportedFileType}
          className="size-7"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)} · {summary.transactionCount}{' '}
            {t('budgets.import.analysis.transactions')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFile(file)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={t('budgets.import.actions.downloadOriginal', 'Download original file')}
          >
            <IconDownload className="size-4" />
          </button>
          <div className="flex items-center gap-1">
            <IconCheck className="size-4 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">
              {t('budgets.import.analysis.parsed')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('budgets.summary.income')}</p>
          <p className="text-sm font-semibold text-emerald-600 mt-0.5">
            +{formatAmount(summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('budgets.summary.expenses')}</p>
          <p className="text-sm font-semibold text-red-500 mt-0.5">
            -{formatAmount(summary.totalExpenses)}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg border p-3 text-center',
            summary.netBalance < 0 && 'border-red-200',
          )}
        >
          <p className="text-xs text-muted-foreground">{t('budgets.summary.balance')}</p>
          <p
            className={cn(
              'text-sm font-semibold mt-0.5',
              summary.netBalance >= 0 ? 'text-foreground' : 'text-red-500',
            )}
          >
            {summary.netBalance >= 0 ? '+' : '-'}
            {formatAmount(Math.abs(summary.netBalance))}
          </p>
        </div>
      </div>

      {/* AI hint banner */}
      {hasAiSuggestions && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 rounded-lg p-2.5">
          <IconSparkles className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            AI found {(aiSuggestions ?? []).length} potential classification issues. Check for ✨
            hints below.
          </p>
        </div>
      )}

      {/* Scrollable list area — grows to fill remaining panel height */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-0.5">
        {/* RECURRING SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <IconRepeat className="size-3" />
              Recurring ({effectiveRecurring.length + userPromotedToRecurring.length})
            </p>
            <span className="text-[10px] text-muted-foreground">Hover to reclassify →</span>
          </div>
          {effectiveRecurring.length === 0 && userPromotedToRecurring.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
              {t('budgets.import.analysis.noRecurring')}
            </p>
          ) : (
            <div className="space-y-1.5 pr-1">
              {effectiveRecurring.map((rec, idx) => (
                <RecurringRow
                  key={idx}
                  rec={rec}
                  aiSuggestion={
                    aiSuggestionByDesc.get(rec.description)?.suggestedClassification === 'direct'
                      ? aiSuggestionByDesc.get(rec.description)
                      : undefined
                  }
                  onMakeDirect={() => onToggle(rec.description, 'recurring')}
                />
              ))}
              {userPromotedToRecurring.map((tx, idx) => (
                <div
                  key={`promoted-${idx}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/10 text-xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <IconRepeat className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium truncate">{tx.description}</span>
                    <span className="text-muted-foreground shrink-0">→ monthly</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(tx.description, 'recurring')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
                  >
                    <IconRepeatOff className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DIRECT / UNPLANNED SECTION */}
        {(effectiveDirect.length > 0 || demotedToDirectDesc.size > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <IconAlertTriangle className="size-3" />
                One-time / Unplanned ({effectiveDirect.length + demotedRecurringItems.length})
              </p>
              <span className="text-[10px] text-muted-foreground">Hover to mark recurring →</span>
            </div>
            <div className="space-y-1.5 pr-1">
              {demotedRecurringItems.map((rec, idx) => (
                <DemotedRecurringRow
                  key={`demoted-${idx}`}
                  rec={rec}
                  onRestoreRecurring={() => onToggle(rec.description, 'direct')}
                />
              ))}
              {dedupedDirect.map((tx, idx) => (
                <DirectRow
                  key={idx}
                  tx={tx}
                  aiSuggestion={
                    aiSuggestionByDesc.get(tx.description)?.suggestedClassification === 'recurring'
                      ? aiSuggestionByDesc.get(tx.description)
                      : undefined
                  }
                  onMakeRecurring={() => onToggle(tx.description, 'direct')}
                />
              ))}
            </div>
            {effectiveDirect.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllDirect((v) => !v)}
                className="mt-2 w-full text-xs text-muted-foreground flex items-center justify-center gap-1 py-1 hover:text-foreground transition-colors"
              >
                {showAllDirect ? (
                  <>
                    <IconChevronUp className="size-3" /> Show less
                  </>
                ) : (
                  <>
                    <IconChevronDown className="size-3" /> Show {effectiveDirect.length - 10} more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Date range */}
        {result?.accountMeta?.dateFrom && (
          <p className="text-xs text-muted-foreground text-center">
            Period: {result.accountMeta.dateFrom} — {result.accountMeta.dateTo}
          </p>
        )}
      </div>
      {/* end scrollable list area */}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Confirm & create budget
// ─────────────────────────────────────────────────────────────────────────────

interface StepConfirmProps {
  result: BudgetImport
  file: File
  reclassifications: Map<string, 'recurring' | 'direct'>
}

function StepConfirm({ result, file, reclassifications }: StepConfirmProps) {
  const { t } = useTranslation()
  const analysis = result.analysis!

  const effectiveRecurring = analysis.recurrences
    .filter((r) => r.confidence >= 0.5)
    .filter((r) => reclassifications.get(r.description) !== 'direct')

  const promotedToRecurring = analysis.oneTimers.filter(
    (t) => reclassifications.get(t.description) === 'recurring',
  )

  const directCount = analysis.oneTimers.filter(
    (t) => reclassifications.get(t.description) !== 'recurring',
  ).length

  const incomeRecs = effectiveRecurring.filter((r) => r.type === 'income')
  const expenseRecs = effectiveRecurring.filter((r) => r.type === 'expense')
  const totalRecurrences = effectiveRecurring.length + promotedToRecurring.length

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
        <p className="text-sm font-medium">{t('budgets.import.confirm.readyTitle')}</p>
        <p className="text-xs text-muted-foreground">
          {t('budgets.import.confirm.readyDesc', {
            recurrences: totalRecurrences,
            transactions: analysis.summary.transactionCount,
          })}
        </p>
        {reclassifications.size > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {reclassifications.size} manual reclassification{reclassifications.size > 1 ? 's' : ''}{' '}
            applied
          </p>
        )}
      </div>

      {incomeRecs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t('budgets.import.confirm.incomeRecurrences')}
          </p>
          <div className="space-y-1.5">
            {incomeRecs.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-1.5 px-3 rounded-md bg-emerald-50 dark:bg-emerald-950/20"
              >
                <span className="truncate max-w-[60%] text-xs">{rec.description}</span>
                <span className="text-emerald-600 font-mono font-medium shrink-0 text-xs">
                  +{formatAmount(Math.abs(rec.averageAmount))} / {frequencyLabel(rec.frequency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenseRecs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t('budgets.import.confirm.expenseRecurrences')}
          </p>
          <div className="space-y-1.5">
            {expenseRecs.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-1.5 px-3 rounded-md bg-red-50 dark:bg-red-950/20"
              >
                <span className="truncate max-w-[60%] text-xs">{rec.description}</span>
                <span className="text-red-500 font-mono font-medium shrink-0 text-xs">
                  -{formatAmount(Math.abs(rec.averageAmount))} / {frequencyLabel(rec.frequency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {promotedToRecurring.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Manually added as recurring
          </p>
          <div className="space-y-1.5">
            {promotedToRecurring.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-md bg-blue-50 dark:bg-blue-950/20"
              >
                <span className="truncate max-w-[60%]">{tx.description}</span>
                <span className="text-blue-600 font-medium shrink-0">monthly (user-set)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <span>{directCount} one-time transactions will be imported as-is</span>
        <button
          type="button"
          onClick={() => downloadFile(file)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <IconDownload className="size-3" />
          Original file
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{t('budgets.import.confirm.nextStepHint')}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className={cn(
            'h-1.5 rounded-full transition-all',
            idx <= current ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5',
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Wizard
// ─────────────────────────────────────────────────────────────────────────────

export function BudgetImportWizard({
  open,
  onOpenChange,
  onImportComplete,
}: BudgetImportWizardProps) {
  const { t } = useTranslation()
  const [step, setStep] = React.useState<WizardStep>('upload')
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [importResult, setImportResult] = React.useState<BudgetImport | null>(null)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [reclassifications, setReclassifications] = React.useState<
    Map<string, 'recurring' | 'direct'>
  >(new Map())

  const uploadMutation = useUploadAndAnalyzeImport()

  function reset() {
    setStep('upload')
    setSelectedFile(null)
    setImportResult(null)
    setParseError(null)
    setReclassifications(new Map())
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  async function handleFileSelected(file: File) {
    setSelectedFile(file)
    setParseError(null)
    setReclassifications(new Map())
    setStep('analysis')

    try {
      const fileContent = await fileToBase64(file)
      const ext = file.name.split('.').pop()?.toLowerCase()
      const fileType: 'csv' | 'xlsx' | 'pdf' =
        ext === 'pdf' ? 'pdf' : ext === 'csv' ? 'csv' : 'xlsx'

      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileType,
        fileSize: file.size,
        fileContent,
      })
      setImportResult(result as BudgetImport)
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e)
      setParseError(raw.split('\n')[0].trim() || raw)
    }
  }

  function handleToggle(description: string, currentClass: 'recurring' | 'direct') {
    setReclassifications((prev) => {
      const next = new Map(prev)
      const current = next.get(description)
      if (current !== undefined) {
        // Already overridden — toggle back to original (remove override)
        next.delete(description)
      } else {
        // Override to opposite class
        next.set(description, currentClass === 'recurring' ? 'direct' : 'recurring')
      }
      return next
    })
  }

  function handleRetry() {
    setStep('upload')
    setSelectedFile(null)
    setImportResult(null)
    setParseError(null)
    setReclassifications(new Map())
  }

  function handleContinueToConfirm() {
    setStep('confirm')
  }

  function handleConfirm() {
    if (importResult) {
      // Build the overrides list from reclassifications state
      const overrides: ImportOverride[] = Array.from(reclassifications.entries()).map(
        ([description, targetClass]) => ({
          description,
          action: targetClass === 'recurring' ? 'make_recurring' : 'make_direct',
        }),
      )
      onImportComplete(importResult, overrides)
    }
    handleClose()
  }

  const stepIndex = step === 'upload' ? 0 : step === 'analysis' ? 1 : 2

  const title =
    step === 'upload'
      ? t('budgets.import.title')
      : step === 'analysis'
        ? t('budgets.import.analysis.title')
        : t('budgets.import.confirm.title')

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <CrudSheetContent>
        <CrudSheetHeader
          title={title}
          description={t('budgets.import.description')}
          onClose={handleClose}
          showPing
          actionsSlot={<StepDots current={stepIndex} />}
        />

        <CrudSheetBody className="flex flex-col overflow-hidden">
          <CrudSheetSection className="flex-1 flex flex-col min-h-0">
            {step === 'upload' && <StepUpload onFileSelected={handleFileSelected} />}

            {step === 'analysis' && selectedFile && (
              <StepAnalysis
                file={selectedFile}
                result={importResult}
                isLoading={uploadMutation.isPending}
                error={parseError}
                onRetry={handleRetry}
                reclassifications={reclassifications}
                onToggle={handleToggle}
              />
            )}

            {step === 'confirm' && importResult && selectedFile && (
              <StepConfirm
                result={importResult}
                file={selectedFile}
                reclassifications={reclassifications}
              />
            )}
          </CrudSheetSection>
        </CrudSheetBody>

        <CrudSheetActions>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button disabled>{t('budgets.import.actions.next')}</Button>
            </>
          )}

          {step === 'analysis' && (
            <>
              <Button variant="outline" onClick={handleRetry} className="gap-2">
                <IconArrowLeft className="size-4" />
                {t('budgets.import.actions.back')}
              </Button>
              <Button
                onClick={handleContinueToConfirm}
                disabled={uploadMutation.isPending || !!parseError || !importResult}
                className="gap-2"
              >
                {t('budgets.import.actions.next')}
                <IconArrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('analysis')} className="gap-2">
                <IconArrowLeft className="size-4" />
                {t('budgets.import.actions.back')}
              </Button>
              <Button onClick={handleConfirm} className="gap-2">
                <IconCheck className="size-4" />
                {t('budgets.import.actions.createBudget')}
              </Button>
            </>
          )}
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Util
// ─────────────────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g. "data:text/csv;base64,")
      const base64 = result.split(',')[1] ?? result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
