const PROFILES = {
  safe: {
    name: 'safe',
    autoExecute: false,
    maxParallelSteps: 1
  },
  balanced: {
    name: 'balanced',
    autoExecute: true,
    maxParallelSteps: 2
  },
  aggressive: {
    name: 'aggressive',
    autoExecute: true,
    maxParallelSteps: 4
  }
};

function loadProfile(name) {
  if (!name) {
    return PROFILES.balanced;
  }

  return PROFILES[name] || PROFILES.balanced;
}

module.exports = {
  PROFILES,
  loadProfile
};
