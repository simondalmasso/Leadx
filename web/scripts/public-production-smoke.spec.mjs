import { test, expect } from "@playwright/test";

const baseURL = process.env.LEADX_BASE_URL || "https://leadx.simondalmasso44.workers.dev";

async function openPublicSurface(page, viewport) {
  await page.setViewportSize(viewport);
  let ready = false;
  let lastTitle = "";
  let lastBody = "";

  for (let attempt = 1; attempt <= 45; attempt += 1) {
    const separator = baseURL.includes("?") ? "&" : "?";
    await page.goto(`${baseURL}${separator}ui_ready=${Date.now()}-${attempt}`, { waitUntil: "domcontentloaded" });
    lastTitle = await page.title().catch(() => "");
    lastBody = await page.locator("body").innerText().catch(() => "");
    const heading = page.getByRole("heading", { name: /Tus contactos/i });
    if (await heading.isVisible({ timeout: 1200 }).catch(() => false)) {
      ready = true;
      console.log(`PUBLIC_UI_PROPAGATION_ATTEMPT=${attempt}`);
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (!ready) {
    console.log(`PUBLIC_UI_LAST_TITLE=${lastTitle}`);
    console.log(`PUBLIC_UI_LAST_BODY=${lastBody.slice(0, 500).replaceAll("\n", " | ")}`);
  }
  expect(ready, "new public React surface did not propagate before smoke timeout").toBe(true);
}

test("LeadX public freemium desktop", async ({ page }) => {
  await openPublicSurface(page, { width: 1440, height: 1000 });
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
  await openPublicSurface(page, { width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Tus contactos/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await expect(page.getByText(/Preview interactiva/i)).toBeVisible();
});
