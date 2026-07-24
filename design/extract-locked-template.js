/* extract5.js — full asset re-extraction from the NEW locked template
   (aa4c9fc4-1000045804.png, 1103x1426). Every painted asset re-cropped so the
   system matches the final approved card. */
const { chromium } = require('playwright');
const fs = require('fs');

const SRC = '/root/.claude/uploads/3761999f-4b77-5b73-ad39-2e7b0dde9dea/aa4c9fc4-1000045804.png';

(async () => {
  const b64 = fs.readFileSync(SRC).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');

  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const results = {};
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const full = mk(img.naturalWidth, img.naturalHeight);
    const fx = full.getContext('2d', { willReadFrequently: true });
    fx.drawImage(img, 0, 0);
    const fd = fx.getImageData(0, 0, full.width, full.height).data;
    const px = (x, y) => { const i = (y * full.width + x) * 4; return [fd[i], fd[i+1], fd[i+2]]; };
    const lum = (x, y) => { const p = px(x, y); return (p[0]+p[1]+p[2])/3; };

    /* frame-full: the whole reference is the card base */
    results['frame-full.png'] = (() => { const c = mk(full.width, full.height);
      c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/png'); })();

    /* rounded-mask panel cropper (abs mask bounds) */
    const panel = (x, y, w, h, mx0, my0, mx1, my1, r) => {
      const c = mk(w, h); const cx = c.getContext('2d');
      cx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const m = mk(w, h); const mc = m.getContext('2d');
      mc.filter = 'blur(2px)'; mc.fillStyle = '#000';
      mc.beginPath(); mc.roundRect(mx0-x, my0-y, mx1-mx0, my1-my0, r); mc.fill();
      cx.globalCompositeOperation = 'destination-in'; cx.drawImage(m, 0, 0);
      return c.toDataURL('image/png');
    };
    results['plaque-full.png'] = panel(167, 796, 700, 446,  173, 802, 858, 1234, 22);
    results['soil-full.png']   = panel(886, 899, 172, 344,  892, 905, 1050, 1234, 20);
    results['band-full.png']   = panel(158, 1242, 900, 118, 164, 1248, 1050, 1352, 22);

    /* crest: crop (886,46,190,212); shield bezier mask scaled from calibrated v11
       path (old 170x205 -> new 190x212); inpaint H2 numerals via row-flank blend */
    {
      const W = 190, H = 212, sx = W/170, sy = H/205;
      const c = mk(W, H); const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 886, 46, W, H, 0, 0, W, H);
      // inpaint numerals: dest local (930-886,106-46)-(1028-886,176-46) = (44,60)-(142,130)
      const id = cx.getImageData(0, 0, W, H); const dd = id.data;
      const lpx = (x,y) => { const i=(y*W+x)*4; return [dd[i],dd[i+1],dd[i+2]]; };
      const x0=40, x1=146, y0=56, y1=134;
      let seed = 24681357;
      const rnd = () => { seed = (seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
      for (let y = y0; y <= y1; y++) {
        let L=[0,0,0], R=[0,0,0];
        for (let x = 24; x <= 36; x++) { const p=lpx(x,y); L[0]+=p[0];L[1]+=p[1];L[2]+=p[2]; }
        for (let x = 150; x <= 162; x++) { const p=lpx(x,y); R[0]+=p[0];R[1]+=p[1];R[2]+=p[2]; }
        L=L.map(v=>v/13); R=R.map(v=>v/13);
        for (let x = x0; x <= x1; x++) {
          const t=(x-x0)/(x1-x0);
          const f=Math.max(0,Math.min(1,(x-x0)/6,(x1-x)/6,(y-y0)/6,(y1-y)/6));
          const n=(rnd()-.5)*6;
          const i=(y*W+x)*4;
          for (let k=0;k<3;k++){ const v=L[k]+(R[k]-L[k])*t+n;
            dd[i+k]=dd[i+k]*(1-f)+Math.max(0,Math.min(255,v))*f; }
        }
      }
      cx.putImageData(id, 0, 0);
      const m = mk(W, H); const mc = m.getContext('2d');
      mc.filter='blur(1.2px)'; mc.fillStyle='#000';
      mc.beginPath();
      mc.moveTo(85*sx,4*sy); mc.quadraticCurveTo(112*sx,3*sy,137*sx,13*sy);
      mc.quadraticCurveTo(150*sx,17*sy,165*sx,21*sy);
      mc.bezierCurveTo(168*sx,45*sy,166*sx,70*sy,161*sx,92*sy);
      mc.bezierCurveTo(153*sx,132*sy,120*sx,172*sy,85*sx,198*sy);
      mc.bezierCurveTo(50*sx,172*sy,17*sx,132*sy,9*sx,92*sy);
      mc.bezierCurveTo(4*sx,70*sy,2*sx,45*sy,5*sx,21*sy);
      mc.quadraticCurveTo(20*sx,17*sy,33*sx,13*sy);
      mc.quadraticCurveTo(58*sx,3*sy,85*sx,4*sy);
      mc.closePath(); mc.fill();
      cx.globalCompositeOperation='destination-in'; cx.drawImage(m,0,0);
      results['crest-blank.png'] = c.toDataURL('image/png');
    }

    /* widget sprites via dark-stroke cluster scan per row, parchment-keyed */
    const clusters = (y0, y1, x0 = 440, x1 = 860) => {
      const cols = [];
      for (let x = x0; x <= x1; x++) {
        let n = 0;
        for (let y = y0; y <= y1; y++) if (lum(x, y) < 120) n++;
        cols.push(n > 1);
      }
      const runs = [];
      let s = null;
      for (let i = 0; i <= cols.length; i++) {
        if (cols[i] && s === null) s = i;
        if ((!cols[i] || i === cols.length) && s !== null) {
          if (i - s > 12) runs.push([x0+s, x0+i-1]);
          else if (runs.length && x0+s-runs[runs.length-1][1] < 12) runs[runs.length-1][1] = x0+i-1;
          s = null;
        }
      }
      const merged = [];
      for (const r of runs) {
        if (merged.length && r[0]-merged[merged.length-1][1] < 14) merged[merged.length-1][1] = r[1];
        else merged.push([...r]);
      }
      return merged.map(([xa, xb]) => {
        let ya = null, yb = null;
        for (let y = y0; y <= y1; y++) {
          let dark = false;
          for (let x = xa; x <= xb; x++) if (lum(x, y) < 120) { dark = true; break; }
          if (dark) { if (ya === null) ya = y; yb = y; }
        }
        return { xa, xb, ya, yb };
      });
    };
    const sprite = (b) => {
      const pad = 3, x0 = b.xa-pad, y0 = b.ya-pad, w = b.xb-b.xa+pad*2, h = b.yb-b.ya+pad*2;
      const samples = [[x0+1,y0+1],[x0+w-2,y0+1],[x0+1,y0+h-2],[x0+w-2,y0+h-2]].map(([sx2,sy2])=>px(sx2,sy2));
      const pr = samples.reduce((a,p)=>a+p[0],0)/4, pg = samples.reduce((a,p)=>a+p[1],0)/4, pb = samples.reduce((a,p)=>a+p[2],0)/4;
      const s = mk(w, h); const sc = s.getContext('2d');
      sc.drawImage(img, x0, y0, w, h, 0, 0, w, h);
      const id = sc.getImageData(0, 0, w, h); const d2 = id.data;
      for (let i = 0; i < w*h; i++) {
        const dist = Math.sqrt((d2[i*4]-pr)**2 + (d2[i*4+1]-pg)**2 + (d2[i*4+2]-pb)**2);
        d2[i*4+3] = Math.round(Math.max(0, Math.min(1, (dist-16)/26)) * 255);
      }
      sc.putImageData(id, 0, 0);
      return s.toDataURL('image/png');
    };
    const found = {
      spray: clusters(915, 1010),
      drop:  clusters(1038, 1107),
      seca:  clusters(1124, 1232),
    };
    results['widget-spray-fill.png'] = sprite(found.spray[0]);
    results['widget-spray-out.png']  = sprite(found.spray[2]);
    results['widget-drop-fill.png']  = sprite(found.drop[0]);
    results['widget-drop-out.png']   = sprite(found.drop[3]);
    results['widget-seca-fill.png']  = sprite(found.seca[0]);
    results['widget-seca-out.png']   = sprite(found.seca[3]);
    results._clusters = found;

    /* faceted gold growth diamond, keyed from the photo background */
    {
      const W = 44, H = 40, ox = 990, oy = 370;
      const c = mk(W, H); const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, ox, oy, W, H, 0, 0, W, H);
      const id = cx.getImageData(0, 0, W, H); const d2 = id.data;
      let keep = new Uint8Array(W*H);
      for (let i = 0; i < W*H; i++) {
        const r = d2[i*4], g = d2[i*4+1], b = d2[i*4+2];
        if (r > 120 && r > b*1.35 && g > b*1.05) keep[i] = 1;  // warm gold vs muted photo
      }
      const pass = (src, grow) => {
        const dst = new Uint8Array(src);
        for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
          const i = y*W+x;
          const n = src[i-1]+src[i+1]+src[i-W]+src[i+W]+src[i-W-1]+src[i-W+1]+src[i+W-1]+src[i+W+1];
          if (grow ? n > 0 : n < 8) dst[i] = grow ? 1 : 0;
        }
        return dst;
      };
      keep = pass(pass(pass(keep, true), true), false);
      for (let i = 0; i < W*H; i++) if (!keep[i]) d2[i*4+3] = 0;
      cx.putImageData(id, 0, 0);
      results['growth-diamond.png'] = c.toDataURL('image/png');
    }

    /* parchment swatch from a clean plaque zone */
    {
      const c = mk(72, 64); c.getContext('2d').drawImage(img, 370, 928, 72, 64, 0, 0, 72, 64);
      results['parch-swatch.png'] = c.toDataURL('image/png');
    }

    /* rail value patches: synthesize from per-row averages of clean columns
       x 118..136 (right of the text column), for the two value zones */
    const railPatch = (yA, yB) => {
      const w = 84, h = yB - yA;
      const c = mk(w, h); const cx = c.getContext('2d');
      const id = cx.createImageData(w, h); const d2 = id.data;
      let seed = 555777;
      const rnd = () => { seed = (seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
      for (let y = 0; y < h; y++) {
        let a = [0,0,0];
        for (let x = 118; x <= 136; x++) { const p = px(x, yA+y); a[0]+=p[0]; a[1]+=p[1]; a[2]+=p[2]; }
        a = a.map(v => v/19);
        for (let x = 0; x < w; x++) {
          const n = (rnd()-.5)*7, i = (y*w+x)*4;
          d2[i]   = Math.max(0,Math.min(255,a[0]+n));
          d2[i+1] = Math.max(0,Math.min(255,a[1]+n));
          d2[i+2] = Math.max(0,Math.min(255,a[2]+n));
          d2[i+3] = 255;
        }
      }
      cx.putImageData(id, 0, 0);
      return c.toDataURL('image/png');
    };
    results['rail-patch-h.png'] = railPatch(540, 700);   // covers HEIGHT value zone
    results['rail-patch-s.png'] = railPatch(930, 1092);  // covers SPREAD value zone

    return results;
  }, `data:image/png;base64,${b64}`);

  await browser.close();
  console.log('clusters:', JSON.stringify(out._clusters));
  delete out._clusters;
  for (const [name, dataUrl] of Object.entries(out)) {
    fs.writeFileSync('art/' + name, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('art/' + name);
  }
})();
