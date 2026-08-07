import { test, expect } from "@playwright/test";

const baseURL = process.env.LEADX_BASE_URL || "https://leadx.simondalmasso44.workers.dev";

test("LeadX public freemium desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Tus contactos/i })).toBeVisible();
  await expect(page.getByText(/Gratis hasta 100 contactos/i).first()).toBeVisible();
  await expect(page.getByText(/Datos 100% ficticios/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Fotomultas|Repuestos agrícolas|Reddit|Radar/i);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByLabel("Buscar contactos").fill("Nómada");
  await expect(page.getByText("Lucía Torres")).toBeVisible();
  await page.getByRole("button", { name: /Empezar gratis/i }).first().click();
  await expect(page.getByRole("heading", { name: /100 contactos gratis/i })).toBeVisible();
});

test("LeadX public freemium mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Tus contactos/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await expect(page.getByText(/Preview interactiva/i)).toBeVisible();
});
