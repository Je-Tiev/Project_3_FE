import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [react()],
  server: {
    // https: true,
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5075',
        changeOrigin: true,
      }
    },
    historyApiFallback: true
  }
});
