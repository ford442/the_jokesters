import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
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
        // Note: TTS model files (tts.json, unicode_indexer.json, *.onnx) are expected
        // to be hosted at ./tts/onnx/ on the deployment server
        // Note: Voice style JSON files (F1.json, F2.json, M1.json, M2.json) are expected
        // to be hosted at ./tts/voice_styles/ on the deployment server
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
