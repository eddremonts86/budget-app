
import { test, expect } from '@playwright/test';

test('check projects page', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  console.log('Navigating to projects page...');
  await page.goto('http://localhost:3000/dashboard/projects', { waitUntil: 'networkidle' });
  
  console.log('Waiting for 2 seconds to let data load...');
  await page.waitForTimeout(2000);

  console.log('--- BROWSER LOGS ---');
  logs.forEach(log => console.log(log));
  console.log('--------------------');

  if (errors.length > 0) {
    console.log('--- BROWSER ERRORS ---');
    errors.forEach(err => console.error(err));
    console.log('----------------------');
  }

  const projects = await page.locator('.grid > .card, .grid > div').count();
  console.log(`Found ${projects} projects in the grid`);

  // Take a screenshot
  await page.screenshot({ path: 'projects-page.png' });
});
