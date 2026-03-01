const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    console.log('Navigating to http://localhost:3000/dashboard/projects...');
    await page.goto('http://localhost:3000/dashboard/projects');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to verify
    await page.screenshot({ path: '/Volumes/Works/github/tanstack-template/projects-verification.png' });
    
    const projectCards = await page.locator('.card').count();
    console.log('Project cards found:', projectCards);
    
    if (projectCards > 0) {
      console.log('SUCCESS: Projects page loaded correctly with ' + projectCards + ' projects.');
    } else {
      console.error('FAILURE: No projects found on the page.');
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR during verification:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
