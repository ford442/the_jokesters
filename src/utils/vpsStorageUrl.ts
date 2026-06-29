/**
 * VPS model storage helpers for storage.1ink.us / storage.noahcohn.com.
 *
 * WebLLM's cleanModelUrl() appends HuggingFace-style `/resolve/main/` to every
 * model base URL. Our VPS serves flat paths (no /resolve/main/), so those
 * requests 404 unless rewritten before fetch or Cache.add().
 */

export const VPS_STORAGE_ORIGIN = 'https://storage.1ink.us';
export const VPS_STORAGE_URL = `${VPS_STORAGE_ORIGIN}/models`;

/** WebLLM HF-style URL → flat VPS path (both storage mirrors) */
const VPS_RESOLVE_MAIN_RE =
  /^(https:\/\/storage\.(?:1ink\.us|noahcohn\.com)\/models\/[^/]+)\/resolve\/main\/(.+)$/;

export function rewriteVpsModelUrl(url: string): string {
  const match = url.match(VPS_RESOLVE_MAIN_RE);
  return match ? `${match[1]}/${match[2]}` : url;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function buildRequest(input: RequestInfo | URL, url: string): Request {
  if (typeof input === 'string') return new Request(url);
  if (input instanceof URL) return new Request(url);
  return new Request(url, input);
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
    const url = resolveRequestUrl(input);
    const rewritten = rewriteVpsModelUrl(url);
    if (rewritten !== url) {
      return originalFetch(buildFetchInput(input, rewritten), init);
    }
    return originalFetch(input, init);
  };

  g.__vpsFetchRewriteInstalled = true;
}

/**
 * Patch Cache.add so WebLLM artifact caching fetches flat VPS paths.
 * Cache.add() does not always honor a patched global fetch, so we fetch
 * explicitly and store under the original /resolve/main/ cache key.
 */
export function installVpsCacheRewrite(): void {
  const g = globalThis as typeof globalThis & { __vpsCacheRewriteInstalled?: boolean };
  if (g.__vpsCacheRewriteInstalled || typeof Cache === 'undefined') return;

  const originalAdd = Cache.prototype.add;
  Cache.prototype.add = async function (input: RequestInfo): Promise<void> {
    const url = resolveRequestUrl(input);
    const rewritten = rewriteVpsModelUrl(url);
    if (rewritten === url) {
      return originalAdd.call(this, input);
    }
    const response = await fetch(rewritten);
    if (!response?.ok) {
      throw new TypeError("Failed to execute 'add' on 'Cache': Request failed");
    }
    await this.put(buildRequest(input, url), response);
  };

  g.__vpsCacheRewriteInstalled = true;
}

/** Install fetch + Cache rewrites (idempotent). */
export function installVpsStorageRewrites(): void {
  installVpsFetchRewrite();
  installVpsCacheRewrite();
}
