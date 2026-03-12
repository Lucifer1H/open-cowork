const test = require('node:test');
const assert = require('node:assert/strict');

const { refactorPlugin } = require('../../src/plugins/refactor.cjs');
const { bugfixPlugin } = require('../../src/plugins/bugfix.cjs');
const { docgenPlugin } = require('../../src/plugins/docgen.cjs');
const { migrationPlugin } = require('../../src/plugins/migration.cjs');
const { createPluginBase, createSimplePlugin, inferRiskLevel } = require('../../src/plugins/base.cjs');

// ============ Plugin Matching Tests ============

test('refactor plugin matches refactor tasks', () => {
  assert.equal(refactorPlugin.canHandle('refactor auth module'), true);
  assert.equal(refactorPlugin.canHandle('reorganize folder structure'), true);
  assert.equal(refactorPlugin.canHandle('extract method from class'), true);
  assert.equal(refactorPlugin.canHandle('write a new feature'), false);
});

test('bugfix plugin matches bug fix tasks', () => {
  assert.equal(bugfixPlugin.canHandle('fix flaky login bug'), true);
  assert.equal(bugfixPlugin.canHandle('fix TypeError in utils'), true);
  assert.equal(bugfixPlugin.canHandle('resolve issue #123'), true);
  assert.equal(bugfixPlugin.canHandle('add new feature'), false);
});

test('docgen plugin matches documentation tasks', () => {
  assert.equal(docgenPlugin.canHandle('generate README'), true);
  assert.equal(docgenPlugin.canHandle('create api documentation'), true);
  assert.equal(docgenPlugin.canHandle('add JSDoc comments'), true);
  assert.equal(docgenPlugin.canHandle('fix bug'), false);
});

test('migration plugin matches migration tasks', () => {
  assert.equal(migrationPlugin.canHandle('migrate to React 18'), true);
  assert.equal(migrationPlugin.canHandle('upgrade dependencies'), true);
  assert.equal(migrationPlugin.canHandle('convert to TypeScript'), true);
  assert.equal(migrationPlugin.canHandle('refactor code'), false);
});

// ============ Plugin Manifest Tests ============

test('all plugins have valid manifests', () => {
  const plugins = [refactorPlugin, bugfixPlugin, docgenPlugin, migrationPlugin];

  for (const plugin of plugins) {
    assert.ok(plugin.id, `${plugin.id} should have id`);
    assert.ok(plugin.manifest, `${plugin.id} should have manifest`);
    assert.ok(plugin.manifest.name, `${plugin.id} manifest should have name`);
    assert.ok(plugin.manifest.version, `${plugin.id} manifest should have version`);
    assert.ok(plugin.manifest.runtime, `${plugin.id} manifest should have runtime`);
    assert.ok(plugin.manifest.capabilities, `${plugin.id} manifest should have capabilities`);
  }
});

// ============ Bugfix Plugin Analysis Tests ============

test('bugfix plugin plan includes analysis', async () => {
  const plan = await bugfixPlugin.plan('fix TypeError in auth module', {});

  assert.ok(plan.analysis);
  assert.ok(plan.analysis.errorType);
  assert.ok(Array.isArray(plan.analysis.suggestedApproach));
});

test('bugfix plugin plan detects async errors', async () => {
  const plan = await bugfixPlugin.plan('fix unhandled promise rejection', {});

  assert.equal(plan.analysis.errorType, 'AsyncError');
  assert.ok(plan.analysis.suggestedApproach.some((s) => s.includes('promise')));
});

test('bugfix plugin plan detects test-related bugs', async () => {
  const plan = await bugfixPlugin.plan('fix flaky test in auth.spec.js', {});

  assert.equal(plan.analysis.taskType, 'test-bugfix');
});

// ============ Plugin Plan Generation Tests ============

test('bugfix plugin generates multiple steps', async () => {
  const plan = await bugfixPlugin.plan('fix login bug', {});

  assert.ok(plan.steps);
  assert.ok(plan.steps.length >= 3, 'Should generate at least 3 steps');
  assert.ok(plan.steps[0].id);
  assert.ok(plan.steps[0].summary);
  assert.ok(plan.steps[0].risk);
});

test('refactor plugin generates analysis step', async () => {
  const plan = await refactorPlugin.plan('refactor auth module', {});

  assert.ok(plan.steps);
  const analyzeStep = plan.steps.find((s) => s.id.includes('analyze'));
  assert.ok(analyzeStep, 'Should have analyze step');
});

