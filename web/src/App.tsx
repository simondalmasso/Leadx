import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Infinity as InfinityIcon,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { DEMO_CONTACTS } from "./demo-leads";
import { api } from "./lib/api";
import type { Contact, ContactStatus, PlanSnapshot, SessionInfo } from "./types";

const FREE_CONTACT_LIMIT = 100;
const STATUS_ORDER: ContactStatus[] = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Cliente", "Pausado"];
const EMPTY_PLAN: PlanSnapshot = { plan: "free", limit: FREE_CONTACT_LIMIT, count: 0, remaining: FREE_CONTACT_LIMIT };
const EMPTY_CONTACT: Partial<Contact> = { name: "", company: "", email: "", phone: "", status: "Nuevo", source: "", notes: "", next_action: "" };

type AuthMode = "register" | "login";
type NoticeTone = "success" | "danger" | "info";

type ContactEditorProps = {
  contact?: Contact | null;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(timestamp));
}

function contactSearch(contact: Contact) {
  return [contact.name, contact.company, contact.email, contact.phone, contact.status, contact.source, contact.next_action].join(" ").toLowerCase();
}

function statusTone(status: ContactStatus) {
  return status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");
}

function exportCsv(contacts: Contact[]) {
  const rows = [
    ["Nombre", "Empresa", "Email", "Telefono", "Estado", "Fuente", "Proxima accion", "Notas", "Creado"],
    ...contacts.map((contact) => [contact.name, contact.company, contact.email, contact.phone, contact.status, contact.source, contact.next_action, contact.notes, contact.created_at]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "leadx-contactos.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function LeadXWordmark() {
  return <img className="leadx-wordmark" src="/leadx-wordmark.svg" alt="LeadX" />;
}

function Status({ value }: { value: ContactStatus }) {
  return <span className="status"><i className={`status-dot status-dot--${statusTone(value)}`} aria-hidden="true" /><span>{value}</span></span>;
}

function useDialogClose(onClose: () => void) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
}

function ContactEditor({ contact, onClose, onSave, onDelete }: ContactEditorProps) {
  const [draft, setDraft] = useState<Partial<Contact>>(contact ? { ...contact } : { ...EMPTY_CONTACT });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  useDialogClose(onClose);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar el contacto.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos eliminar el contacto.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="editor-sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="contact-editor-title">
        <div className="editor-sheet__head">
          <div>
            <span className="eyebrow">{contact ? "Editar contacto" : "Nuevo contacto"}</span>
            <h2 id="contact-editor-title">{contact ? contact.name : "Sumar una señal"}</h2>
            <p>{contact ? "Actualizá lo mínimo necesario para que el próximo paso siga claro." : "Nombre, estado y próxima acción primero. El resto suma contexto."}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="editor-primary">
          <label className="field field--name"><span>Nombre *</span><input autoFocus required maxLength={120} value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ej. Lucía Torres" /></label>
          <label className="field"><span>Estado</span><select value={draft.status || "Nuevo"} onChange={(e) => setDraft({ ...draft, status: e.target.value as ContactStatus })}>{STATUS_ORDER.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="field field--action"><span>Próxima acción</span><input maxLength={220} value={draft.next_action || ""} onChange={(e) => setDraft({ ...draft, next_action: e.target.value })} placeholder="Qué tiene que pasar después" /></label>
        </div>

        <div className="editor-secondary">
          <div className="editor-secondary__label"><span>Contexto</span><small>Opcional, pero útil cuando volvés días después.</small></div>
          <div className="editor-grid">
            <label className="field"><span>Empresa</span><input maxLength={120} value={draft.company || ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Ej. Nómada Studio" /></label>
            <label className="field"><span>Fuente</span><input maxLength={80} value={draft.source || ""} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Web, referido, evento…" /></label>
            <label className="field"><span>Email</span><input type="email" maxLength={254} value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="lucia@empresa.com" /></label>
            <label className="field"><span>Teléfono</span><input maxLength={60} value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+54 9 …" /></label>
            <label className="field editor-grid__wide"><span>Notas</span><textarea maxLength={2000} rows={5} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Contexto que no querés perder" /></label>
          </div>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {confirmDelete ? (
          <div className="delete-confirm" role="alert">
            <div><strong>¿Eliminar este contacto?</strong><span>Esta acción no se puede deshacer.</span></div>
            <div><button className="btn btn--quiet" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancelar</button><button className="btn btn--danger" type="button" onClick={() => void remove()} disabled={deleting}>{deleting ? "Eliminando…" : "Eliminar"}</button></div>
          </div>
        ) : (
          <div className="editor-actions">
            {contact && onDelete ? <button className="text-button text-button--danger" type="button" onClick={() => setConfirmDelete(true)}>Eliminar contacto</button> : <span />}
            <div><button className="btn btn--quiet" type="button" onClick={onClose}>Cancelar</button><button className="btn btn--signal" disabled={saving || !draft.name?.trim()}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>
          </div>
        )}
      </form>
    </div>
  );
}

function AuthDialog({ mode, onClose, onSuccess }: { mode: AuthMode; onClose: () => void; onSuccess: (session: SessionInfo) => void }) {
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useDialogClose(onClose);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = authMode === "register" ? await api.register(email, password) : await api.login(email, password);
      onSuccess({ authenticated: true, mode: "workspace", user: result.user, plan: result.plan });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos completar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="auth-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="auth-card__top"><LeadXWordmark /><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <div className="auth-card__intro">
          <span className="eyebrow">{authMode === "register" ? "Plan Free · disponible ahora" : "Tu espacio privado"}</span>
          <h2 id="auth-title">{authMode === "register" ? "Tus primeros 100 clientes, en orden." : "Volvé a tu mesa."}</h2>
          <p>{authMode === "register" ? "Sin tarjeta. Sin vencimiento. Sólo vos ves lo que guardás." : "Ingresá con el email y contraseña de tu espacio."}</p>
        </div>
        {authMode === "register" && <div className="auth-facts" aria-label="Plan Free"><span><strong>100</strong> clientes</span><span><strong>$0</strong> para siempre</span><span><strong>Privado</strong> por usuario</span></div>}
        <label className="field"><span>Email</span><input autoFocus type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@empresa.com" /></label>
        <label className="field"><span>Contraseña</span><input type="password" required minLength={10} maxLength={128} autoComplete={authMode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 10 caracteres" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--signal auth-card__submit" disabled={loading}>{loading ? "Un segundo…" : authMode === "register" ? "Crear espacio gratis" : "Ingresar"}</button>
        <button className="auth-card__switch" type="button" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setError(""); }}>
          {authMode === "register" ? "Ya tengo cuenta → Ingresar" : "Soy nuevo → Crear espacio gratis"}
        </button>
        <small>Al crear una cuenta aceptás usar LeadX sólo para información que tengas derecho a gestionar.</small>
      </form>
    </div>
  );
}

