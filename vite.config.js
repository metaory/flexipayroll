import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  server: { host: true },
  css: {
    preprocessorOptions: {
      scss: {
        // This ensures Sass can resolve node_modules imports
        includePaths: ['node_modules']
      }
    }
  },
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ]
});
