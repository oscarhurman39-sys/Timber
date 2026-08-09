#!/usr/bin/env node
/*
  install-hooks.js — install a pre-push guard.

    node tools/install-hooks.js          install
    node tools/install-hooks.js --off    remove

  The guard runs the fast data checks (~2s, no browser) before every push:
  data consistency, card self-consistency, build stamp, template geometry.
  It deliberately does NOT run the browser suites — those take minutes, and a
  hook slow enough to be bypassed is worse than no hook.

  Bypass for a genuine emergency with:  git push --no-verify
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

let gitDir;
try {
  gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  console.error('not a git repository');
  process.exit(1);
}
const hookDir = path.resolve(ROOT, gitDir, 'hooks');
const hook = path.join(hookDir, 'pre-push');

if (process.argv.includes('--off')) {
  if (fs.existsSync(hook)) { fs.unlinkSync(hook); console.log('removed ' + hook); }
  else console.log('no pre-push hook installed');
  process.exit(0);
}

const body = `#!/bin/sh
# Timber pre-push guard — installed by tools/install-hooks.js
# Fast checks only (~2s). Browser suites: node tests/run-all.js
# Bypass in an emergency with: git push --no-verify
set -e
echo "pre-push: running fast checks…"
node tests/run-all.js --fast
`;

fs.mkdirSync(hookDir, { recursive: true });
fs.writeFileSync(hook, body, { mode: 0o755 });
console.log('installed ' + hook);
console.log('runs: node tests/run-all.js --fast   (bypass with git push --no-verify)');
