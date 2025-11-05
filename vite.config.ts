import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/domain': resolve(__dirname, './src/domain'),
      '@/api': resolve(__dirname, './src/api'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/components': resolve(__dirname, './src/components'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/types': resolve(__dirname, './src/types'),
    },
  },

  // Plugins
  plugins: [
    // Support for older browsers
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',

    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-validation': ['zod'],

          // Domain chunks
          'domain-calculator': [
            './src/domain/calculator/entities/Money.ts',
            './src/domain/calculator/entities/PaymentCalculator.ts',
          ],
        },
      },
    },

    // Performance optimization
    chunkSizeWarningLimit: 1000,

    // Terser options for minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },

  // Development server
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    open: true,
  },

  // Preview server
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Environment variables prefix
  envPrefix: 'VITE_',
});
