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
CANDIDATE_SOURCE_SHA=75a566a35b49ca05976bdf127a2319f736358685
CANDIDATE_CI_RUN=31188848991
CANDIDATE_CI_JOB=92900212104
CANDIDATE_CI=PASS
RELEASE_STATUS=AUTHORIZED_WORKERS_FIRST_AFTER_SCHEMA_AND_PROPAGATION_FIXES
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
RUN_ID=31188848991
JOB_ID=92900212104
HEAD=75a566a35b49ca05976bdf127a2319f736358685
INSTALL_FROZEN=PASS
BUILD=PASS
PUBLIC_PRODUCT_TESTS=PASS
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
```

## Incidentes de release y correcciones
```text
INCIDENT_1_RUN=31188128602
INCIDENT_1_JOB=92897792944
INCIDENT_1_CAUSE=Cloudflare deployments response parsed as .result[0] although current schema exposes .result.deployments
INCIDENT_1_DEPLOY_ATTEMPTED=NO
INCIDENT_1_PRODUCTION_CHANGED=NO
INCIDENT_1_FIX=1a4b83869e2f26226b850fb5c584d3c02ca2da2a

INCIDENT_2_RUN=31188457557
INCIDENT_2_JOB=92898885449
INCIDENT_2_NEW_DEPLOYMENT_ID=ddb6f1f2-6437-4085-81c8-c5bae895d617
INCIDENT_2_NEW_VERSION_ID=5537b887-09c0-45c9-8f1f-02da3e16fbdb
INCIDENT_2_CAUSE=Production smoke executed immediately after control-plane activation and observed the previous runtime during propagation
INCIDENT_2_OBSERVED_HEALTH_VERSION=leadx-multiline-v1
INCIDENT_2_OBSERVED_SESSION_MODE=demo
INCIDENT_2_ROLLBACK=PASS
INCIDENT_2_RESTORED_VERSION_ID=8194e500-d692-40ef-acb6-cbfdda9e9b4e
INCIDENT_2_LEGACY_KV_PURGED=NO
INCIDENT_2_FIX=75a566a35b49ca05976bdf127a2319f736358685
INCIDENT_2_FIX_DETAIL=Poll exact public release readiness before browser smoke; keep all release assertions unchanged
```

## Release gate
Este commit autoriza un nuevo Workers-first sólo porque las dos causas observadas fueron identificadas, corregidas y validadas en CI. No declarar público hasta registrar deployment/version nuevos, 100% traffic, readiness exacta, browser smoke PASS, purge de las 6 claves KV legacy observadas, cero claves legacy remanentes y smoke post-purge PASS. Si el smoke pre-purge falla, restaurar el version ID anterior y no purgar KV.

## Riesgos conocidos del piloto
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera de este piloto.
- Pro no tiene billing integrado todavía.
- No hay recuperación de contraseña ni verificación de email todavía.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=EXECUTE_AND_VERIFY_WORKERS_FIRST_PUBLIC_RELEASE_THEN_RECONCILE_MAIN_PR_DRIVE
```
