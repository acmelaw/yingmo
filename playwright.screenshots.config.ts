import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Screenshot Generation
 * Uses existing dev server instead of starting a new one
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* No retries for screenshots */
  retries: 0,

  /* Single worker for consistent screenshots */
  workers: 1,

  /* Reporter to use */
  reporter: [["list"]],

  /* Shared settings */
  use: {
    /* Base URL */
    baseURL: "http://localhost:5174",

    /* No trace for screenshots */
    trace: "off",

    /* No screenshots on failure */
    screenshot: "off",

    /* No video */
    video: "off",
  },

  /* Configure projects */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use system chromium in CI
        ...(process.env.CI && {
          launchOptions: { executablePath: "/usr/bin/chromium" },
        }),
      },
    },
  ],

  /* Do NOT start dev server - assume it's already running */
  webServer: undefined,
});
