
import { test, expect } from '@playwright/test';

test('check projects page', async ({ page }) => {
  // Go to the projects page
  await page.goto('http://localhost:3000/dashboard/projects');

  // Wait for some content to load
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'projects-page-debug.png', fullPage: true });

  // Get the page content
  const content = await page.content();
  // console.log('Page Content:', content);

  // Check if "Projects" title is present
  const title = await page.locator('h2').first().textContent();
  console.log('Title:', title);

  // Check if projects are rendered
  const projectCards = await page.locator('.grid > div').count();
  console.log('Project Cards Count:', projectCards);

  // Check for any text indicating no projects
  const noProjectsText = await page.locator('h3').textContent().catch(() => '');
  console.log('H3 Text:', noProjectsText);
});
