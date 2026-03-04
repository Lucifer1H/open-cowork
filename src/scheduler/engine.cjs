const { createScheduleStore } = require('./store.cjs');

function toIsoString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function createOnceJob(input) {
  return {
    id: input.id,
    type: 'once',
    runAt: toIsoString(input.runAt),
    payload: input.payload || {}
  };
}

function createIntervalJob(input) {
  return {
    id: input.id,
    type: 'interval',
    everyMs: input.everyMs,
    nextRunAt: toIsoString(input.nextRunAt),
    payload: input.payload || {}
  };
}

function pollDueJobs(store, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const due = [];

  for (const job of store.all()) {
    if (job.type === 'once') {
      const dueAt = new Date(job.runAt).getTime();
      if (dueAt <= nowMs) {
        due.push(job);
        store.remove(job.id);
      }
      continue;
    }

    if (job.type === 'interval') {
      const dueAt = new Date(job.nextRunAt).getTime();
      if (dueAt <= nowMs) {
        due.push(job);

        const updated = {
          ...job,
          nextRunAt: new Date(dueAt + job.everyMs).toISOString()
        };
        store.update(updated);
      }
    }
  }

  return due;
}

module.exports = {
  createScheduleStore,
  createOnceJob,
  createIntervalJob,
  pollDueJobs
};
