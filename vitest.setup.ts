import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom lacks several browser APIs that Radix UI (dialogs, selects) relies on.
// Polyfill them so component tests using those primitives can render.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Radix Select/Dialog call these on elements; jsdom doesn't implement them.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = vi.fn(() => false);
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = vi.fn();
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = vi.fn();

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