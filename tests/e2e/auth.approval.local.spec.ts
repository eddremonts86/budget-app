import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { expectDashboard, provisionAccount, signInInBrowser } from './utils/auth-local'
import {
  getTransactionById,
  seedAppUser,
  seedProject,
  seedTransaction,
} from './utils/auth-local-db'

type PlaywrightRequestFactory = {
  request: {
    newContext: (options?: { baseURL?: string }) => Promise<APIRequestContext>
  }
}

async function provisionSeededUser(
  playwright: PlaywrightRequestFactory,
  baseURL: string | undefined,
  prefix: string,
  roleId: 'role_admin' | 'role_project_manager' | 'role_user',
) {
  const email = `${prefix}-${Date.now()}@example.com`
  const name = `Approval ${prefix}`
  const password = 'Passw0rd!234'

  const requestContext = await playwright.request.newContext({ baseURL })

  try {
    await provisionAccount(requestContext, {
      email,
      name,
      password,
    })
  } finally {
    await requestContext.dispose()
  }

  const appUser = await seedAppUser({
    email,
    name,
    roleId,
  })

  return {
    appUser,
    credentials: {
      email,
      name,
      password,
    },
  }
}

test.describe.serial('local auth approval visibility', () => {
  test('admin sees all pending approvals regardless of assignment', async ({
    page,
    playwright,
    baseURL,
  }) => {
    const admin = await provisionSeededUser(playwright, baseURL, 'approval-admin', 'role_admin')
    const manager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-manager',
      'role_project_manager',
    )
    const otherManager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-manager-other',
      'role_project_manager',
    )
    const requester = await seedAppUser({
      email: `approval-requester-${Date.now()}@example.com`,
      name: 'Approval Requester',
      roleId: 'role_user',
    })
    const project = await seedProject({ name: `Approval Project ${Date.now()}` })

    const ownAssignedCustomer = `Assigned to manager ${Date.now()}`
    const otherAssignedCustomer = `Assigned to other manager ${Date.now()}`

    await seedTransaction({
      customerName: ownAssignedCustomer,
      customerEmail: 'assigned-manager@example.com',
      amount: 2400,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: manager.appUser.id,
    })

    await seedTransaction({
      customerName: otherAssignedCustomer,
      customerEmail: 'assigned-other@example.com',
      amount: 3600,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: otherManager.appUser.id,
    })

    await page.goto('/auth')
    await signInInBrowser(page, admin.credentials)
    await expectDashboard(page)
    await page.goto('/dashboard/transactions')

    await expect(page.getByTestId('transactions-tab-approval')).toBeVisible()
    await page.getByTestId('transactions-tab-approval').click()

    const pendingPanel = page.getByTestId('transactions-pending-panel')

    await expect(page.getByTestId('dashboard-notification-trigger')).toBeVisible()
    await expect(page.getByTestId('dashboard-notification-badge')).toHaveText('2')
    await expect(page.getByTestId('transactions-tab-approval')).toBeVisible()
    await expect(pendingPanel).toContainText(ownAssignedCustomer)
    await expect(pendingPanel).toContainText(otherAssignedCustomer)
  })

  test('project manager sees only assigned pending approvals', async ({
    page,
    playwright,
    baseURL,
  }) => {
    const manager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-pm',
      'role_project_manager',
    )
    const otherManager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-pm-other',
      'role_project_manager',
    )
    const requester = await seedAppUser({
      email: `approval-requester-pm-${Date.now()}@example.com`,
      name: 'Approval Requester PM',
      roleId: 'role_user',
    })
    const project = await seedProject({ name: `Approval Project PM ${Date.now()}` })

    const ownAssignedCustomer = `PM assigned ${Date.now()}`
    const otherAssignedCustomer = `PM not assigned ${Date.now()}`

    await seedTransaction({
      customerName: ownAssignedCustomer,
      customerEmail: 'pm-assigned@example.com',
      amount: 1100,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: manager.appUser.id,
    })

    await seedTransaction({
      customerName: otherAssignedCustomer,
      customerEmail: 'pm-other@example.com',
      amount: 2200,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: otherManager.appUser.id,
    })

    await page.goto('/auth')
    await signInInBrowser(page, manager.credentials)
    await expectDashboard(page)
    await page.goto('/dashboard/transactions')

    await expect(page.getByTestId('transactions-tab-approval')).toBeVisible()
    await page.getByTestId('transactions-tab-approval').click()

    const pendingPanel = page.getByTestId('transactions-pending-panel')

    await expect(page.getByTestId('dashboard-notification-trigger')).toBeVisible()
    await expect(page.getByTestId('dashboard-notification-badge')).toHaveText('1')
    await expect(page.getByTestId('transactions-tab-approval')).toBeVisible()
    await expect(pendingPanel).toContainText(ownAssignedCustomer)
    await expect(pendingPanel).not.toContainText(otherAssignedCustomer)
  })

  test('regular users do not see approval-specific actions', async ({
    page,
    playwright,
    baseURL,
  }) => {
    const regularUser = await provisionSeededUser(playwright, baseURL, 'approval-user', 'role_user')
    const manager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-user-pm',
      'role_project_manager',
    )
    const requester = await seedAppUser({
      email: `approval-requester-user-${Date.now()}@example.com`,
      name: 'Approval Requester User',
      roleId: 'role_user',
    })
    const project = await seedProject({ name: `Approval Project User ${Date.now()}` })

    await seedTransaction({
      customerName: `User hidden approval ${Date.now()}`,
      customerEmail: 'user-hidden@example.com',
      amount: 1300,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: manager.appUser.id,
    })

    await page.goto('/auth')
    await signInInBrowser(page, regularUser.credentials)
    await expectDashboard(page)
    await page.goto('/dashboard/transactions')

    await expect(page.getByTestId('dashboard-notification-trigger')).toHaveCount(0)
    await expect(page.getByTestId('transactions-tab-approval')).toHaveCount(0)
    await expect(page.getByTestId('transactions-tab-history')).toBeVisible()
  })

  test('project manager can approve an assigned transaction and the change persists', async ({
    page,
    playwright,
    baseURL,
  }) => {
    const manager = await provisionSeededUser(
      playwright,
      baseURL,
      'approval-persist-pm',
      'role_project_manager',
    )
    const requester = await seedAppUser({
      email: `approval-requester-persist-${Date.now()}@example.com`,
      name: 'Approval Persist Requester',
      roleId: 'role_user',
    })
    const project = await seedProject({ name: `Approval Persist Project ${Date.now()}` })
    const customerName = `Persist approval ${Date.now()}`
    const transaction = await seedTransaction({
      customerName,
      customerEmail: 'persist-approval@example.com',
      amount: 1900,
      userId: requester.id,
      projectId: project.id,
      assignedAdminId: manager.appUser.id,
    })

    await page.goto('/auth')
    await signInInBrowser(page, manager.credentials)
    await expectDashboard(page)
    await page.goto('/dashboard/transactions')
    await expect(page.getByTestId('transactions-tab-approval')).toBeVisible()
    await page.getByTestId('transactions-tab-approval').click()

    await expect(page.getByTestId('transactions-pending-panel')).toContainText(customerName)
    await page.getByTestId(`transactions-approve-${transaction.id}`).dispatchEvent('click')
    await expect(page.getByTestId('transactions-confirm-panel')).toBeVisible()
    await page.getByTestId('transactions-confirm-approve').click()

    await expect
      .poll(async () => await getTransactionById(transaction.id))
      .toMatchObject({
        id: transaction.id,
        status: 'Approved',
        approvedBy: manager.appUser.id,
      })
  })
})
