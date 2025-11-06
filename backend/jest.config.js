const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-node',
  collectCoverageFrom: [
    'pages/api/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    'integrations/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|ts)',
    '**/*.(test|spec).(js|ts)',
  ],
};

module.exports = createJestConfig(customJestConfig); 