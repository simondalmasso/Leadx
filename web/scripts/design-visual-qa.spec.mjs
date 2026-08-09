import { test, expect } from "@playwright/test";

const baseURL = process.env.LEADX_QA_BASE_URL || "http://127.0.0.1:4173";
const previewSizes = [
  ["1440x1000", 1440, 1000],
  ["1024x768", 1024, 768],
  ["768x1024", 768, 1024],
  ["390x844", 390, 844],
  ["360x800", 360, 800],
  ["320x568", 320, 568],
];

const now = Date.now();
const dateKey = (days = 0) => new Date(now + days * 86400000).toISOString().slice(0, 10);
const statusOrder = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Cliente", "Pausado"];
const longContact = {
  id: "qa-long-1",
  name: "María de los Ángeles Fernández de la Cruz",
  company: "Estudio Comercial del Litoral y Asociados Internacionales",
  email: "maria.fernandez.conversaciones.comerciales@empresa-ejemplo.test",
  phone: "+54 9 342 555 0101",
  status: "Calificado",
  source: "Referido",
  notes: "Fixture sintético exclusivo de QA visual.",
  next_action: "Confirmar alcance final, responsables, presupuesto y fecha exacta de implementación antes del próximo comité comercial",
  next_action_due_at: dateKey(0),
  last_signal_at: new Date(now).toISOString(),
  created_at: new Date(now).toISOString(),
  updated_at: new Date(now).toISOString(),
};

function contactsFixture(count) {
  return Array.from({ length: count }, (_, index) => index === 0 ? longContact : ({
    id: `qa-${index + 1}`,
    name: `Cliente sintético ${String(index + 1).padStart(3, "0")}`,
    company: `Empresa ${index + 1}`,
    email: `cliente${index + 1}@example.test`,
    phone: `+54 9 342 555 ${String(index).padStart(4, "0")}`,
    status: statusOrder[index % statusOrder.length],
    source: index % 2 ? "Web" : "Referido",
    notes: "Fixture sintético exclusivo de QA visual.",
    next_action: index % 3 ? "Retomar conversación y confirmar siguiente paso" : "Enviar propuesta y pedir confirmación",
    next_action_due_at: index % 4 === 0 ? dateKey(-1) : dateKey(index % 7),
    last_signal_at: new Date(now - index * 3600000).toISOString(),
    created_at: new Date(now - index * 3600000).toISOString(),
    updated_at: new Date(now - index * 1800000).toISOString(),
  }));
}

async function mockPreview(page) {
  await page.route("**/api/auth/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, mode: "preview" }) }));
}

async function mockWorkspace(page, { count = 8, contacts = null, contactsStatus = 200, delay = 0 } = {}) {
  const records = contacts ?? contactsFixture(count);
  const limit = 100;
  const plan = { plan: "free", limit, count: records.length, remaining: Math.max(0, limit - records.length) };
  await page.route("**/api/auth/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true, mode: "workspace", user: { email: "qa.owner@example.test", plan: "free" }, plan }) }));
  await page.route("**/api/contacts", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (contactsStatus !== 200) {
      await route.fulfill({ status: contactsStatus, contentType: "application/json", body: JSON.stringify({ error: "No pudimos sincronizar tu espacio. Probá de nuevo." }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ contacts: records, plan }) });
  });
  await page.route("**/api/pro-interest", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
}

async function waitReady(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.leadxReady), { timeout: 8000 }).toBe("true");
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
}

async function assertMobileTargets(page) {
  const failures = await page.locator("button:visible, a:visible, input:visible, select:visible, textarea:visible").evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { tag: node.tagName, text: (node.getAttribute("aria-label") || node.textContent || "").trim().slice(0, 80), width: Math.round(rect.width), height: Math.round(rect.height) };
  }).filter((item) => item.width < 44 || item.height < 44));
  expect(failures, `visible touch targets under 44px: ${JSON.stringify(failures)}`).toEqual([]);
}

for (const [label, width, height] of previewSizes) {
  test(`preview visual ${label}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await mockPreview(page);
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await expect(page.getByRole("heading", { name: /Tus clientes/i })).toBeVisible();
    await expect(page.getByText(/Mirá la señal\. No el ruido\./i)).toBeVisible();
    await assertNoOverflow(page);
    if (width < 600) await assertMobileTargets(page);
    await page.screenshot({ path: testInfo.outputPath(`preview-${label}.png`), fullPage: true });
  });
}

test("workspace long-content desktop", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockWorkspace(page, { count: 18 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await expect(page.getByRole("heading", { name: /Qué tiene que pasar después/i })).toBeVisible();
  const targetRow = page.locator(".contact-row").filter({ hasText: longContact.name });
  await expect(targetRow.getByText(longContact.name)).toBeVisible();
  await expect(targetRow.getByText(longContact.next_action)).toBeVisible();
  await expect(targetRow.getByText("Vence hoy")).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-desktop-long.png"), fullPage: true });
});

test("workspace mobile + editor sheet", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockWorkspace(page, { count: 18 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await assertNoOverflow(page);
  await assertMobileTargets(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-mobile-long.png"), fullPage: true });
  await page.getByRole("button", { name: /Nuevo contacto/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/Nombre, estado y próxima acción primero/i)).toBeVisible();
  await expect(page.getByLabel("Fecha objetivo")).toBeDisabled();
  await page.waitForTimeout(420);
  await assertNoOverflow(page);
  await assertMobileTargets(page);
  await page.screenshot({ path: testInfo.outputPath("editor-mobile.png"), fullPage: false });
});

test("320px editor stays inside viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await mockWorkspace(page, { count: 4 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.getByRole("button", { name: /Nuevo contacto/i }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(420);
  const box = await sheet.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(569);
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("editor-320x568.png"), fullPage: false });
});

test("empty workspace is intentional", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockWorkspace(page, { contacts: [] });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await expect(page.getByText("Tu primer cliente empieza acá.")).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-empty.png"), fullPage: true });
});

test("free limit reached is explicit", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockWorkspace(page, { count: 100 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await expect(page.getByText("Plan Free completo")).toBeVisible();
  await expect(page.getByRole("button", { name: /Límite alcanzado/i })).toBeDisabled();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-free-limit.png"), fullPage: false });
});

test("network error has retry surface", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await mockWorkspace(page, { contactsStatus: 503 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await expect(page.getByText("No pudimos leer tu espacio.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Reintentar/i })).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-network-error.png"), fullPage: true });
});

test("workspace loading is designed", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await mockWorkspace(page, { count: 8, delay: 2500 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ledger-loading")).toBeVisible({ timeout: 1800 });
  await page.screenshot({ path: testInfo.outputPath("workspace-loading.png"), fullPage: false });
  await waitReady(page);
  await expect(page.getByText(longContact.name)).toBeVisible();
});

test("auth surface remains continuous with landing", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPreview(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.getByRole("button", { name: /Crear espacio/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: /100 clientes, en orden/i })).toBeVisible();
  await page.waitForTimeout(420);
  await assertMobileTargets(page);
  await page.screenshot({ path: testInfo.outputPath("auth-mobile.png"), fullPage: false });
});
