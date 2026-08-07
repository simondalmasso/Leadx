import { test, expect } from "@playwright/test";

const baseURL = process.env.LEADX_BASE_URL || "https://leadx.simondalmasso44.workers.dev";

test.setTimeout(120_000);

async function openPublicSurface(page, viewport) {
  await page.setViewportSize(viewport);
  const separator = baseURL.includes("?") ? "&" : "?";
  const pageErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`));

  await page.goto(`${baseURL}${separator}ui_ready=${Date.now()}`, { waitUntil: "domcontentloaded" });
  const heading = page.getByRole("heading", { name: /Tus clientes/i });
  const ready = await heading.isVisible({ timeout: 10_000 }).catch(() => false);

  if (!ready) {
    const lastTitle = await page.title().catch(() => "");
    const lastBody = await page.locator("body").innerText().catch(() => "");
    console.log(`PUBLIC_UI_LAST_TITLE=${lastTitle}`);
    console.log(`PUBLIC_UI_LAST_BODY=${lastBody.slice(0, 500).replaceAll("\n", " | ")}`);
    console.log(`PUBLIC_UI_PAGE_ERRORS=${JSON.stringify(pageErrors)}`);
    console.log(`PUBLIC_UI_FAILED_REQUESTS=${JSON.stringify(failedRequests)}`);
  }
  expect(ready, "new public React surface did not become ready before smoke timeout").toBe(true);
  expect(pageErrors, "browser page errors").toEqual([]);
}

test("LeadX public freemium desktop", async ({ page }) => {
  await openPublicSurface(page, { width: 1440, height: 1000 });
  await expect(page.getByRole("heading", { name: /Tus clientes/i })).toBeVisible();
  await expect(page.getByText(/Gratis hasta 100 clientes/i).first()).toBeVisible();
  await expect(page.getByText(/Datos 100% ficticios/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Fotomultas|Repuestos agrícolas|Reddit|Radar/i);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByLabel("Buscar contactos").fill("Nómada");
  await expect(page.getByText("Lucía Torres")).toBeVisible();
  await page.getByRole("button", { name: /Empezar gratis/i }).first().click();
  await expect(page.getByRole("heading", { name: /100 clientes gratis/i })).toBeVisible();
});

test("LeadX public freemium mobile", async ({ page }) => {
  await openPublicSurface(page, { width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Tus clientes/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await expect(page.getByText(/Preview interactiva/i)).toBeVisible();
});
