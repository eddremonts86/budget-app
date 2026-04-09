
const { chromium, firefox, webkit, devices } = require('playwright');
const helpers = require('./lib/helpers');

// Extra headers from environment variables (if configured)
const __extraHeaders = helpers.getExtraHeadersFromEnv();

/**
 * Utility to merge environment headers into context options.
 * Use when creating contexts with raw Playwright API instead of helpers.createContext().
 * @param {Object} options - Context options
 * @returns {Object} Options with extraHTTPHeaders merged in
 */
function getContextOptionsWithHeaders(options = {}) {
  if (!__extraHeaders) return options;
  return {
    ...options,
    extraHTTPHeaders: {
      ...__extraHeaders,
      ...(options.extraHTTPHeaders || {})
    }
  };
}

(async () => {
  try {
    const browser=await chromium.launch({headless:true}); const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage(); await page.goto('http://localhost:3000/auth',{waitUntil:'networkidle'}); if(await page.locator('[data-testid=auth-input-sign-in-email]').count()){ await page.fill('[data-testid=auth-input-sign-in-email]','admin@local.com'); await page.fill('[data-testid=auth-input-sign-in-password]','AdminLocal'); await page.click('[data-testid=auth-submit-sign-in]'); await page.waitForURL('**/dashboard**',{timeout:20000}); } await page.goto('http://localhost:3000/dashboard/todos',{waitUntil:'networkidle'}); await page.evaluate(()=>{ const btn=Array.from(document.querySelectorAll('button')).find((b)=>/new task/i.test((b.textContent||''))); if(btn) btn.click(); }); await page.waitForTimeout(500); const openCount=await page.getByText(/create task/i).count().catch(()=>0); await page.evaluate(()=>{ const closeBtn=Array.from(document.querySelectorAll('button')).find((b)=>/cancel/i.test((b.textContent||''))); if(closeBtn) closeBtn.click(); }); await page.waitForTimeout(500); const bodyPointer=await page.evaluate(()=>getComputedStyle(document.body).pointerEvents); const htmlPointer=await page.evaluate(()=>getComputedStyle(document.documentElement).pointerEvents); const responsive=await Promise.race([page.evaluate(()=>document.body.childElementCount), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),3000))]).then(()=>true).catch(()=>false); console.log('openCount='+openCount); console.log('bodyPointer='+bodyPointer); console.log('htmlPointer='+htmlPointer); console.log('responsive='+responsive); await browser.close();
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
