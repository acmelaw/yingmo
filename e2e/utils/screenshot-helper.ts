/**
 * Screenshot Helper Utility
 *
 * Provides reusable functions for capturing optimized screenshots
 * for documentation and PR demos.
 */

import type { Page } from "@playwright/test";

export interface ScreenshotOptions {
  /**
   * Output file path relative to project root
   */
  path: string;

  /**
   * Whether to capture full page or just viewport
   * @default false
   */
  fullPage?: boolean;

  /**
   * Quality for JPEG (0-100) or compression level for PNG
   * @default 80 for JPEG, 6 for PNG
   */
  quality?: number;

  /**
   * Image format
   * @default 'png'
   */
  type?: "png" | "jpeg";
}

/**
 * Setup the app for screenshot by closing any modals
 */
export async function setupAppForScreenshot(page: Page): Promise<void> {
  // Wait for app to load
  await page.waitForLoadState("networkidle");

  // Close server selector if it appears
  const continueOfflineButton = page.getByRole("button", {
    name: "Continue offline",
  });

  if (
    await continueOfflineButton.isVisible({ timeout: 2000 }).catch(() => false)
  ) {
    await continueOfflineButton.click({ force: true });
    await page.waitForTimeout(500);
  }
}

/**
 * Capture an optimized screenshot
 */
export async function captureOptimizedScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<void> {
  const { path, fullPage = false, quality, type = "png" } = options;

  await page.screenshot({
    path,
    fullPage,
    quality,
    type,
    // Optimize for web display
    animations: "disabled",
  });

  console.log(`✅ Screenshot captured: ${path}`);
}

/**
 * Create a note with text input
 */
export async function createNote(
  page: Page,
  content: string,
  slashCommand?: string
): Promise<void> {
  const input = page.getByPlaceholder("Write your note...");

  if (slashCommand) {
    await input.fill(slashCommand);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
  }

  await input.fill(content);

  const sendButton = page.getByRole("button", { name: "⚡" });
  await sendButton.click();
  await page.waitForTimeout(500);
}

/**
 * Type text in the input to show live features (e.g., hashtag detection)
 */
export async function typeInInput(page: Page, content: string): Promise<void> {
  const input = page.getByPlaceholder("Write your note...");
  await input.fill(content);
  await page.waitForTimeout(500); // Wait for live features to activate
}
