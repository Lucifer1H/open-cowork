const ALLOWED_TRANSITIONS = {
  draft: ['planned'],
  planned: ['waiting_approval', 'approved'],
  waiting_approval: ['approved', 'blocked'],
  approved: ['running'],
  running: ['verifying', 'failed'],
  verifying: ['completed', 'failed'],
  completed: [],
  failed: [],
  blocked: []
};

function createTaskSession(initialState = 'draft') {
  if (!ALLOWED_TRANSITIONS[initialState]) {
    throw new Error(`Unknown initial state: ${initialState}`);
  }

  let currentState = initialState;
  const history = [initialState];

  return {
    state() {
      return currentState;
    },
    history() {
      return history.slice();
    },
    transition(nextState) {
      const allowed = ALLOWED_TRANSITIONS[currentState] || [];
      if (!allowed.includes(nextState)) {
        throw new Error(`Invalid transition: ${currentState} -> ${nextState}`);
      }

      currentState = nextState;
      history.push(nextState);
      return currentState;
    }
  };
}

module.exports = {
  ALLOWED_TRANSITIONS,
  createTaskSession
};
