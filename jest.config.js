/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Não roda os testes compilados em build/
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
};
