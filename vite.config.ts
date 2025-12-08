import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './', // Matches your other project
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
          // Copy only WASM files, just like the other project
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'assets/ort'
        }
      ]
    })
  ],
  optimizeDeps: {
    // This is crucial! It stops Vite from breaking the ONNX import
    exclude: ['@mlc-ai/web-llm', 'onnxruntime-web']
  },
  worker: {
    format: 'es',
    plugins: () => [
      // If we needed specific worker plugins
    ]
  }
});
