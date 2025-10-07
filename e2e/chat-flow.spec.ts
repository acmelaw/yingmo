import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Chat/Note Flow
 *
 * These tests verify the complete user journey of creating, viewing,
 * and managing notes in the chat-style interface.
 */

test.describe("Chat/Note Flow - Critical User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for app to load - use first() to get the main heading
    await expect(
      page.getByRole("heading", { name: /vue notes/i }).first()
    ).toBeVisible();

    // Close server selector if it appears - wait for it and force click
    const continueOfflineButton = page.getByRole("button", {
      name: "Continue offline",
    });
    if (
      await continueOfflineButton
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await continueOfflineButton.click({ force: true });
      // Wait for the modal to close
      await page.waitForTimeout(500);
    }
  });

  test("should show empty state initially", async ({ page }) => {
    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  test("should create a note and display it immediately", async ({ page }) => {
    // Type a message
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("hello world");

    // Verify send button becomes enabled
    const sendButton = page.getByTitle("Send message");
    await expect(sendButton).toBeEnabled();

    // Send the message
    await sendButton.click();

    // Verify note appears in the list
    await expect(page.getByText("hello world")).toBeVisible();

    // Verify empty state is gone
    await expect(page.getByText("No notes yet")).not.toBeVisible();

    // Verify input is cleared
    await expect(input).toHaveValue("");

    // Verify send button is disabled again
    await expect(sendButton).toBeDisabled();
  });

  test("should create a note using Enter key", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("quick note");
    await input.press("Enter");

    // Verify note appears
    await expect(page.getByText("quick note")).toBeVisible();
  });

  test("should create multiple notes in sequence", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    // Create first note
    await input.fill("first note");
    await sendButton.click();
    await expect(page.getByText("first note")).toBeVisible();

    // Create second note
    await input.fill("second note");
    await sendButton.click();
    await expect(page.getByText("second note")).toBeVisible();

    // Create third note
    await input.fill("third note");
    await sendButton.click();
    await expect(page.getByText("third note")).toBeVisible();

    // Verify all notes are visible
    await expect(page.getByText("first note")).toBeVisible();
    await expect(page.getByText("second note")).toBeVisible();
    await expect(page.getByText("third note")).toBeVisible();
  });

  test("should auto-detect and display hashtags", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("This is a note with #test and #important tags");

    // Wait for hashtag detection to complete
    await page.waitForTimeout(500);

    // Verify hashtag badge appears while typing
    await expect(page.getByText("2 tags")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("#test", { exact: true })).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByText("#important", { exact: true })).toBeVisible({
      timeout: 2000,
    });

    // Send the note
    await page.getByRole("button", { name: "⚡" }).click();

    // Verify tags are shown in the note card
    const noteCard = page
      .locator("article")
      .filter({ hasText: "This is a note with" });
    await expect(noteCard.getByText("#test", { exact: true })).toBeVisible();
    await expect(
      noteCard.getByText("#important", { exact: true })
    ).toBeVisible();
  });

  test("should persist notes after page reload", async ({ page }) => {
    // Create a note
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("persistent note");
    await page.getByTitle("Send message").click();

    // Verify note is visible
    await expect(page.getByText("persistent note")).toBeVisible();

    // Reload the page
    await page.reload();

    // Close server selector if it appears after reload
    await page.waitForTimeout(500);
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

    // Verify note is still visible after reload
    await expect(page.getByText("persistent note")).toBeVisible();
  });

  test("should delete a note", async ({ page }) => {
    // Create a note
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("note to delete");
    await page.getByTitle("Send message").click();

    // Verify note exists
    await expect(page.getByText("note to delete")).toBeVisible();

    // Click delete button
    const noteCard = page
      .locator("article")
      .filter({ hasText: "note to delete" });
    await noteCard.getByTitle("Delete").click();

    // Verify note is gone
    await expect(page.getByText("note to delete")).not.toBeVisible();

    // Verify empty state returns
    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  test("should archive a note", async ({ page }) => {
    // Create a note
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("note to archive");
    await page.getByTitle("Send message").click();

    // Click archive button (📦)
    const noteCard = page
      .locator("article")
      .filter({ hasText: "note to archive" });
    await noteCard.getByTitle("Archive").click();

    // Verify note is no longer in main view
    await expect(page.getByText("note to archive")).not.toBeVisible();

    // Verify empty state returns
    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  test("should search notes by text", async ({ page }) => {
    // Create multiple notes
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    await input.fill("apple pie recipe");
    await sendButton.click();

    await input.fill("banana smoothie");
    await sendButton.click();

    await input.fill("cherry cake");
    await sendButton.click();

    // Search for "banana"
    const searchBox = page.getByPlaceholder("🔍 Search notes...");
    await searchBox.fill("banana");

    // Verify only banana note is visible
    await expect(page.getByText("banana smoothie")).toBeVisible();
    await expect(page.getByText("apple pie recipe")).not.toBeVisible();
    await expect(page.getByText("cherry cake")).not.toBeVisible();

    // Clear search
    await searchBox.clear();

    // Verify all notes are visible again
    await expect(page.getByText("banana smoothie")).toBeVisible();
    await expect(page.getByText("apple pie recipe")).toBeVisible();
    await expect(page.getByText("cherry cake")).toBeVisible();
  });

  test("creating a note clears active search filter so it appears immediately", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    // Seed with one note
    await input.fill("seed note");
    await sendButton.click();
    await expect(page.getByText("seed note")).toBeVisible();

    // Apply a search that would hide subsequent notes
    const searchBox = page.getByPlaceholder("🔍 Search notes...");
    await searchBox.fill("unrelated");
    await expect(page.getByText("seed note")).not.toBeVisible();

    // Now create a new note; UI should clear the filter and show it
    await input.fill("note visible after send");
    await sendButton.click();

    await expect(page.getByText("note visible after send")).toBeVisible();
    // And the search should be cleared
    await expect(searchBox).toHaveValue("");
  });

  test("should filter notes by hashtag search", async ({ page }) => {
    // Create notes with different tags
    const input = page.getByRole("textbox", { name: "Write your note..." });
    const sendButton = page.getByRole("button", { name: "⚡" });

    await input.fill("work meeting notes #work");
    await sendButton.click();

    await input.fill("personal reminder #personal");
    await sendButton.click();

    await input.fill("project idea #work #project");
    await sendButton.click();

    // Search for "#work"
    const searchBox = page.getByPlaceholder("🔍 Search notes...");
    await searchBox.fill("work");

    // Verify work notes are visible
    await expect(page.getByText("work meeting notes")).toBeVisible();
    await expect(page.getByText("project idea")).toBeVisible();

    // Verify personal note is not visible
    await expect(page.getByText("personal reminder")).not.toBeVisible();
  });

  test("should handle empty input gracefully", async ({ page }) => {
    const sendButton = page.getByTitle("Send message");

    // Verify send button is disabled when empty
    await expect(sendButton).toBeDisabled();

    // Try to click it anyway
    await sendButton.click({ force: true });

    // Verify no note was created
    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  test("should handle whitespace-only input", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    // Type only spaces
    await input.fill("   ");

    // Send button should remain disabled
    await expect(sendButton).toBeDisabled();
  });

  test("should show settings panel", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: "⚙️" }).click();

    // Verify key sections are visible
    await expect(page.getByText("Server Sync")).toBeVisible();
    await expect(page.getByText("Appearance")).toBeVisible();

    // Close settings
    await page.getByRole("button", { name: "✕" }).click();
    await expect(page.getByText("Server Sync")).not.toBeVisible();
  });

  test("should handle special characters", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    const specialText = "Special chars: @#$%^&*() 🎉 émojis ñ";

    await input.fill(specialText);
    await page.getByTitle("Send message").click();

    await expect(page.getByText("Special chars:")).toBeVisible();
    await expect(page.getByText("🎉")).toBeVisible();
  });

  test("should handle very long text", async ({ page }) => {
    const longText = "A".repeat(1000);
    const input = page.getByRole("textbox", { name: "Write your note..." });

    await input.fill(longText);
    await page.getByRole("button", { name: "⚡" }).click();

    // Verify long text is handled (check for first part)
    await expect(page.getByText("AAAAAAA", { exact: false })).toBeVisible();
  });

  test("should handle rapid note creation", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Write your note..." });
    const sendButton = page.getByRole("button", { name: "⚡" });

    // Rapidly create 5 notes
    for (let i = 1; i <= 5; i++) {
      await input.fill(`rapid note ${i}`);
      await sendButton.click();
      // Small delay to ensure each note is processed
      await page.waitForTimeout(100);
    }

    // Verify all notes were created
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`rapid note ${i}`)).toBeVisible();
    }
  });

  test("should display note type badge", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Write your note..." });
    await input.fill("test note");
    await page.getByRole("button", { name: "⚡" }).click();

    // Verify type badge is shown
    const noteCard = page.locator("article").filter({ hasText: "test note" });
    await expect(noteCard.getByText("text")).toBeVisible();
  });

  test("should show timestamp on notes", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    await input.fill("timestamped note");
    await page.getByTitle("Send message").click();

    // Verify time is displayed (looking for time format like "02:40 PM")
    const noteCard = page
      .locator("article")
      .filter({ hasText: "timestamped note" });
    const timeElement = noteCard.locator("time");
    await expect(timeElement).toBeVisible();
  });

  test("should insert emoji from picker", async ({ page }) => {
    // Click emoji button
    await page.getByRole("button", { name: "Emoji" }).click();

    // Wait for emoji picker to appear
    await expect(page.getByText("😀", { exact: true })).toBeVisible();

    // Click an emoji (force to avoid overlapping button animation)
    await page
      .getByRole("button", { name: "😀", exact: true })
      .first()
      .click({ force: true });

    // Verify emoji is inserted in composer (any emoji)
    const input = page.getByPlaceholder("Write your note...");
    await expect(input).toHaveValue(/\p{Extended_Pictographic}/u);

    // Compose message with whatever emoji is present
    const current = await input.inputValue();
    const message = `${current} This is lit!`;
    await input.fill(message);
    await page.getByTitle("Send message").click();

    // Verify note contains text and an emoji
    await expect(page.getByText("This is lit!")).toBeVisible();
  });

  test("should maintain note order (newest first)", async ({ page }) => {
    const input = page.getByPlaceholder("Write your note...");
    const sendButton = page.getByTitle("Send message");

    // Create notes with delay to ensure different timestamps
    await input.fill("first note");
    await sendButton.click();
    await page.waitForTimeout(100);

    await input.fill("second note");
    await sendButton.click();
    await page.waitForTimeout(100);

    await input.fill("third note");
    await sendButton.click();

    // Get all note cards
    const notes = page.locator("article");

    // Verify order (newest first)
    await expect(notes.nth(0)).toContainText("third note");
    await expect(notes.nth(1)).toContainText("second note");
    await expect(notes.nth(2)).toContainText("first note");
  });
});
