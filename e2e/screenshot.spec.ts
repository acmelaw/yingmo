import { test, expect } from "@playwright/test";

/**
 * Screenshot Generator Test
 *
 * This test captures a hero screenshot of the application
 * showing its current state and features for documentation.
 */

test.describe("Hero Screenshot Generation", () => {
  test("capture hero screenshot for README", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for app to load
    await expect(
      page.getByRole("heading", { name: /vue notes/i }).first()
    ).toBeVisible();

    // Close server selector if it appears
    const continueOfflineButton = page.getByRole("button", {
      name: "Continue offline",
    });
    if (
      await continueOfflineButton
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await continueOfflineButton.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Create a few sample notes to showcase the app
    const input = page.getByPlaceholder("Write your note...");

    // Create a markdown note
    await input.fill("/markdown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await input.fill(
      "# Welcome to Yingmo\n\nA modular notes app for **parallel development**"
    );
    const sendButton = page.getByTitle("Send message");
    await sendButton.click();
    await page.waitForTimeout(500);

    // Create a code note
    await input.fill("/code");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await input.fill('console.log("Hello, World!");');
    await sendButton.click();
    await page.waitForTimeout(500);

    // Create a todo note
    await input.fill("/todo");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await input.fill(
      "Setup CI pipeline\nAdd screenshot generation\nUpdate README"
    );
    await sendButton.click();
    await page.waitForTimeout(500);

    // Wait for all notes to render
    await page.waitForTimeout(1000);

    // Capture the hero screenshot
    await page.screenshot({
      path: "hero-screenshot.png",
      fullPage: false,
    });

    console.log("Hero screenshot captured successfully!");
  });
});
