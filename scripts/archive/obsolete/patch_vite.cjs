const fs = require('fs');

let content = fs.readFileSync('vite.config.ts', 'utf8');

if (!content.includes("import { VitePWA } from 'vite-plugin-pwa';")) {
    content = content.replace("import compression from 'vite-plugin-compression2';", "import compression from 'vite-plugin-compression2';\nimport { VitePWA } from 'vite-plugin-pwa';");
}

const pwaPlugin = `
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,wasm,json}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 // 10 MB to allow some larger local json files
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
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('webllm') ||
                                     url.pathname.includes('.bin') ||
                                     url.pathname.includes('.safetensors') ||
                                     url.pathname.includes('models'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'webllm-models',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tts-assets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),`;

if (!content.includes('VitePWA({')) {
    content = content.replace('plugins: [', `plugins: [${pwaPlugin}`);
}

fs.writeFileSync('vite.config.ts', content);
