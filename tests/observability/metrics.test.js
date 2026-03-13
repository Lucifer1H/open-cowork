const test = require('node:test');
const assert = require('node:assert/strict');

const { createEventStore } = require('../../src/observability/event-store.cjs');
const { computeMetricsSnapshot, computeBasicStats, computePercentile } = require('../../src/observability/metrics.cjs');

test('computeMetricsSnapshot aggregates success rate and durations', () => {
  const store = createEventStore();

  store.append({ type: 'task.completed', durationMs: 200 });
  store.append({ type: 'task.failed', durationMs: 100 });
  store.append({ type: 'task.completed', durationMs: 300 });

  const metrics = computeMetricsSnapshot(store.all());

  // New API structure: nested under 'tasks'
  assert.equal(metrics.tasks.total, 3);
  assert.equal(metrics.tasks.completed, 2);
  assert.equal(metrics.tasks.failed, 1);
  assert.equal(metrics.tasks.successRate, 2 / 3);
  assert.equal(metrics.tasks.durations.mean, 200);
});

test('computeMetricsSnapshot includes step metrics', () => {
  const store = createEventStore();

  store.append({ type: 'step.started', stepId: 'step1' });
  store.append({ type: 'step.completed', stepId: 'step1', durationMs: 50 });
  store.append({ type: 'step.failed', stepId: 'step2', durationMs: 30 });

  const metrics = computeMetricsSnapshot(store.all());

  assert.ok(metrics.steps);
  assert.equal(metrics.steps.completed, 1);
  assert.equal(metrics.steps.failed, 1);
});

test('computeMetricsSnapshot includes timing percentiles', () => {
  const store = createEventStore();

  // Add multiple completed tasks
  for (let i = 1; i <= 10; i++) {
    store.append({ type: 'task.completed', durationMs: i * 100 });
  }

  const metrics = computeMetricsSnapshot(store.all());

  assert.ok(metrics.timing);
  assert.ok(metrics.timing.tasks);
  assert.ok(metrics.timing.tasks.p50 > 0);
  assert.ok(metrics.timing.tasks.p95 > 0);
  assert.ok(metrics.timing.tasks.p99 > 0);
});

test('computeMetricsSnapshot tracks errors', () => {
  const store = createEventStore();

  store.append({ type: 'task.failed', error: 'Error 1', taskId: 't1' });
  store.append({ type: 'step.failed', error: 'Error 2', stepId: 's1' });
  store.append({ type: 'schedule.failed', error: 'Error 3', jobId: 'j1' });

  const metrics = computeMetricsSnapshot(store.all());

  assert.ok(metrics.errors);
  assert.equal(metrics.errors.total, 3);
  assert.ok(metrics.errors.recent.length > 0);
});

test('computeBasicStats handles empty array', () => {
  const stats = computeBasicStats([]);

  assert.equal(stats.count, 0);
  assert.equal(stats.mean, 0);
  assert.equal(stats.p50, 0);
});

test('computeBasicStats calculates correct percentiles', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const stats = computeBasicStats(values);

  assert.equal(stats.count, 10);
  assert.equal(stats.min, 1);
  assert.equal(stats.max, 10);
  assert.equal(stats.mean, 5.5);
  assert.ok(stats.p50 >= 5);
  assert.ok(stats.p95 >= 9);
});

test('computePercentile returns 0 for empty array', () => {
  assert.equal(computePercentile([], 50), 0);
});

test('computePercentile calculates correctly', () => {
  const values = [10, 20, 30, 40, 50];

  assert.equal(computePercentile(values, 50), 30);
  assert.equal(computePercentile(values, 100), 50);
});