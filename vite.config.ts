import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'assets'
        },
        // Assuming models are in public/models or similar, copy them if needed.
        // For now, prompt said "node_modules (or a local public/models folder)".
        // If they are in public/, Vite copies them automatically.
        // If we need to copy specific onnx files from somewhere else, we add them here.
        // Adding a placeholder for model setup if they were in node_modules.
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'onnxruntime-web'],
  },
  worker: {
    format: 'es',
    plugins: () => [
      // If we needed specific worker plugins
    ]
  }
})
