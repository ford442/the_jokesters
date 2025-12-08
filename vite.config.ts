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
        },
        {
          // Copy ONNX model files and configs
          src: 'models/onnx/*',
          dest: 'assets/onnx'
        }
        // Note: Voice style JSON files are expected to be hosted at ./tts/voice_styles/
        // on the deployment server and are not included in the build
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
