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
  Search,
  Sparkles,
  Users,
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

function ContactEditor({ contact, onClose, onSave, onDelete }: ContactEditorProps) {
  const [draft, setDraft] = useState<Partial<Contact>>(contact ? { ...contact } : { ...EMPTY_CONTACT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="editor-sheet" onSubmit={submit}>
        <div className="editor-sheet__head">
          <div><span className="eyebrow">{contact ? "Contacto" : "Nuevo contacto"}</span><h2>{contact ? contact.name : "Sumar a tu espacio"}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="editor-grid">
          <label><span>Nombre *</span><input autoFocus required maxLength={120} value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ej. Lucía Torres" /></label>
          <label><span>Empresa</span><input maxLength={120} value={draft.company || ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Ej. Nómada Studio" /></label>
          <label><span>Email</span><input type="email" maxLength={254} value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="lucia@empresa.com" /></label>
          <label><span>Teléfono</span><input maxLength={60} value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+54 9 ..." /></label>
          <label><span>Estado</span><select value={draft.status || "Nuevo"} onChange={(e) => setDraft({ ...draft, status: e.target.value as ContactStatus })}>{STATUS_ORDER.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Fuente</span><input maxLength={80} value={draft.source || ""} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Web, referido, evento..." /></label>
          <label className="editor-grid__wide"><span>Próxima acción</span><input maxLength={220} value={draft.next_action || ""} onChange={(e) => setDraft({ ...draft, next_action: e.target.value })} placeholder="Qué tiene que pasar después" /></label>
          <label className="editor-grid__wide"><span>Notas</span><textarea maxLength={2000} rows={5} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Contexto que no querés perder" /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="editor-actions">
          {contact && onDelete ? <button className="text-button text-button--danger" type="button" onClick={async () => { if (window.confirm("¿Eliminar este contacto?")) { await onDelete(); onClose(); } }}>Eliminar</button> : <span />}
          <div><button className="btn btn--quiet" type="button" onClick={onClose}>Cancelar</button><button className="btn btn--signal" disabled={saving || !draft.name?.trim()}>{saving ? "Guardando…" : "Guardar"}</button></div>
        </div>
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
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card__top"><div className="brand-mark">L<span>X</span></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <span className="eyebrow">{authMode === "register" ? "Plan Free" : "Tu espacio"}</span>
        <h2>{authMode === "register" ? "Empezá con tus primeros 100 clientes gratis." : "Volvé a tu LeadX."}</h2>
        <p>{authMode === "register" ? "Sin tarjeta, sin vencimiento. Tus clientes quedan privados en tu espacio." : "Ingresá con el email y contraseña de tu espacio."}</p>
        <label><span>Email</span><input autoFocus type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@empresa.com" /></label>
        <label><span>Contraseña</span><input type="password" required minLength={10} maxLength={128} autoComplete={authMode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 10 caracteres" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--signal auth-card__submit" disabled={loading}>{loading ? "Un segundo…" : authMode === "register" ? "Crear espacio gratis" : "Ingresar"}</button>
        <button className="auth-card__switch" type="button" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setError(""); }}>
          {authMode === "register" ? "¿Ya tenés cuenta? Ingresar" : "¿Sos nuevo? Crear espacio gratis"}
        </button>
        <small>Al crear una cuenta aceptás usar LeadX para información que tengas derecho a gestionar.</small>
      </form>
    </div>
  );
}

function ContactDesk({ contacts, preview, plan, onAdd, onOpen }: { contacts: Contact[]; preview: boolean; plan: PlanSnapshot; onAdd: () => void; onOpen: (contact: Contact) => void }) {
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

  return (
    <section className={`desk ${preview ? "desk--preview" : ""}`} id={preview ? "demo" : "workspace"}>
      <div className="desk__intro">
        <div>
          <span className="eyebrow">{preview ? "Preview interactiva" : "Tu espacio"}</span>
          <h2>{preview ? "Mirá la señal. No el ruido." : "Contactos"}</h2>
          <p>{preview ? "Datos 100% ficticios. Buscá, filtrá y abrí cualquier contacto." : `${plan.count} de ${plan.limit ?? "∞"} contactos en tu plan ${plan.plan === "free" ? "Free" : "Pro"}.`}</p>
        </div>
        <div className="desk__intro-actions">
          {!preview && <button className="btn btn--quiet" onClick={() => exportCsv(contacts)} disabled={!contacts.length}><Download size={16} /> Exportar</button>}
          <button className="btn btn--signal" onClick={onAdd}><Plus size={16} /> {preview ? "Crear mi espacio" : "Nuevo contacto"}</button>
        </div>
      </div>

      <div className="signal-strip" aria-label="Resumen">
        <div><span>Contactos</span><strong>{contacts.length}</strong></div>
        <div><span>Activos</span><strong>{active}</strong></div>
        <div><span>Calificados+</span><strong>{qualified}</strong></div>
        <div><span>Clientes</span><strong>{clients}</strong></div>
      </div>

      <div className="desk-toolbar">
        <label className="search-field"><Search size={18} aria-hidden="true" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar persona, empresa, email…" aria-label="Buscar contactos" /></label>
        <label className="select-field"><span>Estado</span><select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus | "Todos")}><option>Todos</option>{STATUS_ORDER.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        <label className="select-field"><span>Orden</span><select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "name")}><option value="recent">Más recientes</option><option value="name">Nombre A–Z</option></select><ChevronDown size={15} /></label>
      </div>

      <div className="contact-ledger" role="table" aria-label="Contactos">
        <div className="contact-ledger__head" role="row"><span>Contacto</span><span>Estado</span><span>Próxima acción</span><span>Creado</span></div>
        {visible.map((contact) => (
          <button className="contact-row" key={contact.id} onClick={() => onOpen(contact)} role="row">
            <span className="contact-main"><strong>{contact.name}</strong><small>{contact.company || "Sin empresa"} · {contact.email || contact.phone || "Sin dato de contacto"}</small></span>
            <span><i className={`status-dot status-dot--${statusTone(contact.status)}`} />{contact.status}</span>
            <span className="contact-next">{contact.next_action || "Sin próxima acción"}</span>
            <span className="contact-date">{formatDate(contact.created_at)}</span>
          </button>
        ))}
        {!visible.length && <div className="empty-state"><strong>No hay coincidencias.</strong><span>Probá otra búsqueda o limpiá el filtro.</span></div>}
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
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const loadWorkspace = async () => {
    const result = await api.contacts();
    setContacts(result.contacts);
    setPlan(result.plan);
  };

  useEffect(() => {
    void (async () => {
      try {
        const current = await api.session();
        setSession(current);
        if (current.authenticated) await loadWorkspace();
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
  }, [loading, session.authenticated, contacts.length, editorOpen, authOpen]);

  const authSuccess = async (next: SessionInfo) => {
    setSession(next);
    setPlan(next.plan || EMPTY_PLAN);
    await loadWorkspace();
    setNotice("Tu espacio está listo. El plan Free incluye hasta 100 clientes.");
    window.setTimeout(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    setSession({ authenticated: false, mode: "preview" });
    setContacts([]);
    setPlan(EMPTY_PLAN);
    setSelected(null);
    setEditorOpen(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveContact = async (draft: Partial<Contact>) => {
    const result = selected ? await api.updateContact(selected.id, draft) : await api.createContact(draft);
    setPlan(result.plan);
    setContacts((current) => selected ? current.map((contact) => contact.id === result.contact.id ? result.contact : contact) : [result.contact, ...current]);
    setSelected(null);
    setNotice(selected ? "Contacto actualizado." : "Contacto creado.");
  };

  const deleteContact = async () => {
    if (!selected) return;
    const result = await api.deleteContact(selected.id);
    setPlan(result.plan);
    setContacts((current) => current.filter((contact) => contact.id !== selected.id));
    setSelected(null);
    setNotice("Contacto eliminado.");
  };

  const wantPro = async () => {
    if (!session.authenticated) { setAuthOpen("register"); return; }
    try {
      await api.proInterest();
      setNotice("Listo. Registramos tu interés en LeadX Pro.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "No pudimos registrar el interés.");
    }
  };

  if (loading) return <div className="boot-screen"><div className="brand-mark">L<span>X</span></div><span>Preparando LeadX…</span></div>;

  const preview = !session.authenticated;
  const shownContacts = preview ? DEMO_CONTACTS : contacts;

  return (
    <div className="site-shell">
      <header className="site-nav">
        <a className="wordmark" href="#top" aria-label="LeadX inicio">Lead<span>X</span></a>
        <nav className={mobileNav ? "site-links site-links--open" : "site-links"}>
          <a href="#demo" onClick={() => setMobileNav(false)}>Demo</a>
          <a href="#como-funciona" onClick={() => setMobileNav(false)}>Cómo funciona</a>
          <a href="#precios" onClick={() => setMobileNav(false)}>Precios</a>
        </nav>
        <div className="nav-actions">
          {session.authenticated ? <><span className="account-chip">{session.user?.email}</span><button className="btn btn--quiet" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>Mi espacio</button><button className="icon-button" onClick={() => void logout()} aria-label="Cerrar sesión"><LogOut size={18} /></button></>
            : <><button className="btn btn--quiet nav-login" onClick={() => setAuthOpen("login")}>Ingresar</button><button className="btn btn--signal" onClick={() => setAuthOpen("register")}>Empezar gratis</button></>}
          <button className="icon-button mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label="Menú">{mobileNav ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={16} /></button></div>}

      {preview && <main id="top">
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">CRM liviano para vender mejor</span>
            <h1>Tus clientes.<br /><em>En orden.</em></h1>
            <p>LeadX reúne lo que importa para avanzar una relación comercial: quién es, en qué estado está y qué tiene que pasar después.</p>
            <div className="hero__actions"><button className="btn btn--signal btn--large" onClick={() => setAuthOpen("register")}>Crear espacio gratis <ArrowRight size={18} /></button><a className="btn btn--quiet btn--large" href="#demo">Ver demo</a></div>
            <div className="hero__proof"><span><Check size={15} /> Gratis hasta 100 clientes</span><span><Check size={15} /> Sin tarjeta</span><span><Check size={15} /> Sin vencimiento</span></div>
          </div>
          <div className="hero__aside" aria-hidden="true">
            <div className="hero-number">100</div><span>clientes gratis<br />para empezar</span>
          </div>
        </section>

        <section className="statement"><span>Menos CRM.</span><strong>Más próxima acción.</strong><p>No necesitás otra suite enorme. Necesitás saber a quién llamar, qué prometiste y qué sigue.</p></section>
      </main>}

      <ContactDesk
        contacts={shownContacts}
        preview={preview}
        plan={plan}
        onAdd={() => preview ? setAuthOpen("register") : setEditorOpen(true)}
        onOpen={(contact) => preview ? setNotice("Esta es una demo con datos ficticios. Creá tu espacio gratis para guardar cambios.") : setSelected(contact)}
      />

      {preview && <>
        <section className="how" id="como-funciona">
          <div className="section-heading"><span className="eyebrow">Cómo funciona</span><h2>Una disciplina comercial simple.</h2></div>
          <div className="steps">
            <article><span>01</span><h3>Guardá el contacto</h3><p>Persona, empresa y la mínima información útil. Nada de completar un formulario infinito.</p></article>
            <article><span>02</span><h3>Marcá dónde está</h3><p>Nuevo, contactado, calificado, propuesta, cliente o pausado. Todos entienden el estado.</p></article>
            <article><span>03</span><h3>Definí qué sigue</h3><p>Una próxima acción clara transforma una lista de nombres en un pipeline que se mueve.</p></article>
          </div>
        </section>

        <section className="pricing" id="precios">
          <div className="section-heading"><span className="eyebrow">Precios</span><h2>Gratis hasta que realmente crezcas.</h2><p>El plan Free no vence. Si llegás al límite, tus clientes quedan intactos: simplemente no agregás nuevos hasta pasar a Pro.</p></div>
          <div className="pricing-grid">
            <article className="plan-card plan-card--free">
              <div><span className="plan-label">Free</span><strong className="plan-price">$0</strong><small>para siempre</small></div>
              <ul><li><Check size={16} /> Hasta 100 clientes</li><li><Check size={16} /> Estados y próxima acción</li><li><Check size={16} /> Notas, búsqueda y filtros</li><li><Check size={16} /> Exportación CSV</li><li><Check size={16} /> Sin tarjeta ni vencimiento</li></ul>
              <button className="btn btn--signal btn--wide" onClick={() => setAuthOpen("register")}>Empezar gratis</button>
            </article>
            <article className="plan-card plan-card--pro">
              <div className="plan-card__tag">En preparación</div>
              <div><span className="plan-label">Pro</span><strong className="plan-price"><InfinityIcon size={34} /></strong><small>para equipos que crecen</small></div>
              <ul><li><Sparkles size={16} /> Contactos sin límite</li><li><Sparkles size={16} /> Colaboración de equipo</li><li><Sparkles size={16} /> Automatizaciones comerciales</li><li><Sparkles size={16} /> Reportes avanzados</li><li><Sparkles size={16} /> Soporte humano</li></ul>
              <button className="btn btn--ink btn--wide" onClick={() => void wantPro()}>Quiero Pro</button>
            </article>
          </div>
        </section>

        <section className="final-cta"><Users size={28} /><h2>Empezá con los próximos 100.</h2><p>Sin migración, sin tarjeta, sin configurar una empresa entera antes de ver valor.</p><button className="btn btn--signal btn--large" onClick={() => setAuthOpen("register")}>Crear espacio gratis <ArrowRight size={18} /></button></section>
      </>}

      {!preview && <section className="workspace-plan">
        <div><span className="eyebrow">Plan {plan.plan === "free" ? "Free" : "Pro"}</span><h2>{plan.limit === null ? "Sin límites." : `${plan.remaining} lugares disponibles.`}</h2><p>{plan.limit === null ? "Tu espacio no tiene límite de contactos." : `Usaste ${plan.count} de ${plan.limit}. Si llegás a 100, nada se borra: sólo se pausa la creación de nuevos contactos.`}</p></div>
        {plan.plan === "free" && <button className="btn btn--ink" onClick={() => void wantPro()}>Avisame por Pro <ArrowRight size={16} /></button>}
      </section>}

      <footer><a className="wordmark" href="#top">Lead<span>X</span></a><p>CRM liviano para equipos comerciales. Piloto público 2026.</p><span>Free hasta 100 clientes.</span></footer>

      {authOpen && <AuthDialog mode={authOpen} onClose={() => setAuthOpen(null)} onSuccess={(next) => void authSuccess(next)} />}
      {(editorOpen || selected) && session.authenticated && <ContactEditor contact={selected} onClose={() => { setEditorOpen(false); setSelected(null); }} onSave={saveContact} onDelete={selected ? deleteContact : undefined} />}
    </div>
  );
}