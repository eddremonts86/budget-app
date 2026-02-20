
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const PAGES = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/todos',
  '/dashboard/settings'
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting page check...');

  for (const path of PAGES) {
    const url = BASE_URL + path;
    console.log(`Checking ${url}...`);

    try {
      page.on('console', async msg => {
        if (msg.type() === 'error') {
          const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
          console.log(`  Console Error on ${path}:`, args.length ? args : msg.text());
        }
      });

      await page.goto(url, { waitUntil: 'networkidle' });
      
      const content = await page.content();
      const hasError = content.includes('Error loading dashboard');
      const hasUpcoming = content.includes('Upcoming Tasks');
      const hasRevenue = content.includes('Revenue');

      console.log(`Path: ${path}`);
      console.log(`  Status: ${hasError ? 'Error Detected' : 'OK'}`);
      console.log(`  "Upcoming Tasks" Found: ${hasUpcoming}`);
      console.log(`  "Revenue" Found: ${hasRevenue}`);
      
      await page.screenshot({ path: `/tmp/screenshot-${path.replace(/\//g, '_')}.png`, fullPage: true });

    } catch (e) {
      console.error(`Failed to load ${path}: ${e.message}`);
    }
  }

  await browser.close();
})();
