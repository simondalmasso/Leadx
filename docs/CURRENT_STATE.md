# LeadX — estado operativo

Actualizado: 2026-08-07 · America/Argentina/Cordoba.

## Cambio de producto autorizado

```text
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
OWNER_AUTHORIZED_PUBLIC_RELEASE=YES
OWNER_AUTHORIZED_LEGACY_DATA_DISCARD=YES
OWNER_AUTHORIZED_SCRAPING_REMOVAL=YES
PUBLIC_PREVIEW=OPEN_SYNTHETIC_ONLY
FREE_CONTACT_LIMIT=100
PRO_TRIAL_DAYS=14
FREE_PLAN_EXPIRY=NEVER
FREE_LIMIT_BEHAVIOR=KEEP_DATA_BLOCK_NEW_CONTACTS
BILLING_PROVIDER=NOT_IMPLEMENTED
PRO_COMMERCIAL_ACTIVATION=EARLY_ACCESS_REQUEST
```

LeadX deja de ser un CRM especializado por vertical. Fotomultas y Repuestos agrícolas se retiran del producto, junto con Radar/scraping/discovery e ingest legado.

## Arquitectura candidata

```text
FRONTEND=React_Vite_PUBLIC_LANDING_PLUS_CRM
RUNTIME=Cloudflare_Worker
STORAGE=Cloudflare_KV_MULTI_TENANT
AUTH=EMAIL_PASSWORD_PBKDF2_PLUS_SERVER_SESSION
SESSION_COOKIE=HttpOnly_Secure_SameSite_Lax
ACCOUNT_NAMESPACE=account:v1
CONTACT_NAMESPACE=contacts:v1
SESSION_NAMESPACE=session:v1
LEGACY_LEADS_KEY=leads:live_TO_BE_PURGED_POST_SMOKE
```

## Modelo comercial

Inspiración de mecánica, no copia visual ni textual: Free permanente con límites de escala, una prueba Pro y conservación de datos al volver a Free. LeadX adapta esa lógica a contactos.

```text
FREE=$0
FREE_CONTACTS=100
TRIAL_PRO=14_DAYS
PRO=UNLIMITED_CONTACTS_PLUS_EXPORT_TEAM_FEATURES
PRO_PAYMENT_RAIL=NOT_YET_CONNECTED
```

## Seguridad / aislamiento

- no se reutilizan datos productivos históricos en el preview;
- demo sólo contiene fixtures sintéticos embebidos;
- cada cuenta tiene su propio keyspace de contactos;
- contraseñas PBKDF2 SHA-256 con salt aleatorio y comparación endurecida;
- cookie de sesión HttpOnly + Secure;
- endpoints `/api/leads`, `/api/ingest`, `/api/admin/import` y `/api/metrics` quedan retirados;
- Radar, importadores y workflows de scraping se eliminan del árbol candidato.

## Release

```text
BRANCH=release/leadx-public-v1
BASE=feat/hovs-global-design-v1@793c07a246ae54260a64551f0f2e5d5431cfe033
DEPLOY=NOT_YET_EXECUTED
PRODUCTION_CHANGED=NO_AT_THIS_CHECKPOINT
LEGACY_KV_PURGE=NOT_YET_EXECUTED
```

## Próximo paso exacto

1. Publicar el candidato en la rama.
2. Exigir CI build + test + typecheck verde.
3. Crear una única señal de release que dispare el operador Workers-first una sola vez.
4. Verificar producción real, signup, contacto CRUD, aislamiento y endpoints legados retirados.
5. Eliminar `leads:live` sólo después del smoke del nuevo producto.
6. Reconciliar GitHub/Drive con version ID, deployment y smokes.
