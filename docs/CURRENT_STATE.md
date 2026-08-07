# LeadX — estado operativo

Actualizado: 2026-08-07 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK
DEFAULT_BRANCH=main
PRE_RELEASE_MAIN_SHA=91672001c893815a1f31f9cfdd11b31a18a6968a
PR=23
PR_STATE=MERGED
PR_MERGE_SHA=3adde0dbeff46e6d012e848266113be22bd5def1
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
PRODUCTION_DEPLOY=PASS
PRODUCTION_DEPLOYED_GIT_SHA=27756c854a2719af42c683fff95faf66a70e25ab
ACTIVE_DEPLOYMENT_ID=2c092d39-38c7-404a-93d2-44979e88e2c6
ACTIVE_VERSION_ID=deff1f6a-4664-4c2e-a595-91ba91aeae52
ACTIVE_TRAFFIC=100
ACTIVE_JS_ASSET=/assets/index-C_HJKQA3.js
FREE_CONTACT_LIMIT=100
PUBLIC_SESSION_MODE=preview
DEMO=PUBLIC_SYNTHETIC_ONLY
LEGACY_KV_KEYS_PURGED=6
REMAINING_LEGACY_KV_KEYS=0
SCRAPING_DISCOVERY=REMOVED_FROM_ACTIVE_TREE
OLD_VERTICALS=REMOVED_FROM_ACTIVE_PRODUCT
GITHUB_RECONCILIATION=PASS
REDEPLOY_AFTER_MERGE=NO
```

## Producto público
LeadX es un CRM web genérico y liviano para ordenar contactos comerciales y mantener visible la próxima acción.

Modelo comercial vigente:
- demo pública abierta con datos 100% ficticios;
- registro/login por email y contraseña;
- workspace privado por usuario;
- CRUD de contactos, estados, próxima acción, notas, búsqueda, filtros y exportación CSV;
- plan Free permanente hasta 100 contactos;
- sin tarjeta y sin vencimiento;
- al alcanzar 100 contactos no se borra información: sólo se bloquea crear nuevos;
- Pro está presentado como siguiente capa comercial, sin billing integrado todavía.

Las verticales Fotomultas/Repuestos agrícolas, los datasets anteriores, scraping/discovery/radar, importadores y endpoints legacy fueron retirados del árbol activo. La historia Git no se reescribió.

## Arquitectura activa
```text
PUBLIC_BROWSER
  -> React/Vite landing + demo ficticia
  -> registro/login
  -> workspace privado
  -> /api/* Cloudflare Worker
  -> Workers KV aislado por user-id
```

## Seguridad activa
- PBKDF2-SHA256, 150.000 iteraciones y salt aleatorio.
- sesión aleatoria 256-bit almacenada por hash en KV con TTL 30 días.
- cookie HttpOnly + Secure + SameSite=Lax.
- rate-limit binding para auth/escrituras.
- CSP `frame-ancestors 'none'`.
- límite Free validado en backend.
- bootstrap público no puede quedar bloqueado indefinidamente: sesión aborta a los 3 s y degrada a preview; otras llamadas API tienen timeout finito.

## Validación pre-release y PR
```text
CI_RUN=31190348835
CI_JOB=92905314348
CANDIDATE_HEAD=bbca1657f81bb7412e801f6dc9ad335d5821b715
PUBLIC_PRODUCT_TESTS=13/13
BUILD=PASS
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
TARGETED_BOOTSTRAP_HANG_TEST=PASS
FINAL_PR_CI_RUN=31191155803
FINAL_PR_HEAD=c004de29711f5725e6dd2726e9b8629dd736a2dc
FINAL_PR_CI=success
```

## Release Workers-first
```text
RELEASE_RUN=31190568927
RELEASE_JOB=92906030054
DEPLOY_SOURCE_SHA=27756c854a2719af42c683fff95faf66a70e25ab
PREVIOUS_VERSION_ID=8194e500-d692-40ef-acb6-cbfdda9e9b4e
NEW_DEPLOYMENT_ID=2c092d39-38c7-404a-93d2-44979e88e2c6
NEW_VERSION_ID=deff1f6a-4664-4c2e-a595-91ba91aeae52
RUNTIME_PROPAGATION_READY=PASS
ASSET_PROPAGATION_READY=PASS
PRE_PURGE_BROWSER_DESKTOP_MOBILE=2/2_PASS
LEGACY_KV_KEYS_BEFORE=6
LEGACY_KV_KEYS_PURGED=6
KV_AFTER=0
WORKFLOW_CONCLUSION=failure
WORKFLOW_FAILURE_SCOPE=single immediate HTTP assertion after successful purge
ROLLBACK_AFTER_PURGE=NO
```

El workflow de release terminó rojo por una aserción HTTP inmediata después del purge. No hubo rollback en ese tramo. El Worker nuevo permaneció activo y se verificó luego de forma independiente.

## Verificación productiva independiente post-release
```text
VERIFY_RUN=31190922275
VERIFY_JOB=92907210684
VERIFY_SOURCE_SHA=238af9d0c4b64f3067ce6c3f3d6184aba7018595
VERIFY_MODE=READ_ONLY
RUN_CONCLUSION=success
ACTIVE_DEPLOYMENT_ID=2c092d39-38c7-404a-93d2-44979e88e2c6
ACTIVE_VERSION_ID=deff1f6a-4664-4c2e-a595-91ba91aeae52
ACTIVE_TRAFFIC=100
REMAINING_LEGACY_KV_KEYS=0
HEALTH=PASS
SESSION_PREVIEW=PASS
EXACT_JS_ASSET=PASS
BROWSER_DESKTOP_MOBILE=2/2_PASS
POST_RELEASE_ARTIFACT_ID=8998788961
POST_RELEASE_ARTIFACT_DIGEST=sha256:1b47e725b4f55fdb11ca8ae6cbacfb6aa34ac2c6a5cd7f67bb143a61a29ce057
```

## Incidentes cerrados
1. Parser del schema de deployments Cloudflare incompatible: corregido antes de deploy.
2. Race de propagación de runtime: corregido con readiness polling; rollback previo exitoso.
3. Race de assets estáticos: corregido con fingerprint gate; rollback previo exitoso.
4. Bootstrap React bloqueado por session fetch sin timeout: reproducido, corregido y probado con sesión deliberadamente colgada.
5. Aserción inmediata post-purge falló, pero el estado productivo posterior fue verificado por workflow read-only completo: fallo del gate temporal, no del producto.

## Riesgos abiertos
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera de este piloto.
- Pro no tiene billing integrado todavía.
- No hay recuperación de contraseña ni verificación de email todavía.
- `npm ci` mantiene 1 vulnerabilidad moderada preexistente; instalar Playwright temporalmente para CI muestra vulnerabilidades transitorias adicionales que no forman parte del bundle productivo.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=OPERATE_PUBLIC_PILOT_AND_COLLECT_COMMERCIAL_FEEDBACK
```
