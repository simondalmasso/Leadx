# LeadX — estado operativo

Actualizado: 2026-08-07 · America/Argentina/Cordoba.

## Estado
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK
DEFAULT_BRANCH=main
VERIFIED_MAIN_SHA=91672001c893815a1f31f9cfdd11b31a18a6968a
WORKING_BRANCH=feat/public-freemium-v1
PR=23
PR_STATE=DRAFT_OPEN
BASE_DESIGN_HEAD=793c07a246ae54260a64551f0f2e5d5431cfe033
CANDIDATE_SOURCE_SHA=1a4b83869e2f26226b850fb5c584d3c02ca2da2a
CANDIDATE_CI_RUN=31188352572
CANDIDATE_CI_JOB=92898534266
CANDIDATE_CI=PASS
RELEASE_STATUS=AUTHORIZED_WORKERS_FIRST_RETRY_2_RUNNING_OR_PENDING
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
FREE_CONTACT_LIMIT=100
DEMO=PUBLIC_SYNTHETIC_ONLY
CURRENT_DATA=DISCARD_AUTHORIZED
SCRAPING_DISCOVERY=REMOVED_FROM_ACTIVE_TREE
PRODUCTION_DEPLOY=PENDING_VERIFICATION
```

## Decisión vigente
LeadX deja de ser un CRM sectorial. Se eliminaron del árbol activo las verticales anteriores, datasets, scraping/discovery/radar, importadores, artefactos de trabajo y workflows asociados. La historia Git no se reescribe.

Modelo comercial inspirado en el patrón freemium de Frambuesa, sin copiar su producto ni su diseño:
- Free permanente;
- sin tarjeta y sin vencimiento;
- límite server-side de 100 contactos;
- al alcanzar el límite no se borra información;
- se bloquea únicamente la creación de nuevos contactos;
- Pro quita límites y agregará funciones de crecimiento;
- cobro de Pro todavía no integrado en este hito.

## Arquitectura candidata
```text
PUBLIC_BROWSER
  -> React/Vite landing + demo ficticia
  -> registro/login
  -> workspace privado
  -> /api/* Cloudflare Worker
  -> Workers KV aislado por user-id
```

## Seguridad candidata
- PBKDF2-SHA256, 150.000 iteraciones y salt aleatorio.
- sesión aleatoria 256-bit almacenada por hash en KV con TTL 30 días.
- cookie HttpOnly + Secure + SameSite=Lax.
- rate-limit binding para auth/escrituras.
- CSP `frame-ancestors 'none'`.
- límite Free validado en backend.

## Gate pre-release ejecutado
```text
RUN_ID=31188352572
JOB_ID=92898534266
HEAD=1a4b83869e2f26226b850fb5c584d3c02ca2da2a
INSTALL_FROZEN=PASS
BUILD=PASS
PUBLIC_PRODUCT_TESTS=PASS
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
```

## Incidente de release y corrección
```text
FAILED_RELEASE_RUN=31188128602
FAILED_RELEASE_JOB=92897792944
FIRST_CAUSAL_ERROR=Cloudflare deployments response parsed as .result[0] although current schema exposes .result.deployments
DEPLOY_ATTEMPTED=NO
PRODUCTION_CHANGED=NO
LEGACY_KV_PURGED=NO
FIX_COMMIT=1a4b83869e2f26226b850fb5c584d3c02ca2da2a
FIX=Normalize both supported Cloudflare deployment response shapes before reading deployment/version IDs
FIX_VALIDATION=CI_PASS
```

## Release gate
Este commit inicia el único reintento Workers-first después de identificar y corregir la causa anterior. No declarar público hasta registrar deployment/version anteriores y nuevos, 100% traffic, HTTP/browser smoke PASS, purge de KV legacy, cero keys legacy remanentes y smoke post-purge PASS. Si el smoke pre-purge falla, el workflow debe restaurar el version ID anterior.

## Riesgos conocidos del piloto
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera de este piloto.
- Pro no tiene billing integrado todavía.
- No hay recuperación de contraseña ni verificación de email todavía.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=VERIFY_WORKERS_FIRST_RETRY_2_AND_PRODUCTION_THEN_RECONCILE_GITHUB_AND_DRIVE
```
