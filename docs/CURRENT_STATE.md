# LeadX — estado operativo

Actualizado: 2026-08-07 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK
DEFAULT_BRANCH=main
SOURCE_MERGE_SHA=7749462e5ec990f0c924dc4108d7ea842691da64
RECONCILIATION_PR=24
RECONCILIATION_PR_STATE=MERGED
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
PRODUCTION_DEPLOY=PASS
PRODUCTION_DEPLOYED_GIT_SHA=8bc76173e4d90e60445f99ec56c52caabae9be6e
ACTIVE_DEPLOYMENT_ID=1e076a5e-b3b9-4c3f-a087-09100bdb51f3
ACTIVE_VERSION_ID=e06c6606-6fdc-4363-a9a4-7915ffc7a787
ACTIVE_TRAFFIC=100
ACTIVE_JS_ASSET=/assets/index-TYa2Tc_i.js
FREE_CUSTOMER_LIMIT=100
PUBLIC_SESSION_MODE=preview
DEMO=PUBLIC_SYNTHETIC_ONLY
REMAINING_LEGACY_KV_KEYS=0
SCRAPING_DISCOVERY=REMOVED_FROM_ACTIVE_TREE
OLD_VERTICALS=REMOVED_FROM_ACTIVE_PRODUCT
WORKERS_FIRST=YES
GITHUB_RECONCILIATION=PASS
REDEPLOY_AFTER_MERGE=NO
```

## Producto público
LeadX es un CRM web genérico y liviano. La propuesta pública habla de **clientes**: `Tus clientes. En orden.`

Modelo comercial vigente:
- demo pública abierta con datos 100% ficticios;
- registro/login por email y contraseña;
- workspace privado por usuario;
- CRUD interno de contactos, estados, próxima acción, notas, búsqueda, filtros y exportación CSV;
- plan Free permanente hasta 100 clientes/contactos almacenados;
- sin tarjeta y sin vencimiento;
- al alcanzar el límite no se borra información: sólo se bloquea crear nuevos registros;
- Pro está presentado como siguiente capa comercial, sin billing integrado todavía.

Las verticales Fotomultas/Repuestos agrícolas, datasets anteriores, scraping/discovery/radar, importadores y endpoints legacy están fuera del árbol activo.

## Autenticación — hotfix productivo
El registro público inicialmente devolvía Cloudflare Worker exception 1101. El login de usuario inexistente respondía normalmente, por lo que se aisló el fallo al cálculo de contraseña durante registro.

Corrección desplegada:
```text
PASSWORD_KDF=PBKDF2-SHA256
PASSWORD_KDF_ITERATIONS=10000
PASSWORD_SALT=random_per_user
SESSION_TOKEN=random_256_bit
SESSION_TTL=30_days
COOKIE=HttpOnly+Secure+SameSite_Lax
AUTH_RATE_LIMIT=enabled
PUBLIC_SESSION_BOOTSTRAP_TIMEOUT_MS=3000
```

La reducción del costo PBKDF2 fue necesaria para mantener el registro dentro del presupuesto de CPU del Worker. Es adecuada para este piloto operativo, pero queda como deuda de seguridad revisar una arquitectura/KDF más fuerte antes de escalar exposición o valor de cuentas.

## Validación productiva final
```text
RELEASE_WORKFLOW=LeadX Public SaaS Workers-first Release
RELEASE_RUN=31196841214
RELEASE_JOB=92927017652
RELEASE_SOURCE_SHA=8bc76173e4d90e60445f99ec56c52caabae9be6e
WORKFLOW_CONCLUSION=success
PUBLIC_PRODUCT_TESTS=14/14
BUILD=PASS
TYPECHECK=PASS
WORKER_SYNTAX=PASS
WRANGLER_DRY_RUN=PASS
NEW_DEPLOYMENT_ID=1e076a5e-b3b9-4c3f-a087-09100bdb51f3
NEW_VERSION_ID=e06c6606-6fdc-4363-a9a4-7915ffc7a787
RUNTIME_PROPAGATION_READY=PASS
PUBLIC_ASSET_PROPAGATION_READY=PASS
DESKTOP_BROWSER_SMOKE=PASS
MOBILE_BROWSER_SMOKE=PASS
PRE_PURGE_PRODUCTION_SMOKE=PASS
LEGACY_KV_KEYS_BEFORE=0
REMAINING_LEGACY_KV_KEYS=0
POST_PURGE_SMOKE=PASS
PRODUCTION_RELEASE=PASS
RELEASE_ARTIFACT_ID=9001176118
RELEASE_ARTIFACT_DIGEST=sha256:ab56287d87783ce9a3924ab6a88557cfd4dc357ff4e0c17ba7364c64f1362a47
```

## Cuenta del propietario — verificación redactada
No se documenta email ni contraseña.
```text
OWNER_ACCOUNT_REGISTRATION=PASS
OWNER_ACCOUNT_REGISTER_HTTP=201
OWNER_LOGIN=PASS
OWNER_LOGIN_HTTP=200
OWNER_SESSION=PASS
OWNER_SESSION_MODE=workspace
OWNER_LOGOUT=PASS
OWNER_LOGOUT_HTTP=200
```

## Copy público verificado
```text
PUBLIC_TITLE=LeadX — Tus clientes, en orden
PUBLIC_HERO=Tus clientes. En orden.
FREE_COPY=Gratis hasta 100 clientes
OLD_TUS_CONTACTOS_TITLE_PRESENT=NO
```

## GitHub reconciliado
```text
PR=24
PR_TITLE=Fix public auth and client-facing copy
PR_HEAD=07fae2c4ff74c3a268c3373db7ab48ae5fae4b4b
PR_CI_RUN=31197112414
PR_CI_JOB=92927950407
PR_CI_CONCLUSION=success
PR_MERGED=YES
PR_MERGE_SHA=7749462e5ec990f0c924dc4108d7ea842691da64
PRODUCTION_REDEPLOY_FROM_MAIN=NO
```

## Incidentes cerrados del hotfix
1. Registro 1101 por costo PBKDF2: corregido.
2. Smoke recargaba antes del timeout de bootstrap: corregido.
3. `isVisible({timeout})` muestreaba en vez de esperar: reemplazado por `waitFor`.
4. Propagación regional de assets produjo HTML viejo temporalmente en un POP: gate ampliado para esperar propagación real sin relajar expectativas funcionales.
5. Intentos fallidos previos hicieron rollback correctamente; el release final concluyó PASS.

## Riesgos abiertos
- PBKDF2 a 10.000 iteraciones es una concesión del piloto por CPU; revisar antes de escalar.
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera de este piloto.
- Pro no tiene billing integrado todavía.
- No hay recuperación de contraseña ni verificación de email todavía.
- `npm ci` mantiene 1 vulnerabilidad moderada preexistente.

## Decisiones vigentes
- Workers-first: Cloudflare se despliega y verifica antes de reconciliar GitHub.
- No volver a introducir verticales sectoriales ni scraping en el producto activo sin decisión explícita nueva.
- No documentar valores de secretos ni contraseñas.
- La demo pública usa únicamente datos sintéticos.
- El lenguaje comercial principal es `clientes`; el modelo técnico interno puede conservar `contacts/contactos` para evitar migraciones innecesarias.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=OPERATE_PUBLIC_PILOT_AND_COLLECT_COMMERCIAL_FEEDBACK
```
