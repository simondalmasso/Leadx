import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check, Download, LogOut, Plus, Search, Trash2, X } from "lucide-react";

type ContactStatus = "Nuevo" | "Contactado" | "Calificado" | "Propuesta" | "Ganado" | "Perdido";
type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  notes: string;
  createdAt: string;
};
type Session = {
  authenticated: boolean;
  email?: string;
  effectivePlan?: "trial" | "free" | "pro";
  trialEndsAt?: string;
  contactLimit?: number | null;
  contactCount?: number;
};
type AuthMode = "signup" | "login";
type ApiError = Error & { status?: number; code?: string };

const DEMO_CONTACTS: Contact[] = [
  { id:"demo-1", name:"Ana Torres", company:"Norte Estudio", email:"ana@ejemplo.com", phone:"+54 11 5555 0101", status:"Nuevo", notes:"Pidió una demo para su equipo comercial.", createdAt:"2026-08-07T11:00:00Z" },
  { id:"demo-2", name:"Bruno Díaz", company:"Cauce", email:"bruno@ejemplo.com", phone:"+54 351 555 0202", status:"Contactado", notes:"Interesado en centralizar seguimiento.", createdAt:"2026-08-07T10:00:00Z" },
  { id:"demo-3", name:"Camila Ríos", company:"Estación Sur", email:"camila@ejemplo.com", phone:"+54 341 555 0303", status:"Calificado", notes:"Equipo de cuatro personas.", createdAt:"2026-08-06T18:30:00Z" },
  { id:"demo-4", name:"Diego Paz", company:"Lumen", email:"diego@ejemplo.com", phone:"+54 261 555 0404", status:"Propuesta", notes:"Revisar propuesta el viernes.", createdAt:"2026-08-06T15:10:00Z" },
  { id:"demo-5", name:"Elena Soto", company:"Punto Uno", email:"elena@ejemplo.com", phone:"+54 342 555 0505", status:"Ganado", notes:"Onboarding confirmado.", createdAt:"2026-08-05T12:20:00Z" },
  { id:"demo-6", name:"Facundo Vera", company:"Marea", email:"facundo@ejemplo.com", phone:"+54 299 555 0606", status:"Nuevo", notes:"Llegó por recomendación.", createdAt:"2026-08-05T09:00:00Z" },
];

const STATUS: ContactStatus[] = ["Nuevo","Contactado","Calificado","Propuesta","Ganado","Perdido"];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({})) as any;
  if (!response.ok) {
    const error = new Error(data.message || data.error || "No se pudo completar la operación") as ApiError;
    error.status = response.status;
    error.code = data.error;
    throw error;
  }
  return data as T;
}

function daysLeft(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}

function ProductMark() {
  return <a className="wordmark" href="/" aria-label="LeadX inicio"><span>Lead</span><b>X</b></a>;
}

function AuthDialog({ mode, onClose, onDone }: { mode: AuthMode; onClose: () => void; onDone: (session: Session) => void }) {
  const [kind, setKind] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const session = await api<Session>(kind === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method:"POST", body: JSON.stringify({ email, password }),
      });
      onDone(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo ingresar");
    } finally { setBusy(false); }
  };
  return <div className="dialog-layer" onMouseDown={(e)=>e.target===e.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-btn dialog__close" onClick={onClose} aria-label="Cerrar"><X size={19}/></button>
      <p className="eyebrow">{kind === "signup" ? "Empezá gratis" : "Volvé a tu espacio"}</p>
      <h2 id="auth-title">{kind === "signup" ? "Tu CRM, listo para usar." : "Ingresá a LeadX."}</h2>
      <p className="muted">{kind === "signup" ? "14 días de Pro de regalo. Después seguís Free hasta 100 contactos." : "Tus contactos quedan en tu espacio privado."}</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="vos@empresa.com"/></label>
        <label>Contraseña<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={kind==="signup"?"new-password":"current-password"} placeholder="Mínimo 8 caracteres"/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-btn" disabled={busy}>{busy ? "Procesando…" : kind === "signup" ? "Crear cuenta gratis" : "Ingresar"}<ArrowRight size={17}/></button>
      </form>
      <button className="text-btn" onClick={()=>{setKind(kind==="signup"?"login":"signup");setError("");}}>
        {kind === "signup" ? "Ya tengo cuenta" : "Crear una cuenta gratis"}
      </button>
    </section>
  </div>;
}

