import { defineConfig, devices } from "@playwright/test";

const testPort = Number(process.env.E2E_PORT ?? 3100);
const testBaseUrl = `http://localhost:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  use: { baseURL: testBaseUrl, trace: "retain-on-failure" },
  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "true",
    timeout: 120_000,
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
});
