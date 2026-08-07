# LeadX — estado operativo

Actualizado: 2026-08-07 · America/Argentina/Cordoba.

Este archivo registra el punto de toma operativo de la rama de rediseño. Verificar siempre estado externo antes de cualquier deploy, merge o modificación productiva.

## Estado resumido

```text
PROJECT=LeadX
DEFAULT_BRANCH=main
VERIFIED_MAIN_SHA=91672001c893815a1f31f9cfdd11b31a18a6968a
WORKING_BRANCH=feat/hovs-global-design-v1
PR=21
PR_STATE=DRAFT_OPEN
PR_BASE=main
LAST_PRODUCT_HEAD_VALIDATED=081c4b7d4caa5d0243b146c5f194d248cbc864a0
DESIGN_DIRECTION=SIGNAL_DESK
IMPLEMENTATION_STATUS=CODE_COMPLETE_CI_PASS_VISUAL_QA_PASS
DESKTOP_VISUAL_QA=PASS_NON_PRODUCTION
MOBILE_VISUAL_QA=PASS_NON_PRODUCTION
SYNTHETIC_REAL_MODE_QA=PASS
PRODUCTION_VISUAL_QA=NOT_EXECUTED
DEPLOY_EXECUTED=NO
MERGE_EXECUTED=NO
PRODUCTION_CHANGED=NO
CLOUDFLARE_CHANGED=NO
KV_CHANGED=NO
REAL_DATA_CHANGED=NO
```

## Dirección creativa

LeadX se replanteó como una mesa editorial de señales comerciales y no como un dashboard SaaS. La decisión funcional central es **a quién prestar atención ahora**.

```text
WHY=REDUCE_COMMERCIAL_DECISION_NOISE
CONCEPT=SIGNAL_DESK
PAPER=#f2efe8
INK=#171714
SIGNAL=#f04d2f
REMOTE_FONT=NO
NEW_UI_DEPENDENCY=NO
```

Sistema implementado:

- fondo cálido tipo papel de trabajo;
- tinta casi negra y un único vermellón funcional;
- KPIs como banda editorial sin cards independientes;
- verticales como índice textual con señal activa;
- búsqueda convertida en comando visual primario;
- filtros y controles secundarios de menor peso visual;
- tabla desktop como ledger comercial;
- mobile como registros continuos separados por reglas;
- detalle como hoja lateral de lectura;
- estados demo/real explícitos;
- motion funcional con `prefers-reduced-motion` preservado;
- mark y wordmark alineados al mismo código cromático.

Documento de concepto: `docs/DESIGN_SIGNAL_DESK.md`.

## Alcance exacto

Archivos de producto modificados:

- `web/src/styles.css`
- `web/src/styles-multiline-base.css`
- `web/src/styles-multiline-table.css`
- `web/src/styles-multiline-responsive.css`
- `web/src/styles-contact-demo.css`
- `web/src/components/LeadTable.tsx` — sólo agrega una clase presentacional para dimensionar correctamente el ledger de 7 columnas de Repuestos agrícolas;
- `web/public/leadx-mark.svg`
- `web/public/leadx-wordmark.svg`

Gobernanza/evidencia:

- `.github/workflows/ui-product-ci.yml`
- `docs/DESIGN_SIGNAL_DESK.md`
- `docs/CURRENT_STATE.md`

No se modificaron `App.tsx`, worker, APIs, sesión, autenticación, KV, scoring, filtros, importación ni datos.

## Validación técnica final

```text
WORKFLOW=LeadX UI Product CI
RUN_ID=31178481661
JOB_ID=92865842250
HEAD=081c4b7d4caa5d0243b146c5f194d248cbc864a0
RUN_CONCLUSION=success
INSTALL_FROZEN=PASS
BUILD=PASS
TEST=PASS
TYPECHECK=PASS
DESIGN_CONTAINMENT=PASS
STATIC_PREVIEW_ARTIFACT_UPLOAD=PASS
ARTIFACT_ID=8993779264
ARTIFACT_SHA256=d1748a82f2d64b77fe91c995d05a52cbe973647bc51945a4ff8fbd16817e951b
BASELINE_COVERAGE=66/66
SECURITY_RUNTIME_TESTS=71/71
MULTI_LINEA=32/32
DEPLOY_ATTEMPTED=NO
```

El artefacto estático fue generado por el mismo run verde y usado para QA visual local sin conexión a producción ni acceso a datos reales.

## QA visual ejecutado

Superficies inspeccionadas mediante render real del bundle compilado:

```text
DESKTOP_1440_FOTOMULTAS_DEMO=PASS
DESKTOP_1440_REPUESTOS_DEMO=PASS
DESKTOP_1440_FILTER_DRAWER=PASS
DESKTOP_1440_LEAD_DETAIL=PASS
DESKTOP_1440_SYNTHETIC_REAL_MODE=PASS
DESKTOP_1024_REPUESTOS=PASS
MOBILE_390_FOTOMULTAS_DEMO=PASS
MOBILE_390_FILTER_SHEET=PASS
MOBILE_390_LEAD_DETAIL=PASS
MOBILE_390_LOGIN_SHEET=PASS
MOBILE_390_SYNTHETIC_REAL_REPUESTOS=PASS
MOBILE_320_FOTOMULTAS_DEMO=PASS
```

