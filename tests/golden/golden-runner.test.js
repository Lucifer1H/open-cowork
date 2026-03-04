const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { runGoldenCases } = require('../../scripts/golden-runner.cjs');

test('runGoldenCases returns deterministic summary', async () => {
  const summary = await runGoldenCases({
    casesPath: path.join(__dirname, 'cases', 'basic.json')
  });

  assert.equal(summary.total, 2);
  assert.equal(summary.passed, 2);
  assert.equal(summary.failed, 0);
});
