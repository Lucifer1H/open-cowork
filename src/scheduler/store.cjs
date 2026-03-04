function createScheduleStore() {
  const jobs = new Map();

  return {
    add(job) {
      jobs.set(job.id, { ...job });
    },
    get(id) {
      const value = jobs.get(id);
      return value ? { ...value } : null;
    },
    update(job) {
      jobs.set(job.id, { ...job });
    },
    remove(id) {
      jobs.delete(id);
    },
    all() {
      return Array.from(jobs.values()).map((job) => ({ ...job }));
    }
  };
}

module.exports = {
  createScheduleStore
};
