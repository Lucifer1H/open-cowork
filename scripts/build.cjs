#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const steps = [
  ['node', ['scripts/build-check.cjs']],
  ['node', ['scripts/build-command.cjs']]
];

for (const [cmd, args] of steps) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