function ContactTable({ contacts, demo, onDelete, onStatus }: { contacts: Contact[]; demo?: boolean; onDelete?: (id:string)=>void; onStatus?: (id:string,status:ContactStatus)=>void }) {
  return <div className="contact-ledger">
    <div className="contact-row contact-row--head"><span>Contacto</span><span>Empresa</span><span>Estado</span><span>Contacto</span><span></span></div>
    {contacts.map(contact => <div className="contact-row" key={contact.id}>
      <div><strong>{contact.name}</strong><small>{contact.notes || "Sin notas"}</small></div>
      <span>{contact.company || "—"}</span>
      <span>{demo ? <span className={`status status--${contact.status.toLowerCase()}`}>{contact.status}</span> :
        <select aria-label={`Estado de ${contact.name}`} value={contact.status} onChange={e=>onStatus?.(contact.id,e.target.value as ContactStatus)}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>}</span>
      <div className="contact-cell"><a href={`mailto:${contact.email}`}>{contact.email || "—"}</a><small>{contact.phone || ""}</small></div>
      <span>{!demo && <button className="icon-btn" onClick={()=>onDelete?.(contact.id)} aria-label={`Eliminar ${contact.name}`}><Trash2 size={16}/></button>}</span>
    </div>)}
    {!contacts.length && <div className="empty-state"><strong>No hay contactos acá.</strong><span>Agregá el primero o limpiá la búsqueda.</span></div>}
  </div>;
}

function DemoBoard({ onStart }: { onStart:()=>void }) {
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("Todos");
  const visible=useMemo(()=>DEMO_CONTACTS.filter(c=>{
    const hay=`${c.name} ${c.company} ${c.email}`.toLowerCase();
    return hay.includes(search.toLowerCase()) && (status==="Todos" || c.status===status);
  }),[search,status]);
  return <section id="demo" className="demo-shell">
    <div className="section-intro"><div><p className="eyebrow">Preview abierto</p><h2>Probalo antes de registrarte.</h2></div><p>Datos 100% ficticios. Buscá, filtrá y recorré el flujo sin crear una cuenta.</p></div>
    <div className="demo-toolbar">
      <label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contacto…"/></label>
      <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filtrar estado"><option>Todos</option>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
      <button className="primary-btn compact" onClick={onStart}><Plus size={16}/>Agregar contacto</button>
    </div>
    <div className="demo-metrics"><div><strong>{DEMO_CONTACTS.length}</strong><span>contactos</span></div><div><strong>{DEMO_CONTACTS.filter(c=>c.status==="Calificado"||c.status==="Propuesta").length}</strong><span>en oportunidad</span></div><div><strong>{DEMO_CONTACTS.filter(c=>c.status==="Ganado").length}</strong><span>ganados</span></div></div>
    <ContactTable contacts={visible} demo/>
    <div className="demo-foot"><span>Preview · no guarda cambios</span><button className="text-btn" onClick={onStart}>Crear mi espacio gratis <ArrowRight size={15}/></button></div>
  </section>;
}

