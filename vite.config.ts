import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import compression from 'vite-plugin-compression2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const repoRoot = path.dirname(fileURLToPath(new URL('.', import.meta.url)));

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

const webllmAlias = webllmResolveAlias();
const webllmChunkId = useCustomWebLLM()
  ? path.resolve(repoRoot, '3rd_party/web-llm-dist/lib/index.js')
  : '@mlc-ai/web-llm';

export default defineConfig({
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
        manualChunks: {
          'webllm-engine': [webllmChunkId],
          'llamacpp-engine': ['@wllama/wllama'],
          'transformers-engine': ['@huggingface/transformers'],
          'three-core': ['three'],
          'onnx-runtime': ['onnxruntime-web'],
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
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
          dest: 'assets/ort',
        },
      ],
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 512,
      deleteOriginalAssets: false,
      verbose: true,
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 512,
      deleteOriginalAssets: false,
      verbose: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'onnxruntime-web', '@wllama/wllama', '@huggingface/transformers'],
  },
  worker: {
    format: 'es',
    plugins: () => [],
  },
});
