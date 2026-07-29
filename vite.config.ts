import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const API_TARGET = env.VITE_API_TARGET || 'http://127.0.0.1:8000'

  // Run `ANALYZE=true npm run build` to emit dist/stats.html (treemap).
  const analyze = env.ANALYZE === 'true'

  const plugins: PluginOption[] = [react()]
  if (analyze) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    )
  }

  return {
    plugins,
    server: {
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep the rarely-changing framework code in its own long-cached
          // chunk, separate from app code that ships on every deploy.
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            // Check router before react — 'react-router-dom' contains 'react'.
            if (id.includes('react-router')) return 'router'
            if (id.includes('/react-dom/') || id.includes('/react/')) {
              return 'react'
            }
          },
        },
      },
    },
  }
})
