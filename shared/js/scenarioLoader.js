window.loadScenario = function () {
  if (!window.SCENARIO_DATA) {
    throw new Error('SCENARIO_DATA not found. Ensure data/scenario.js is loaded before this script.');
  }
  return window.SCENARIO_DATA;
};
