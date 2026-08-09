import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const app = read("web/src/App.tsx");
const styles = read("web/src/styles.css");
const actionQueueStyles = read("web/src/action-queue.css");
const api = read("web/src/lib/api.ts");
const demo = read("web/src/demo-leads.ts");
const worker = read("worker/runtime.mjs");
const wrangler = read("wrangler.toml");
const wordmark = read("web/public/leadx-wordmark.svg");
const vite = read("web/vite.config.ts");
const apiTests = read("web/scripts/worker-api-tests.mjs");
const releaseWorkflow = read(".github/workflows/public-saas-release.yml");
const postReleaseWorkflow = read(".github/workflows/public-post-release-verify.yml");
const active = `${app}\n${demo}\n${worker}\n${wrangler}`.toLowerCase();

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test("free contact limit is 100 in UI", () => assert.match(app, /FREE_CONTACT_LIMIT = 100/));
test("free contact limit is 100 server-side", () => assert.match(worker, /FREE_CONTACT_LIMIT = 100/));
test("server rejects new contacts after free limit", () => assert.match(worker, /free_limit_reached/));
test("demo explicitly uses fictitious contacts", () => assert.match(app, /demo ficticia|datos ficticios/i));
test("public marketing says no card and no expiration", () => { assert.match(app, /Sin tarjeta/); assert.match(app, /Sin vencimiento/); });
test("public marketing speaks about clients", () => { assert.match(app, /Tus clientes/); assert.match(app, /100 clientes/); });
test("active product has no former vertical terminology", () => {
  for (const token of ["fotomultas", "repuestos_agricolas", "repuestos agrícolas", "radar", "reddit", "scraping"]) assert.equal(active.includes(token), false, `forbidden token remains: ${token}`);
});
test("passwords use PBKDF2 with explicit version-ready work factor", () => {
  assert.match(worker, /PBKDF2/);
  assert.match(worker, /PASSWORD_ITERATIONS = 10000/);
  assert.match(worker, /passwordIterations: PASSWORD_ITERATIONS/);
});
test("session cookie is hardened", () => { assert.match(worker, /HttpOnly/); assert.match(worker, /Secure/); assert.match(worker, /SameSite=Lax/); });
test("API exposes generic contacts routes", () => { assert.match(worker, /\/api\/contacts/); assert.match(worker, /\/api\/auth\/register/); assert.match(worker, /\/api\/auth\/login/); });
test("legacy auth and ingest API are absent", () => { assert.doesNotMatch(worker, /DASHBOARD_PASSWORD|INGEST_SECRET|\/api\/ingest/); });
test("CSP blocks framing", () => assert.match(worker, /frame-ancestors 'none'/));
test("worker uses only the generic KV binding", () => assert.match(wrangler, /binding = "LEADX_KV"/));
test("public bootstrap cannot wait forever for session", () => {
  assert.match(api, /SESSION_TIMEOUT_MS = 3000/);
  assert.match(api, /new AbortController\(\)/);
  assert.match(api, /controller\.abort\("request_timeout"\)/);
  assert.match(api, /session: \(\) => request<SessionInfo>\([^\n]+SESSION_TIMEOUT_MS\)/);
});
test("Signal Desk v2 exposes semantic design tokens", () => {
  for (const token of ["--bg-canvas", "--bg-elevated", "--bg-inverse", "--text-primary", "--text-secondary", "--border-subtle", "--border-strong", "--signal-primary", "--success", "--warning", "--danger", "--focus", "--selection"]) assert.match(styles, new RegExp(token));
});
test("official LeadX wordmark is used by runtime", () => { assert.match(app, /leadx-wordmark\.svg/); assert.match(wordmark, /LeadX/); });
test("critical product states are intentionally rendered", () => {
  for (const text of ["Mesa vacía", "Sin coincidencias", "Conexión interrumpida", "Plan Free completo", "Guardando", "Eliminar este contacto", "Registramos tu interés en LeadX Pro"]) assert.match(app, new RegExp(text));
});
test("dialogs are explicit accessible surfaces", () => { assert.match(app, /role="dialog"/); assert.match(app, /aria-modal="true"/); assert.match(styles, /:focus-visible/); });
test("public product avoids decorative AI icon language", () => assert.doesNotMatch(app, /Sparkles/));
test("motion respects reduced-motion preference", () => assert.match(styles, /prefers-reduced-motion/));
test("operational views remain explicit without opaque scoring", () => {
  for (const text of ["Pendientes", "Sin próxima", "Prioridad de acción", "Sin próxima acción"]) assert.match(app, new RegExp(text));
  assert.match(app, /needsNextAction/);
  assert.match(app, /actionPriority/);
  assert.doesNotMatch(app, /score_value|scoring_rule_version|AI score/i);
});
test("next action has optional date and temporal priority", () => {
  assert.match(app, /next_action_due_at/);
  assert.match(app, /Vencida/);
  assert.match(app, /Vence hoy/);
  assert.match(app, /Fecha objetivo/);
  assert.match(worker, /validDateOnly/);
  assert.match(worker, /due_without_action/);
});
test("commercial signal time is distinct from generic updated_at", () => {
  assert.match(app, /last_signal_at/);
  assert.match(app, /Señal reciente/);
  assert.match(worker, /commercialSignalChanged/);
  assert.match(worker, /last_signal_at/);
});
test("CSV export neutralizes spreadsheet formulas", () => {
  assert.match(app, /safeCsvValue/);
  assert.match(app, /\[=\+\\-@\]/);
  assert.match(app, /neutralized/);
});
test("writes fail closed when rate limiting binding is unavailable", () => {
  assert.match(worker, /requireRateLimit/);
  assert.match(worker, /rate_limiter_unavailable/);
  assert.match(worker, /write_protection/);
  assert.doesNotMatch(worker, /if \(!env\.AUTH_RATE_LIMITER\?\.limit\) return true/);
});
test("corrupt contact storage fails without becoming an empty list", () => {
  assert.match(worker, /contacts_corrupt/);
  assert.match(worker, /data_integrity_error/);
  assert.doesNotMatch(worker, /catch \{\s*return \[\];\s*\}/);
});
test("duplicate normalized contact emails are rejected per workspace", () => {
  assert.match(worker, /duplicateEmail/);
  assert.match(worker, /duplicate_email/);
});
test("local Vite development does not target production by default", () => {
  assert.match(vite, /LEADX_DEV_API_TARGET/);
  assert.match(vite, /http:\/\/127\.0\.0\.1:8787/);
  assert.doesNotMatch(vite, /target:\s*["']https:\/\/leadx\.simondalmasso44\.workers\.dev/);
});
test("release workflow never bulk-deletes non-lx KV keys", () => {
  assert.doesNotMatch(releaseWorkflow, /kv bulk delete/);
  assert.doesNotMatch(releaseWorkflow, /legacy-keys\.json/);
  assert.match(releaseWorkflow, /UNEXPECTED_NON_LX_KV_KEYS/);
});
test("post-release verification is explicit and non-mutating", () => {
  assert.match(postReleaseWorkflow, /workflow_dispatch/);
  assert.doesNotMatch(postReleaseWorkflow, /kv bulk delete/);
});
test("real Worker API integration suite covers isolation and corruption", () => {
  assert.match(apiTests, /cross-user contact access is isolated/);
  assert.match(apiTests, /corrupt contact storage/);
  assert.match(apiTests, /WORKER_API_TESTS/);
});
test("action queue controls remain explicit and touchable", () => {
  assert.match(actionQueueStyles, /\.queue-views/);
  assert.match(actionQueueStyles, /\.queue-view/);
  assert.match(actionQueueStyles, /min-height: 52px/);
  assert.match(actionQueueStyles, /--overdue/);
});

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`PUBLIC_PRODUCT_TESTS=${passed}/${tests.length}`);
