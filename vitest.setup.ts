import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs after each test suite is done
afterEach(() => {
  cleanup();
});

// Global setup/teardown for the test suite
beforeAll(() => {
  // Global setup code here
  // This is a good place to initialize test services
});

afterAll(() => {
  // Global cleanup code here
});