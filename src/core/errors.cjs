class PluginContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PluginContractError';
  }
}

module.exports = {
  PluginContractError
};
