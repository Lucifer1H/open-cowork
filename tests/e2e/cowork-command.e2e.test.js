const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCoworkCommand } = require('../../src/adapter/legacy-adapter.cjs');

test('cowork compatibility e2e keeps legacy markers', () => {
  const md = buildCoworkCommand({ mode: 'balanced' });

  assert.match(md, /## Your Task/);
  assert.match(md, /\$ARGUMENTS/);
  assert.match(md, /Execution Flow/);
  assert.match(md, /Important Notes/);
});
