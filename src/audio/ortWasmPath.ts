/**
 * Directory (absolute URL) that serves the ONNX Runtime wasm runtime copied by
 * vite-plugin-static-copy (see vite.config.ts). Resolved against the page, not the calling
 * script, so it is right for the main thread and for module workers alike.
 */
export function getOrtWasmBaseUrl(): string {
  return new URL('assets/ort/', document.baseURI || window.location.href).href
}
