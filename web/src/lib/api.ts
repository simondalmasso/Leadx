import type { Contact, PlanSnapshot, SessionInfo } from "../types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "No pudimos completar la operación.") as Error & { code?: string; status?: number };
    error.code = payload.code;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export const api = {
  session: () => request<SessionInfo>("/api/auth/session", { method: "GET" }),
  register: (email: string, password: string) => request<{ ok: true; user: SessionInfo["user"]; plan: PlanSnapshot }>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) => request<{ ok: true; user: SessionInfo["user"]; plan: PlanSnapshot }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  contacts: () => request<{ contacts: Contact[]; plan: PlanSnapshot }>("/api/contacts", { method: "GET" }),
  createContact: (contact: Partial<Contact>) => request<{ ok: true; contact: Contact; plan: PlanSnapshot }>("/api/contacts", { method: "POST", body: JSON.stringify(contact) }),
  updateContact: (id: string, contact: Partial<Contact>) => request<{ ok: true; contact: Contact; plan: PlanSnapshot }>(`/api/contacts/${id}`, { method: "PATCH", body: JSON.stringify(contact) }),
  deleteContact: (id: string) => request<{ ok: true; plan: PlanSnapshot }>(`/api/contacts/${id}`, { method: "DELETE" }),
  proInterest: () => request<{ ok: true }>("/api/pro-interest", { method: "POST" }),
};
