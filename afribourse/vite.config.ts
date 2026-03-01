import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true, // Required for Sentry source maps
  },
  plugins: [
    react(),
    imagetools(),
    // Sentry source maps upload (only in production build with auth token)
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'], // Don't deploy source maps
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'images/logo_afribourse.png',
        'AppImages/android/android-launchericon-192-192.png',
        'AppImages/android/android-launchericon-512-512.png',
      ],
      // manifest.json is in /public, no need to generate one
      manifest: false,
      workbox: {
        importScripts: ['/push-handler.js'],
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,woff,ttf}'],
        // Exclude large images from precache, they'll be cached at runtime
        globIgnores: ['**/screenshot/**', '**/AppImages/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        // SPA: route all navigation to index.html
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^(?!\/(api|__)).*$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Google Fonts webfont files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Images (logos, avatars, screenshots)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API: Stocks (stale-while-revalidate for fast display + background refresh)
          {
            urlPattern: /^https:\/\/api\.africbourse\.com\/api\/stocks/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stocks-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API: Learning modules (cache-first, rarely changes)
          {
            urlPattern: /^https:\/\/api\.africbourse\.com\/api\/learning/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'learning-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API: Leaderboard (network-first, changes often)
          {
            urlPattern: /^https:\/\/api\.africbourse\.com\/api\/leaderboard/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'leaderboard-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API: All other endpoints (network-first with fallback)
          {
            urlPattern: /^https:\/\/api\.africbourse\.com\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // SW désactivé en dev pour éviter les conflits de cache
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['lightweight-charts', 'lightweight-charts-line-tools'],
  },
});
