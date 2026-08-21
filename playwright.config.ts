import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    serviceWorkers: "block"
  },
  webServer: {
    command: `npm run preview -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: "mobile-320",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 320, height: 568 }
      }
    },
    {
      name: "mobile-390",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 }
      }
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 900 }
      }
    }
  ]
});
