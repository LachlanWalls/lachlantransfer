import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import express from 'express'

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 5173 },
  plugins: [preact(),
    {
      name: 'api',
      config: () => { return { server: { hmr: false } } },
      configureServer: async server => {
        const { router } = await server.ssrLoadModule('./backend/src/server.ts')
        const app = express().use(router)
        server.middlewares.use('/upload', (req, res) => app(req, res))
      }
    }
  ],
})
