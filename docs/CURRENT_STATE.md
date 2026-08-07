# LeadX — estado operativo

Actualizado: 2026-08-07 15:02 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK_V2
DEFAULT_BRANCH=main
PRODUCT_RECONCILIATION_MERGE_SHA=0aaa55d1f700877bc12ba4564f82bbaa161f6bea
RECONCILIATION_PR=27
RECONCILIATION_PR_STATE=MERGED
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
PRODUCTION_DEPLOY=PASS
PRODUCTION_RELEASE_SOURCE_SHA=a8fcd57ff6c448c039f47ca55c71fc9c2a4b100d
ACTIVE_DEPLOYMENT_ID=2b76bd77-9105-4388-aca5-8fa16818bc4e
ACTIVE_VERSION_ID=bc7b126b-c408-4de6-96cd-2484b2c4f30f
ACTIVE_TRAFFIC=100
ACTIVE_JS_ASSET=/assets/index-DOQzsCEp.js
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

## Producto vigente
LeadX es un CRM web genérico y liviano diseñado como una mesa de señales comerciales.

North star:
```text
CONTACT → SIGNAL → NEXT ACTION
```

Flujo conservado:
`landing → demo ficticia → register/login → workspace privado → contactos → estados → próxima acción → notas → search/filter → CSV → Free≤100 → Pro interest`.

La jerarquía de producto prioriza quién requiere atención y qué tiene que pasar después. `Próxima acción` tiene más peso que metadata histórica. Desktop funciona como ledger editorial y mobile como composición propia, no como desktop encogido.

## Signal Desk V2 — alcance entregado
- sistema de color semántico sobre neutrales cálidos, tinta y vermellón reservado a señal/acción;
- grotesca local/system sin dependencia remota;
- wordmark SVG oficial integrado;
- escala tipográfica, spacing, grid, rules, radius y motion coherentes;
- hero, demo, métricas, search/filtros, ledger, auth, editor, pricing, workspace y footer recompuestos bajo un mismo sistema;
- Free presentado como producto disponible; Pro como capa futura sin checkout ficticio;
- estados explícitos para boot, loading, empty, empty-search, network error/retry, form error, saving, notices, Free limit, disabled, auth failure, delete confirmation y Pro-interest success;
- focus-visible, dialogs semánticos, Escape, labels reales, color+texto, reduced-motion y targets táctiles >=44px.

## Validación pre-release final
El candidato original fue corregido después de un primer QA visual que bloqueó 3 hallazgos y luego quedó verde. El último SHA de reconciliación incluye además una corrección acotada del smoke productivo para esperar una señal V2 específica durante propagación regional.

```text
FINAL_CANDIDATE_SHA=e41c7ff19f8ffda48d9df46083b409db1616dd70
PR_CI_RUN=31204230669
PR_CI_JOB=92951266379
PR_CI_CONCLUSION=success
BUILD=PASS
PUBLIC_PRODUCT_TESTS=20/20
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
MULTI_BREAKPOINT_VISUAL_QA=PASS
CI_ARTIFACT_ID=9004113245
CI_ARTIFACT_DIGEST=sha256:fa82241f27e8833e306cd793882d17e9d3849e75c829a729778184e56e50eb34
```

Breakpoints validados:
```text
1440x1000=PASS
1024x768=PASS
768x1024=PASS
390x844=PASS
360x800=PASS
320x568=PASS
```

También verificados con fixtures sintéticos: texto largo, workspace desktop/mobile, editor mobile/320, workspace vacío, Free 100/100, error de red + retry, loading, auth, touch targets y ausencia de overflow horizontal.

## Release Workers-first final
```text
RELEASE_WORKFLOW=LeadX Public SaaS Workers-first Release
RELEASE_RUN=31204523025
RELEASE_JOB=92952199298
RELEASE_SOURCE_SHA=a8fcd57ff6c448c039f47ca55c71fc9c2a4b100d
WORKFLOW_CONCLUSION=success
PREVIOUS_VERSION_ID=d50f96d7-1aac-46e9-9e0b-e1a7c279c775
NEW_DEPLOYMENT_ID=2b76bd77-9105-4388-aca5-8fa16818bc4e
NEW_VERSION_ID=bc7b126b-c408-4de6-96cd-2484b2c4f30f
RUNTIME_PROPAGATION_ATTEMPT=1
RUNTIME_PROPAGATION_READY=PASS
EXPECTED_JS_ASSET=/assets/index-DOQzsCEp.js
PUBLIC_ASSET_PROPAGATION_ATTEMPT=5
PUBLIC_ASSET_PROPAGATION_READY=PASS
DESKTOP_BROWSER_SMOKE=PASS
MOBILE_BROWSER_SMOKE=PASS
PRE_PURGE_PRODUCTION_SMOKE=PASS
LEGACY_KV_KEYS_BEFORE=0
LEGACY_KV_KEYS_PURGED=0
REMAINING_LEGACY_KV_KEYS=0
POST_PURGE_SMOKE=PASS
PRODUCTION_RELEASE=PASS
RELEASE_ARTIFACT_ID=9004210857
RELEASE_ARTIFACT_DIGEST=sha256:dea566835a2875eb073e2f7360970f580c6b0fd4a1fa2e1c162360584fa63050
```

El smoke desktop requirió 1 intento en el release final y el mobile 7 intentos; esto confirmó que la espera V2-específica era necesaria durante propagación regional y evitó aceptar HTML viejo como superficie lista.

