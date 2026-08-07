import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const app = read("web/src/App.tsx");
const demo = read("web/src/demo-leads.ts");
const worker = read("worker/runtime.mjs");
const wrangler = read("wrangler.toml");
const active = `${app}\n${demo}\n${worker}\n${wrangler}`.toLowerCase();

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test("free contact limit is 100 in UI", () => assert.match(app, /FREE_CONTACT_LIMIT = 100/));
test("free contact limit is 100 server-side", () => assert.match(worker, /FREE_CONTACT_LIMIT = 100/));
test("server rejects new contacts after free limit", () => assert.match(worker, /free_limit_reached/));
test("demo explicitly uses fictitious contacts", () => assert.match(app, /Datos 100% ficticios/));
test("public marketing says no card and no expiration", () => { assert.match(app, /Sin tarjeta/); assert.match(app, /Sin vencimiento/); });
test("active product has no former vertical terminology", () => {
  for (const token of ["fotomultas", "repuestos_agricolas", "repuestos agrícolas", "radar", "reddit", "scraping"]) assert.equal(active.includes(token), false, `forbidden token remains: ${token}`);
});
test("passwords use PBKDF2", () => { assert.match(worker, /PBKDF2/); assert.match(worker, /iterations: 150000/); });
test("session cookie is hardened", () => { assert.match(worker, /HttpOnly/); assert.match(worker, /Secure/); assert.match(worker, /SameSite=Lax/); });
test("API exposes generic contacts routes", () => { assert.match(worker, /\/api\/contacts/); assert.match(worker, /\/api\/auth\/register/); assert.match(worker, /\/api\/auth\/login/); });
test("legacy auth and ingest API are absent", () => { assert.doesNotMatch(worker, /DASHBOARD_PASSWORD|INGEST_SECRET|\/api\/ingest/); });
test("CSP blocks framing", () => assert.match(worker, /frame-ancestors 'none'/));
test("worker uses only the generic KV binding", () => assert.match(wrangler, /binding = "LEADX_KV"/));

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`PUBLIC_PRODUCT_TESTS=${passed}/${tests.length}`);
