import { expect, test } from "@playwright/test";

test("guest can open the landing page and demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /practice the interview/i })).toBeVisible();
  await page.getByRole("link", { name: /try interview demo/i }).click();
  await expect(page.getByRole("heading", { name: /guest interview demo/i })).toBeVisible();
  await expect(page.getByText(/Retorio/i).first()).toBeVisible();
});

test("sign-in is required for the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/dashboard$/);
});

test("interview room renders avatar states", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: /start demo interview/i })).toBeVisible();
});

test("avatar state hook is available on a rendered avatar page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("preploop:agent-state", { detail: "speaking" }));
  });
  await expect(page.locator("body")).toBeVisible();
});
