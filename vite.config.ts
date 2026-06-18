import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import compression from 'vite-plugin-compression2';

export default defineConfig({
  base: './',
  server: {
    // headers: {
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    //   'Cross-Origin-Embedder-Policy': 'credentialless',
    // },
    fs: {
      allow: ['..']
    }
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2022',
    // CSS optimization
    cssCodeSplit: true,
    // Minification settings
    minify: 'esbuild',
    // Source maps for debugging (can be disabled for production)
    sourcemap: false,
    // Rollup options for chunking
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './src/service-worker.ts',
      },
      output: {
        // Manual chunks for code splitting
        manualChunks: {
          // WebLLM engine - loaded on demand when user selects a model
          'webllm-engine': ['@mlc-ai/web-llm'],
          // llama.cpp WASM engine - loaded for GGUF models
          'llamacpp-engine': ['@wllama/wllama'],
          // Transformers.js engine - loaded for ONNX/WebGPU models
          'transformers-engine': ['@huggingface/transformers'],
          // Three.js core - split into smaller chunks
          'three-core': ['three'],
          // ONNX Runtime - loaded when TTS is needed
          'onnx-runtime': ['onnxruntime-web'],
        },
        // Ensure chunks are properly named for caching
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // Add content hash for cache busting
          return `assets/${name}-[hash].js`;
        },
        // Entry file naming - service worker gets stable name, others are hashed
        entryFileNames: (chunkInfo) => {
          // Service worker must have a stable name for reliable registration
          if (chunkInfo.name === 'sw') {
            return 'service-worker.js';
          }
          // Hash main and other entries for cache busting
          return 'assets/[name]-[hash].js';
        },
        // Asset file naming (for images, fonts, etc.)
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (info.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          if (info.endsWith('.wasm')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Reduce chunk size warning threshold (500KB is default)
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
        start_url: '/',
        icons: [
          { src: '/vite.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      devOptions: {
        enabled: true,
      },
    }),
    viteStaticCopy({
      targets: [
        {
          // Copy both .wasm and .mjs files
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
          dest: 'assets/ort'
        }
        // TTS model files are hosted at storage.1ink.us/models/tts/onnx/
        // Voice styles at storage.1ink.us/models/tts/voice_styles/
      ]
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 512,
      deleteOriginalAssets: false,
      verbose: true
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 512,
      deleteOriginalAssets: false,
      verbose: true
    })
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'onnxruntime-web', '@wllama/wllama', '@huggingface/transformers']
  },
  worker: {
    format: 'es',
    plugins: () => [
      // If we needed specific worker plugins
    ]
  }
});
