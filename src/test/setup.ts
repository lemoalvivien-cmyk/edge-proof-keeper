import "@testing-library/jest-dom";

// Mock matchMedia (jsdom doesn't implement it)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
(window as Window & typeof globalThis & { ResizeObserver: unknown }).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
(window as Window & typeof globalThis & { IntersectionObserver: unknown }).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock crypto.subtle for CryptoProof tests
Object.defineProperty(window, "crypto", {
  writable: true,
  value: {
    subtle: {
      digest: async (_algorithm: string, _data: ArrayBuffer) => {
        return new Uint8Array(32).fill(0).buffer;
      },
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});
