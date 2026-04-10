const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173');
  
  // Wait a bit for initial load
  await page.waitForTimeout(2000);

  // We are probably on the login screen.
  // Wait, if we are on the login screen, we can't test tabs.
  // We need to bypass auth. I'll mock it before running this script.

  console.log('Errors caught:', errors);
  await browser.close();
})();
