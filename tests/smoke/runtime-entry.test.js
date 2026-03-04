const test = require('node:test');
const assert = require('node:assert/strict');

const { createCoworkRuntime } = require('../../src/index.cjs');

test('runtime entry creates runtime with version', () => {
  const runtime = createCoworkRuntime();
  assert.equal(runtime.version, '3.0.0-alpha');
});
