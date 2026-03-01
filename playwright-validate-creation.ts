import { chromium, type ConsoleMessage } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg: ConsoleMessage) => {
    console.log(`BROWSER LOG: [${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err: Error) => {
    console.log(`BROWSER ERROR: ${err.message}`);
  });

  console.log('Navigating to http://localhost:3000/dashboard/projects');
  await page.goto('http://localhost:3000/dashboard/projects');

  // Wait for projects to load
  await page.waitForTimeout(3000);

  console.log('Clicking "Create Project" button');
  const createBtn = page.locator('button:has-text("Create Project")');
  await createBtn.click();

  // Wait for the sheet to open
  await page.waitForSelector('h2:has-text("Create New Project")');
  console.log('Create Project Sheet is open');

  // Check if Team field is present
  const teamLabel = page.locator('label:has-text("Team Members")');
  const teamLabelCount = await teamLabel.count();
  console.log(`Team Members label found: ${teamLabelCount > 0}`);

  if (teamLabelCount > 0) {
    // Try to click the combobox to see if users are listed
    const combobox = page.locator('input[placeholder*="team"]');
    const comboboxCount = await combobox.count();
    console.log(`Team combobox found: ${comboboxCount > 0}`);
    
    if (comboboxCount > 0) {
      await combobox.click();
      await page.waitForTimeout(1000);
      const userItems = page.locator('[role="option"]');
      const userItemsCount = await userItems.count();
      console.log(`Number of users found in combobox: ${userItemsCount}`);
    }
  }

  // Fill project details
  const projectName = `Test Project ${Date.now()}`;
  await page.fill('input[placeholder*="name"]', projectName);
  await page.fill('textarea[placeholder*="description"]', 'This is a test project created by MCP');
  await page.fill('input[placeholder*="technologies"]', 'React, TypeScript, Tailwind');
  
  // Submit
  console.log('Submitting project form');
  await page.click('button[type="submit"]:has-text("Create Project")');

  // Wait for success
  await page.waitForSelector('h2:has-text("Project Created Successfully")');
  console.log('Project created successfully!');

  // Take screenshot of the success state
  await page.screenshot({ path: 'project-created-success.png' });

  // Now verify if we can add members to an EXISTING project
  console.log('Going back to projects list');
  await page.click('button:has-text("Back to Projects")');
  await page.waitForTimeout(2000);

  // Find the first project card and click edit (which should be the one we just created)
  console.log('Opening edit sheet for the new project');
  const projectCard = page.locator('.flex-col.h-full').first();
  await projectCard.locator('button:has-text("Edit")').click();

  // Wait for Edit Sheet
  await page.waitForSelector('h2:has-text("Edit Project")');
  console.log('Edit Project Sheet is open');

  // Check for Tabs
  const teamTab = page.locator('button[role="tab"]:has-text("Team")');
  const teamTabCount = await teamTab.count();
  console.log(`Team tab found: ${teamTabCount > 0}`);

  if (teamTabCount > 0) {
    await teamTab.click();
    console.log('Clicked Team tab');
    
    // Check if we can add members here
    const addMemberBtn = page.locator('button:has-text("Add Member")');
    const addMemberBtnCount = await addMemberBtn.count();
    console.log(`Add Member button found in Team tab: ${addMemberBtnCount > 0}`);
    
    if (addMemberBtnCount > 0) {
        await addMemberBtn.click();
        await page.waitForTimeout(1000);
        const userItems = page.locator('[role="menuitem"]');
        const userItemsCount = await userItems.count();
        console.log(`Number of users found in Add Member dropdown: ${userItemsCount}`);
    }
  }

  await page.screenshot({ path: 'project-team-tab.png' });

  await browser.close();
}

main().catch(console.error);
