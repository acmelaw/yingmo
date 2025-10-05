import { test, expect, Page } from "@playwright/test";

/**
 * E2E Tests for Data Persistence & Integrity
 *
 * These tests verify that data persists correctly across sessions
 * and that the application handles storage correctly.
 */

/**
 * Helper to close server selector modal if visible
 */
async function closeServerSelectorIfVisible(page: Page) {
  await page.waitForTimeout(300);
  const continueOfflineButton = page.getByRole("button", {
    name: "Continue offline",
  });
  try {
    if (await continueOfflineButton.isVisible({ timeout: 1000 })) {
      await continueOfflineButton.click({ force: true });
      await page.waitForTimeout(300);
    }
  } catch {
    // Modal not visible, continue
  }
}

test.describe("Data Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Close server selector
    await closeServerSelectorIfVisible(page);
  });

  test("should persist single note across reload", async ({ page }) => {
    // Create a note
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("persisted note");
    await page.getByRole("button", { name: "⚡" }).click();

    // Verify note is visible
    await expect(page.getByText("persisted note")).toBeVisible();

    // Reload page
    await page.reload();
    await closeServerSelectorIfVisible(page);

    // Verify note is still there
    await expect(page.getByText("persisted note")).toBeVisible();
  });

  test("should persist multiple notes with metadata", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    // Create notes with tags
    await input.fill("work task #work #urgent");
    await sendButton.click();
    await page.waitForTimeout(100);

    await input.fill("personal reminder #personal");
    await sendButton.click();
    await page.waitForTimeout(100);

    await input.fill("project idea #work #project");
    await sendButton.click();

    // Reload page
    await page.reload();
    await closeServerSelectorIfVisible(page);

    // Verify all notes and their tags persist
    await expect(page.getByText("work task")).toBeVisible();
    await expect(page.getByText("personal reminder")).toBeVisible();
    await expect(page.getByText("project idea")).toBeVisible();

    // Verify tags are still there
    const workTaskCard = page
      .locator("article")
      .filter({ hasText: "work task" });
    await expect(
      workTaskCard.getByText("#work", { exact: true })
    ).toBeVisible();
    await expect(
      workTaskCard.getByText("#urgent", { exact: true })
    ).toBeVisible();
  });

  test("should handle 20 notes efficiently", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Write your note..." });
    const sendButton = page.getByRole("button", { name: "⚡" });

    // Create 20 notes
    for (let i = 1; i <= 20; i++) {
      await input.fill(`Note number ${i}`);
      await sendButton.click();
      if (i % 5 === 0) {
        await page.waitForTimeout(100);
      }
    }

    // Select exact text to avoid matching timestamps like "2003"
    const latestNoteText = page.getByText("Note number 20", { exact: true });
    await expect(latestNoteText).toBeVisible();

    // Reload page
    await page.reload();
    await closeServerSelectorIfVisible(page);

    // Verify notes are still there
    const firstNoteText = page.getByText("Note number 1", { exact: true });
    await expect(firstNoteText).toBeVisible();

    const lastNoteText = page.getByText("Note number 20", { exact: true });
    await expect(lastNoteText).toBeVisible();
  });

  test("should show new note immediately even when sync is enabled (optimistic UI)", async ({ page }) => {
    // Enable sync in settings
    await page.getByRole("button", { name: "⚙️" }).click();
    const syncToggle = page.getByRole("switch");
    await syncToggle.click();
    await page.getByRole("button", { name: "✕" }).click();

    // Create a note and verify it appears right away
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");
    await input.fill("optimistic note");
    await sendButton.click();

    await expect(page.getByText("optimistic note")).toBeVisible();
  });
});
