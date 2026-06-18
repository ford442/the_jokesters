/**
 * VPS model storage helpers for storage.1ink.us.
 *
 * WebLLM's cleanModelUrl() appends HuggingFace-style `/resolve/main/` to every
 * model base URL. Our VPS serves flat paths (no /resolve/main/), so those
 * requests 404 unless rewritten before fetch.
 */

export const VPS_STORAGE_ORIGIN = 'https://storage.1ink.us';
export const VPS_STORAGE_URL = `${VPS_STORAGE_ORIGIN}/models`;

/** WebLLM HF-style URL → flat VPS path */
const VPS_RESOLVE_MAIN_RE =
  /^(https:\/\/storage\.1ink\.us\/models\/[^/]+)\/resolve\/main\/(.+)$/;

export function rewriteVpsModelUrl(url: string): string {
  const match = url.match(VPS_RESOLVE_MAIN_RE);
  return match ? `${match[1]}/${match[2]}` : url;
}

function resolveFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function buildFetchInput(input: RequestInfo | URL, rewrittenUrl: string): RequestInfo | URL {
  if (typeof input === 'string' || input instanceof URL) {
    return rewrittenUrl;
  }
  return new Request(rewrittenUrl, input);
}

/**
 * Patch global fetch so WebLLM's /resolve/main/ URLs hit flat VPS paths.
 * Safe to call multiple times (no-op after first install).
 */
export function installVpsFetchRewrite(): void {
  const g = globalThis as typeof globalThis & { __vpsFetchRewriteInstalled?: boolean };
  if (g.__vpsFetchRewriteInstalled) return;

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveFetchUrl(input);
    const rewritten = rewriteVpsModelUrl(url);
    if (rewritten !== url) {
      return originalFetch(buildFetchInput(input, rewritten), init);
    }
    return originalFetch(input, init);
  };

  g.__vpsFetchRewriteInstalled = true;
}
