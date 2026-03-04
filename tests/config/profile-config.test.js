const test = require('node:test');
const assert = require('node:assert/strict');

const { loadProfile } = require('../../src/config/profiles.cjs');

test('loads balanced profile by default', () => {
  const profile = loadProfile();
  assert.equal(profile.name, 'balanced');
  assert.equal(profile.autoExecute, true);
});

test('loads explicit safe profile', () => {
  const profile = loadProfile('safe');
  assert.equal(profile.name, 'safe');
  assert.equal(profile.maxParallelSteps, 1);
});
