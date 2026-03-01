const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000/dashboard/projects';

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Navigating to:', TARGET_URL);
    await page.goto(TARGET_URL);

    // 1. Verify page loads
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });
    console.log('✅ Projects page loaded');

    // 2. Verify "Create New Project" button
    const createButton = page.getByRole('button', { name: /create/i });
    await createButton.waitFor({ state: 'visible' });
    console.log('✅ "Create New Project" button is visible');

    // 3. Open Form
    await createButton.click();
    // Use a more specific selector if needed
    const sheetTitle = page.getByRole('heading', { name: /create/i });
    await sheetTitle.waitFor({ state: 'visible' });
    console.log('✅ Project creation form opened');

    // 4. Fill form and submit
    await page.getByLabel(/project name/i).fill('E2E Test Project ' + Date.now());
    await page.getByLabel(/description/i).fill('This project was created by Playwright automated test.');
    
    // Select priority - prioritizing accessibility names
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: /high/i }).click();

    // Select status
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /active/i }).click();

    const submitButton = page.getByRole('button', { name: /create project/i });
    await submitButton.click();

    // 5. Verify success
    // Wait for the toast
    await page.waitForSelector('text=Project created successfully', { timeout: 10000 });
    console.log('✅ Project created successfully');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
