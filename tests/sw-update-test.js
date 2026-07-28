/* Verifies the stale-while-revalidate update path: redeploying timber.html
   (with NO sw.js change) must reach an installed client on its next load.
   Also guards the install-time art pre-cache against drifting from the real art/ files. */
const { chromium } = require('playwright');
const fs = require('fs');
const APP = '/home/user/Timber/timber.html';
const ROOT = '/home/user/Timber';

let failed = 0;
function check(ok, name, extra) {
  console.log((ok ? 'PASS: ' : 'FAIL: ') + name + (ok || !extra ? '' : ' — ' + extra));
  if (!ok) failed++;
}

/* The card front has no fallback if the painted template is missing, so every art/ file on
   disk must be pre-cached at install — a new asset that nobody added to sw.js breaks offline. */
function checkArtPrecache() {
  const sw = fs.readFileSync(ROOT + '/sw.js', 'utf8');
  const listed = new Set((sw.match(/'[a-z0-9-]+'/g) || []).map(s => s.slice(1, -1) + '.png'));
  const onDisk = fs.readdirSync(ROOT + '/art').filter(f => f.endsWith('.png'));
  const missing = onDisk.filter(f => !listed.has(f));
  check(missing.length === 0, 'sw.js pre-caches every art/ asset', 'not listed: ' + missing.join(', '));
}

(async () => {
  checkArtPrecache();
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
    check(html.includes('v2-marker'), 'redeployed timber.html reaches client on next load (no sw.js change)');
    process.exitCode = failed ? 1 : 0;
  } finally {
    fs.writeFileSync(APP, orig);
    await browser.close();
  }
})();
