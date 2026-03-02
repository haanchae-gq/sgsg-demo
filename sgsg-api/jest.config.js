/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'import.meta': {
      url: 'file://' + process.cwd() + '/',
    },
  },
  testEnvironment: 'node',
  testEnvironmentOptions: {
    nodeOptions: '--experimental-vm-modules',
  },
  injectGlobals: true,
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|mjs)$': ['babel-jest'],
  },
  transformIgnorePatterns: ['node_modules/(?!@prisma/)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@prisma/internals$': '<rootDir>/__tests__/mocks/prisma-internals.js',
    '^@prisma/client/runtime/query_compiler_fast_bg\\.postgresql\\.mjs$': '<rootDir>/__tests__/mocks/prisma-query-compiler.js',
    '^@prisma/client/runtime/query_compiler_fast_bg\\.postgresql\\.wasm-base64\\.mjs$': '<rootDir>/__tests__/mocks/prisma-wasm-base64.js', 
    '^@prisma/client/runtime/query_compiler_fast_bg\\.js$': '<rootDir>/__tests__/mocks/prisma-query-compiler.js',
    '\\./query_compiler_fast_bg\\.js$': '<rootDir>/__tests__/mocks/prisma-query-compiler.js',
    '^l$': '<rootDir>/__tests__/mocks/l-function.js',
    '^../src/generated/prisma/client$': '<rootDir>/__tests__/mocks/prisma-client.js',
    '^.*src/generated/prisma/client$': '<rootDir>/__tests__/mocks/prisma-client.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts'],
  // WebAssembly mock 로드
  setupFiles: ['<rootDir>/__tests__/mocks/webassembly.js'],
  // 테스트 전/후 실행할 스크립트
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  // 테스트 파일만 보고
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // 최대 10초
  testTimeout: 10000,
};

export default config;