type ContactDeskProps = {
  contacts: Contact[];
  preview: boolean;
  plan: PlanSnapshot;
  loading?: boolean;
  error?: string;
  onAdd: () => void;
  onOpen: (contact: Contact) => void;
  onRetry?: () => void;
};

function ContactDesk({ contacts, preview, plan, loading = false, error = "", onAdd, onOpen, onRetry }: ContactDeskProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactStatus | "Todos">("Todos");
  const [sort, setSort] = useState<"recent" | "name">("recent");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contacts
      .filter((contact) => (!needle || contactSearch(contact).includes(needle)) && (status === "Todos" || contact.status === status))
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "es") : Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [contacts, search, sort, status]);

  const active = contacts.filter((contact) => !["Cliente", "Pausado"].includes(contact.status)).length;
  const qualified = contacts.filter((contact) => ["Calificado", "Propuesta", "Cliente"].includes(contact.status)).length;
  const clients = contacts.filter((contact) => contact.status === "Cliente").length;
  const atLimit = !preview && plan.limit !== null && plan.remaining === 0;
  const filtered = Boolean(search.trim()) || status !== "Todos";

  return (
    <section className={`desk ${preview ? "desk--preview" : "desk--workspace"}`} id={preview ? "demo" : "workspace"} aria-labelledby="desk-title">
      <div className="desk__context">
        <div className="desk__context-copy">
          <span className="eyebrow">{preview ? "Mesa de señales · demo ficticia" : "Mesa de señales · tu espacio"}</span>
          <h2 id="desk-title">{preview ? "Mirá la señal. No el ruido." : "Qué tiene que pasar después."}</h2>
          <p>{preview ? "Doce contactos inventados para probar el ritmo real del producto." : `${plan.count} de ${plan.limit ?? "∞"} clientes en tu plan ${plan.plan === "free" ? "Free" : "Pro"}.`}</p>
        </div>
        <div className="desk__intro-actions">
          {!preview && <button className="btn btn--quiet" onClick={() => exportCsv(contacts)} disabled={!contacts.length}><Download size={16} /> Exportar CSV</button>}
          <button className="btn btn--signal" onClick={onAdd} disabled={atLimit}><Plus size={16} /> {preview ? "Crear mi espacio" : atLimit ? "Límite alcanzado" : "Nuevo contacto"}</button>
        </div>
      </div>

      {atLimit && <div className="limit-banner"><span className="eyebrow">Plan Free completo</span><p>Tus 100 clientes siguen intactos. Para sumar otro, liberá un lugar o registrá interés en Pro.</p></div>}

      <div className="signal-strip" aria-label="Resumen comercial">
        <div><span>Contactos</span><strong>{contacts.length}</strong></div>
        <div><span>Activos</span><strong>{active}</strong></div>
        <div><span>Calificados+</span><strong>{qualified}</strong></div>
        <div><span>Clientes</span><strong>{clients}</strong></div>
      </div>

      <div className="desk-toolbar">
        <label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar contactos</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar persona, empresa, email…" aria-label="Buscar contactos" /></label>
        <label className="select-field"><span>Estado</span><select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus | "Todos")}><option>Todos</option>{STATUS_ORDER.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label>
        <label className="select-field"><span>Orden</span><select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "name")}><option value="recent">Más recientes</option><option value="name">Nombre A–Z</option></select><ChevronDown size={15} aria-hidden="true" /></label>
      </div>

      <div className="contact-ledger" aria-label="Contactos">
        <div className="contact-ledger__head" aria-hidden="true"><span>Contacto</span><span>Estado</span><span>Próxima acción</span><span>Creado</span></div>

        {loading && <div className="ledger-loading" aria-live="polite" aria-label="Cargando contactos">{Array.from({ length: 5 }).map((_, index) => <span key={index} />)}</div>}

        {!loading && error && <div className="state-panel state-panel--error" role="alert"><span className="eyebrow">Conexión interrumpida</span><strong>No pudimos leer tu espacio.</strong><p>{error}</p>{onRetry && <button className="btn btn--quiet" onClick={onRetry}><RefreshCw size={16} /> Reintentar</button>}</div>}

        {!loading && !error && visible.map((contact) => (
          <button className="contact-row" key={contact.id} onClick={() => onOpen(contact)}>
            <span className="contact-main"><strong>{contact.name}</strong><small>{contact.company || "Sin empresa"}<b aria-hidden="true">·</b>{contact.email || contact.phone || "Sin dato de contacto"}</small></span>
            <Status value={contact.status} />
            <span className="contact-next"><small>Próxima</small><strong>{contact.next_action || "Definir próxima acción"}</strong></span>
            <span className="contact-date">{formatDate(contact.created_at)}</span>
          </button>
        ))}

        {!loading && !error && contacts.length === 0 && !filtered && <div className="state-panel state-panel--empty"><span className="eyebrow">Mesa vacía</span><strong>Tu primer cliente empieza acá.</strong><p>Guardá sólo lo que necesitás para saber dónde está y qué sigue.</p><button className="btn btn--signal" onClick={onAdd}><Plus size={16} /> Nuevo contacto</button></div>}
        {!loading && !error && contacts.length > 0 && !visible.length && <div className="state-panel state-panel--empty-search"><span className="eyebrow">Sin coincidencias</span><strong>No aparece ninguna señal con ese filtro.</strong><p>Probá otra búsqueda o volvé a “Todos”.</p></div>}
      </div>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState<SessionInfo>({ authenticated: false, mode: "preview" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [plan, setPlan] = useState<PlanSnapshot>(EMPTY_PLAN);
  const [authOpen, setAuthOpen] = useState<AuthMode | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const loadWorkspace = async () => {
    setWorkspaceLoading(true);
    setWorkspaceError("");
    try {
      const result = await api.contacts();
      setContacts(result.contacts);
      setPlan(result.plan);
    } catch (reason) {
      setWorkspaceError(reason instanceof Error ? reason.message : "No pudimos cargar tus contactos.");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const current = await api.session();
        setSession(current);
        if (current.authenticated) {
          setPlan(current.plan || EMPTY_PLAN);
          setLoading(false);
          await loadWorkspace();
        }
      } catch {
        setSession({ authenticated: false, mode: "preview" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.documentElement.dataset.leadxReady = loading ? "false" : "true";
      document.documentElement.dataset.mode = session.authenticated ? "workspace" : "preview";
      document.documentElement.dataset.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth ? "true" : "false";
    }, 60);
    return () => window.clearTimeout(timer);
  }, [loading, session.authenticated, contacts.length, editorOpen, authOpen, workspaceLoading, workspaceError]);

  const showNotice = (message: string, tone: NoticeTone = "info") => setNotice({ message, tone });

  const authSuccess = async (next: SessionInfo) => {
    setSession(next);
    setPlan(next.plan || EMPTY_PLAN);
    await loadWorkspace();
    showNotice("Tu espacio está listo. El plan Free incluye hasta 100 clientes.", "success");
    window.setTimeout(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    setSession({ authenticated: false, mode: "preview" });
    setContacts([]);
    setPlan(EMPTY_PLAN);
    setSelected(null);
    setEditorOpen(false);
    setWorkspaceError("");
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveContact = async (draft: Partial<Contact>) => {
    const wasEditing = Boolean(selected);
    const result = selected ? await api.updateContact(selected.id, draft) : await api.createContact(draft);
    setPlan(result.plan);
    setContacts((current) => selected ? current.map((contact) => contact.id === result.contact.id ? result.contact : contact) : [result.contact, ...current]);
    setSelected(null);
    showNotice(wasEditing ? "Contacto actualizado." : "Contacto creado. Ahora definí el próximo paso.", "success");
  };

  const deleteContact = async () => {
    if (!selected) return;
    const result = await api.deleteContact(selected.id);
    setPlan(result.plan);
    setContacts((current) => current.filter((contact) => contact.id !== selected.id));
    setSelected(null);
    showNotice("Contacto eliminado.", "info");
  };

  const wantPro = async () => {
    if (!session.authenticated) { setAuthOpen("register"); return; }
    try {
      await api.proInterest();
      showNotice("Listo. Registramos tu interés en LeadX Pro.", "success");
    } catch (reason) {
      showNotice(reason instanceof Error ? reason.message : "No pudimos registrar el interés.", "danger");
    }
  };

  const addContact = () => {
    if (!session.authenticated) { setAuthOpen("register"); return; }
    if (plan.limit !== null && plan.remaining === 0) {
      showNotice("Llegaste a 100 clientes. Nada se borra: liberá un lugar o registrá interés en Pro.", "danger");
      return;
    }
    setEditorOpen(true);
  };

  if (loading) return <div className="boot-screen" aria-live="polite"><LeadXWordmark /><span className="boot-signal" /><p>Ordenando la mesa…</p></div>;

  const preview = !session.authenticated;
  const shownContacts = preview ? DEMO_CONTACTS : contacts;

  return (
    <div className={`site-shell ${preview ? "site-shell--preview" : "site-shell--workspace"}`}>
      <header className="site-nav">
        <a className="wordmark-link" href="#top" aria-label="LeadX inicio"><LeadXWordmark /></a>
        {preview && <nav className={mobileNav ? "site-links site-links--open" : "site-links"} aria-label="Navegación principal">
          <a href="#demo" onClick={() => setMobileNav(false)}>Demo</a>
          <a href="#como-funciona" onClick={() => setMobileNav(false)}>Cómo funciona</a>
          <a href="#precios" onClick={() => setMobileNav(false)}>Precios</a>
        </nav>}
        <div className="nav-actions">
          {session.authenticated ? <><span className="account-chip">{session.user?.email}</span><button className="btn btn--quiet nav-workspace" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>Mi espacio</button><button className="icon-button" onClick={() => void logout()} aria-label="Cerrar sesión"><LogOut size={18} /></button></>
            : <><button className="btn btn--text nav-login" onClick={() => setAuthOpen("login")}>Ingresar</button><button className="btn btn--signal nav-primary" onClick={() => setAuthOpen("register")}>Crear espacio</button></>}
          {preview && <button className="icon-button mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-expanded={mobileNav} aria-label={mobileNav ? "Cerrar menú" : "Abrir menú"}>{mobileNav ? <X size={20} /> : <Menu size={20} />}</button>}
        </div>
      </header>

      {notice && <div className={`notice notice--${notice.tone}`} role={notice.tone === "danger" ? "alert" : "status"}><span>{notice.message}</span><button className="icon-button" onClick={() => setNotice(null)} aria-label="Cerrar aviso"><X size={16} /></button></div>}

      {preview && <main id="top">
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">CRM liviano · una decisión a la vez</span>
            <h1>Tus clientes.<br /><span>En orden.</span></h1>
            <p>LeadX te muestra quién importa, dónde está cada relación y qué tiene que pasar después. Sin convertir vender en administrar software.</p>
            <div className="hero__actions"><button className="btn btn--signal btn--large" onClick={() => setAuthOpen("register")}>Crear espacio gratis <ArrowRight size={18} /></button><a className="btn btn--quiet btn--large" href="#demo">Ver demo</a></div>
            <div className="hero__proof" aria-label="Condiciones del plan Free"><span><Check size={15} /> 100 clientes</span><span><Check size={15} /> Sin tarjeta</span><span><Check size={15} /> Sin vencimiento</span><span><Check size={15} /> Privado</span></div>
          </div>
          <aside className="hero__aside" aria-label="Plan Free">
            <span className="hero__aside-label">Free / 01</span>
            <div className="hero-number">100</div>
            <p>clientes gratis<br />para empezar</p>
            <span className="hero-signal" aria-hidden="true" />
          </aside>
        </section>

        <section className="statement" aria-labelledby="statement-title"><span>Menos CRM.</span><strong id="statement-title">Más próxima acción.</strong><p>Una lista sirve cuando te devuelve una decisión. LeadX ordena la información alrededor de esa pregunta: <em>¿qué sigue?</em></p></section>
      </main>}

      <ContactDesk
        contacts={shownContacts}
        preview={preview}
        plan={plan}
        loading={!preview && workspaceLoading}
        error={!preview ? workspaceError : ""}
        onAdd={addContact}
        onRetry={() => void loadWorkspace()}
        onOpen={(contact) => preview ? showNotice("Esta demo usa datos ficticios. Creá tu espacio para guardar cambios.", "info") : setSelected(contact)}
      />

      {preview && <>
        <section className="how" id="como-funciona">
          <div className="section-heading"><span className="eyebrow">Contact → signal → next action</span><h2>Una disciplina comercial simple.</h2><p>No hay un sistema para aprender. Hay tres preguntas que se repiten hasta que el negocio se mueve.</p></div>
          <div className="steps">
            <article><span>01 / Contact</span><h3>¿Quién es?</h3><p>Persona, empresa y la mínima información útil. Nada de completar un formulario infinito.</p></article>
            <article><span>02 / Signal</span><h3>¿Dónde está?</h3><p>Nuevo, contactado, calificado, propuesta, cliente o pausado. Un estado legible, no un dashboard de colores.</p></article>
            <article><span>03 / Next</span><h3>¿Qué sigue?</h3><p>Una próxima acción clara transforma una lista de nombres en trabajo comercial concreto.</p></article>
          </div>
        </section>

        <section className="pricing" id="precios">
          <div className="section-heading"><span className="eyebrow">Precio honesto</span><h2>Free es el producto.<br />Pro es lo que viene.</h2><p>No te mostramos un checkout que todavía no existe. Hoy podés usar LeadX gratis hasta 100 clientes, sin vencimiento.</p></div>
          <div className="pricing-grid">
            <article className="plan-card plan-card--free">
              <header><span className="plan-label">Free · disponible ahora</span><strong className="plan-price">$0</strong><small>para siempre</small></header>
              <ul><li><Check size={16} /> Hasta 100 clientes</li><li><Check size={16} /> Estados y próxima acción</li><li><Check size={16} /> Notas, búsqueda y filtros</li><li><Check size={16} /> Exportación CSV</li><li><Check size={16} /> Sin tarjeta ni vencimiento</li></ul>
              <button className="btn btn--signal btn--wide" onClick={() => setAuthOpen("register")}>Crear espacio gratis</button>
            </article>
            <article className="plan-card plan-card--pro">
              <header><span className="plan-label">Pro · próxima capa</span><strong className="plan-price"><InfinityIcon size={38} /></strong><small>No está a la venta todavía.</small></header>
              <ul><li><span className="plan-bullet" /> Contactos sin límite</li><li><span className="plan-bullet" /> Colaboración de equipo</li><li><span className="plan-bullet" /> Automatizaciones comerciales</li><li><span className="plan-bullet" /> Reportes avanzados</li><li><span className="plan-bullet" /> Soporte humano</li></ul>
              <button className="btn btn--quiet btn--wide" onClick={() => void wantPro()}>Registrar interés</button>
            </article>
          </div>
        </section>

        <section className="final-cta"><span className="eyebrow">El próximo paso</span><h2>Empezá con los próximos 100.</h2><p>Sin migración. Sin tarjeta. Sin configurar una empresa entera antes de ver valor.</p><button className="btn btn--signal btn--large" onClick={() => setAuthOpen("register")}>Crear espacio gratis <ArrowRight size={18} /></button></section>
      </>}

      {!preview && <section className="workspace-plan">
        <div><span className="eyebrow">Plan {plan.plan === "free" ? "Free" : "Pro"}</span><h2>{plan.limit === null ? "Sin límites." : plan.remaining === 0 ? "100 de 100." : `${plan.remaining} lugares disponibles.`}</h2><p>{plan.limit === null ? "Tu espacio no tiene límite de contactos." : `Usaste ${plan.count} de ${plan.limit}. Si llegás a 100, nada se borra: sólo se pausa la creación de nuevos contactos.`}</p></div>
        {plan.plan === "free" && <button className="btn btn--ink" onClick={() => void wantPro()}>Avisame por Pro <ArrowRight size={16} /></button>}
      </section>}

      <footer><a className="wordmark-link" href="#top" aria-label="LeadX inicio"><LeadXWordmark /></a><p>Una mesa de señales comerciales.</p><span>Free hasta 100 clientes.</span></footer>

      {authOpen && <AuthDialog mode={authOpen} onClose={() => setAuthOpen(null)} onSuccess={(next) => void authSuccess(next)} />}
      {(editorOpen || selected) && session.authenticated && <ContactEditor contact={selected} onClose={() => { setEditorOpen(false); setSelected(null); }} onSave={saveContact} onDelete={selected ? deleteContact : undefined} />}
    </div>
  );
}
