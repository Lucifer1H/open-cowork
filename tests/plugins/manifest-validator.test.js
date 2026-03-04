const test = require('node:test');
const assert = require('node:assert/strict');

const { validatePluginManifest } = require('../../src/plugins/manifest-validator.cjs');

test('validatePluginManifest rejects missing required fields', () => {
  assert.throws(
    () => validatePluginManifest({ name: 'plugin-a' }, '3.0.0-alpha'),
    /missing required manifest field/i
  );
});

test('validatePluginManifest rejects incompatible runtime range', () => {
  assert.throws(
    () =>
      validatePluginManifest(
        {
          name: 'plugin-a',
          version: '1.0.0',
          runtime: '^4',
          capabilities: ['plan']
        },
        '3.0.0-alpha'
      ),
    /incompatible runtime/i
  );
});

test('validatePluginManifest accepts compatible manifest', () => {
  const manifest = validatePluginManifest(
    {
      name: 'plugin-a',
      version: '1.0.0',
      runtime: '^3',
      capabilities: ['plan', 'run']
    },
    '3.0.0-alpha'
  );

  assert.equal(manifest.name, 'plugin-a');
  assert.equal(manifest.runtime, '^3');
});
