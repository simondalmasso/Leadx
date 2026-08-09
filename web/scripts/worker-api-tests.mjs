import assert from "node:assert/strict";
import worker from "../../worker/runtime.mjs";

class MemoryKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.has(key) ? this.values.get(key) : null; }
  async put(key, value) { this.values.set(key, String(value)); }
  async delete(key) { this.values.delete(key); }
}

const allowLimiter = { limit: async () => ({ success: true }) };

function makeEnv({ kv = new MemoryKV(), limiter = allowLimiter } = {}) {
  return {
    LEADX_KV: kv,
    AUTH_RATE_LIMITER: limiter,
    ASSETS: { fetch: async () => new Response("asset") },
  };
}

async function call(env, path, { method = "GET", body, cookie, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
  if (cookie) requestHeaders.set("cookie", cookie);
  const request = new Request(`https://leadx.test${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const response = await worker.fetch(request, env);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function sessionCookie(response) {
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

function userIdForEmail(kv, email) {
  for (const [key, raw] of kv.values) {
    if (!key.startsWith("lx:user-id:")) continue;
    const user = JSON.parse(raw);
    if (user.email === email) return user.id;
  }
  throw new Error(`No user id for ${email}`);
}

async function register(env, email) {
  const result = await call(env, "/api/auth/register", { method: "POST", body: { email, password: "correct-horse-123" } });
  assert.equal(result.response.status, 201);
  return { ...result, cookie: sessionCookie(result.response) };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("health fails closed when write protection binding is missing", async () => {
  const healthy = await call(makeEnv(), "/api/health");
  assert.equal(healthy.response.status, 200);
  assert.equal(healthy.payload.status, "ok");
  assert.equal(healthy.payload.write_protection, "ready");

  const degraded = await call(makeEnv({ limiter: null }), "/api/health");
  assert.equal(degraded.response.status, 503);
  assert.equal(degraded.payload.status, "degraded");
  assert.equal(degraded.payload.write_protection, "unavailable");
});

test("register, session, login and logout preserve hardened session behavior", async () => {
  const env = makeEnv();
  const created = await register(env, "owner@example.test");
  const setCookie = created.response.headers.get("set-cookie") || "";
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax"]) assert.match(setCookie, new RegExp(flag, "i"));

  const session = await call(env, "/api/auth/session", { cookie: created.cookie });
  assert.equal(session.payload.authenticated, true);
  assert.equal(session.payload.mode, "workspace");

  const wrong = await call(env, "/api/auth/login", { method: "POST", body: { email: "owner@example.test", password: "not-the-password" } });
  assert.equal(wrong.response.status, 401);

  const login = await call(env, "/api/auth/login", { method: "POST", body: { email: "owner@example.test", password: "correct-horse-123" } });
  assert.equal(login.response.status, 200);
  const loginCookie = sessionCookie(login.response);

  const logout = await call(env, "/api/auth/logout", { method: "POST", cookie: loginCookie });
  assert.equal(logout.response.status, 200);
  const after = await call(env, "/api/auth/session", { cookie: loginCookie });
  assert.equal(after.payload.authenticated, false);
});

test("contact CRUD supports due dates and separates commercial signal time from generic edits", async () => {
  const env = makeEnv();
  const owner = await register(env, "crud@example.test");
  const created = await call(env, "/api/contacts", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "Lucía", email: "lucia@example.test", status: "Contactado", next_action: "Enviar propuesta", next_action_due_at: "2026-08-12" },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.contact.next_action_due_at, "2026-08-12");
  assert.ok(created.payload.contact.last_signal_at);
  const signalAt = created.payload.contact.last_signal_at;

  await new Promise((resolve) => setTimeout(resolve, 3));
  const noteOnly = await call(env, `/api/contacts/${created.payload.contact.id}`, {
    method: "PATCH",
    cookie: owner.cookie,
    body: { notes: "Contexto nuevo sin movimiento comercial" },
  });
  assert.equal(noteOnly.response.status, 200);
  assert.equal(noteOnly.payload.contact.last_signal_at, signalAt);
  assert.notEqual(noteOnly.payload.contact.updated_at, created.payload.contact.updated_at);

  await new Promise((resolve) => setTimeout(resolve, 3));
  const moved = await call(env, `/api/contacts/${created.payload.contact.id}`, {
    method: "PATCH",
    cookie: owner.cookie,
    body: { next_action_due_at: "2026-08-13" },
  });
  assert.equal(moved.response.status, 200);
  assert.notEqual(moved.payload.contact.last_signal_at, signalAt);

  const removed = await call(env, `/api/contacts/${created.payload.contact.id}`, { method: "DELETE", cookie: owner.cookie });
  assert.equal(removed.response.status, 200);
  const list = await call(env, "/api/contacts", { cookie: owner.cookie });
  assert.equal(list.payload.contacts.length, 0);
});

test("workspace prevents duplicate normalized emails", async () => {
  const env = makeEnv();
  const owner = await register(env, "dedupe@example.test");
  const first = await call(env, "/api/contacts", { method: "POST", cookie: owner.cookie, body: { name: "Uno", email: "Same@Example.Test" } });
  assert.equal(first.response.status, 201);
  const duplicate = await call(env, "/api/contacts", { method: "POST", cookie: owner.cookie, body: { name: "Dos", email: "same@example.test" } });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.payload.code, "duplicate_email");
});

test("cross-user contact access is isolated", async () => {
  const env = makeEnv();
  const a = await register(env, "a@example.test");
  const b = await register(env, "b@example.test");
  const created = await call(env, "/api/contacts", { method: "POST", cookie: a.cookie, body: { name: "Solo A" } });
  const listB = await call(env, "/api/contacts", { cookie: b.cookie });
  assert.deepEqual(listB.payload.contacts, []);
  const patchB = await call(env, `/api/contacts/${created.payload.contact.id}`, { method: "PATCH", cookie: b.cookie, body: { name: "Intento B" } });
  assert.equal(patchB.response.status, 404);
});

test("invalid due dates and due dates without an action are rejected", async () => {
  const env = makeEnv();
  const owner = await register(env, "dates@example.test");
  const invalid = await call(env, "/api/contacts", { method: "POST", cookie: owner.cookie, body: { name: "Fecha", next_action: "Llamar", next_action_due_at: "2026-02-30" } });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.payload.code, "invalid_due_date");
  const orphanDue = await call(env, "/api/contacts", { method: "POST", cookie: owner.cookie, body: { name: "Sin acción", next_action_due_at: "2026-08-12" } });
  assert.equal(orphanDue.response.status, 400);
  assert.equal(orphanDue.payload.code, "due_without_action");
});

test("malformed and oversized bodies fail safely", async () => {
  const env = makeEnv();
  const malformed = await call(env, "/api/auth/register", { method: "POST", body: "{" });
  assert.equal(malformed.response.status, 400);
  assert.equal(malformed.payload.code, "invalid_json");
  const huge = await call(env, "/api/auth/register", { method: "POST", body: JSON.stringify({ email: "huge@example.test", password: "x".repeat(70_000) }) });
  assert.equal(huge.response.status, 413);
  assert.equal(huge.payload.code, "payload_too_large");
});

test("corrupt contact storage never degrades silently to an empty writable list", async () => {
  const kv = new MemoryKV();
  const env = makeEnv({ kv });
  const owner = await register(env, "integrity@example.test");
  const userId = userIdForEmail(kv, "integrity@example.test");
  await kv.put(`lx:contacts:${userId}`, "{broken-json");
  const read = await call(env, "/api/contacts", { cookie: owner.cookie });
  assert.equal(read.response.status, 500);
  assert.equal(read.payload.code, "data_integrity_error");
  assert.equal(await kv.get(`lx:contacts:${userId}`), "{broken-json");
});

test("Free limit remains server-side at 100 contacts", async () => {
  const kv = new MemoryKV();
  const env = makeEnv({ kv });
  const owner = await register(env, "limit@example.test");
  const userId = userIdForEmail(kv, "limit@example.test");
  const contacts = Array.from({ length: 100 }, (_, index) => ({ id: crypto.randomUUID(), name: `Cliente ${index + 1}` }));
  await kv.put(`lx:contacts:${userId}`, JSON.stringify(contacts));
  const blocked = await call(env, "/api/contacts", { method: "POST", cookie: owner.cookie, body: { name: "101" } });
  assert.equal(blocked.response.status, 403);
  assert.equal(blocked.payload.code, "free_limit_reached");
  assert.equal(JSON.parse(await kv.get(`lx:contacts:${userId}`)).length, 100);
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}
console.log(`WORKER_API_TESTS=${passed}/${tests.length}`);
