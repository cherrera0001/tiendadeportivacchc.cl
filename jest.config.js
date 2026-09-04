export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['widget'],
  collectCoverageFrom: [
    'lib/handlers/chat.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25
    }
  },
  testTimeout: 10000,
  verbose: true,
  // Configuración de proyectos para diferentes ambientes
  projects: [
    {
      displayName: 'API Tests',
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js'],
      testPathIgnorePatterns: ['widget']
    }
  ]
};
