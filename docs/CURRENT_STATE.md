# LeadX — estado operativo

Actualizado: 2026-08-07 14:11 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK_V2_CANDIDATE
DEFAULT_BRANCH=main
MAIN_SHA=01dc33f4b39e9352e920941685961e30ffc29033
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
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
PRODUCTION_CHANGED_BY_DESIGN_V2=NO
DESIGN_V2_DEPLOY_EXECUTED=NO
DESIGN_V2_MERGE_EXECUTED=NO
```

## Producción vigente
Producción permanece en el release público ya verificado. Este trabajo de diseño no tocó Cloudflare Worker, KV, datos ni tráfico productivo.

Estado productivo conocido:
```text
RELEASE_RUN=31196841214
RELEASE_JOB=92927017652
RELEASE_CONCLUSION=success
PRODUCTION_RELEASE=PASS
HEALTH=PASS
DESKTOP_BROWSER_SMOKE=PASS
MOBILE_BROWSER_SMOKE=PASS
OWNER_ACCOUNT_REGISTRATION=PASS
OWNER_LOGIN=PASS
OWNER_SESSION=PASS
OWNER_LOGOUT=PASS
PUBLIC_HERO=Tus clientes. En orden.
FREE_COPY=Gratis hasta 100 clientes
```

## LeadX Signal Desk V2 — candidato no productivo
```text
DESIGN_ORDER=HOVS_CREATIVE_DIRECTION_PASS_V2
DESIGN_NORTH_STAR=CONTACT_SIGNAL_NEXT_ACTION
PR=25
PR_STATE=DRAFT_OPEN_NO_DEPLOY
PR_BRANCH=agent/hovs-creative-direction-v2-candidate
PR_BASE=main@01dc33f4b39e9352e920941685961e30ffc29033
INITIAL_DESIGN_SHA=a2660c24af2605b77d015ab6905b490040e67d2e
QA_CORRECTION_SHA=ba3c0e61d60f5479c108d1601ab98eb2d077e1e0
FINAL_VALIDATED_SOURCE_SHA=d3299e041e81235d1134f437a62e41201969ad01
QA_EVIDENCE_DOC_COMMIT=9cc3bf53933d0d61f3002de5ebb03e1c8bf4d53a
PRODUCTION_DEPLOY_EXECUTED=NO
PRODUCTION_CHANGED=NO
BACKEND_CHANGED=NO
API_CHANGED=NO
KV_CHANGED=NO
AUTH_BEHAVIOR_CHANGED=NO
NEW_RUNTIME_DEPENDENCY=NO
REAL_CONTACT_DATA_IN_QA=NO
```

### Concepto
LeadX se diseñó como una **mesa editorial de señales comerciales**, no como un dashboard SaaS genérico.

```text
CONTACT → SIGNAL → NEXT ACTION
```

La jerarquía del workspace es:
```text
CONTEXT
→ METRICS
→ SEARCH / FILTER
→ CONTACT
→ STATUS
→ NEXT ACTION
→ SECONDARY DATA
```

`Próxima acción` tiene prioridad sobre metadata histórica. La landing, demo, workspace, ledger, auth, editor, pricing, estados y responsive usan el mismo sistema visual.

### Sistema entregado
- paleta Signal Desk evolucionada a tokens semánticos completos;
- vermellón reservado para señal/acción, no decoración masiva;
- grotesca local/system trabajada por escala, peso, tracking, leading y measure; sin fuente remota;
- wordmark SVG oficial integrado como firma canónica;
- spacing 4/8/12/16/24/32/48/64/96/128;
- estructura por whitespace, rules y tipografía antes que cards;
- radius restringido a 2px/4px;
- motion 140/210/340ms con `prefers-reduced-motion`;
- desktop como ledger editorial;
- mobile recompuesto como registros verticales y sheets, no desktop encogido;
- Free presentado como producto real; Pro como próxima capa sin checkout ficticio.

## Estados diseñados
```text
BOOT=IMPLEMENTED
LOADING=IMPLEMENTED
EMPTY_WORKSPACE=IMPLEMENTED
EMPTY_SEARCH=IMPLEMENTED
NETWORK_ERROR=IMPLEMENTED_WITH_RETRY
FORM_ERROR=IMPLEMENTED
SAVING=IMPLEMENTED
SUCCESS_NOTICE=IMPLEMENTED
FREE_LIMIT_REACHED=IMPLEMENTED
DISABLED=IMPLEMENTED
AUTH_FAILURE=IMPLEMENTED
DELETE_CONFIRMATION=IMPLEMENTED_CUSTOM_NO_BROWSER_CONFIRM
PRO_INTEREST_SUCCESS=IMPLEMENTED
```

## Accesibilidad y calidad
- focus-visible inequívoco;
- dialogs con semántica y Escape;
- labels reales;
- status usa color + texto;
- touch targets móviles >=44px verificados;
- reduced motion;
- horizontal overflow no detectado en gate final;
- sin iconografía AI decorativa;
- `lucide-react` sigue siendo la única librería de iconos.

## QA visual — ciclo real
Primer gate:
```text
RUN=31199803262
JOB=92936793941
BUILD=PASS
PUBLIC_PRODUCT_TESTS=20/20
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
VISUAL_QA=11/14_FAIL_BLOCKED
```

Hallazgos detectados antes de promoción:
1. botón cerrar podía comprimirse a 35px en mobile;
2. el loading del workspace no llegaba a renderizar porque el boot global esperaba el fetch de contactos;
3. la medición del sheet 320px ocurría durante su transición de entrada.

Correcciones aplicadas sin relajar criterios:
- icon button fijo a 44×44;
- workspace loading visible después de resolver sesión autenticada;
- medición de geometría/touch targets después de asentar la transición.

Gate final:
```text
FINAL_QA_RUN=31200535102
FINAL_QA_JOB=92939204758
FINAL_QA_SOURCE=d3299e041e81235d1134f437a62e41201969ad01
FINAL_QA_CONCLUSION=success
BUILD=PASS
PUBLIC_PRODUCT_TESTS=PASS
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
LOCAL_PRODUCTION_PREVIEW=PASS
MULTI_BREAKPOINT_VISUAL_QA=PASS
ARTIFACT_ID=9002729241
ARTIFACT_DIGEST=sha256:51cd1a64bedc485517b11a82e75d24faefb3aafffcc6418f88a30c0176f53027
FINAL_VISUAL_QA_MANUAL_REVIEW=PASS
```

Breakpoints renderizados:
```text
1440x1000=PASS
1024x768=PASS
768x1024=PASS
390x844=PASS
360x800=PASS
320x568=PASS
```

También verificados con fixtures sintéticos:
- nombre, email y próxima acción largos;
- workspace desktop/mobile;
- editor mobile y 320px;
- workspace vacío;
- plan Free 100/100;
- error de red + retry;
- loading;
- auth mobile;
- targets táctiles;
- no overflow horizontal.

La evidencia visual final fue descargada e inspeccionada manualmente; el PASS no depende sólo de tests DOM.

## Contención funcional
Se conservó el producto canónico:
`landing → demo ficticia → register/login → workspace privado → contactos → estados → próxima acción → notas → search/filter → CSV → Free≤100 → Pro interest`.

No reintroducir:
`Fotomultas / Repuestos agrícolas / Agro / scraping / discovery / radar / verticales legacy`.

No se modificó backend por necesidad estética.

## Riesgos abiertos preexistentes
- PBKDF2 a 10.000 iteraciones sigue siendo deuda de seguridad del piloto por presupuesto CPU del Worker.
- Workers KV tiene consistencia eventual; colaboración concurrente multiusuario queda fuera del piloto.
- Pro no tiene billing integrado.
- No hay recuperación de contraseña ni verificación de email.
- `npm ci` mantiene 1 vulnerabilidad moderada preexistente.

## Decisiones vigentes
- Workers-first sigue siendo obligatorio: un candidato que requiere validación productiva no se mergea antes de esa validación.
- PR #25 permanece candidato no productivo.
- No publicar datos reales en GitHub, CI, docs ni screenshots.
- El lenguaje comercial principal es `clientes`; el modelo técnico puede conservar `contacts/contactos` internamente.
- No copiar obras o layouts existentes de HOVS, mymind, Semplice o Carbonmade.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=OWNER_AUTHORIZE_WORKERS_FIRST_RELEASE_OF_PR25_CANDIDATE
```

Si se autoriza: revalidar HEAD remoto de PR #25, desplegar primero a Workers, verificar producción completa, recién después reconciliar/mergear GitHub y actualizar CONTEXTO LEADX.
