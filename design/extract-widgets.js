/* extract-widgets.js — re-extract the six rating widgets (spray/drop/seca ×
   fill/outline) as TRUE-ALPHA sprites by keying out the parchment, instead of
   rectangle chips that carry background tone. Exemplar positions are found by
   scanning each plaque row for dark-stroke clusters. */
const { chromium } = require('playwright');
const fs = require('fs');

const SRC = '/root/.claude/uploads/3761999f-4b77-5b73-ad39-2e7b0dde9dea/94befbc9-1000045655.png';

(async () => {
  const b64 = fs.readFileSync(SRC).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');

  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, W, H).data;
    const px = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i+1], data[i+2]]; };

    // find the 5 widget clusters in a row zone by column-darkness histogram
    const clusters = (y0, y1, x0 = 420, x1 = 890) => {
      const colDark = [];
      for (let x = x0; x <= x1; x++) {
        let n = 0;
        for (let y = y0; y <= y1; y++) { const p = px(x, y); if ((p[0]+p[1]+p[2])/3 < 120) n++; }
        colDark.push(n > 1);
      }
      const runs = [];
      let s = null;
      for (let i = 0; i <= colDark.length; i++) {
        if (colDark[i] && s === null) s = i;
        if ((!colDark[i] || i === colDark.length) && s !== null) {
          if (i - s > 12) runs.push([x0 + s, x0 + i - 1]); // ignore specks
          else if (runs.length && x0 + s - runs[runs.length-1][1] < 12) runs[runs.length-1][1] = x0 + i - 1;
          s = null;
        }
      }
      // merge runs separated by < 14px (parts of one widget)
      const merged = [];
      for (const r of runs) {
        if (merged.length && r[0] - merged[merged.length-1][1] < 14) merged[merged.length-1][1] = r[1];
        else merged.push([...r]);
      }
      return merged;
    };

    // vertical bounds of a cluster
    const vBounds = (xa, xb, y0, y1) => {
      let a = null, b = null;
      for (let y = y0; y <= y1; y++) {
        let dark = false;
        for (let x = xa; x <= xb; x++) { const p = px(x, y); if ((p[0]+p[1]+p[2])/3 < 120) { dark = true; break; } }
        if (dark) { if (a === null) a = y; b = y; }
      }
      return [a, b];
    };

    const ROWS = { spray: [800, 928], drop: [936, 1022], seca: [1028, 1148] };
    const found = {};
    for (const [k, [y0, y1]] of Object.entries(ROWS)) {
      const cl = clusters(y0, y1).map(([xa, xb]) => {
        const [ya, yb] = vBounds(xa, xb, y0, y1);
        return { xa, xb, ya, yb };
      });
      found[k] = cl;
    }

    // parchment keyer: sample local parchment, alpha by colour distance
    const sprite = (xa, ya, xb, yb) => {
      const pad = 3;
      const x0 = xa - pad, y0 = ya - pad, w = xb - xa + pad * 2, h = yb - ya + pad * 2;
      // parchment stats from the corners of the crop
      const samples = [];
      for (const [sx, sy] of [[x0+1, y0+1], [x0+w-2, y0+1], [x0+1, y0+h-2], [x0+w-2, y0+h-2]])
        samples.push(px(sx, sy));
      const pr = samples.reduce((a, p) => a + p[0], 0) / 4,
            pg = samples.reduce((a, p) => a + p[1], 0) / 4,
            pb = samples.reduce((a, p) => a + p[2], 0) / 4;
      const s = document.createElement('canvas'); s.width = w; s.height = h;
      const sx2 = s.getContext('2d');
      sx2.drawImage(img, x0, y0, w, h, 0, 0, w, h);
      const id = sx2.getImageData(0, 0, w, h); const d = id.data;
      for (let i = 0; i < w * h; i++) {
        const r = d[i*4], g = d[i*4+1], b = d[i*4+2];
        const dist = Math.sqrt((r-pr)**2 + (g-pg)**2 + (b-pb)**2);
        const a = Math.max(0, Math.min(1, (dist - 16) / 26));
        d[i*4+3] = Math.round(a * 255);
      }
      sx2.putImageData(id, 0, 0);
      return s.toDataURL('image/png');
    };

    const results = { found };
    const pick = (row, i) => { const c = found[row][i]; return sprite(c.xa, c.ya, c.xb, c.yb); };
    results.files = {
      'widget-spray-fill.png': pick('spray', 0),
      'widget-spray-out.png':  pick('spray', 2),
      'widget-drop-fill.png':  pick('drop', 0),
      'widget-drop-out.png':   pick('drop', 3),
      'widget-seca-fill.png':  pick('seca', 0),
      'widget-seca-out.png':   pick('seca', 3),
    };
    return results;
  }, `data:image/png;base64,${b64}`);

  await browser.close();
  console.log('clusters found:', JSON.stringify(out.found, null, 1));
  for (const [name, dataUrl] of Object.entries(out.files)) {
    fs.writeFileSync('art/' + name, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('art/' + name, 'written');
  }
})();
