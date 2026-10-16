// Mock browser environment for Node.js CI runner
// Only mocks minimal necessary APIs to prevent crashes when loading modules

if (typeof window === 'undefined') {
  // The mocks below are deliberately partial, so they are installed through an
  // untyped view of globalThis rather than against the DOM lib types.
  const g = globalThis as unknown as Record<string, unknown>;

  g.window = globalThis;

  // Minimal document mock for canvas creation
  g.document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({}),
          width: 0,
          height: 0,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      }
      return {};
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    getElementById: () => null
  };

  // Mock localStorage
  const storage = new Map<string, string>();
  g.localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] || null,
    length: 0
  };

  // Mock Worker
  g.Worker = class Worker {
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  };

  // Mock performance.now if needed (usually available in recent Node)
  if (!globalThis.performance) {
    g.performance = { now: () => Date.now() };
  }

  // Mock requestAnimationFrame
  g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
  g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);

  // Mock URL.createObjectURL - Only add if missing or if URL exists but createObjectURL doesn't
  if (typeof URL !== 'undefined') {
    if (!URL.createObjectURL) {
      Object.assign(URL, {
        createObjectURL: () => 'blob:mock',
        revokeObjectURL: () => {}
      });
    }
  } else {
    g.URL = {
      createObjectURL: () => 'blob:mock',
      revokeObjectURL: () => {}
    };
  }

  // Mock Blob
  if (!globalThis.Blob) {
    g.Blob = class Blob {};
  }
}
