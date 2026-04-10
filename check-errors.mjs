import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge'
  });
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
  console.log('Waiting for load...');
  await page.waitForTimeout(2000);

  // Click on pill tab
  console.log('Clicking Pill tab...');
  try {
     const pillTab = await page.getByText(/pill/i);
     // there might be multiple texts, let's find the button
     const buttons = await page.locator('button').allInnerTexts();
     // Actually let's just wait 1 second on Pill Tab.
  } catch(e) {}
  await page.waitForTimeout(1000);

  try {
    console.log('Clicking INR tab...');
    await page.getByText('INR', { exact: false }).first().click();
  } catch(e) {}
  await page.waitForTimeout(1000);

  try {
    console.log('Clicking Predict tab...');
    await page.getByText('Predict', { exact: false }).first().click();
  } catch(e) {}
  await page.waitForTimeout(1000);

  console.log('--- ERRORS START ---');
  errors.forEach(e => console.log(e));
  console.log('--- ERRORS END ---');
  await browser.close();
  process.exit(0);
})();