function Landing({ onSignup, onLogin }: {onSignup:()=>void;onLogin:()=>void}) {
  return <>
    <header className="marketing-nav"><ProductMark/><nav><a href="#demo">Producto</a><a href="#pricing">Precios</a><button className="text-btn" onClick={onLogin}>Ingresar</button><button className="primary-btn compact" onClick={onSignup}>Empezar gratis</button></nav></header>
    <main>
      <section className="hero">
        <p className="eyebrow">CRM para equipos que venden</p>
        <h1>Menos administrar.<br/>Más <em>seguir la señal.</em></h1>
        <p className="hero__copy">Ordená contactos, seguí oportunidades y sabé qué conversación mover ahora. Sin setup, sin tarjeta y sin ruido.</p>
        <div className="hero__actions"><button className="primary-btn" onClick={onSignup}>Crear cuenta gratis <ArrowRight size={18}/></button><a className="secondary-link" href="#demo">Ver el preview</a></div>
        <p className="hero__proof">Gratis para siempre hasta 100 contactos · 14 días de Pro de regalo · tus datos no se borran si volvés a Free</p>
      </section>
      <section className="principles">
        <div><span>01</span><h3>Una lista que se entiende.</h3><p>Contacto, empresa, estado y próxima señal. Lo necesario para trabajar.</p></div>
        <div><span>02</span><h3>Pipeline sin ceremonia.</h3><p>Mové una oportunidad de Nuevo a Ganado sin construir un sistema alrededor.</p></div>
        <div><span>03</span><h3>Crece cuando vos crecés.</h3><p>Empezá Free. Pasá a Pro recién cuando el límite de escala realmente te quede chico.</p></div>
      </section>
      <DemoBoard onStart={onSignup}/>
      <section id="pricing" className="pricing">
        <div className="section-intro"><div><p className="eyebrow">Precio simple</p><h2>Gratis hasta que crezcas.</h2></div><p>La lógica es deliberada: el producto base no vence. Pro quita límites de escala.</p></div>
        <div className="price-grid">
          <article className="price-card"><p className="eyebrow">Free</p><h3>$0</h3><p>para siempre</p><ul><li><Check size={16}/>Hasta 100 contactos</li><li><Check size={16}/>Pipeline completo</li><li><Check size={16}/>Búsqueda y seguimiento</li><li><Check size={16}/>1 espacio personal</li></ul><button className="primary-btn" onClick={onSignup}>Empezar gratis</button></article>
          <article className="price-card price-card--pro"><p className="eyebrow">Pro</p><h3>Sin límites</h3><p>para equipos que ya crecieron</p><ul><li><Check size={16}/>Contactos ilimitados</li><li><Check size={16}/>Exportación CSV</li><li><Check size={16}/>Funciones de equipo</li><li><Check size={16}/>Soporte prioritario</li></ul><button className="secondary-btn" onClick={onSignup}>Probar Pro 14 días</button></article>
        </div>
      </section>
      <section className="final-cta"><p className="eyebrow">LeadX</p><h2>Tu próximo contacto ya está ahí.<br/>Que no se pierda.</h2><button className="primary-btn" onClick={onSignup}>Crear cuenta gratis <ArrowRight size={18}/></button></section>
    </main>
    <footer><ProductMark/><span>LeadX · CRM simple para vender con foco.</span><a href="#pricing">Free hasta 100 contactos</a></footer>
  </>;
}

function AddContactDialog({onClose,onAdded}:{onClose:()=>void;onAdded:(c:Contact)=>void}) {
  const [form,setForm]=useState({name:"",company:"",email:"",phone:"",notes:""});
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{
    const result=await api<{contact:Contact}>("/api/contacts",{method:"POST",body:JSON.stringify(form)}); onAdded(result.contact); onClose();
  }catch(reason){setError(reason instanceof Error?reason.message:"No se pudo crear");}finally{setBusy(false);}};
  return <div className="dialog-layer" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="dialog" role="dialog" aria-modal="true"><button className="icon-btn dialog__close" onClick={onClose}><X size={19}/></button><p className="eyebrow">Nuevo contacto</p><h2>Guardá la conversación.</h2><form onSubmit={submit} className="auth-form"><label>Nombre<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Empresa<input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Teléfono<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Nota<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{error&&<p className="form-error">{error}</p>}<button className="primary-btn" disabled={busy}>{busy?"Guardando…":"Guardar contacto"}</button></form></section></div>
}

