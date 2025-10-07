import { test } from "@playwright/test";
import {
  setupAppForScreenshot,
  captureOptimizedScreenshot,
  typeInInput,
} from "./utils/screenshot-helper";

/**
 * Feature Demo Screenshots
 *
 * These tests capture screenshots demonstrating specific features
 * for use in documentation and PR descriptions.
 */

test.describe("Feature Demo Screenshots", () => {
  test("capture hashtag detection demo", async ({ page }) => {
    await page.goto("/");
    await setupAppForScreenshot(page);

    // Type text with hashtags to show the detection feature
    await typeInInput(page, "This is a note with #test and #important tags");

    // Capture screenshot showing hashtag detection
    await captureOptimizedScreenshot(page, {
      path: "docs/images/feature-hashtag-detection.png",
      type: "png",
    });
  });

  test("capture slash command demo", async ({ page }) => {
    await page.goto("/");
    await setupAppForScreenshot(page);

    // Type slash command to show auto-detection
    await typeInInput(page, "/markdown");

    // Capture screenshot showing slash command detection
    await captureOptimizedScreenshot(page, {
      path: "docs/images/feature-slash-commands.png",
      type: "png",
    });
  });
});
