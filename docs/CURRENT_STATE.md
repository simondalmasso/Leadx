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
BASE_DESIGN_HEAD=793c07a246ae54260a64551f0f2e5d5431cfe033
RELEASE_STATUS=CANDIDATE_BUILDING
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
FREE_CONTACT_LIMIT=100
DEMO=PUBLIC_SYNTHETIC_ONLY
CURRENT_DATA=DISCARD_AUTHORIZED
SCRAPING_DISCOVERY=REMOVAL_AUTHORIZED
PRODUCTION_DEPLOY=PENDING
```

## Decisión vigente
LeadX deja de ser un CRM sectorial. Se eliminan del producto activo las verticales anteriores, datos actuales, scraping/discovery/radar e importación privada. El producto pasa a ser un SaaS genérico público.

Modelo comercial inspirado en el patrón freemium de Frambuesa, sin copiar su producto ni su diseño:
- Free permanente;
- sin tarjeta y sin vencimiento;
- límite por escala: 100 contactos;
- al superar el límite no se borra información;
- Pro quita límites y agregará funciones de crecimiento;
- cobro de Pro todavía no integrado en este hito.

## Arquitectura candidata
```text
PUBLIC_BROWSER
  -> React/Vite landing + demo ficticia
  -> registro/login
  -> workspace privado
  -> /api/* Cloudflare Worker
  -> Workers KV por user-id
```

## Seguridad candidata
- PBKDF2-SHA256, 150.000 iteraciones.
- sesión aleatoria 256-bit en KV con TTL 30 días.
- cookie HttpOnly + Secure + SameSite=Lax.
- rate-limit binding para auth/escrituras.
- CSP `frame-ancestors 'none'`.
- límite Free validado en backend.

## Release gate
No declarar público hasta que el PR tenga CI verde y el workflow Workers-first registre deploy/version IDs, smoke HTTP + browser PASS, purge legacy KV y smoke post-purge PASS.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=CREATE_CANDIDATE_COMMIT_OPEN_PR_RUN_CI_THEN_TRIGGER_SINGLE_WORKERS_FIRST_RELEASE
```
