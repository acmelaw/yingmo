import { test } from "@playwright/test";
import {
  setupAppForScreenshot,
  captureOptimizedScreenshot,
  createNote,
} from "./utils/screenshot-helper";

/**
 * Screenshot Generator Test
 *
 * This test captures a hero screenshot of the application
 * showing its current state and features for documentation.
 */

test.describe("Hero Screenshot Generation", () => {
  test("capture hero screenshot for README", async ({ page }) => {
    await page.goto("/");
    await setupAppForScreenshot(page);

    // Create sample notes to showcase the app
    await createNote(
      page,
      "# Welcome to Yingmo\n\nA modular notes app for **parallel development**",
      "/markdown"
    );

    await createNote(page, 'console.log("Hello, World!");', "/code");

    await createNote(
      page,
      "Setup CI pipeline\nAdd screenshot generation\nUpdate README",
      "/todo"
    );

    // Wait for all notes to render
    await page.waitForTimeout(1000);

    // Capture optimized hero screenshot
    await captureOptimizedScreenshot(page, {
      path: "hero-screenshot.png",
      type: "png",
    });
  });
});