function Workspace({initialSession,onLogout}:{initialSession:Session;onLogout:()=>void}) {
  const [session,setSession]=useState(initialSession); const [contacts,setContacts]=useState<Contact[]>([]);
  const [search,setSearch]=useState(""); const [status,setStatus]=useState("Todos"); const [addOpen,setAddOpen]=useState(false);
  const [error,setError]=useState(""); const [upgradeSent,setUpgradeSent]=useState(false);
  const load=async()=>{try{const data=await api<{contacts:Contact[];session:Session}>("/api/contacts");setContacts(data.contacts);setSession(data.session);}catch(e){setError(e instanceof Error?e.message:"Error");}};
  useEffect(()=>{void load();},[]);
  const visible=useMemo(()=>contacts.filter(c=>`${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())&&(status==="Todos"||c.status===status)),[contacts,search,status]);
  const remove=async(id:string)=>{if(!confirm("¿Eliminar este contacto?"))return; await api(`/api/contacts/${id}`,{method:"DELETE"}); setContacts(v=>v.filter(c=>c.id!==id)); setSession(s=>({...s,contactCount:Math.max(0,(s.contactCount||1)-1)}));};
  const changeStatus=async(id:string,next:ContactStatus)=>{const {contact}=await api<{contact:Contact}>(`/api/contacts/${id}`,{method:"PATCH",body:JSON.stringify({status:next})});setContacts(v=>v.map(c=>c.id===id?contact:c));};
  const signout=async()=>{await api("/api/auth/logout",{method:"POST"}).catch(()=>undefined);onLogout();};
  const exportCsv=()=>{const rows=[["Nombre","Empresa","Email","Teléfono","Estado","Notas"],...contacts.map(c=>[c.name,c.company,c.email,c.phone,c.status,c.notes])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="leadx-contactos.csv";a.click();URL.revokeObjectURL(url);};
  const askPro=async()=>{await api("/api/upgrade-interest",{method:"POST"});setUpgradeSent(true);};
  const plan=session.effectivePlan||"free"; const limit=session.contactLimit; const count=session.contactCount??contacts.length; const atLimit=plan==="free"&&typeof limit==="number"&&count>=limit;
  return <div className="workspace">
    <header className="workspace-nav"><ProductMark/><div><span className={`plan-pill plan-pill--${plan}`}>{plan==="trial"?`Pro prueba · ${daysLeft(session.trialEndsAt)}d`:plan==="pro"?"Pro":"Free"}</span><span className="account-email">{session.email}</span><button className="icon-btn" onClick={signout} aria-label="Salir"><LogOut size={17}/></button></div></header>
    <main className="workspace-main">
      <section className="workspace-head"><div><p className="eyebrow">Contactos</p><h1>Tu señal comercial.</h1><p>{plan==="free"?`${count} de ${limit} contactos usados`:`${count} contactos · sin límite durante ${plan==="trial"?"la prueba Pro":"Pro"}`}</p></div><div className="workspace-actions">{plan!=="free"&&<button className="secondary-btn" onClick={exportCsv}><Download size={16}/>Exportar</button>}<button className="primary-btn" disabled={atLimit} onClick={()=>setAddOpen(true)}><Plus size={17}/>{atLimit?"Límite alcanzado":"Agregar contacto"}</button></div></section>
      {atLimit&&<section className="limit-banner"><div><p className="eyebrow">Llegaste a 100</p><strong>Tu información sigue intacta.</strong><span>Podés seguir usando LeadX; para crear contactos nuevos necesitás Pro.</span></div><button className="secondary-btn" onClick={askPro}>{upgradeSent?"Solicitud enviada":"Quiero Pro"}</button></section>}
      {plan==="trial"&&<section className="trial-note">Tenés Pro desbloqueado por {daysLeft(session.trialEndsAt)} días. Después seguís Free; nada se borra.</section>}
      {error&&<p className="form-error">{error}</p>}
      <div className="demo-toolbar workspace-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, empresa o email…"/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="workspace-metrics"><div><strong>{count}</strong><span>contactos</span></div><div><strong>{contacts.filter(c=>["Calificado","Propuesta"].includes(c.status)).length}</strong><span>oportunidades</span></div><div><strong>{contacts.filter(c=>c.status==="Ganado").length}</strong><span>ganados</span></div></div>
      <ContactTable contacts={visible} onDelete={remove} onStatus={changeStatus}/>
    </main>
    {addOpen&&<AddContactDialog onClose={()=>setAddOpen(false)} onAdded={c=>{setContacts(v=>[c,...v]);setSession(s=>({...s,contactCount:(s.contactCount||0)+1}));}}/>}
  </div>;
}

export default function App(){
  const [session,setSession]=useState<Session|null>(null); const [auth,setAuth]=useState<AuthMode|null>(null);
  useEffect(()=>{void api<Session>("/api/auth/session").then(setSession).catch(()=>setSession({authenticated:false}));},[]);
  if(session?.authenticated) return <Workspace initialSession={session} onLogout={()=>setSession({authenticated:false})}/>;
  return <><Landing onSignup={()=>setAuth("signup")} onLogin={()=>setAuth("login")}/>{auth&&<AuthDialog mode={auth} onClose={()=>setAuth(null)} onDone={s=>{setSession(s);setAuth(null);}}/>}</>;
}
