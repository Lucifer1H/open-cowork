const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCoworkCommand } = require('../../src/adapter/legacy-adapter.cjs');

test('legacy adapter preserves cowork command markers', () => {
  const md = buildCoworkCommand({ mode: 'balanced' });
  assert.match(md, /description: Cowork mode/);
  assert.match(md, /\$ARGUMENTS/);
});
