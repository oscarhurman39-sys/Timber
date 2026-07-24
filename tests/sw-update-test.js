/* Verifies the stale-while-revalidate update path: redeploying timber.html
   (with NO sw.js change) must reach an installed client on its next load. */
const { chromium } = require('playwright');
const fs = require('fs');
const APP = '/home/user/Timber/timber.html';

(async () => {
  const orig = fs.readFileSync(APP, 'utf8');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:8477/timber.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(600);

    fs.writeFileSync(APP, orig.replace('</body>', '<!-- v2-marker --></body>'));

    await page.reload(); await page.waitForTimeout(1000); // stale served, revalidates in background
    await page.reload(); await page.waitForTimeout(600);  // fresh copy now in cache
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const ok = html.includes('v2-marker');
    console.log(ok ? 'PASS: redeployed timber.html reaches client on next load (no sw.js change)'
                   : 'FAIL: update not picked up');
    process.exitCode = ok ? 0 : 1;
  } finally {
    fs.writeFileSync(APP, orig);
    await browser.close();
  }
})();
