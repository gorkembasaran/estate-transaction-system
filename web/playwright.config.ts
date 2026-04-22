import { defineConfig, devices } from '@playwright/test'

const isDeployedMode = process.env.E2E_MODE === 'deployed'
const frontendBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim()
  || (isDeployedMode
    ? 'https://estate-transaction-system.vercel.app'
    : 'http://127.0.0.1:3000')
const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL?.trim()
  || (isDeployedMode
    ? 'https://estate-transaction-api.onrender.com'
    : 'http://127.0.0.1:3001')
const shouldReuseExistingServer = process.env.E2E_REUSE_SERVER === 'true'
const e2eMongoUri = process.env.E2E_MONGODB_URI?.trim()
  || 'mongodb://127.0.0.1:27017'
const e2eMongoDatabase = process.env.E2E_MONGODB_DATABASE?.trim()
  || 'estate_transaction_system_e2e'

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: './e2e',
  fullyParallel: false,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: frontendBaseUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: isDeployedMode
    ? undefined
    : [
        {
          command: 'npm run start:dev',
          cwd: '../api',
          env: {
            ...process.env,
            FRONTEND_ORIGIN: 'http://127.0.0.1:3000,http://localhost:3000',
            HOST: '127.0.0.1',
            MONGODB_DATABASE: e2eMongoDatabase,
            MONGODB_URI: e2eMongoUri,
            NODE_ENV: 'test',
            PORT: '3001',
          },
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 120_000,
          url: `${apiBaseUrl}/agents?page=1&limit=1`,
        },
        {
          command: 'npm run build && npm run preview',
          cwd: '.',
          env: {
            ...process.env,
            NITRO_HOST: '127.0.0.1',
            NITRO_PORT: '3000',
            NUXT_PUBLIC_API_BASE: apiBaseUrl,
            NUXT_PUBLIC_API_TIMEOUT_MS: process.env.NUXT_PUBLIC_API_TIMEOUT_MS
              || '60000',
          },
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 180_000,
          url: frontendBaseUrl,
        },
      ],
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