test('docgen plugin generates scan step', async () => {
  const plan = await docgenPlugin.plan('generate API documentation', {});

  assert.ok(plan.steps);
  const scanStep = plan.steps.find((s) => s.id.includes('scan'));
  assert.ok(scanStep, 'Should have scan step');
});

test('migration plugin generates verify step', async () => {
  const plan = await migrationPlugin.plan('migrate to React 18', {});

  assert.ok(plan.steps);
  const verifyStep = plan.steps.find((s) => s.id.includes('verify'));
  assert.ok(verifyStep, 'Should have verify step');
});

// ============ Plugin Run Tests ============

test('bugfix plugin run returns ok for successful steps', async () => {
  const plan = await bugfixPlugin.plan('fix bug', {});
  const result = await bugfixPlugin.run(plan, {});

  assert.ok(result.ok);
  assert.ok(result.results);
  assert.equal(result.results.length, plan.steps.length);
});

test('plugin run with emit collects events', async () => {
  const events = [];
  const context = {
    emit: (type, payload) => events.push({ type, ...payload })
  };

  const plan = await bugfixPlugin.plan('fix bug', {});
  await bugfixPlugin.run(plan, context);

  const eventTypes = events.map((e) => e.type);
  assert.ok(eventTypes.includes('step.started'));
  assert.ok(eventTypes.includes('step.completed'));
});

// ============ Plugin Verify Tests ============

test('bugfix plugin verify returns ok for successful run', async () => {
  const runResult = {
    ok: true,
    results: [
      { ok: true, stepId: 'step1' },
      { ok: true, stepId: 'step2' }
    ]
  };

  const result = await bugfixPlugin.verify(runResult, {});

  assert.ok(result.ok);
});

test('bugfix plugin verify fails for failed run', async () => {
  const runResult = {
    ok: false,
    reason: 'Step failed'
  };

  const result = await bugfixPlugin.verify(runResult, {});

  assert.equal(result.ok, false);
  assert.ok(result.reason);
});

// ============ Plugin Base Tests ============

test('createPluginBase creates valid plugin', () => {
  const plugin = createPluginBase({
    id: 'test',
    manifest: {
      name: '@cowork/test',
      version: '1.0.0',
      runtime: '^3',
      capabilities: ['plan', 'run', 'verify']
    },
    canHandle: (task) => task.includes('test')
  });

  assert.equal(plugin.id, 'test');
  assert.equal(typeof plugin.canHandle, 'function');
  assert.equal(typeof plugin.plan, 'function');
  assert.equal(typeof plugin.run, 'function');
  assert.equal(typeof plugin.verify, 'function');
});

test('createPluginBase throws for missing id', () => {
  assert.throws(() => {
    createPluginBase({
      manifest: { name: 'test' },
      canHandle: () => true
    });
  }, /id is required/);
});

test('createPluginBase throws for missing canHandle', () => {
  assert.throws(() => {
    createPluginBase({
      id: 'test',
      manifest: { name: 'test' }
    });
  }, /canHandle function is required/);
});

test('createSimplePlugin creates plugin with static steps', async () => {
  const plugin = createSimplePlugin({
    id: 'simple',
    pattern: /simple/i,
    steps: [
      { id: 'step1', summary: 'Do something' },
      { id: 'step2', summary: 'Do another thing' }
    ]
  });

  assert.equal(plugin.id, 'simple');
  assert.equal(plugin.canHandle('do something simple'), true);
  assert.equal(plugin.canHandle('complex task'), false);

  const plan = await plugin.plan('simple task', {});
  assert.equal(plan.steps.length, 2);
});

// ============ Risk Level Inference Tests ============

test('inferRiskLevel detects critical operations', () => {
  assert.equal(inferRiskLevel('delete all files'), 'critical');
  assert.equal(inferRiskLevel('remove database'), 'critical');
});

test('inferRiskLevel detects high risk operations', () => {
  assert.equal(inferRiskLevel('force push to main'), 'high');
  assert.equal(inferRiskLevel('overwrite config'), 'high');
});

test('inferRiskLevel detects medium risk operations', () => {
  assert.equal(inferRiskLevel('modify auth module'), 'medium');
  assert.equal(inferRiskLevel('refactor code'), 'medium');
});

test('inferRiskLevel detects low risk operations', () => {
  assert.equal(inferRiskLevel('read configuration file'), 'low');
  assert.equal(inferRiskLevel('generate documentation'), 'low');
  assert.equal(inferRiskLevel('show all files'), 'low');
});