function createEventStore() {
  const events = [];

  return {
    append(event) {
      events.push({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      });
    },
    all() {
      return events.slice();
    }
  };
}

module.exports = {
  createEventStore
};
