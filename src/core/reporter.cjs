function createReporter() {
  const events = [];

  return {
    event(type, payload = {}) {
      events.push({ type, payload, at: new Date().toISOString() });
    },
    all() {
      return events.slice();
    },
    summarize(finalStatus) {
      return {
        finalStatus,
        eventCount: events.length
      };
    }
  };
}

module.exports = {
  createReporter
};
