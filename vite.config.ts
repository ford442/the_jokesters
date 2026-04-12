import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
    viteStaticCopy({
      targets: [
        {
          // Copy both .wasm and .mjs files
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
          dest: 'assets/ort'
        }
        // Note: TTS model files (tts.json, unicode_indexer.json, *.onnx) are expected
        // to be hosted at ./tts/onnx/ on the deployment server
        // Note: Voice style JSON files (F1.json, F2.json, M1.json, M2.json) are expected
        // to be hosted at ./tts/voice_styles/ on the deployment server
      ]
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
