import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4917",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run preview -- --port 4917 --strictPort",
      url: "http://localhost:4917",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // party relay for e2e/party.spec.ts
      command: "npm run relay",
      port: 8787,
      // reuse lets the same test run against the Cloudflare relay (cd relay && npm run dev)
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
