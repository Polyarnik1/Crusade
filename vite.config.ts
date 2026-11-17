import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — чтобы сборка работала и на GitHub Pages (/Crusade/), и в будущем APK
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
});
