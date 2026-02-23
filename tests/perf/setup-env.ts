// Mock browser environment for Node.js CI runner
// Only mocks minimal necessary APIs to prevent crashes when loading modules

if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = global;

  // Minimal document mock for canvas creation
  // @ts-ignore
  global.document = {
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
  // @ts-ignore
  global.localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] || null,
    length: 0
  };

  // Mock Worker
  // @ts-ignore
  global.Worker = class Worker {
    constructor() {}
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  };

  // Mock performance.now if needed (usually available in recent Node)
  if (!global.performance) {
    // @ts-ignore
    global.performance = { now: () => Date.now() };
  }

  // Mock requestAnimationFrame
  // @ts-ignore
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  // @ts-ignore
  global.cancelAnimationFrame = (id) => clearTimeout(id);

  // Mock URL.createObjectURL - Only add if missing or if URL exists but createObjectURL doesn't
  if (typeof URL !== 'undefined') {
      if (!URL.createObjectURL) {
          // @ts-ignore
          URL.createObjectURL = () => 'blob:mock';
          // @ts-ignore
          URL.revokeObjectURL = () => {};
      }
  } else {
      // @ts-ignore
      global.URL = {
          createObjectURL: () => 'blob:mock',
          revokeObjectURL: () => {}
      };
  }

  // Mock Blob
  if (!global.Blob) {
      // @ts-ignore
      global.Blob = class Blob {
          constructor(content: any[], options: any) {}
      };
  }
}
