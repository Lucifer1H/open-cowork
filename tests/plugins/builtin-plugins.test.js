const test = require('node:test');
const assert = require('node:assert/strict');

const { refactorPlugin } = require('../../src/plugins/refactor.cjs');
const { bugfixPlugin } = require('../../src/plugins/bugfix.cjs');

test('refactor plugin matches refactor tasks', () => {
  assert.equal(refactorPlugin.canHandle('refactor auth module'), true);
});

test('bugfix plugin matches bug fix tasks', () => {
  assert.equal(bugfixPlugin.canHandle('fix flaky login bug'), true);
});