Mediciones:

```text
HORIZONTAL_OVERFLOW_1440=NO
HORIZONTAL_OVERFLOW_1024=NO
HORIZONTAL_OVERFLOW_390=NO
HORIZONTAL_OVERFLOW_320=NO
MOBILE_VISIBLE_INTERACTION_TARGETS_UNDER_44PX=0
MOBILE_LAST_FILTER_ACCESSIBLE_ABOVE_STICKY_ACTIONS=YES
```

La comprobación de targets fue realizada sobre los controles visibles del estado base en 390 y 320 px después del ajuste final. No equivale a una certificación WCAG completa ni a una auditoría con lector de pantalla.

## QA funcional ejecutado sobre el render

```text
INITIAL_DEMO_ROWS=12
SEARCH_TOMAS_RESULT_ROWS=1
SORT_NAME_FIRST_RESULT=Agustín_Ejemplo
FILTER_MENDOZA_RESULT_ROWS=2
KEYBOARD_ENTER_OPENS_DETAIL=PASS
VERTICAL_SWITCH_REPUESTOS_ROWS=12
VERTICAL_SWITCH_REPUESTOS_COLUMNS=7
REPUESTOS_HORIZONTAL_OVERFLOW=NO
SYNTHETIC_REAL_DESKTOP=PASS
SYNTHETIC_REAL_MOBILE_REPUESTOS=PASS
REAL_DATA_USED_FOR_QA=NO
```

Los modos autenticados se probaron con un `fetch` sintético local y fixtures ficticios; no se utilizaron secretos ni leads reales.

## Hallazgos visuales corregidos durante QA

1. **Ledger de Repuestos agrícolas:** el diseño inicial aplicaba anchos de 6 columnas a una tabla de 7 columnas; `Creado` quedaba fuera del viewport. Se agregó una clase exclusivamente presentacional y un reparto explícito 22/10/19/11/15/14/9, total 100%. Revalidado en 1440 y 1024 px sin overflow.
2. **Targets táctiles mobile:** pestañas de línea y controles de cierre/unlock quedaban en 40–42 px. Se normalizaron a mínimo 44 px. Revalidado en 390 y 320 px con cero controles visibles por debajo de 44 px.

## Incidentes de CI cerrados

1. Run `31176461890`: falló el contrato visual de provenance demo al cambiar las cadenas `MODO DEMO` / `SIN DATOS REALES`. Se restauraron ambas sin abandonar el sistema visual nuevo.
2. Run `31176575906`: build, tests y typecheck pasaron; falló sólo el gate de contención nuevo por checkout shallow. Se corrigió con historia Git completa y comparación contra el SHA base exacto.
3. Run `31176702954`: primer cierre técnico completo antes del QA visual.
4. Run `31178481661`: cierre técnico final después de los fixes encontrados en QA visual; todos los pasos `success` y artefacto de preview publicado.

## Invariantes preservados

```text
AUTH_LOGIC_CHANGED=NO
SESSION_POLICY_CHANGED=NO
API_CHANGED=NO
WORKER_CHANGED=NO
KV_CHANGED=NO
IMPORT_LOGIC_CHANGED=NO
FILTER_LOGIC_CHANGED=NO
SCORING_CHANGED=NO
REAL_LEADS_IN_GITHUB=NO
DEPLOY=NO
```

## Riesgos abiertos no introducidos por este rediseño

El run final también expone deuda preexistente del repositorio. No se debe confundir con PASS del rediseño:

```text
NPM_AUDIT_MODERATE_VULNERABILITIES=1
CURRENT_TREE_SECRET_SCAN=FAIL
CURRENT_TREE_PII_SCAN=FAIL
CURRENT_TREE_FALSE_POSITIVES=2
GIT_HISTORY_SECRET_SCAN=FAIL
GIT_HISTORY_PII_SCAN=FAIL
HISTORY_REMEDIATION_REQUIRED=yes
HISTORY_VALUES_REDACTED=yes
```

Este PR no modifica `package.json`, `package-lock.json`, secretos, Worker ni datos. Los valores sensibles no se documentan aquí. La deuda de scanner debe tratarse como un trabajo de seguridad separado y verificable antes de afirmar que el repositorio completo está limpio.

## Límite de validación

```text
NON_PRODUCTION_RENDER_QA=PASS
PRODUCTION_VISUAL_QA=NOT_EXECUTED
PRODUCTION_DEPLOY=NO
```

No declarar el diseño validado en producción hasta que exista un release explícitamente autorizado y su browser smoke productivo correspondiente.

## Próximo paso exacto

```text
NEXT_EXACT_ACTION=OWNER_DECIDE_WHETHER_TO_AUTHORIZE_WORKERS_FIRST_RELEASE_OF_PR21
```

No mergear ni desplegar a producción sin autorización explícita del owner.
