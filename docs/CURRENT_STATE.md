# LeadX — estado operativo

Actualizado: 2026-08-07 17:51 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK_V2
OPERATING_LAYER=ACTION_QUEUE_V1
NORTH_STAR=CONTACT → SIGNAL → NEXT ACTION
DEFAULT_BRANCH=main
PRODUCT_RECONCILIATION_PR=29
PRODUCT_RECONCILIATION_MERGE_SHA=fc47d7754b4b79becaade05b64885e4605fa506e
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
PRODUCTION_DEPLOY=PASS
PRODUCTION_RELEASE_SOURCE_SHA=54e0acca207e9b2ce7eda7e7e76bc0d3f4ae9c83
ACTIVE_DEPLOYMENT_ID=4cb1c135-b528-4eda-a1f7-db2e546efbb9
ACTIVE_VERSION_ID=11335216-05a7-4238-8a60-fd7f1888b5f7
ACTIVE_TRAFFIC=100
ACTIVE_JS_ASSET=/assets/index-CcL4P5U0.js
FREE_CUSTOMER_LIMIT=100
PUBLIC_SESSION_MODE=preview
DEMO=PUBLIC_SYNTHETIC_ONLY
REMAINING_LEGACY_KV_KEYS=0
SCRAPING_DISCOVERY=REMOVED_FROM_ACTIVE_TREE
OLD_VERTICALS=REMOVED_FROM_ACTIVE_PRODUCT
WORKERS_FIRST=YES
GITHUB_RECONCILIATION=PASS
REDEPLOY_AFTER_MAIN_MERGE=NO
```

## Último hito completado — Action Queue V1
Se tomó el hallazgo de mayor retorno del benchmark externo sin copiar un CRM completo ni introducir arquitectura innecesaria: convertir la lista existente en una cola operativa que responda **quién requiere atención y qué falta hacer**.

Implementado sobre datos que LeadX ya tenía (`status`, `next_action`, `updated_at`), sin migración:
- vista inicial `Pendientes`;
- vista `Sin próxima` para relaciones activas sin próxima acción definida;
- vista `Clientes`;
- vista `Todos`;
- orden `Prioridad de acción` explicable: primero pendientes sin `next_action`, luego la relación menos recientemente actualizada, luego nombre;
- razón operativa visible por fila (`Sin próxima acción`, `Resolver primer contacto`, `Seguimiento pendiente`, `Oportunidad calificada`, `Propuesta abierta`);
- KPI strip `Contactos / Pendientes / Sin próxima / Clientes`;
- columna de metadata `Actividad` basada en `updated_at`;
- búsqueda y filtro por estado operan dentro de la vista seleccionada;
- demo pública sintética incluye deliberadamente 2 registros sin próxima acción para hacer visible el valor del patrón;
- controles responsive con targets táctiles >=44px.

Deliberadamente NO implementado todavía:
```text
OPAQUE_SCORING=NO
AI_SCORING=NO
AUTOMATIONS=NO
NEW_BACKEND_ENTITY=NO
NEXT_ACTION_DUE_DATE=NO
DATA_MIGRATION=NO
BACKEND_CHANGE=NO
API_CHANGE=NO
AUTH_CHANGE=NO
KV_SCHEMA_CHANGE=NO
```

## Validación del candidato
```text
CANDIDATE_BRANCH=feat/action-queue-v1
CANDIDATE_SHA=fd14d20b355962cea59087a1afd25e34aebf8be3
PR=29
PR_STATE=MERGED_AFTER_PRODUCTION_PASS
CI_RUN=31217065306
CI_JOB=92992950809
CI_CONCLUSION=success
BUILD=PASS
PUBLIC_PRODUCT_TESTS=22/22
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
MULTI_BREAKPOINT_VISUAL_QA=14/14_PASS
CI_ARTIFACT_ID=9008950736
CI_ARTIFACT_DIGEST=sha256:b614600189c531bfc999b77c24a684c52181269af700891ddd0651e0c23b94e0
```

Breakpoints renderizados y revisados:
```text
1440x1000=PASS
1024x768=PASS
768x1024=PASS
390x844=PASS
360x800=PASS
320x568=PASS
```

También continúan cubiertos por QA: workspace con contenido largo, editor mobile/320, empty workspace, Free 100/100, network error + retry, loading, auth, touch targets y ausencia de overflow horizontal.

## Release Workers-first Action Queue V1
La promoción se hizo desde un branch exacto del candidato hacia la rama operativa `feat/public-freemium-v1`; `main` no se tocó hasta terminar producción.

```text
RELEASE_PROMOTION_PR=30
RELEASE_PROMOTION_PR_STATE=MERGED
RELEASE_SOURCE_SHA=54e0acca207e9b2ce7eda7e7e76bc0d3f4ae9c83
RELEASE_WORKFLOW=LeadX Public SaaS Workers-first Release
RELEASE_RUN=31217418005
RELEASE_JOB=92994077164
RELEASE_CONCLUSION=success
DEPLOY_ATTEMPT=1
PREVIOUS_DEPLOYMENT_ID=2b76bd77-9105-4388-aca5-8fa16818bc4e
PREVIOUS_VERSION_ID=bc7b126b-c408-4de6-96cd-2484b2c4f30f
NEW_DEPLOYMENT_ID=4cb1c135-b528-4eda-a1f7-db2e546efbb9
NEW_VERSION_ID=11335216-05a7-4238-8a60-fd7f1888b5f7
RUNTIME_PROPAGATION_ATTEMPT=1
RUNTIME_PROPAGATION_READY=PASS
EXPECTED_JS_ASSET=/assets/index-CcL4P5U0.js
PUBLIC_ASSET_PROPAGATION_ATTEMPT=3
PUBLIC_ASSET_PROPAGATION_READY=PASS
PRODUCTION_BROWSER_SMOKE=2/2_PASS
PRE_PURGE_PRODUCTION_SMOKE=PASS
LEGACY_KV_KEYS_BEFORE=0
LEGACY_KV_KEYS_PURGED=0
REMAINING_LEGACY_KV_KEYS=0
POST_PURGE_SMOKE=PASS
PRODUCTION_RELEASE=PASS
RELEASE_ARTIFACT_ID=9009073496
RELEASE_ARTIFACT_DIGEST=sha256:32eec042a958b688097b311cbe076fdebb9f3bee025ceff12677677520a90a66
```

No hubo rollback ni segundo deploy: el primer intento concluyó PASS.

## Verificación productiva independiente post-release
Ejecutada después del workflow y antes del merge a `main`:
```text
HEALTH_HTTP=200
SESSION_HTTP=200
HOME_HTTP=200
ACTIVE_ASSET_HTTP=200
HOME_EXPECTED_ASSET=PASS
BUNDLE_PENDIENTES_PRESENT=PASS
BUNDLE_SIN_PROXIMA_PRESENT=PASS
BUNDLE_PRIORIDAD_PRESENT=PASS
BUNDLE_LEGACY_TERMS_ABSENT=PASS
HEALTH_STATUS=ok
HEALTH_SERVICE=leadx
HEALTH_RELEASE=leadx-public-freemium-v1
HEALTH_FREE_CONTACT_LIMIT=100
SESSION_AUTHENTICATED=false
SESSION_MODE=preview
```

## GitHub reconciliado después de producción
```text
RECONCILIATION_PR=29
RECONCILIATION_HEAD=fd14d20b355962cea59087a1afd25e34aebf8be3
RECONCILIATION_MERGED=YES
RECONCILIATION_MERGE_SHA=fc47d7754b4b79becaade05b64885e4605fa506e
PRODUCTION_VALIDATED_BEFORE_MAIN_MERGE=YES
PRODUCTION_REDEPLOY_FROM_MAIN=NO
```

## Producto vigente
Flujo:
`landing → demo ficticia → register/login → workspace privado → Action Queue → contacto → estado → próxima acción → notas → search/filter → CSV → Free≤100 → Pro interest`.

Las vistas operativas son una capa de lectura sobre los contactos existentes; no alteran el aislamiento por usuario ni el modelo persistente. `Pendientes` incluye `Nuevo`, `Contactado`, `Calificado` y `Propuesta`. `Cliente` y `Pausado` no se mezclan con la cola activa.

## Contención funcional y de datos
No reintroducir sin decisión explícita:
`Fotomultas / Repuestos agrícolas / Agro / scraping / discovery / radar / verticales legacy`.

No hubo migración de datos, purge de datos válidos, cambio de esquema KV, modificación de auth ni nueva dependencia runtime. La demo continúa usando sólo datos sintéticos.

## Decisiones vigentes
- Workers-first es obligatorio.
- No mergear a `main` candidatos que requieran validación productiva antes del PASS de producción.
- No ejecutar un segundo deploy después de un fallo sin identificar la causa.
- Priorizar lógica explicable y útil sobre scoring opaco o IA decorativa.
- No agregar arquitectura/entidades nuevas mientras el mismo valor pueda obtenerse de campos existentes.
- El lenguaje comercial principal es `clientes`; `contacts/contactos` puede mantenerse internamente.
- No publicar datos reales, secretos, cookies ni credenciales en GitHub, CI, docs o screenshots.

## Riesgos abiertos preexistentes
- PBKDF2 a 10.000 iteraciones sigue siendo deuda de seguridad del piloto por presupuesto CPU del Worker.
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera del piloto.
- Pro no tiene billing integrado.
- No hay recuperación de contraseña ni verificación de email.
- `npm ci` mantiene 1 vulnerabilidad moderada preexistente.
- La instalación temporal de Playwright en CI puede reportar vulnerabilidades transitorias; no forma parte del bundle runtime.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=OPERATE_ACTION_QUEUE_V1_WITH_REAL_WORKSPACE_USAGE_AND_MEASURE_WHETHER_NEXT_ACTION_DUE_DATE_IS_NEEDED
```
