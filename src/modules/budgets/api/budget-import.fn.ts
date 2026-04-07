import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import {
  budgetImports,
  budgetRecurrenceRules,
  categories,
  transactions,
} from '@/shared/lib/db/schema'
import {
  analyzeTransactions,
  type AiSuggestion,
  type ImportAnalysis,
} from './budget-import.analyzer'
import { parseFile, type SupportedFileType, type RawTransaction } from './budget-import.parser'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Categorization helper
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryInfo {
  id: string
  name: string
}

/**
 * Ask the active AI provider to assign categories to transaction descriptions.
 * Returns a map of description → category name string.
 * Falls back gracefully if the AI provider is unavailable.
 */
async function categorizeWithAI(
  descriptions: string[],
  categoryList: CategoryInfo[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (descriptions.length === 0 || categoryList.length === 0) return result

  try {
    const { resolveAvailableProviderConfig } =
      await import('@/modules/ai/server/provider-resolution')
    const { getProviderHeaders } = await import('@/modules/ai/providers/headers')

    const resolved = await resolveAvailableProviderConfig()
    if (!resolved) return result

    const { config } = resolved
    const endpoint = `${config.baseUrl}${config.endpoints.chat}`
    const headers = getProviderHeaders(config)

    const categoryNames = categoryList.map((c) => c.name).join(', ')
    const descList = descriptions
      .slice(0, 50)
      .map((d, i) => `${i + 1}. "${d}"`)
      .join('\n')

    const prompt = [
      'You are a financial categorization assistant.',
      'Given a list of bank transaction descriptions and available categories, assign the best matching category to each transaction.',
      'Only use the provided category names. If none match, return null.',
      '',
      `Available categories: ${categoryNames}`,
      '',
      'Return a JSON array where each element has: { "index": <1-based number>, "category": <category name or null> }',
      'Return ONLY the JSON array, no explanation.',
      '',
      'Transactions to categorize:',
      descList,
    ].join('\n')

    const body = JSON.stringify({
      model: config.parameters.model === 'auto' ? undefined : config.parameters.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) return result

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim() ?? ''

    // Extract JSON from the response (may have markdown fences)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return result

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ index: number; category: string | null }>
    for (const item of parsed) {
      const idx = item.index - 1
      if (idx >= 0 && idx < descriptions.length && item.category) {
        result.set(descriptions[idx], item.category)
      }
    }
  } catch {
    // AI categorization is best-effort; never fail the import
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Analysis review — reclassification suggestions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ask the AI to review the heuristic analysis and suggest reclassifications.
 * Returns a list of suggestions (recurring↔direct). Best-effort, never throws.
 */
async function reviewAnalysisWithAI(analysis: ImportAnalysis): Promise<AiSuggestion[]> {
  try {
    const { resolveAvailableProviderConfig } =
      await import('@/modules/ai/server/provider-resolution')
    const { getProviderHeaders } = await import('@/modules/ai/providers/headers')

    const resolved = await resolveAvailableProviderConfig()
    if (!resolved) return []

    const { config } = resolved
    const endpoint = `${config.baseUrl}${config.endpoints.chat}`
    const headers = getProviderHeaders(config)

    const recurringSummary = analysis.recurrences
      .slice(0, 30)
      .map(
        (r) =>
          `- "${r.description}" | ${r.frequency} | avg ${r.averageAmount.toFixed(2)} | ${r.occurrences}x | confidence ${Math.round(r.confidence * 100)}%`,
      )
      .join('\n')

    const directSummary = analysis.oneTimers
      .slice(0, 40)
      .map((t) => `- "${t.description}" | ${t.date} | ${t.amount.toFixed(2)}`)
      .join('\n')

    const prompt = [
      'You are an expert financial analyst reviewing an automated bank statement analysis.',
      'The system has used heuristics to classify transactions as either recurring (scheduled payments/income) or one-time (direct).',
      'Your job is to identify classification mistakes.',
      '',
      'RECURRING (detected by heuristics):',
      recurringSummary || '(none)',
      '',
      'NON-RECURRING / DIRECT (one-timers):',
      directSummary || '(none)',
      '',
      'Rules:',
      '- If a "direct" transaction looks like it could be a regular salary, rent, subscription or bill, suggest making it recurring.',
      '- If a "recurring" entry has only 1-2 occurrences or looks like a coincidence (e.g. same round number twice), suggest making it direct.',
      '- Be conservative: only flag clear mistakes. If unsure, do NOT suggest a change.',
      '- Limit to at most 10 suggestions.',
      '',
      'Return a JSON array (or empty [] if no changes needed):',
      '[{ "description": "<exact description from the lists>", "currentClassification": "recurring"|"direct", "suggestedClassification": "recurring"|"direct", "reason": "<brief reason in English>", "suggestedFrequency": "monthly"|"quarterly"|"semiannual"|"annual"|null }]',
      'Return ONLY the JSON array, no explanation.',
    ].join('\n')

    const body = JSON.stringify({
      model: config.parameters.model === 'auto' ? undefined : config.parameters.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 1024,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) return []

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim() ?? ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      description: string
      currentClassification: string
      suggestedClassification: string
      reason: string
      suggestedFrequency?: string | null
    }>

    return parsed
      .filter(
        (s) =>
          s.description &&
          (s.currentClassification === 'recurring' || s.currentClassification === 'direct') &&
          (s.suggestedClassification === 'recurring' || s.suggestedClassification === 'direct') &&
          s.currentClassification !== s.suggestedClassification,
      )
      .map((s) => ({
        description: s.description,
        currentClassification: s.currentClassification as 'recurring' | 'direct',
        suggestedClassification: s.suggestedClassification as 'recurring' | 'direct',
        reason: s.reason,
        suggestedFrequency: s.suggestedFrequency as AiSuggestion['suggestedFrequency'] | null,
      }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BudgetImport {
  id: string
  createdBy: string
  budgetId: string | null
  fileName: string
  fileType: string
  fileSize: number
  status: 'pending' | 'analyzed' | 'imported' | 'failed'
  rawTransactions: RawTransaction[] | null
  analysis: ImportAnalysis | null
  accountMeta: {
    accountNumber?: string
    accountName?: string
    currency?: string
    dateFrom?: string
    dateTo?: string
    openingBalance?: number
    closingBalance?: number
  } | null
  createdAt: string
  updatedAt: string
}

function serializeImport(row: typeof budgetImports.$inferSelect): BudgetImport {
  return {
    id: row.id,
    createdBy: row.createdBy,
    budgetId: row.budgetId ?? null,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    status: row.status,
    rawTransactions: row.rawTransactions ? JSON.parse(row.rawTransactions) : null,
    analysis: row.analysis ? JSON.parse(row.analysis) : null,
    accountMeta: row.accountMeta ? JSON.parse(row.accountMeta) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Functions
// ─────────────────────────────────────────────────────────────────────────────

const uploadImportSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['csv', 'xlsx', 'pdf']),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024), // 10MB limit
  fileContent: z.string().min(1), // base64
})

const linkImportSchema = z.object({
  importId: z.string().min(1),
  budgetId: z.string().min(1),
})

/** Upload a file, parse it, analyze it, and store the result */
export const uploadAndAnalyzeImportFn = createServerFn({ method: 'POST' })
  .inputValidator(uploadImportSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    // Parse the file
    let parsed
    try {
      parsed = await parseFile(data.fileContent, data.fileType as SupportedFileType)
    } catch (e) {
      throw new Error(`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`)
    }

    if (parsed.transactions.length === 0) {
      throw new Error('No transactions could be extracted from the file.')
    }

    // Analyze
    const analysis = analyzeTransactions(parsed.transactions)

    // AI review pass — suggest reclassifications (best-effort, does not block)
    const aiSuggestions = await reviewAnalysisWithAI(analysis)
    if (aiSuggestions.length > 0) {
      analysis.aiSuggestions = aiSuggestions
    }

    // Store in DB
    const id = crypto.randomUUID()
    await db.insert(budgetImports).values({
      id,
      createdBy: user.id,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileContent: data.fileContent,
      status: 'analyzed',
      rawTransactions: JSON.stringify(parsed.transactions),
      analysis: JSON.stringify(analysis),
      accountMeta: JSON.stringify(parsed.accountMeta),
    })

    const [inserted] = await db
      .select()
      .from(budgetImports)
      .where(eq(budgetImports.id, id))
      .limit(1)

    return serializeImport(inserted)
  })

/** Get a single import by ID */
export const getImportByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [row] = await db.select().from(budgetImports).where(eq(budgetImports.id, id)).limit(1)

    if (!row || row.createdBy !== user.id) {
      throw new Error('Import not found')
    }

    return serializeImport(row)
  })

/** List all imports for the current user */
export const listMyImportsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireCurrentAppUser()
  const db = await loadDb()

  const rows = await db
    .select({
      id: budgetImports.id,
      createdBy: budgetImports.createdBy,
      budgetId: budgetImports.budgetId,
      fileName: budgetImports.fileName,
      fileType: budgetImports.fileType,
      fileSize: budgetImports.fileSize,
      status: budgetImports.status,
      accountMeta: budgetImports.accountMeta,
      createdAt: budgetImports.createdAt,
      updatedAt: budgetImports.updatedAt,
    })
    .from(budgetImports)
    .where(eq(budgetImports.createdBy, user.id))
    .orderBy(desc(budgetImports.createdAt))
    .limit(50)

  return rows.map((row) => ({
    id: row.id,
    createdBy: row.createdBy,
    budgetId: row.budgetId ?? null,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    status: row.status,
    accountMeta: row.accountMeta ? JSON.parse(row.accountMeta) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
})

/** Link an import to a created budget */
export const linkImportToBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(linkImportSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [existing] = await db
      .select()
      .from(budgetImports)
      .where(eq(budgetImports.id, data.importId))
      .limit(1)

    if (!existing || existing.createdBy !== user.id) {
      throw new Error('Import not found')
    }

    await db
      .update(budgetImports)
      .set({ budgetId: data.budgetId, status: 'imported', updatedAt: new Date() })
      .where(eq(budgetImports.id, data.importId))
  })

const applyImportSchema = z.object({
  importId: z.string().min(1),
  budgetId: z.string().min(1),
  /** User-confirmed overrides: descriptions reclassified from recurring→direct or vice versa */
  overrides: z
    .array(
      z.object({
        description: z.string(),
        action: z.enum(['make_recurring', 'make_direct']),
        frequency: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
})

/**
 * Apply parsed transactions from an import record to a budget.
 * Creates one transaction row per raw transaction, amounts converted to cents.
 * Transactions that belong to a recurring rule are tagged with [Auto] prefix
 * so they don't appear as "unplanned direct" in the annual report.
 */
export const applyImportTransactionsFn = createServerFn({ method: 'POST' })
  .inputValidator(applyImportSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [existing] = await db
      .select()
      .from(budgetImports)
      .where(eq(budgetImports.id, data.importId))
      .limit(1)

    if (!existing || existing.createdBy !== user.id) {
      throw new Error('Import not found')
    }

    const rawTransactions: RawTransaction[] = existing.rawTransactions
      ? JSON.parse(existing.rawTransactions)
      : []

    const analysis: ImportAnalysis | null = existing.analysis ? JSON.parse(existing.analysis) : null

    // Apply user overrides to the analysis classification
    const overrideMap = new Map(data.overrides.map((o) => [o.description, o]))

    // Build a set of tx keys that belong to recurring rules (post-overrides)
    const recurringTxKeySet = new Set<string>()

    if (analysis?.recurrences) {
      for (const rec of analysis.recurrences) {
        const override = overrideMap.get(rec.description)
        // Honour user's "make_direct" override — don't tag these as recurring
        if (override?.action === 'make_direct') continue
        for (const key of rec.txKeys ?? []) {
          recurringTxKeySet.add(key)
        }
      }
    }

    // Descriptions from oneTimers that the user wants to promote to recurring
    const makeRecurringDescs = new Set(
      data.overrides.filter((o) => o.action === 'make_recurring').map((o) => o.description),
    )
    if (analysis?.oneTimers) {
      for (const tx of analysis.oneTimers) {
        if (makeRecurringDescs.has(tx.description)) {
          recurringTxKeySet.add(`${tx.date}::${tx.description}`)
        }
      }
    }

    // Fetch all available categories for AI categorization
    const allCategories = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)

    // Get unique descriptions and AI-categorize them (best-effort)
    const uniqueDescriptions = [
      ...new Set(rawTransactions.map((t) => t.description).filter(Boolean)),
    ]
    const aiCategoryMap = await categorizeWithAI(uniqueDescriptions, allCategories)

    // Build description → categoryId lookup
    const categoryIdByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]))
    const categoryIdByDesc = new Map<string, string | null>()
    for (const [desc, catName] of aiCategoryMap) {
      const catId = categoryIdByName.get(catName.toLowerCase()) ?? null
      categoryIdByDesc.set(desc, catId)
    }

    await db.transaction(async (tx) => {
      // Insert each raw transaction as a real transaction linked to the budget.
      // Amounts from the parser are floats (e.g. -1000.00); DB stores integer cents.
      // Transactions matching a recurring rule get an [Auto] description prefix so
      // they are excluded from the "unplanned direct" section of the annual report.
      for (const rawTx of rawTransactions) {
        const categoryId = rawTx.description
          ? (categoryIdByDesc.get(rawTx.description) ?? null)
          : null
        const txKey = `${rawTx.date}::${rawTx.description}`
        const isRecurring = recurringTxKeySet.has(txKey)
        const description = rawTx.description
          ? isRecurring
            ? `[Auto] ${rawTx.description}`
            : rawTx.description
          : null

        await tx.insert(transactions).values({
          id: crypto.randomUUID(),
          budgetId: data.budgetId,
          userId: user.id,
          amount: Math.round(rawTx.amount * 100),
          date: new Date(rawTx.date),
          description,
          categoryId,
          status: 'Approved',
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Build effective recurrences (heuristic + user promotions, minus user demotions)
      const effectiveRecurrences = [
        ...(analysis?.recurrences ?? []).filter((r) => {
          if (r.confidence < 0.5) return false
          const override = overrideMap.get(r.description)
          return override?.action !== 'make_direct'
        }),
      ]

      // User-promoted oneTimers → create recurrence rules for them
      if (analysis?.oneTimers && makeRecurringDescs.size > 0) {
        const grouped = new Map<string, typeof analysis.oneTimers>()
        for (const t of analysis.oneTimers) {
          if (!makeRecurringDescs.has(t.description)) continue
          const key = t.description
          if (!grouped.has(key)) grouped.set(key, [])
          grouped.get(key)!.push(t)
        }
        for (const [desc, txList] of grouped) {
          const override = overrideMap.get(desc)
          const avgAmount = txList.reduce((s, t) => s + t.amount, 0) / txList.length
          const sortedDates = txList.map((t) => t.date).sort()
          effectiveRecurrences.push({
            description: desc,
            normalizedKey: desc.toLowerCase(),
            frequency: (override?.frequency as import('./budget-import.analyzer').RecurrenceFrequency) ?? 'monthly',
            intervalDays: 30,
            averageAmount: avgAmount,
            amounts: txList.map((t) => t.amount),
            type: avgAmount >= 0 ? 'income' : 'expense',
            occurrences: txList.length,
            dates: sortedDates,
            lastDate: sortedDates[sortedDates.length - 1] ?? '',
            confidence: 1,
            txKeys: txList.map((t) => `${t.date}::${t.description}`),
          })
        }
      }

      // Persist effective recurrences as budget recurrence rules
      for (const rec of effectiveRecurrences) {
        const lastDate = new Date(rec.lastDate)
        const nextDate = new Date(lastDate.getTime() + rec.intervalDays * 24 * 60 * 60 * 1000)
        const startDate = rec.dates[0] ? new Date(rec.dates[0]) : lastDate

        await tx.insert(budgetRecurrenceRules).values({
          id: crypto.randomUUID(),
          budgetId: data.budgetId,
          categoryId: null,
          userId: user.id,
          amount: Math.round(rec.averageAmount * 100),
          frequency: rec.frequency,
          interval: 1,
          description: rec.description || null,
          startDate,
          nextDate,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Mark the import as applied
      await tx
        .update(budgetImports)
        .set({ budgetId: data.budgetId, status: 'imported', updatedAt: new Date() })
        .where(eq(budgetImports.id, data.importId))
    })

    const recurrenceCount = (analysis?.recurrences?.filter((r) => r.confidence >= 0.5).length ?? 0) +
      data.overrides.filter((o) => o.action === 'make_recurring').length
    return { count: rawTransactions.length, recurrenceCount }
  })
