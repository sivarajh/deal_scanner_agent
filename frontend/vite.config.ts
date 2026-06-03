import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/apps': 'http://127.0.0.1:8090',
      '/run_sse': 'http://127.0.0.1:8090',
      '/run': 'http://127.0.0.1:8090',
    },
  },
})
