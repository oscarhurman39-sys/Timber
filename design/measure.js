/* measure.js — ground-truth pixel measurements from the reference card:
   panel edges, slider track, painted marker, so crops/overlays stop relying
   on eyeballed grid reads. */
const { chromium } = require('playwright');
const fs = require('fs');

const SRC = '/root/.claude/uploads/3761999f-4b77-5b73-ad39-2e7b0dde9dea/94befbc9-1000045655.png';

(async () => {
  const b64 = fs.readFileSync(SRC).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.getElementById('c'); c.width = W; c.height = H;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, W, H).data;
    const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const lum = (x, y) => { const p = px(x, y); return (p[0] + p[1] + p[2]) / 3; };

    const res = { size: `${W}x${H}` };

    // horizontal light-run bounds at a row (panel parchment is bright)
    const runX = (y, x0, x1, thr = 150) => {
      let a = null, b = null;
      for (let x = x0; x <= x1; x++) if (lum(x, y) > thr) { if (a === null) a = x; b = x; }
      return [a, b];
    };
    const runY = (x, y0, y1, thr = 150) => {
      let a = null, b = null;
      for (let y = y0; y <= y1; y++) if (lum(x, y) > thr) { if (a === null) a = y; b = y; }
      return [a, b];
    };

    // band panel: mid-height row, and column through the compass-free zone
    res.bandX = runX(1262, 90, 1120);        // [left,right] incl. border glow
    res.bandY = runY(560, 1150, 1400);
    // plaque
    res.plaqueX = runX(900, 70, 950);
    res.plaqueY = runY(500, 640, 1220);
    // soil panel
    res.soilX = runX(1000, 860, 1120);
    res.soilY = runY(990, 820, 1220);

    // slider track: dark horizontal run inside band; probe rows to find it
    let trackRow = null;
    for (let y = 1240; y <= 1300; y++) {
      let dark = 0;
      for (let x = 620; x <= 1000; x++) if (lum(x, y) < 110) dark++;
      if (dark > 300) { trackRow = y; break; }
    }
    res.trackRow = trackRow;
    if (trackRow) {
      let a = null, b = null;
      for (let x = 500; x <= 1100; x++) {
        // track pixels: strongly non-parchment (dark or saturated gradient)
        const p = px(x, trackRow + 6); const l = (p[0] + p[1] + p[2]) / 3;
        const sat = Math.max(...p) - Math.min(...p);
        if (l < 130 || sat > 90) { if (a === null) a = x; b = x; }
      }
      res.trackX = [a, b];
      // vertical extent at track centre
      const cxm = Math.round((a + b) / 2);
      let ta = null, tb = null;
      for (let y = trackRow - 20; y <= trackRow + 40; y++) {
        const p = px(cxm, y); const l = (p[0] + p[1] + p[2]) / 3;
        const sat = Math.max(...p) - Math.min(...p);
        if (l < 130 || sat > 90) { if (ta === null) ta = y; tb = y; }
      }
      res.trackY = [ta, tb];
    }

    // painted marker: dark-green cluster above the track
    {
      let minX = null, maxX = null, minY = null, maxY = null;
      for (let y = res.trackY ? res.trackY[0] - 45 : 1205; y < (res.trackY ? res.trackY[0] : 1250); y++) {
        for (let x = 800; x <= 1080; x++) {
          const [r, g, b] = px(x, y);
          if (r < 80 && g < 110 && b < 90 && g > r - 10) {
            if (minX === null || x < minX) minX = x;
            if (maxX === null || x > maxX) maxX = x;
            if (minY === null || y < minY) minY = y;
            if (maxY === null || y > maxY) maxY = y;
          }
        }
      }
      res.marker = { minX, maxX, minY, maxY };
    }
    return res;
  }, `data:image/png;base64,${b64}`);
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
