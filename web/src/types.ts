export type ContactStatus = "Nuevo" | "Contactado" | "Calificado" | "Propuesta" | "Cliente" | "Pausado";

export type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  source: string;
  notes: string;
  next_action: string;
  next_action_due_at: string;
  last_signal_at: string;
  created_at: string;
  updated_at: string;
  demo?: boolean;
};

export type PlanSnapshot = {
  plan: "free" | "pro";
  limit: number | null;
  count: number;
  remaining: number | null;
};

export type SessionInfo = {
  authenticated: boolean;
  mode: "preview" | "workspace";
  user?: { email: string; plan: "free" | "pro" };
  plan?: PlanSnapshot;
};
