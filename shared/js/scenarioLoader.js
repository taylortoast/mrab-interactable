window.loadScenario = function () {
  if (!window.SCENARIO_DATA) {
    throw new Error('SCENARIO_DATA not found. Ensure data/scenario.js is loaded before this script.');
  }
  return window.SCENARIO_DATA;
};

window.validateScenario = function (data) {
  if (!data || typeof data !== 'object') throw new Error('Not a valid scenario object.');
  if (typeof data.id !== 'string' || !data.id) throw new Error('Scenario missing id field.');
  if (typeof data.title !== 'string' || !data.title) throw new Error('Scenario missing title field.');
  if (!Array.isArray(data.buildings)) throw new Error('Scenario missing buildings array.');
  return data;
};
