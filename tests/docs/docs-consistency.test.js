const test = require('node:test');
const assert = require('node:assert/strict');

const { checkDocsCoverage } = require('../../scripts/docs-check.cjs');

test('docs coverage check passes for required runtime features', () => {
  const result = checkDocsCoverage(process.cwd());
  assert.equal(result.ok, true, result.missing.join(', '));
});
