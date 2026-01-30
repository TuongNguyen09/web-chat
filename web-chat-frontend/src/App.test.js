// Simple smoke test - just verify the app module can be imported
test('app module imports successfully', () => {
  const App = require('./App').default;
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
