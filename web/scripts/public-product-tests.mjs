import fs from "node:fs";
import assert from "node:assert/strict";

const runtime = fs.readFileSync(new URL("../../worker/runtime.mjs", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const wrangler = fs.readFileSync(new URL("../../wrangler.toml", import.meta.url), "utf8");

const checks = [
  ["free limit is 100", /FREE_CONTACT_LIMIT = 100/.test(runtime)],
  ["trial is 14 days", /TRIAL_DAYS = 14/.test(runtime)],
  ["legacy leads endpoint retired", /"\/api\/leads"/.test(runtime) && /retired_endpoint/.test(runtime)],
  ["legacy ingest retired", /"\/api\/ingest"/.test(runtime) && /retired_endpoint/.test(runtime)],
  ["private import retired", /"\/api\/admin\/import"/.test(runtime) && /retired_endpoint/.test(runtime)],
  ["password uses PBKDF2", /PBKDF2/.test(runtime) && /120000/.test(runtime)],
  ["password comparison is timing hardened", /constantTimeEqual/.test(runtime)],
  ["session cookie is HttpOnly Secure", /HttpOnly; Secure; SameSite=Lax/.test(runtime)],
  ["public preview is explicit", /Preview abierto/.test(app) && /Datos 100% ficticios/.test(app)],
  ["free plan is explicit", /Hasta 100 contactos/.test(app) && /Gratis para siempre hasta 100 contactos/.test(app)],
  ["no old verticals in product app", !/fotomultas|repuestos_agricolas/i.test(app)],
  ["all API routes run Worker first", /run_worker_first\s*=\s*\[\s*"\/api\/\*"\s*\]/.test(wrangler)],
];
for (const [name, ok] of checks) { assert.equal(ok, true, name); console.log(`PASS ${name}`); }
console.log(`PUBLIC_PRODUCT_TESTS=${checks.length}/${checks.length}`);
