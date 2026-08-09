const RELEASE = "leadx-public-freemium-v1";
const FREE_CONTACT_LIMIT = 100;
const SESSION_COOKIE = "leadx_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 64 * 1024;
const PASSWORD_ITERATIONS = 10000;
const CONTACT_STATUSES = new Set(["Nuevo", "Contactado", "Calificado", "Propuesta", "Cliente", "Pausado"]);
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const encoder = new TextEncoder();

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...extraHeaders,
    },
  });
}

function apiError(message, status = 400, code = "bad_request") {
  return json({ ok: false, error: message, code }, status);
}

function secureHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("x-frame-options", "DENY");
  headers.set(
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
  );
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomToken(bytes = 32) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return base64url(values);
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function passwordHash(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations },
    key,
    256
  );
  return bytesToHex(bits);
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

function parseCookies(request) {
  const cookie = request.headers.get("cookie") || "";
  return Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

async function readJsonBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new Error("payload_too_large");
  const text = await request.text();
  if (encoder.encode(text).byteLength > MAX_BODY_BYTES) throw new Error("payload_too_large");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_json");
  }
}

function cleanText(value, max = 200) {
  if (value == null) return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function normalizeEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validDateOnly(value) {
  if (!DATE_ONLY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function publicUser(user) {
  return { email: user.email, plan: user.plan || "free" };
}

async function getUserByEmail(env, email) {
  const emailHash = await sha256(email);
  const raw = await env.LEADX_KV.get(`lx:user-email:${emailHash}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function sessionStorageKey(token) {
  return `lx:session:${await sha256(token)}`;
}

async function createSession(env, userId) {
  const token = randomToken(32);
  await env.LEADX_KV.put(await sessionStorageKey(token), JSON.stringify({ userId, createdAt: new Date().toISOString() }), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return token;
}

async function requireUser(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const sessionRaw = await env.LEADX_KV.get(await sessionStorageKey(token));
  if (!sessionRaw) return null;
  const session = JSON.parse(sessionRaw);
  const userRaw = await env.LEADX_KV.get(`lx:user-id:${session.userId}`);
  if (!userRaw) return null;
  return { token, user: JSON.parse(userRaw) };
}

async function requireRateLimit(env, key) {
  if (!env.AUTH_RATE_LIMITER?.limit) throw new Error("rate_limiter_unavailable");
  const result = await env.AUTH_RATE_LIMITER.limit({ key });
  if (!result?.success) throw new Error("rate_limited");
}

async function register(request, env) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email)) return apiError("Ingresá un email válido.", 400, "invalid_email");
  if (password.length < 10 || password.length > 128) return apiError("La contraseña debe tener entre 10 y 128 caracteres.", 400, "invalid_password");
  await requireRateLimit(env, `register:${await sha256(email)}`);
  if (await getUserByEmail(env, email)) return apiError("Ese email ya tiene una cuenta.", 409, "email_exists");

  const userId = crypto.randomUUID();
  const salt = randomToken(18);
  const hash = await passwordHash(password, salt);
  const now = new Date().toISOString();
  const user = { id: userId, email, passwordHash: hash, salt, passwordIterations: PASSWORD_ITERATIONS, plan: "free", createdAt: now };
  const safeUser = { id: userId, email, plan: "free", createdAt: now };
  const emailHash = await sha256(email);
  await Promise.all([
    env.LEADX_KV.put(`lx:user-email:${emailHash}`, JSON.stringify(user)),
    env.LEADX_KV.put(`lx:user-id:${userId}`, JSON.stringify(safeUser)),
    env.LEADX_KV.put(`lx:contacts:${userId}`, "[]"),
  ]);
  const token = await createSession(env, userId);
  return json({ ok: true, user: publicUser(user), plan: planSnapshot(user, 0) }, 201, { "set-cookie": sessionCookie(token) });
}

async function login(request, env) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || !password) return apiError("Email o contraseña incorrectos.", 401, "invalid_credentials");
  await requireRateLimit(env, `login:${await sha256(email)}`);
  const user = await getUserByEmail(env, email);
  if (!user) return apiError("Email o contraseña incorrectos.", 401, "invalid_credentials");
  const iterations = Number.isInteger(user.passwordIterations) && user.passwordIterations >= PASSWORD_ITERATIONS
    ? user.passwordIterations
    : PASSWORD_ITERATIONS;
  const candidate = await passwordHash(password, user.salt, iterations);
  if (!constantTimeEqual(candidate, user.passwordHash)) return apiError("Email o contraseña incorrectos.", 401, "invalid_credentials");
  const token = await createSession(env, user.id);
  const contacts = await loadContacts(env, user.id);
  return json({ ok: true, user: publicUser(user), plan: planSnapshot(user, contacts.length) }, 200, { "set-cookie": sessionCookie(token) });
}

async function logout(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await env.LEADX_KV.delete(await sessionStorageKey(token));
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}

async function session(request, env) {
  const auth = await requireUser(request, env);
  if (!auth) return json({ authenticated: false, mode: "preview" });
  const contacts = await loadContacts(env, auth.user.id);
  return json({ authenticated: true, mode: "workspace", user: publicUser(auth.user), plan: planSnapshot(auth.user, contacts.length) });
}

async function loadContacts(env, userId) {
  const raw = await env.LEADX_KV.get(`lx:contacts:${userId}`);
  if (!raw) return [];
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("contacts_corrupt");
  }
  if (!Array.isArray(value)) throw new Error("contacts_corrupt");
  return value;
}

async function saveContacts(env, userId, contacts) {
  await env.LEADX_KV.put(`lx:contacts:${userId}`, JSON.stringify(contacts));
}

function planSnapshot(user, count) {
  const plan = user.plan || "free";
  if (plan === "pro") return { plan, limit: null, count, remaining: null };
  return { plan: "free", limit: FREE_CONTACT_LIMIT, count, remaining: Math.max(0, FREE_CONTACT_LIMIT - count) };
}

function normalizeContact(input, existing = {}) {
  const status = cleanText(input.status ?? existing.status ?? "Nuevo", 40);
  const nextAction = cleanText(input.next_action ?? existing.next_action, 220);
  const nextActionDueAt = cleanText(input.next_action_due_at ?? existing.next_action_due_at, 10);
  if (nextActionDueAt && !validDateOnly(nextActionDueAt)) throw new Error("invalid_due_date");
  if (nextActionDueAt && !nextAction) throw new Error("due_without_action");
  return {
    ...existing,
    name: cleanText(input.name ?? existing.name, 120),
    company: cleanText(input.company ?? existing.company, 120),
    email: normalizeEmail(input.email ?? existing.email),
    phone: cleanText(input.phone ?? existing.phone, 60),
    status: CONTACT_STATUSES.has(status) ? status : "Nuevo",
    source: cleanText(input.source ?? existing.source, 80),
    notes: cleanText(input.notes ?? existing.notes, 2000),
    next_action: nextAction,
    next_action_due_at: nextActionDueAt,
  };
}

function duplicateEmail(contacts, email, excludedId = "") {
  if (!email) return false;
  return contacts.some((contact) => contact.id !== excludedId && normalizeEmail(contact.email) === email);
}

function commercialSignalChanged(previous, next) {
  return previous.status !== next.status
    || (previous.next_action || "") !== next.next_action
    || (previous.next_action_due_at || "") !== next.next_action_due_at;
}

async function contactsCollection(request, env) {
  const auth = await requireUser(request, env);
  if (!auth) return apiError("Iniciá sesión para usar tu espacio.", 401, "unauthorized");
  const contacts = await loadContacts(env, auth.user.id);
  if (request.method === "GET") return json({ contacts, plan: planSnapshot(auth.user, contacts.length) });
  if (request.method !== "POST") return apiError("Método no permitido.", 405, "method_not_allowed");

  await requireRateLimit(env, `contact-write:${auth.user.id}`);
  const plan = planSnapshot(auth.user, contacts.length);
  if (plan.limit !== null && contacts.length >= plan.limit) {
    return apiError("Llegaste al límite de 100 contactos del plan Free. Tus datos siguen intactos; pasá a Pro para crear más.", 403, "free_limit_reached");
  }
  const body = await readJsonBody(request);
  const contact = normalizeContact(body);
  if (!contact.name) return apiError("El nombre es obligatorio.", 400, "name_required");
  if (duplicateEmail(contacts, contact.email)) return apiError("Ya existe un contacto con ese email en tu espacio.", 409, "duplicate_email");
  const now = new Date().toISOString();
  const created = { id: crypto.randomUUID(), ...contact, last_signal_at: now, created_at: now, updated_at: now };
  const next = [created, ...contacts];
  await saveContacts(env, auth.user.id, next);
  return json({ ok: true, contact: created, plan: planSnapshot(auth.user, next.length) }, 201);
}

async function contactItem(request, env, id) {
  const auth = await requireUser(request, env);
  if (!auth) return apiError("Iniciá sesión para usar tu espacio.", 401, "unauthorized");
  await requireRateLimit(env, `contact-write:${auth.user.id}`);
  const contacts = await loadContacts(env, auth.user.id);
  const index = contacts.findIndex((contact) => contact.id === id);
  if (index === -1) return apiError("Contacto no encontrado.", 404, "not_found");

  if (request.method === "DELETE") {
    const next = contacts.filter((contact) => contact.id !== id);
    await saveContacts(env, auth.user.id, next);
    return json({ ok: true, plan: planSnapshot(auth.user, next.length) });
  }
  if (request.method !== "PATCH") return apiError("Método no permitido.", 405, "method_not_allowed");
  const body = await readJsonBody(request);
  const normalized = normalizeContact(body, contacts[index]);
  if (!normalized.name) return apiError("El nombre es obligatorio.", 400, "name_required");
  if (duplicateEmail(contacts, normalized.email, id)) return apiError("Ya existe un contacto con ese email en tu espacio.", 409, "duplicate_email");
  const now = new Date().toISOString();
  const updated = {
    ...normalized,
    id,
    created_at: contacts[index].created_at,
    last_signal_at: commercialSignalChanged(contacts[index], normalized)
      ? now
      : contacts[index].last_signal_at || contacts[index].updated_at || contacts[index].created_at,
    updated_at: now,
  };
  const next = contacts.slice();
  next[index] = updated;
  await saveContacts(env, auth.user.id, next);
  return json({ ok: true, contact: updated, plan: planSnapshot(auth.user, next.length) });
}

async function proInterest(request, env) {
  const auth = await requireUser(request, env);
  if (!auth) return apiError("Creá tu espacio gratis para anotarte a Pro.", 401, "unauthorized");
  await env.LEADX_KV.put(`lx:pro-interest:${auth.user.id}`, JSON.stringify({ email: auth.user.email, createdAt: new Date().toISOString() }));
  return json({ ok: true });
}

async function handleApi(request, env, url) {
  try {
    if (url.pathname === "/api/health" && request.method === "GET") {
      const writeProtectionReady = Boolean(env.AUTH_RATE_LIMITER?.limit);
      return json({
        status: writeProtectionReady ? "ok" : "degraded",
        service: "leadx",
        release: RELEASE,
        free_contact_limit: FREE_CONTACT_LIMIT,
        write_protection: writeProtectionReady ? "ready" : "unavailable",
      }, writeProtectionReady ? 200 : 503);
    }
    if (url.pathname === "/api/auth/register" && request.method === "POST") return register(request, env);
    if (url.pathname === "/api/auth/login" && request.method === "POST") return login(request, env);
    if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
    if (url.pathname === "/api/auth/session" && request.method === "GET") return session(request, env);
    if (url.pathname === "/api/contacts") return contactsCollection(request, env);
    if (url.pathname === "/api/pro-interest" && request.method === "POST") return proInterest(request, env);
    const match = url.pathname.match(/^\/api\/contacts\/([0-9a-f-]{36})$/i);
    if (match) return contactItem(request, env, match[1]);
    return apiError("Ruta no encontrada.", 404, "not_found");
  } catch (error) {
    if (error instanceof Error && error.message === "payload_too_large") return apiError("El contenido supera el tamaño permitido.", 413, "payload_too_large");
    if (error instanceof Error && error.message === "invalid_json") return apiError("JSON inválido.", 400, "invalid_json");
    if (error instanceof Error && error.message === "invalid_due_date") return apiError("La fecha de próxima acción no es válida.", 400, "invalid_due_date");
    if (error instanceof Error && error.message === "due_without_action") return apiError("Definí una próxima acción antes de asignarle fecha.", 400, "due_without_action");
    if (error instanceof Error && error.message === "rate_limited") return apiError("Demasiados intentos. Probá nuevamente en un minuto.", 429, "rate_limited");
    if (error instanceof Error && error.message === "rate_limiter_unavailable") return apiError("Las escrituras están temporalmente protegidas. Probá nuevamente en unos minutos.", 503, "write_protection_unavailable");
    if (error instanceof Error && error.message === "contacts_corrupt") return apiError("No pudimos leer tus contactos de forma segura. No se modificó ningún dato.", 500, "data_integrity_error");
    return apiError("No pudimos completar la operación.", 500, "internal_error");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (!env.ASSETS?.fetch) return new Response("LeadX assets unavailable", { status: 503 });
    return secureHeaders(await env.ASSETS.fetch(request));
  },
};
