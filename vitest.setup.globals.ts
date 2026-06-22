// Node.js 25 adds a built-in `localStorage` global that conflicts with jsdom's.
// vitest's populateGlobal skips it because Node already has it.
// This setup file explicitly copies jsdom's localStorage onto globalThis.
if (typeof window !== "undefined") {
  const g = globalThis as unknown as { jsdom?: { window: { localStorage: Storage } } };
  if (g.jsdom !== undefined) {
    Object.defineProperty(globalThis, "localStorage", {
      value: g.jsdom.window.localStorage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}
