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
CURRENT_PR_HEAD=VERIFY_REMOTE_BEFORE_ACTION
LAST_PRODUCT_HEAD_VALIDATED=88623f130eab637d01337c58a3c84b3770f4de43
DESIGN_DIRECTION=SIGNAL_DESK
IMPLEMENTATION_STATUS=CODE_COMPLETE_CI_PASS
VISUAL_RENDER_QA=PENDING
DEPLOY_EXECUTED=NO
MERGE_EXECUTED=NO
PRODUCTION_CHANGED=NO
CLOUDFLARE_CHANGED=NO
KV_CHANGED=NO
REAL_DATA_CHANGED=NO
```

## Dirección creativa

El rediseño parte de una decisión funcional: LeadX debe ayudar a resolver **a quién prestar atención ahora**. La interfaz se trata como una mesa editorial de señales comerciales y no como un dashboard SaaS.

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
- `web/public/leadx-mark.svg`
- `web/public/leadx-wordmark.svg`

CI agregado:

- `.github/workflows/ui-product-ci.yml`

No se modificaron `App.tsx`, componentes React, worker, APIs, sesión, autenticación, KV, scoring, filtros ni importación.

## Validación

Workflow:

```text
WORKFLOW=LeadX UI Product CI
RUN_ID=31176702954
JOB_ID=92860166544
HEAD=88623f130eab637d01337c58a3c84b3770f4de43
RUN_CONCLUSION=success
INSTALL_FROZEN=PASS
BUILD=PASS
TEST=PASS
TYPECHECK=PASS
DESIGN_CONTAINMENT=PASS
DEPLOY_ATTEMPTED=NO
```

La ejecución final verificó producto y contención sin secretos y sin deploy.

Resultados visibles en logs de la ejecución previa que ejercitó la misma implementación de producto después de la corrección demo:

```text
BASELINE_COVERAGE=66/66
SECURITY_RUNTIME_TESTS=71/71
MULTI_LINEA=32/32
```

### Incidentes de CI durante implementación

1. Run `31176461890`: build y baseline iniciales avanzaron, pero el contrato `demo mode is visually unequivocal` falló porque se habían cambiado las cadenas CSS `MODO DEMO` / `SIN DATOS REALES`. Se restauraron esas señales textuales manteniendo el sistema visual nuevo.
2. Run `31176575906`: build, tests y typecheck pasaron; falló únicamente el gate de contención nuevo porque `checkout` shallow no tenía `origin/main`. Se corrigió el workflow con `fetch-depth: 0` y comparación contra el SHA base del PR.
3. Run `31176702954`: conclusión final `success` en todos los pasos.

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

## Riesgo abierto

La rama todavía no fue renderizada en un entorno accesible para QA visual real. Por lo tanto:

```text
DESKTOP_VISUAL_QA=NOT_EXECUTED
MOBILE_VISUAL_QA=NOT_EXECUTED
PRODUCTION_VISUAL_QA=NOT_EXECUTED
```

No declarar calidad visual final ni promover el diseño basándose sólo en CI.

## Próximo paso exacto

```text
NEXT_EXACT_ACTION=AUTHORIZE_NON_PRODUCTION_RENDER_OF_PR21_FOR_DESKTOP_AND_MOBILE_VISUAL_QA
```

No mergear ni desplegar a producción hasta revisar el render real del PR #21 y corregir cualquier defecto visual encontrado.
