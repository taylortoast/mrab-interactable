export async function loadScenario(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load scenario: ${path}`);
  }
  return response.json();
}
