const RELEASE = "leadx-public-v1";
const FREE_CONTACT_LIMIT = 100;
const TRIAL_DAYS = 14;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCOUNT_KEY_PREFIX = "account:v1:";
const CONTACT_KEY_PREFIX = "contacts:v1:";
const SESSION_KEY_PREFIX = "session:v1:";
const UPGRADE_KEY_PREFIX = "upgrade:v1:";
const STATUSES = new Set(["Nuevo","Contactado","Calificado","Propuesta","Ganado","Perdido"]);

const encoder = new TextEncoder();

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"strict-origin-when-cross-origin",
    "Permissions-Policy":"camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    ...extra,
  };
}
function json(body,status=200,extra={}) {
  return new Response(JSON.stringify(body),{status,headers:securityHeaders({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...extra})});
}
function clean(value,max=200){return typeof value==="string"?value.trim().slice(0,max):"";}
function normalizeEmail(value){return clean(value,254).toLowerCase();}
function cookieValue(request,name){
  const raw=request.headers.get("Cookie")||"";
  for(const part of raw.split(";")){const [key,...rest]=part.trim().split("=");if(key===name)return rest.join("=");}
  return "";
}
function sessionCookie(token){return `leadx_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;}
function expiredCookie(){return "leadx_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";}
function bytesToB64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function b64ToBytes(value){const s=atob(value);return Uint8Array.from(s,c=>c.charCodeAt(0));}
async function sha256Text(value){const hash=await crypto.subtle.digest("SHA-256",encoder.encode(value));return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function constantTimeEqual(a,b){
  if(typeof a!=="string"||typeof b!=="string")return false;
  const aa=encoder.encode(a),bb=encoder.encode(b);
  let diff=aa.length^bb.length;
  const length=Math.max(aa.length,bb.length);
  for(let i=0;i<length;i++)diff|=(aa[i%aa.length]||0)^(bb[i%bb.length]||0);
  return diff===0;
}
async function hashPassword(password,saltBytes){
  const material=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:saltBytes,iterations:120000,hash:"SHA-256"},material,256);
  return bytesToB64(new Uint8Array(bits));
}
async function accountKey(email){return ACCOUNT_KEY_PREFIX + await sha256Text(email);}
async function parseJson(request,maxBytes=32768){
  const text=await request.text();
  if(new Blob([text]).size>maxBytes)throw Object.assign(new Error("payload_too_large"),{status:413});
  try{return JSON.parse(text||"{}");}catch{throw Object.assign(new Error("invalid_json"),{status:400});}
}
function sameOrigin(request,url){
  const origin=request.headers.get("Origin");
  if(!origin)return true;
  try{return new URL(origin).origin===url.origin;}catch{return false;}
}
async function rateAllowed(request,env){
  if(!env.LOGIN_RATE_LIMITER)return true;
  try{
    const ip=request.headers.get("CF-Connecting-IP")||"unknown";
    const result=await env.LOGIN_RATE_LIMITER.limit({key:`auth:${ip}`});
    return result?.success!==false;
  }catch{return true;}
}
function effectivePlan(account,contactCount=0){
  if(account.plan==="pro")return {effectivePlan:"pro",contactLimit:null,contactCount};
  if(Date.parse(account.trialEndsAt)>Date.now())return {effectivePlan:"trial",contactLimit:null,contactCount};
  return {effectivePlan:"free",contactLimit:FREE_CONTACT_LIMIT,contactCount};
}
async function getContacts(env,accountId){
  const value=await env.LEADX_KV.get(CONTACT_KEY_PREFIX+accountId,"json");
  return Array.isArray(value)?value:[];
}
async function getSession(request,env){
  const token=cookieValue(request,"leadx_session");
  if(!token)return null;
  const session=await env.LEADX_KV.get(SESSION_KEY_PREFIX+token,"json");
  if(!session?.accountId)return null;
  const account=await env.LEADX_KV.get(session.accountKey,"json");
  if(!account)return null;
  return {token,session,account};
}
async function publicSession(request,env){
  const resolved=await getSession(request,env);
  if(!resolved)return {authenticated:false};
  const contacts=await getContacts(env,resolved.account.id);
  return {authenticated:true,email:resolved.account.email,trialEndsAt:resolved.account.trialEndsAt,...effectivePlan(resolved.account,contacts.length)};
}
async function issueSession(env,account,accountKeyValue){
  const token=crypto.randomUUID();
  await env.LEADX_KV.put(SESSION_KEY_PREFIX+token,JSON.stringify({accountId:account.id,accountKey:accountKeyValue,createdAt:new Date().toISOString()}),{expirationTtl:SESSION_TTL_SECONDS});
  return {token,session:{authenticated:true,email:account.email,trialEndsAt:account.trialEndsAt,...effectivePlan(account,0)}};
}
async function authRequired(request,env){
  const resolved=await getSession(request,env);
  if(!resolved)throw Object.assign(new Error("authentication_required"),{status:401});
  return resolved;
}
function validateEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
async function handleSignup(request,env){
  if(!(await rateAllowed(request,env)))return json({error:"rate_limited",message:"Demasiados intentos. Probá de nuevo en un minuto."},429);
  const body=await parseJson(request);const email=normalizeEmail(body.email);const password=String(body.password||"");
  if(!validateEmail(email)||password.length<8||password.length>200)return json({error:"invalid_credentials",message:"Usá un email válido y una contraseña de al menos 8 caracteres."},400);
  const key=await accountKey(email);if(await env.LEADX_KV.get(key))return json({error:"account_exists",message:"Ese email ya tiene una cuenta."},409);
  const salt=crypto.getRandomValues(new Uint8Array(16));const passwordHash=await hashPassword(password,salt);
  const now=Date.now();const account={id:crypto.randomUUID(),email,passwordHash,salt:bytesToB64(salt),plan:"free",createdAt:new Date(now).toISOString(),trialEndsAt:new Date(now+TRIAL_DAYS*86400000).toISOString()};
  await env.LEADX_KV.put(key,JSON.stringify(account));
  const issued=await issueSession(env,account,key);
  return json(issued.session,201,{"Set-Cookie":sessionCookie(issued.token)});
}
async function handleLogin(request,env){
  if(!(await rateAllowed(request,env)))return json({error:"rate_limited",message:"Demasiados intentos. Probá de nuevo en un minuto."},429);
  const body=await parseJson(request);const email=normalizeEmail(body.email);const password=String(body.password||"");
  const key=await accountKey(email);const account=await env.LEADX_KV.get(key,"json");
  if(!account||!password)return json({error:"invalid_credentials",message:"Email o contraseña incorrectos."},401);
  const candidate=await hashPassword(password,b64ToBytes(account.salt));if(!constantTimeEqual(candidate,account.passwordHash))return json({error:"invalid_credentials",message:"Email o contraseña incorrectos."},401);
  const contacts=await getContacts(env,account.id);const issued=await issueSession(env,account,key);
  return json({...issued.session,...effectivePlan(account,contacts.length)},200,{"Set-Cookie":sessionCookie(issued.token)});
}
async function handleLogout(request,env){
  const token=cookieValue(request,"leadx_session");if(token)await env.LEADX_KV.delete(SESSION_KEY_PREFIX+token);
  return json({ok:true},200,{"Set-Cookie":expiredCookie()});
}
function sanitizeContact(body,existing={}){
  const status=STATUSES.has(body.status)?body.status:(existing.status||"Nuevo");
  return {id:existing.id||crypto.randomUUID(),name:clean(body.name??existing.name,120),company:clean(body.company??existing.company,120),email:normalizeEmail(body.email??existing.email),phone:clean(body.phone??existing.phone,60),status,notes:clean(body.notes??existing.notes,1000),createdAt:existing.createdAt||new Date().toISOString()};
}
async function handleContacts(request,env){
  const resolved=await authRequired(request,env);let contacts=await getContacts(env,resolved.account.id);
  if(request.method==="GET")return json({contacts,session:{authenticated:true,email:resolved.account.email,trialEndsAt:resolved.account.trialEndsAt,...effectivePlan(resolved.account,contacts.length)}});
  const plan=effectivePlan(resolved.account,contacts.length);
  if(plan.effectivePlan==="free"&&contacts.length>=FREE_CONTACT_LIMIT)return json({error:"free_limit_reached",message:"Llegaste al límite Free de 100 contactos. Tus datos siguen intactos; necesitás Pro para agregar más."},409);
  const body=await parseJson(request);const contact=sanitizeContact(body);
  if(!contact.name)return json({error:"name_required",message:"El nombre es obligatorio."},400);
  contacts=[contact,...contacts];await env.LEADX_KV.put(CONTACT_KEY_PREFIX+resolved.account.id,JSON.stringify(contacts));
  return json({contact,usage:effectivePlan(resolved.account,contacts.length)},201);
}
async function handleContactItem(request,env,id){
  const resolved=await authRequired(request,env);let contacts=await getContacts(env,resolved.account.id);const index=contacts.findIndex(c=>c.id===id);
  if(index<0)return json({error:"not_found"},404);
  if(request.method==="DELETE"){contacts.splice(index,1);await env.LEADX_KV.put(CONTACT_KEY_PREFIX+resolved.account.id,JSON.stringify(contacts));return json({ok:true});}
  const body=await parseJson(request);const contact=sanitizeContact(body,contacts[index]);if(!contact.name)return json({error:"name_required"},400);
  contacts[index]=contact;await env.LEADX_KV.put(CONTACT_KEY_PREFIX+resolved.account.id,JSON.stringify(contacts));return json({contact});
}
async function handleUpgrade(request,env){
  const resolved=await authRequired(request,env);
  await env.LEADX_KV.put(UPGRADE_KEY_PREFIX+resolved.account.id,JSON.stringify({accountId:resolved.account.id,email:resolved.account.email,requestedAt:new Date().toISOString()}));
  return json({ok:true});
}
async function handleDeleteAccount(request,env){
  const resolved=await authRequired(request,env);
  await Promise.all([env.LEADX_KV.delete(CONTACT_KEY_PREFIX+resolved.account.id),env.LEADX_KV.delete(resolved.session.accountKey),env.LEADX_KV.delete(UPGRADE_KEY_PREFIX+resolved.account.id),env.LEADX_KV.delete(SESSION_KEY_PREFIX+resolved.token)]);
  return json({ok:true},200,{"Set-Cookie":expiredCookie()});
}
async function serveAsset(request,env){
  if(!env.ASSETS)return json({error:"static_assets_unavailable"},503);
  let response=await env.ASSETS.fetch(request);
  if(response.status===404)response=await env.ASSETS.fetch(new Request(new URL("/index.html",request.url),request));
  const headers=new Headers(response.headers);for(const [k,v] of Object.entries(securityHeaders()))headers.set(k,v);
  headers.set("Cache-Control",new URL(request.url).pathname.startsWith("/assets/")?"public, max-age=31536000, immutable":"no-cache");
  return new Response(response.body,{status:response.status,headers});
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(!sameOrigin(request,url))return json({error:"cross_origin_forbidden"},403,{"Vary":"Origin"});
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:securityHeaders({"Allow":"GET, POST, PATCH, DELETE, OPTIONS"})});
  try{
    if(url.pathname==="/api/health"&&request.method==="GET")return json({status:"ok",service:"leadx",version:RELEASE,free_contact_limit:FREE_CONTACT_LIMIT,trial_days:TRIAL_DAYS,checked_at:new Date().toISOString()});
    if(url.pathname==="/api/auth/session"&&request.method==="GET")return json(await publicSession(request,env));
    if(url.pathname==="/api/auth/signup"&&request.method==="POST")return await handleSignup(request,env);
    if(url.pathname==="/api/auth/login"&&request.method==="POST")return await handleLogin(request,env);
    if(url.pathname==="/api/auth/logout"&&request.method==="POST")return await handleLogout(request,env);
    if(url.pathname==="/api/contacts"&&(request.method==="GET"||request.method==="POST"))return await handleContacts(request,env);
    const match=url.pathname.match(/^\/api\/contacts\/([0-9a-f-]{36})$/);
    if(match&&(request.method==="PATCH"||request.method==="DELETE"))return await handleContactItem(request,env,match[1]);
    if(url.pathname==="/api/upgrade-interest"&&request.method==="POST")return await handleUpgrade(request,env);
    if(url.pathname==="/api/account"&&request.method==="DELETE")return await handleDeleteAccount(request,env);
    if(["/api/leads","/api/ingest","/api/admin/import","/api/metrics"].includes(url.pathname))return json({error:"retired_endpoint"},410);
    if(url.pathname.startsWith("/api/"))return json({error:"not_found"},404);
    return await serveAsset(request,env);
  }catch(reason){
    const status=Number(reason?.status)||500;
    return json({error:status===500?"internal_error":String(reason?.message||"request_failed"),message:status===500?"No se pudo completar la operación.":String(reason?.message||"No se pudo completar la operación.")},status);
  }
}};
