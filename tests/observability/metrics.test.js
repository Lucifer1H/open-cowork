const test = require('node:test');
const assert = require('node:assert/strict');

const { createEventStore } = require('../../src/observability/event-store.cjs');
const { computeMetricsSnapshot } = require('../../src/observability/metrics.cjs');

test('computeMetricsSnapshot aggregates success rate and durations', () => {
  const store = createEventStore();

  store.append({ type: 'task.completed', durationMs: 200 });
  store.append({ type: 'task.failed', durationMs: 100 });
  store.append({ type: 'task.completed', durationMs: 300 });

  const metrics = computeMetricsSnapshot(store.all());

  assert.equal(metrics.totalTasks, 3);
  assert.equal(metrics.completedTasks, 2);
  assert.equal(metrics.failedTasks, 1);
  assert.equal(metrics.successRate, 2 / 3);
  assert.equal(metrics.averageDurationMs, 200);
});
