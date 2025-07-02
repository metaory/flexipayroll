import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  server: { host: true },
  plugins: [
    tailwindcss(),
    svelte()
  ]
});
