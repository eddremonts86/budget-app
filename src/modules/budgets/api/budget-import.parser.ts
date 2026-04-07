/**
 * Budget Import Parser
 *
 * Generic parser for CSV, XLSX, and PDF bank statements.
 * Supports multi-language column headers: English, Danish, Spanish.
 */
import { createRequire } from 'node:module'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedFileType = 'csv' | 'xlsx' | 'pdf'

export interface RawTransaction {
  date: string // ISO date string
  description: string
  amount: number // positive = income, negative = expense
  balance?: number
  category?: string
  mainCategory?: string
  accountNumber?: string
  accountName?: string
  currency?: string
}

export interface ParsedImport {
  transactions: RawTransaction[]
  accountMeta: {
    accountNumber?: string
    accountName?: string
    currency?: string
    dateFrom?: string
    dateTo?: string
    openingBalance?: number
    closingBalance?: number
  }
  rawText?: string // for debugging
}

// ─────────────────────────────────────────────────────────────────────────────
// Column name mappings (multi-language)
// ─────────────────────────────────────────────────────────────────────────────

const DATE_COLUMNS = [
  'date',
  'dato',
  'fecha',
  'bookingdato',
  'valuedato',
  'booking date',
  'value date',
  'transaction date',
  'transactiondate',
  'posting date',
  'booked',
]

const DESCRIPTION_COLUMNS = [
  'text',
  'tekst',
  'descripcion',
  'descripción',
  'description',
  'narration',
  'details',
  'detalles',
  'narrative',
  'merchant',
  'payee',
  'memo',
  'note',
  'notes',
  'reference',
  'referencia',
]

const AMOUNT_COLUMNS = [
  'amount',
  'beløb',
  'belob',
  'monto',
  'importe',
  'cantidad',
  'transaction amount',
  'transactionamount',
  'sum',
  'credit/debit',
]

const BALANCE_COLUMNS = [
  'balance',
  'saldo',
  'balance after',
  'running balance',
  'account balance',
  'closing balance',
]

const CATEGORY_COLUMNS = [
  'category',
  'kategori',
  'categoría',
  'categoria',
  'type',
  'type of transaction',
]

const MAIN_CATEGORY_COLUMNS = [
  'maincategory',
  'main category',
  'hovedkategori',
  'categoríaprincipal',
  'main_category',
  'transaction type',
]

const ACCOUNT_NUMBER_COLUMNS = [
  'accountnumber',
  'account number',
  'kontonummer',
  'número de cuenta',
  'numero_cuenta',
  'account no',
  'acc no',
]

const ACCOUNT_NAME_COLUMNS = [
  'accountname',
  'account name',
  'kontonavn',
  'nombre de cuenta',
  'account',
  'cuenta',
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '')
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalizedHeaders = headers.map((h) => normalizeHeader(h))
  const normalizedCandidates = candidates.map((c) => normalizeHeader(c))
  for (const candidate of normalizedCandidates) {
    const idx = normalizedHeaders.indexOf(candidate)
    if (idx !== -1) return headers[idx]
  }
  return null
}

/**
 * Parse a number string with various locale formats.
 * Handles: "1,500.00" (EN), "1.500,00" (EU/DA/ES), "1500.00", "-1,000.00 "
 */
