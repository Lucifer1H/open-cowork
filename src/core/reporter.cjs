const { createEventStore } = require('../observability/event-store.cjs');
const { computeMetricsSnapshot } = require('../observability/metrics.cjs');

function createReporter(store = createEventStore()) {
  return {
    event(type, payload = {}) {
      store.append({ type, ...payload });
    },
    all() {
      return store.all();
    },
    summarize(finalStatus) {
      const events = store.all();
      return {
        finalStatus,
        eventCount: events.length,
        metrics: computeMetricsSnapshot(events)
      };
    }
  };
}

module.exports = {
  createReporter
};
