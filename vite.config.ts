import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      allow: ['..']
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // Copy both .wasm and .mjs files
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
          dest: 'assets/ort'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'onnxruntime-web']
  },
  worker: {
    format: 'es',
    plugins: () => [
      // If we needed specific worker plugins
    ]
  }
});
