import { randomUUID } from 'node:crypto'
import { chromium, type Page } from '@playwright/test'
import {
  getTransactionById,
  seedAppUser,
  seedProject,
  seedTransaction,
} from '../../tests/e2e/utils/auth-local-db'

const baseUrl = process.env.AUTH_E2E_BASE_URL ?? 'http://127.0.0.1:3110'

interface BrowserAuthResult {
  ok: boolean
  status: number
  payload: unknown
}

async function signInInBrowser(email: string, password: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded' })

    const authResult = await page.evaluate(
      async (credentials) => {
        const response = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        })

        let payload: unknown

        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        return {
          ok: response.ok,
          status: response.status,
          payload,
        }
      },
      { email, password },
    )

    return {
      browser,
      page,
      authResult: authResult as BrowserAuthResult,
    }
  } catch (error) {
    await browser.close()
    throw error
  }
}

async function waitForText(testId: string, expectedText: string, page: Page) {
  await page.waitForFunction(
    ({ targetTestId, targetText }) => {
      const element = document.querySelector(`[data-testid="${targetTestId}"]`)
      return Boolean(element?.textContent?.includes(targetText))
    },
    { targetTestId: testId, targetText: expectedText },
    { timeout: 10000 },
  )
}

async function waitForApprovedTransaction(transactionId: string, managerId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const transaction = await getTransactionById(transactionId)

    if (transaction?.status === 'Approved' && transaction.approvedBy === managerId) {
      return transaction
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error('Timed out waiting for approved transaction to persist')
}

async function clickByTestId(page: Page, testId: string) {
  const locator = page.getByTestId(testId)

  await locator.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForFunction(
    (targetTestId) => {
      const element = document.querySelector<HTMLButtonElement>(`[data-testid="${targetTestId}"]`)
      return Boolean(element && !element.disabled)
    },
    testId,
    { timeout: 10000 },
  )

  await locator.evaluate((element) => {
    ;(element as HTMLButtonElement).click()
  })
}

async function main() {
  const now = Date.now()
  const managerEmail = `approval-smoke-pm-${now}@example.com`
  const managerName = `Approval Smoke PM ${now}`
  const password = 'Passw0rd!234'
  const customerName = `Approval Smoke Customer ${now}`

  const requester = await seedAppUser({
    email: `approval-smoke-requester-${now}@example.com`,
    name: `Approval Smoke Requester ${now}`,
    roleId: 'role_user',
  })

  const project = await seedProject({
    name: `Approval Smoke Project ${now}`,
  })

  const signUpResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
    },
    body: JSON.stringify({
      email: managerEmail,
      name: managerName,
      password,
    }),
  })

  if (!signUpResponse.ok) {
    const body = await signUpResponse.text()
    throw new Error(`Unable to provision auth-local manager: ${signUpResponse.status} ${body}`)
  }

  const manager = await seedAppUser({
    email: managerEmail,
    name: managerName,
    roleId: 'role_project_manager',
  })

  const transaction = await seedTransaction({
    id: randomUUID(),
    customerName,
    customerEmail: 'approval-smoke@example.com',
    amount: 1900,
    userId: requester.id,
    projectId: project.id,
    assignedAdminId: manager.id,
  })

  const { browser, page, authResult } = await signInInBrowser(managerEmail, password)

  try {
    if (!authResult.ok) {
      throw new Error(
        `Browser sign-in failed: ${authResult.status} ${JSON.stringify(authResult.payload)}`,
      )
    }

    await page.goto(`${baseUrl}/dashboard/transactions`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page
      .getByTestId('transactions-tab-approval')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('transactions-tab-approval').click()

    await waitForText('transactions-pending-panel', customerName, page)

    await clickByTestId(page, `transactions-approve-${transaction.id}`)
    await page
      .getByTestId('transactions-confirm-panel')
      .waitFor({ state: 'visible', timeout: 10000 })
    await clickByTestId(page, 'transactions-confirm-approve')

    const approvedTransaction = await waitForApprovedTransaction(transaction.id, manager.id)

    console.log(
      JSON.stringify(
        {
          status: 'passed',
          baseUrl,
          transactionId: transaction.id,
          managerId: manager.id,
          approvedBy: approvedTransaction.approvedBy,
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error(
    JSON.stringify(
      {
        status: 'failed',
        baseUrl,
        message,
        stack,
      },
      null,
      2,
    ),
  )

  process.exit(1)
})
