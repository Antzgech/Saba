// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3000,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5000',
//         changeOrigin: true
//       }
//     }
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: true
//   }
// });
// // import { defineConfig } from 'vite'

// export default defineConfig({
//   server: {
//     allowedHosts: [
//       "https://jayna-unsepultured-depravedly.ngrok-free.dev"
//     ]
//   }
// })
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,

    // Allow all external hosts (ngrok, cloudflare, railway, etc.)
    allowedHosts: true,
  }
});
