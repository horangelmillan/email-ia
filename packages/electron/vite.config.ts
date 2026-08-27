import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'src/main.ts',
        vite: {
          build: {
            outDir: 'dist',
          },
        },
      },
      preload: {
        input: 'src/preload.ts',
        vite: {
          build: {
            outDir: 'dist',
          },
        },
      },
    }),
  ],
});