export function parseAmount(raw: string | number): number {
  if (typeof raw === 'number') return raw
  if (!raw) return 0

  const str = String(raw).trim().replace(/\s/g, '')
  if (!str) return 0

  // Strip leading/trailing quotes
  const cleaned = str.replace(/^["']|["']$/g, '')

  // Determine format: European (,00) vs American/EN (,000.)
  // If last separator is comma and there are exactly 2 digits after → European
  const lastCommaIdx = cleaned.lastIndexOf(',')
  const lastDotIdx = cleaned.lastIndexOf('.')

  let normalized: string
  if (lastCommaIdx > lastDotIdx) {
    // European: 1.500,00 → remove dots, replace comma with dot
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    // American: 1,500.00 → remove commas
    normalized = cleaned.replace(/,/g, '')
  }

  const result = parseFloat(normalized)
  return isNaN(result) ? 0 : result
}

/**
 * Parse a date string in various formats.
 * Returns ISO date string or the original if unparseable.
 */
export function parseDate(raw: string): string {
  if (!raw) return ''
  const str = String(raw).trim()

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)

  // DD.MM.YYYY (Danish/European)
  const dmyDot = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dmyDot) {
    const [, d, m, y] = dmyDot
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // DD/MM/YYYY
  const dmySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmySlash) {
    const [, d, m, y] = dmySlash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // MM/DD/YYYY (US)
  const mdySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (mdySlash) {
    const [, m, d, y] = mdySlash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Try native Date parse
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)

  return str
}

/** Map a row object (with original header keys) into a RawTransaction */
function mapRow(row: Record<string, string>, headers: string[]): RawTransaction | null {
  const dateCol = findColumn(headers, DATE_COLUMNS)
  const descCol = findColumn(headers, DESCRIPTION_COLUMNS)
  const amountCol = findColumn(headers, AMOUNT_COLUMNS)
  const balanceCol = findColumn(headers, BALANCE_COLUMNS)
  const categoryCol = findColumn(headers, CATEGORY_COLUMNS)
  const mainCatCol = findColumn(headers, MAIN_CATEGORY_COLUMNS)
  const accountNumCol = findColumn(headers, ACCOUNT_NUMBER_COLUMNS)
  const accountNameCol = findColumn(headers, ACCOUNT_NAME_COLUMNS)

  if (!dateCol || !amountCol) return null

  const dateRaw = row[dateCol] ?? ''
  const amountRaw = row[amountCol] ?? '0'

  const date = parseDate(dateRaw)
  if (!date) return null

  const amount = parseAmount(amountRaw)

  return {
    date,
    description: descCol ? (row[descCol] ?? '').trim() : '',
    amount,
    balance: balanceCol ? parseAmount(row[balanceCol] ?? '') : undefined,
    category: categoryCol ? (row[categoryCol] ?? '').trim() || undefined : undefined,
    mainCategory: mainCatCol ? (row[mainCatCol] ?? '').trim() || undefined : undefined,
    accountNumber: accountNumCol ? (row[accountNumCol] ?? '').trim() || undefined : undefined,
    accountName: accountNameCol ? (row[accountNameCol] ?? '').trim() || undefined : undefined,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Parser
// ─────────────────────────────────────────────────────────────────────────────

/** Detect the delimiter used in a CSV file */
function detectDelimiter(firstLine: string): string {
  const delimiters = [';', ',', '\t', '|']
  let bestCount = 0
  let bestDelim = ','
  for (const d of delimiters) {
    const count = firstLine.split(d).length
    if (count > bestCount) {
      bestCount = count
      bestDelim = d
    }
  }
  return bestDelim
}

export function parseCSV(content: string): ParsedImport {
  const lines = content.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { transactions: [], accountMeta: {} }

  const delimiter = detectDelimiter(lines[0])
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim())

  const transactions: RawTransaction[] = []
  const accountMeta: ParsedImport['accountMeta'] = {}

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim())
    if (cells.length < 2) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })

    const tx = mapRow(row, headers)
    if (tx) {
      if (!accountMeta.accountNumber && tx.accountNumber) {
        accountMeta.accountNumber = tx.accountNumber
      }
      if (!accountMeta.accountName && tx.accountName) {
        accountMeta.accountName = tx.accountName
      }
      transactions.push(tx)
    }
  }

  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).sort()
    accountMeta.dateFrom = dates[0]
    accountMeta.dateTo = dates[dates.length - 1]
    const lastBalance = transactions[0]?.balance
    const firstBalance = transactions[transactions.length - 1]?.balance
    if (lastBalance !== undefined) accountMeta.closingBalance = lastBalance
    if (firstBalance !== undefined) accountMeta.openingBalance = firstBalance
  }

  return { transactions, accountMeta }
}

// ─────────────────────────────────────────────────────────────────────────────
// XLSX Parser (server-side only)
// ─────────────────────────────────────────────────────────────────────────────

