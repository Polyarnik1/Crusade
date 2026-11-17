import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Сборка в один HTML для артефакта Claude: npm run build:artifact
export default defineConfig({
  base: './',
  mode: 'artifact',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});
