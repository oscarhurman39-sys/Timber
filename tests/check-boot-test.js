#!/usr/bin/env node
/* Negative coverage for tools/check-boot.js.
   This deliberately mutates the working timber.html one case at a time, invokes
   the checker in a child process, and restores the original in finally. Run it
   from a complete checkout (the normal repo includes art/photo binaries):

     node tests/check-boot-test.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'timber.html');
const CHECK = path.join(ROOT, 'tools', 'check-boot.js');
const original = fs.readFileSync(APP, 'utf8');

const run = () => spawnSync(process.execPath, [CHECK], { cwd: ROOT, encoding: 'utf8' });
const expectFail = (name, html, needle) => {
  fs.writeFileSync(APP, html);
  const r = run();
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status !== 0 && (!needle || out.includes(needle));
  console.log(`${ok ? 'PASS' : 'FAIL'}: check-boot rejects ${name}`);
  if (!ok) {
    console.error(`  exit=${r.status}; wanted non-zero${needle ? ` and output containing ${JSON.stringify(needle)}` : ''}`);
    console.error(out.trim().split('\n').slice(-8).join('\n'));
    process.exitCode = 1;
  }
};

try {
  const baseline = run();
  if (baseline.status !== 0) {
    console.error('FAIL: baseline check-boot must pass before negative cases can prove anything.');
    console.error(((baseline.stdout || '') + (baseline.stderr || '')).trim().split('\n').slice(-12).join('\n'));
    process.exitCode = 1;
  } else {
    expectFail('bad JavaScript syntax', original.replace('</script>', 'const __bootSyntaxBreak = ;\n</script>'), 'syntax error');
    expectFail('a missing special-card asset', original.replace("frame:'art/frame-avondale.png'", "frame:'art/definitely-missing-frame.png'"), 'missing asset');
    expectFail('an ANIM duration/frame mismatch', original.replace('durations:[260,160,150,150,150,220,180,150,150,220]', 'durations:[260,160,150,150,150,220,180,150,150]'), 'durations for 10 frames');
  }
} finally {
  fs.writeFileSync(APP, original);
}
