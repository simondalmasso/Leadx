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
test("passwords use PBKDF2 within Workers CPU budget", () => { assert.match(worker, /PBKDF2/); assert.match(worker, /iterations: 10000/); });
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
test("operational smart views prioritize next action without opaque scoring", () => {
  for (const text of ["Pendientes", "Sin próxima", "Prioridad de acción", "Sin próxima acción"]) assert.match(app, new RegExp(text));
  assert.match(app, /needsNextAction/);
  assert.match(app, /actionPriority/);
  assert.match(app, /updated_at/);
  assert.doesNotMatch(app, /score_value|scoring_rule_version|AI score/i);
});
test("action queue controls remain explicit and touchable", () => {
  assert.match(actionQueueStyles, /\.queue-views/);
  assert.match(actionQueueStyles, /\.queue-view/);
  assert.match(actionQueueStyles, /min-height: 52px/);
  assert.match(actionQueueStyles, /--signal-primary/);
});

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`PUBLIC_PRODUCT_TESTS=${passed}/${tests.length}`);
