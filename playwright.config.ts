import { defineConfig } from '@playwright/test'

// E2E smoke tests (e2e/) are deliberately NOT part of `npm run test` —
// they need a running, seeded backend on :8000. See README §5.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
