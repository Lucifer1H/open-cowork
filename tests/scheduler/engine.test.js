const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createScheduleStore,
  createOnceJob,
  createIntervalJob,
  pollDueJobs
} = require('../../src/scheduler/engine.cjs');

test('once job becomes due when runAt <= now', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createOnceJob({ id: 'job.once', runAt: '2026-03-03T23:00:00.000Z', payload: { task: 'a' } }));

  const due = pollDueJobs(store, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].id, 'job.once');
});

test('interval job updates next run deterministically', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createIntervalJob({
    id: 'job.interval',
    everyMs: 60_000,
    nextRunAt: '2026-03-03T23:59:00.000Z',
    payload: { task: 'b' }
  }));

  const due = pollDueJobs(store, now);
  assert.equal(due.length, 1);
  const job = store.get('job.interval');
  assert.equal(job.nextRunAt, '2026-03-04T00:00:00.000Z');
});
