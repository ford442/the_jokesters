import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import compression from 'vite-plugin-compression2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function useCustomWebLLM(): boolean {
  return process.env.USE_CUSTOM_WEBLLM === '1' || process.env.USE_CUSTOM_WEBLLM === 'true';
}

function webllmResolveAlias(): Record<string, string> {
  if (!useCustomWebLLM()) return {};
  const distEntry = path.resolve(repoRoot, '3rd_party/web-llm-dist/lib/index.js');
  if (!fs.existsSync(distEntry)) {
    console.warn(
      '[vite] USE_CUSTOM_WEBLLM is set but 3rd_party/web-llm-dist/lib/index.js is missing.\n' +
        '       Run ./scripts/build-webllm.sh first.',
    );
  }
  return { '@mlc-ai/web-llm': distEntry };
}

/**
 * onnxruntime-web bundles locate their wasm with `new URL('ort-wasm-*.wasm', import.meta.url)`,
 * so Vite emits a private ~25 MB copy beside every bundle that imports it (about 75 MB in total).
 * Those are only fallbacks: the app always sets `ort.env.wasm.wasmPaths` to the single copy in
 * `assets/ort/` (see src/audio/ortWasmPath.ts) and transformers.js sets its own CDN path.
 * Drop the unused copies so they are neither shipped nor precached by the service worker.
 */
function dropOrtFallbackWasm(): Plugin {
  return {
    name: 'drop-ort-fallback-wasm',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/^assets\/ort-wasm-[^/]*\.wasm$/.test(fileName)) delete bundle[fileName];
      }
    },
  };
}

const webllmAlias = webllmResolveAlias();
const webllmChunkId = useCustomWebLLM()
  ? path.resolve(repoRoot, '3rd_party/web-llm-dist/lib/index.js')
  : '@mlc-ai/web-llm';

export default defineConfig(({ command }) => {
  // Deployed under a shared origin (test.1ink.us/the-jokesters/, go.1ink.us/the-jokesters/)
  // alongside unrelated sibling apps (dog_dash, weather_clock, marbles, hyphon, ...).
  // The PWA service worker MUST be scoped to this app's own subpath — a relative
  // `base: './'` leaves vite-plugin-pwa unable to resolve an absolute scope, which
  // previously fell back to '/' and let this app's service worker intercept fetches
  // (including model downloads) on every other app sharing the origin.
  const pwaScope = command === 'build' ? '/the-jokesters/' : undefined;

  return {
    base: './',
    resolve: {
      alias: webllmAlias,
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: './index.html',
          sw: './src/service-worker.ts',
        },
        output: {
          manualChunks: (id) => {
            // The `?url` wasm modules are tiny stubs referenced from the initial bundle (wllamaRuntime);
            // keep them out of this chunk so the wllama JS is only fetched when llama.cpp is selected.
            if (id.includes('@wllama/wllama') && !id.includes('.wasm')) return 'llamacpp-engine';
            if (id.includes('@huggingface/transformers')) return 'transformers-engine';
            if (id.includes('three/src')) return 'three-core';
            if (id.includes('three/examples')) return 'three-examples';
            if (id.includes('onnxruntime-web')) return 'onnx-runtime';
            if (id.includes('@mlc-ai/web-llm') || id.includes('3rd_party/web-llm-dist/lib/index.js')) return 'webllm-engine';
          },
          chunkFileNames: (chunkInfo) => `assets/${chunkInfo.name}-[hash].js`,
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'sw') return 'service-worker.js';
            return 'assets/[name]-[hash].js';
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || '';
            if (info.endsWith('.css')) return 'assets/[name]-[hash][extname]';
            if (info.endsWith('.wasm')) return 'assets/[name][extname]';
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'service-worker.ts',
        base: pwaScope,
        scope: pwaScope,
        injectManifest: {
          injectionPoint: undefined,
          globPatterns: ['**/*.{js,css,html,woff2,wasm,json}'],
          maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        },
        manifest: {
          name: 'The Jokesters',
          short_name: 'Jokesters',
          description: 'AI-powered comedy improv with 3D avatars and real-time WebGPU inference',
          theme_color: '#6b46c1',
          background_color: '#0f0f23',
          display: 'standalone',
          orientation: 'any',
          // Relative — resolved against the manifest's own URL, so this works whether the
          // app is deployed at the site root or under a subpath (e.g. /the-jokesters/).
          start_url: '.',
          icons: [{ src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' }],
        },
        devOptions: { enabled: true },
      }),
      dropOrtFallbackWasm(),
      viteStaticCopy({
        targets: [
          {
            // Only the variant the default `onnxruntime-web` entry (ort.bundle.min.mjs) requests:
            // the JSEP build, which serves both the webgpu and wasm execution providers.
            // The remaining dist/ files (asyncify, jspi, plain, webgl, all.*) are never fetched.
            src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.{wasm,mjs}',
            dest: 'assets/ort',
          },
        ],
      }),
      compression({
        algorithm: 'brotliCompress',
        threshold: 512,
        deleteOriginalAssets: false,
      }),
      compression({
        algorithm: 'gzip',
        threshold: 512,
        deleteOriginalAssets: false,
      }),
    ],
    optimizeDeps: {
      exclude: ['@mlc-ai/web-llm', 'onnxruntime-web', '@wllama/wllama', '@huggingface/transformers'],
    },
    worker: {
      format: 'es',
      plugins: () => [],
    },
  };
});