## Verificación productiva independiente post-release
Ejecutada después del workflow y antes del merge a `main`:
```text
HEALTH_HTTP=200
HEALTH_STATUS=ok
HEALTH_SERVICE=leadx
HEALTH_RELEASE=leadx-public-freemium-v1
HEALTH_FREE_CONTACT_LIMIT=100
SESSION_HTTP=200
SESSION_AUTHENTICATED=false
SESSION_MODE=preview
HOME_HTTP=200
HOME_EXPECTED_V2_ASSET=PASS
HOME_LEADX_PRESENT=PASS
HOME_LEGACY_TERMS_ABSENT=PASS
```

## Incidentes del release V2
### 1. Trigger inicial sobre release viejo
Se creó por error un trigger `release(public): Signal Desk V2` antes de promover el árbol V2 a la rama de release.

```text
RUN=31203579429
JOB=92949132142
RESULT=success
SCOPE=REDEPLOY_PREVIOUS_RELEASE_ONLY
V2_DEPLOYED=NO
REGRESSION_OBSERVED=NO
```

La causa fue identificada inmediatamente. No se encadenó otro deploy mientras ese ciclo estaba en curso. El trigger se eliminó después con un commit no-release.

### 2. Primer deploy real V2 — rollback automático
```text
RUN=31203878422
JOB=92950106131
SOURCE_SHA=10a90a722f4189f86519bb748065ff073ee7992b
NEW_DEPLOYMENT_ID=74280a9b-a165-4b2d-add7-e9e428fff867
NEW_VERSION_ID=ea79d691-bb9f-4216-9182-01cb82f63f4d
RUNTIME_PROPAGATION_READY=PASS
PUBLIC_ASSET_PROPAGATION_READY=PASS
MOBILE_SMOKE=PASS
DESKTOP_SMOKE=FAIL_FALSE_NEGATIVE
ROLLBACK_REQUESTED=YES
ROLLBACK_VERSION=d50f96d7-1aac-46e9-9e0b-e1a7c279c775
ROLLBACK_STATE=completed
FAILURE_ARTIFACT_ID=9003948172
FAILURE_ARTIFACT_DIGEST=sha256:af77a4f5a89d1f9ed2837c332d25f7742707528b8f72bbe3a5254673e5292226
```

Causa verificada: `openPublicSurface()` podía declarar la UI lista usando título/heading compartidos por release viejo y V2. En un POP todavía propagando HTML viejo, el siguiente assert V2-específico `.leadx-wordmark` fallaba. El producto V2 sí contenía ese wordmark. Se corrigió únicamente el readiness para exigir `.leadx-wordmark` antes de declarar ready; no se cambió backend, API, KV, auth ni comportamiento del producto.

No se ejecutó el segundo deploy hasta identificar esta causa y volver a pasar el CI completo.

## GitHub reconciliado después de producción
```text
RELEASE_PROMOTION_PR_1=26
RELEASE_PROMOTION_PR_1_MERGE_SHA=10a90a722f4189f86519bb748065ff073ee7992b
RELEASE_PROMOTION_PR_2=28
RELEASE_PROMOTION_PR_2_MERGE_SHA=a8fcd57ff6c448c039f47ca55c71fc9c2a4b100d
RECONCILIATION_PR=27
RECONCILIATION_HEAD=e41c7ff19f8ffda48d9df46083b409db1616dd70
RECONCILIATION_MERGED=YES
RECONCILIATION_MERGE_SHA=0aaa55d1f700877bc12ba4564f82bbaa161f6bea
PRODUCTION_VALIDATED_BEFORE_MAIN_MERGE=YES
PRODUCTION_REDEPLOY_FROM_MAIN=NO
```

PR #25 quedó supersedido por la línea limpia de reconciliación y no debe mergearse.

## Contención funcional y de datos
No reintroducir:
`Fotomultas / Repuestos agrícolas / Agro / scraping / discovery / radar / verticales legacy`.

No hubo migración de datos ni modificación deliberada de datos productivos en este release. El gate confirmó `LEGACY_KV_KEYS_BEFORE=0` y `REMAINING_LEGACY_KV_KEYS=0`.

## Riesgos abiertos preexistentes
- PBKDF2 a 10.000 iteraciones sigue siendo deuda de seguridad del piloto por presupuesto CPU del Worker.
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera del piloto.
- Pro no tiene billing integrado.
- No hay recuperación de contraseña ni verificación de email.
- `npm ci` mantiene 1 vulnerabilidad moderada preexistente.
- La instalación temporal de Playwright en CI reporta vulnerabilidades transitorias adicionales; no forman parte del bundle runtime del producto.

## Decisiones vigentes
- Workers-first sigue siendo obligatorio.
- No mergear a `main` candidatos que requieren validación productiva antes del PASS de producción.
- No ejecutar un segundo deploy después de un fallo sin causa identificada.
- No publicar datos reales, secretos, cookies ni credenciales en GitHub, CI, docs o screenshots.
- La demo pública usa únicamente datos sintéticos.
- El lenguaje comercial principal es `clientes`; el modelo técnico puede conservar `contacts/contactos` internamente.
- No copiar obras o layouts existentes de HOVS, mymind, Semplice o Carbonmade.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=OPERATE_SIGNAL_DESK_V2_IN_PUBLIC_PILOT_AND_COLLECT_COMMERCIAL_FEEDBACK
```
