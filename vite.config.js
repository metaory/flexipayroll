import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  server: { host: true },
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ]
});
