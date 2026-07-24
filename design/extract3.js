/* extract3.js — panel-overlay strategy: crop the WHOLE painted panels (rounded
   feathered masks) so ~95% of the reference's painted pixels are reused; plus
   synthesized railfix, corrected stature-label, pristine crest, closed leaf. */
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
    const results = {};
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

    // crop + rounded-rect mask (feathered). mask = the panel's TRUE pixel bounds
    // (measured, not eyeballed) given in absolute coords.
    const panel = (x, y, w, h, mx0, my0, mx1, my1, r) => {
      const c = mk(w, h); const cx = c.getContext('2d');
      cx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const m = mk(w, h); const mxc = m.getContext('2d');
      mxc.filter = 'blur(2px)';
      mxc.fillStyle = '#000';
      mxc.beginPath();
      mxc.roundRect(mx0 - x, my0 - y, mx1 - mx0, my1 - my0, r);
      mxc.fill();
      cx.globalCompositeOperation = 'destination-in';
      cx.drawImage(m, 0, 0);
      return c.toDataURL('image/png');
    };

    /* ---- whole painted panels (edges from measured luminance transitions) ---- */
    results['plaque-full.png'] = panel(91, 679, 800, 506,   95, 683, 884, 1182, 24);
    results['soil-full.png']   = panel(894, 862, 200, 314,  904, 868, 1084, 1170, 20);
    results['band-full.png']   = panel(109, 1184, 973, 156, 118, 1186, 1074, 1332, 24);

    /* ---- crest, pristine (H5 baked — Kniphofia IS H5), shield bezier mask ---- */
    {
      const W = 170, H = 205;
      const c = mk(W, H); const cx = c.getContext('2d');
      cx.drawImage(img, 925, 28, W, H, 0, 0, W, H);
      const m = mk(W, H); const mx = m.getContext('2d');
      mx.filter = 'blur(1.2px)'; mx.fillStyle = '#000';
      mx.beginPath();
      mx.moveTo(85, 4);
      mx.quadraticCurveTo(112, 3, 137, 13);
      mx.quadraticCurveTo(150, 17, 165, 21);
      mx.bezierCurveTo(168, 45, 166, 70, 161, 92);
      mx.bezierCurveTo(153, 132, 120, 172, 85, 198);
      mx.bezierCurveTo(50, 172, 17, 132, 9, 92);
      mx.bezierCurveTo(4, 70, 2, 45, 5, 21);
      mx.quadraticCurveTo(20, 17, 33, 13);
      mx.quadraticCurveTo(58, 3, 85, 4);
      mx.closePath(); mx.fill();
      cx.globalCompositeOperation = 'destination-in';
      cx.drawImage(m, 0, 0);
      results['crest-h5.png'] = c.toDataURL('image/png');
    }

    /* ---- railfix 84x385: synthesized from clean-column row averages ----------
       clean column x 20-26 runs the full stature block; per-row average gives the
       vignette without glyph ghosts. Horizontal profile from clean rows 314-324. */
    {
      const gcx = mk(1, 1).getContext('2d'); // just for sampling
      const sc = mk(110, 420); const scx = sc.getContext('2d', { willReadFrequently: true });
      scx.drawImage(img, 10, 280, 110, 420, 0, 0, 110, 420); // local: abs-(10,280)
      const sd = scx.getImageData(0, 0, 110, 420).data;
      const px = (x, y) => { const i = ((y - 280) * 110 + (x - 10)) * 4; return [sd[i], sd[i + 1], sd[i + 2]]; };
      const rowAvg = [];
      for (let y = 315; y < 700; y++) {
        let r = 0, g = 0, b = 0;
        for (let x = 20; x <= 26; x++) { const p = px(x, y); r += p[0]; g += p[1]; b += p[2]; }
        rowAvg.push([r / 7, g / 7, b / 7]);
      }
      // horizontal luminance profile from clean rows y 314..322, x 20..103
      const prof = [];
      for (let x = 20; x <= 103; x++) {
        let l = 0;
        for (let y = 314; y <= 322; y++) { const p = px(x, y); l += (p[0] + p[1] + p[2]) / 3; }
        prof.push(l / 9);
      }
      const profMean = prof.reduce((a, v) => a + v, 0) / prof.length;
      const c = mk(84, 385); const cx = c.getContext('2d');
      const id = cx.createImageData(84, 385); const d = id.data;
      let seed = 12345;
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      for (let y = 0; y < 385; y++) {
        const base = rowAvg[Math.min(y, rowAvg.length - 1)];
        for (let x = 0; x < 84; x++) {
          const k = prof[Math.min(x, prof.length - 1)] / profMean;
          const n = (rnd() - 0.5) * 7;
          const i = (y * 84 + x) * 4;
          d[i] = Math.max(0, Math.min(255, base[0] * k + n));
          d[i + 1] = Math.max(0, Math.min(255, base[1] * k + n));
          d[i + 2] = Math.max(0, Math.min(255, base[2] * k + n));
          d[i + 3] = 255;
        }
      }
      cx.putImageData(id, 0, 0);
      results['railfix.png'] = c.toDataURL('image/png');
    }

    /* ---- stature label, correct column this time ---- */
    {
      const c = mk(34, 232); const cx = c.getContext('2d');
      cx.drawImage(img, 26, 362, 34, 232, 0, 0, 34, 232);
      results['stature-label.png'] = c.toDataURL('image/png');
    }

    /* ---- growth leaf v2: key + morphological close + feather ---- */
    {
      const W = 72, H = 62;
      const c = mk(W, H); const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 1026, 352, W, H, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H); const p = d.data;
      let keep = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
        if (g > 95 && g > r * 1.05 && g > b * 1.4) keep[i] = 1;
      }
      const pass = (src, grow) => {
        const dst = new Uint8Array(src);
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          const n = src[i - 1] + src[i + 1] + src[i - W] + src[i + W]
                  + src[i - W - 1] + src[i - W + 1] + src[i + W - 1] + src[i + W + 1];
          if (grow ? n > 0 : n < 8) dst[i] = grow ? 1 : 0;
        }
        return dst;
      };
      keep = pass(pass(pass(keep, true), true), false); // dilate x2, erode x1 => closed + 1px rim
      for (let i = 0; i < W * H; i++) if (!keep[i]) p[i * 4 + 3] = 0;
      cx.putImageData(d, 0, 0);
      results['growth-leaf.png'] = c.toDataURL('image/png');
    }

    return results;
  }, `data:image/png;base64,${b64}`);

  await browser.close();
  for (const [name, dataUrl] of Object.entries(out)) {
    fs.writeFileSync('art/' + name, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('art/' + name, 'written');
  }
})();
