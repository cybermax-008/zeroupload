import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Copy wasm-vips WASM binary to build output with its original name.
// Vite content-hashes it (vips-XXXXX.wasm) but wasm-vips resolves
// the filename at runtime via import.meta.url, so it needs the
// unhashed name to be available too.
function copyVipsWasm() {
  return {
    name: 'copy-vips-wasm',
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const assetsDir = resolve(outDir, 'assets');
      mkdirSync(assetsDir, { recursive: true });
      const src = resolve('node_modules/wasm-vips/lib/vips.wasm');
      copyFileSync(src, resolve(assetsDir, 'vips.wasm'));
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    copyVipsWasm(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Cache wasm-vips binary, pica, pdf-lib for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for wasm binaries
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Activate new service worker immediately — prevents stale cache issues
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Cache CDN resources (fonts, etc.)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache wasm binaries
            urlPattern: /\.wasm$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-binaries',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Acorn Tools — Private PDF & Image Tools',
        short_name: 'Acorn Tools',
        description: 'Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device.',
        theme_color: '#0a0a0b',
        background_color: '#0a0a0b',
        display: 'standalone',
        orientation: 'any',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],

  // Required headers for wasm-vips SharedArrayBuffer support
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  // Preview server also needs these headers
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split wasm-vips into its own chunk (it's large)
          'image-engine': ['wasm-vips'],
          'pdf-engine': ['pdf-lib'],
          'resize-engine': ['pica'],
          'pdf-renderer': ['pdfjs-dist'],
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['wasm-vips', 'pdfjs-dist'], // Let these handle their own loading
  },
});