export async function parseXLSX(buffer: Buffer): Promise<ParsedImport> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { transactions: [], accountMeta: {} }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rows.length === 0) return { transactions: [], accountMeta: {} }

  const headers = Object.keys(rows[0])
  const transactions: RawTransaction[] = []
  const accountMeta: ParsedImport['accountMeta'] = {}

  for (const row of rows) {
    const stringRow: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) {
        stringRow[k] = v.toISOString().slice(0, 10)
      } else {
        stringRow[k] = String(v ?? '')
      }
    }
    const tx = mapRow(stringRow, headers)
    if (tx) {
      if (!accountMeta.accountNumber && tx.accountNumber) {
        accountMeta.accountNumber = tx.accountNumber
      }
      if (!accountMeta.accountName && tx.accountName) {
        accountMeta.accountName = tx.accountName
      }
      transactions.push(tx)
    }
  }

  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).sort()
    accountMeta.dateFrom = dates[0]
    accountMeta.dateTo = dates[dates.length - 1]
  }

  return { transactions, accountMeta }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Parser (server-side only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PDF bank statements typically have lines like:
 *   "01.04.2026  Privatkonto  -1,000.00  3,858.29"
 * We extract text and attempt heuristic line parsing.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedImport> {
  // pdf-parse v2 exports an object with a PDFParse class, not a function
  const _require = createRequire(import.meta.url)
  const { PDFParse } = _require('pdf-parse') as {
    PDFParse: new (opts: { data: Uint8Array }) => { getText: () => Promise<{ text: string }> }
  }
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  return parsePDFText(result.text)
}

export function parsePDFText(text: string): ParsedImport {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const transactions: RawTransaction[] = []
  const accountMeta: ParsedImport['accountMeta'] = {}

  // Date pattern: DD.MM.YYYY | DD/MM/YYYY | YYYY-MM-DD
  const datePattern = /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})/

  // Amount pattern (for reference only)
  // Extracted via matchAll below

  for (const line of lines) {
    // Skip header-like lines
    if (line.length < 10) continue
    if (!datePattern.test(line)) continue

    // Extract date
    const dateMatch = line.match(datePattern)
    if (!dateMatch) continue
    const date = parseDate(dateMatch[1])
    if (!date) continue

    // The rest after date
    const rest = line.slice(dateMatch[0].length).trim()
    if (!rest) continue

    // Try to extract trailing numbers (balance, then amount)
    // Pattern: "Description amount balance"
    // We look for the last two numbers
    const numberPattern = /-?[\d.,]+/g
    const allNumbers = [...rest.matchAll(numberPattern)].map((m) => ({
      value: parseAmount(m[0]),
      index: m.index!,
    }))

    if (allNumbers.length === 0) continue

    // Last number = balance, second to last = amount (if 2+ numbers found)
    // If only 1 number, it's the amount
    let amount: number
    let balance: number | undefined
    let descriptionEnd: number

    if (allNumbers.length >= 2) {
      const last = allNumbers[allNumbers.length - 1]
      const secondLast = allNumbers[allNumbers.length - 2]
      balance = last.value
      amount = secondLast.value
      descriptionEnd = secondLast.index
    } else {
      const only = allNumbers[0]
      amount = only.value
      descriptionEnd = only.index
    }

    // Description is the text between date and first amount
    const description = rest.slice(0, descriptionEnd).trim()

    if (!description && amount === 0) continue

    transactions.push({ date, description, amount, balance })
  }

  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).sort()
    accountMeta.dateFrom = dates[0]
    accountMeta.dateTo = dates[dates.length - 1]
    const lastTx = transactions[0]
    const firstTx = transactions[transactions.length - 1]
    if (lastTx.balance !== undefined) accountMeta.closingBalance = lastTx.balance
    if (firstTx.balance !== undefined) accountMeta.openingBalance = firstTx.balance
  }

  return { transactions, accountMeta, rawText: text }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function parseFile(
  base64Content: string,
  fileType: SupportedFileType,
): Promise<ParsedImport> {
  const buffer = Buffer.from(base64Content, 'base64')

  switch (fileType) {
    case 'csv': {
      const text = buffer.toString('utf-8')
      return parseCSV(text)
    }
    case 'xlsx': {
      return parseXLSX(buffer)
    }
    case 'pdf': {
      return parsePDF(buffer)
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
