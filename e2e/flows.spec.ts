import { expect, test } from "@playwright/test";

test("practice pack page is protected", async ({ page }) => {
  await page.goto("/practice/new");
  await expect(page).not.toHaveURL(/\/practice\/new$/);
});

test("scenario review route is protected", async ({ page }) => {
  await page.goto("/practice/seed-retorio-ai-pe-data");
  await expect(page).not.toHaveURL(/\/practice\/seed-retorio-ai-pe-data$/);
});

test("interview room preview renders avatar state transitions", async ({ page }) => {
  await page.goto("/preview/room");
  await expect(page.getByText("Technical Interviewer")).toBeVisible();
  await expect(page.getByText("Your video is not stored.")).toBeVisible();
  await page.getByRole("button", { name: "speaking" }).click();
  await expect(page.locator("[data-agent-state=speaking]")).toBeVisible();
  await page.getByRole("button", { name: "listening" }).click();
  await expect(page.locator("[data-agent-state=listening]")).toBeVisible();
});

test("feedback page shows score chrome", async ({ page }) => {
  await page.goto("/feedback/missing");
  await expect(page.getByRole("heading", { name: /interview feedback/i })).toBeVisible();
});

test("progress assistant is protected", async ({ page }) => {
  await page.goto("/progress");
  await expect(page).not.toHaveURL(/\/progress$/);
});
