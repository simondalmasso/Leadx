# LeadX — estado operativo

Actualizado: 2026-08-09 01:16 · America/Argentina/Cordoba.

## Estado canónico
```text
PROJECT=LeadX
PRODUCT_DIRECTION=PUBLIC_GENERIC_CRM
DESIGN_SYSTEM=SIGNAL_DESK_V2
OPERATING_LAYER=ACTION_QUEUE_DUE_ACTIONS_V1
NORTH_STAR=CONTACT → SIGNAL → NEXT ACTION
DEFAULT_BRANCH=main
PRODUCTION_URL=https://leadx.simondalmasso44.workers.dev/
PRODUCTION_RELEASE=leadx-public-freemium-v1
PRODUCTION_DEPLOY=PASS
PRODUCTION_RELEASE_SOURCE_SHA=513593c72820c00361a63accbcd9e43765c6e34e
VALIDATED_CANDIDATE_SHA=4d3ba2a7cf70af73464e751b3776c0e7d9b3de84
VALIDATED_CANDIDATE_TREE=cbdac7534901861fbced310427e4a3a434926b87
PRODUCT_RECONCILIATION_PR=31
PRODUCT_RECONCILIATION_MERGE_SHA=b9f481588276195f372eb23a5c1c8d4f9854f422
ACTIVE_DEPLOYMENT_ID=04ed02f5-5a07-4427-bdfa-054b585f1be4
ACTIVE_VERSION_ID=4ce9cbcd-f5da-429a-9584-53a3cfd6c09b
ACTIVE_TRAFFIC=100
ACTIVE_JS_ASSET=/assets/index-DzzMNnG8.js
FREE_CUSTOMER_LIMIT=100
PUBLIC_SESSION_MODE=preview
DEMO=PUBLIC_SYNTHETIC_ONLY
UNEXPECTED_NON_LX_KV_KEYS=0
SCRAPING_DISCOVERY=REMOVED_FROM_ACTIVE_TREE
OLD_VERTICALS=REMOVED_FROM_ACTIVE_PRODUCT
WORKERS_FIRST=YES
GITHUB_RECONCILIATION=PASS
REDEPLOY_AFTER_MAIN_MERGE=NO
DRIVE_CONTINUITY=DISABLED_BY_USER
```

## Último hito completado — Integrity + Due Actions V1
Se releyó el árbol canónico completo (`truncated=false`, 31 blobs) antes de implementar. También se inspeccionó `trycompai/crm` y se extrajeron sólo dos patrones compatibles con LeadX: separar la última actividad/señal comercial del timestamp técnico del registro y permitir fecha objetivo para una tarea/próxima acción. No se copió su arquitectura agentic ni se agregaron entidades innecesarias.

### Producto
- `next_action_due_at`: fecha objetivo opcional `YYYY-MM-DD`;
- una fecha sólo puede existir cuando hay `next_action`;
- prioridad de acción explicable: `vencida → hoy → sin próxima acción → próxima → sin fecha`;
- `last_signal_at`: cambia sólo cuando cambia `status`, `next_action` o `next_action_due_at`;
- `updated_at` sigue siendo timestamp técnico y ya no representa actividad comercial;
- la UI muestra `Vencida`, `Vence hoy` y `Próxima` con fecha;
- orden `Señal reciente` usa `last_signal_at`;
- emails de contacto no vacíos se normalizan y no pueden duplicarse dentro del mismo workspace;
- CSV neutraliza celdas que podrían interpretarse como fórmulas (`=`, `+`, `-`, `@`) y exporta fecha/próxima señal.

### Seguridad e integridad
- rate limiting pasó de fail-open a fail-closed para register/login/escrituras/Pro-interest;
- `/api/health` reporta `write_protection=ready`; si falta el binding responde `503/degraded`;
- JSON corrupto en `lx:contacts:<userId>` produce `data_integrity_error` y no se degrada silenciosamente a `[]`;
- se corrigió un defecto latente: `handleApi()` ahora hace `await` de handlers asíncronos para que su `try/catch` capture y normalice rechazos;
- PBKDF2 permanece en 10.000 iteraciones para compatibilidad y presupuesto CPU; las cuentas nuevas guardan `passwordIterations` para permitir una migración versionada posterior sin invalidar hashes existentes;
- auth success sólo declara workspace listo si la carga de contactos realmente terminó bien.

### Desarrollo y release
- Vite local apunta por defecto a `http://127.0.0.1:8787`; producción requiere `LEADX_DEV_API_TARGET` explícito;
- el release ya NO ejecuta `kv bulk delete` ni purge genérico;
- cualquier key fuera de `lx:` bloquea el release para inventario manual en vez de borrarse;
- nombres de keys KV no se guardan en artefactos de release;
- resultado ambiguo/no-zero de Wrangler se reconcilia contra el control-plane antes de decidir fallo o reintento;
- deployments se seleccionan por `created_on`, no por posición implícita `[0]`;
- post-release verification es manual/expresa y read-only;
- UI CI cubre cambios al post-release workflow;
- audit bloqueante se aplica a runtime dependencies high+; tooling de build se registra aparte.

## Validación del candidato
PR #31 se mantuvo fuera de `main` hasta validar producción.

```text
CANDIDATE_BRANCH=feat/integrity-due-actions-v1
CANDIDATE_SHA=4d3ba2a7cf70af73464e751b3776c0e7d9b3de84
CANDIDATE_TREE=cbdac7534901861fbced310427e4a3a434926b87
PR=31
CI_RUN=31293907763
CI_JOB=93195736828
CI_CONCLUSION=success
RUNTIME_DEPENDENCY_AUDIT_HIGH_PLUS=0
BUILD=PASS
PUBLIC_PRODUCT_TESTS=32/32
WORKER_API_TESTS=9/9
TYPECHECK=PASS
WORKER_SYNTAX=PASS
LEGACY_ACTIVE_RUNTIME=ABSENT
WRANGLER_DRY_RUN=PASS
MULTI_BREAKPOINT_VISUAL_QA=14/14_PASS
CI_ARTIFACT_ID=9032314010
CI_ARTIFACT_DIGEST=sha256:f70c482c64dfa98d7a8a64aa0d47e20147d58fc51912d7411ee0f1d5d70d2590
```

Breakpoints/estados visuales cubiertos:
```text
1440x1000=PASS
1024x768=PASS
768x1024=PASS
390x844=PASS
360x800=PASS
320x568=PASS
LONG_CONTENT=PASS
WORKSPACE_MOBILE=PASS
EDITOR_MOBILE=PASS
EDITOR_320=PASS
EMPTY=PASS
FREE_100_OF_100=PASS
NETWORK_ERROR_RETRY=PASS
LOADING=PASS
AUTH=PASS
TOUCH_TARGETS=PASS
HORIZONTAL_OVERFLOW=NONE
```

### Hallazgos detectados por los gates antes del release
1. El primer audit CI era demasiado amplio y bloqueó por advisories de tooling/dev (`nanoid` high y `postcss` moderate); runtime audit `--omit=dev --audit-level=high` confirmó 0 vulnerabilidades high+ en dependencias productivas. No se forzó un upgrade transitive improvisado.
2. La suite API nueva descubrió que excepciones asíncronas podían escapar del `try/catch` de `handleApi`; se corrigió con `await` central y se repitió el gate completo.
3. El QA visual encontró un assertion ambiguo porque varias filas podían decir legítimamente `Vence hoy`; se acotó al registro objetivo sin relajar la validación visual.

## Release Workers-first
La rama operativa tenía ancestry divergente respecto del candidato. No se forzó un PR conflictivo. Se creó un merge commit de release cuya **tree es exactamente la tree validada del candidato**, conservando la rama de release vigente como primer padre.

```text
RELEASE_BRANCH=feat/public-freemium-v1
RELEASE_SOURCE_SHA=513593c72820c00361a63accbcd9e43765c6e34e
RELEASE_TREE=cbdac7534901861fbced310427e4a3a434926b87
RELEASE_WORKFLOW=LeadX Public SaaS Workers-first Release
RELEASE_RUN=31294042395
RELEASE_JOB=93196080710
RELEASE_CONCLUSION=success
DEPLOY_ATTEMPT=1
DEPLOY_CLI_EXIT=0
PREVIOUS_DEPLOYMENT_ID=4cb1c135-b528-4eda-a1f7-db2e546efbb9
PREVIOUS_VERSION_ID=11335216-05a7-4238-8a60-fd7f1888b5f7
NEW_DEPLOYMENT_ID=04ed02f5-5a07-4427-bdfa-054b585f1be4
NEW_VERSION_ID=4ce9cbcd-f5da-429a-9584-53a3cfd6c09b
DEPLOY_REMOTE_RECONCILIATION=PASS
RUNTIME_PROPAGATION_ATTEMPT=3
RUNTIME_PROPAGATION_READY=PASS
EXPECTED_JS_ASSET=/assets/index-DzzMNnG8.js
PUBLIC_ASSET_PROPAGATION_ATTEMPT=1
PUBLIC_ASSET_PROPAGATION_READY=PASS
PRODUCTION_BROWSER_SMOKE=2/2_PASS
UNEXPECTED_NON_LX_KV_KEYS_BEFORE=0
UNEXPECTED_NON_LX_KV_KEYS_AFTER=0
KV_PURGE_EXECUTED=NO
KV_DATA_MIGRATION=NO
ROLLBACK=NO
POST_RELEASE_HTTP=PASS
PRODUCTION_RELEASE=PASS
RELEASE_ARTIFACT_ID=9032356751
RELEASE_ARTIFACT_DIGEST=sha256:e197ece6ed92562f8b1a89b97b18615092194b74187049ebf10a87a49b7eb8ad
```

No hubo segundo deploy. No hubo modificación de KV durante el release.

## Verificación productiva independiente post-release
Ejecutada después del workflow y antes del merge del candidato a `main`:

```text
HEALTH_HTTP=200
HEALTH_STATUS=ok
HEALTH_SERVICE=leadx
HEALTH_RELEASE=leadx-public-freemium-v1
HEALTH_FREE_CONTACT_LIMIT=100
HEALTH_WRITE_PROTECTION=ready
SESSION_HTTP=200
SESSION_AUTHENTICATED=false
SESSION_MODE=preview
HOME_HTTP=200
HOME_EXPECTED_ASSET=PASS
ACTIVE_ASSET=/assets/index-DzzMNnG8.js
ACTIVE_ASSET_HTTP=200
BUNDLE_VENCE_HOY_PRESENT=PASS
BUNDLE_FECHA_OBJETIVO_PRESENT=PASS
BUNDLE_LEGACY_TERMS_ABSENT=PASS
```

## GitHub reconciliado después de producción
```text
RECONCILIATION_PR=31
RECONCILIATION_HEAD=4d3ba2a7cf70af73464e751b3776c0e7d9b3de84
RECONCILIATION_MERGED=YES
RECONCILIATION_MERGE_SHA=b9f481588276195f372eb23a5c1c8d4f9854f422
PRODUCTION_VALIDATED_BEFORE_MAIN_MERGE=YES
PRODUCTION_REDEPLOY_FROM_MAIN=NO
```

PR #32 fue la promoción directa inicialmente conflictiva contra la rama operativa. Quedó supersedida por el merge commit de release exact-tree `513593c…`; no representa un segundo deploy.

## Producto vigente
Flujo:
`landing → demo ficticia → register/login → workspace privado → Action Queue → contacto → estado → próxima acción + fecha opcional → notas → search/filter → CSV → Free≤100 → Pro interest`.

Las vistas son `Pendientes / Sin próxima / Clientes / Todos`. `Pendientes` incluye `Nuevo`, `Contactado`, `Calificado` y `Propuesta`; `Cliente` y `Pausado` no se mezclan en la cola activa.

## Contención funcional y de datos
No reintroducir sin decisión explícita:
`Fotomultas / Repuestos agrícolas / Agro / scraping / discovery / radar / verticales legacy`.

No hubo migración de almacenamiento, purge de datos válidos ni dependencia runtime nueva. La demo continúa usando sólo datos sintéticos.

## Decisiones vigentes
- Workers-first es obligatorio.
- No mergear a `main` un candidato que requiera validación productiva antes del PASS real.
- No ejecutar un segundo deploy tras un fallo sin aislar primero la causa.
- Release no borra KV automáticamente; keys inesperadas bloquean y se investigan.
- Priorizar lógica comercial explicable sobre scoring opaco o IA decorativa.
- No importar arquitectura de otros CRMs cuando un patrón pequeño resuelve el problema.
- `last_signal_at` representa movimiento comercial, no cualquier edición administrativa.
- El lenguaje comercial principal es `clientes`; `contacts/contactos` puede mantenerse internamente.
- No publicar datos reales, secretos, cookies ni credenciales en GitHub, CI, docs o screenshots.
- Google Drive dejó de ser fuente/continuidad de LeadX por instrucción explícita del usuario; no leerlo ni actualizarlo.

## Riesgos abiertos / deuda aceptada
- **Workers KV whole-array:** `lx:contacts:<userId>` continúa siendo read-modify-write de un array completo. Existe riesgo de lost update entre pestañas/dispositivos concurrentes. Antes de colaboración, Pro a escala o escrituras concurrentes relevantes, evaluar migración a almacenamiento coordinado/consistente (candidato: Durable Object con SQLite). Esta migración NO se hizo en este release porque cambia arquitectura y datos.
- **Registro concurrente:** unicidad de email de cuenta sigue dependiendo de Workers KV eventual consistency; requiere solución coordinada si el volumen lo justifica.
- **PBKDF2:** 10.000 iteraciones sigue siendo deuda. No aumentar a ciegas: benchmarkear CPU real, definir nuevo work factor y migrar hashes de forma versionada al login.
- **Sesión:** TTL de 30 días, sin idle timeout/logout-all-devices.
- No hay password reset, email verification ni account deletion.
- Delete de contacto sigue siendo destructivo/sin undo.
- Pro no tiene billing integrado.
- Dependencias productivas: runtime audit high+=0 en el release. El lock de tooling/dev mantiene advisories conocidos (1 high + 1 moderate) y la instalación temporal de Playwright reporta 2 high; no forman parte del bundle runtime, pero deben reevaluarse en mantenimiento de toolchain.
- GitHub Actions reporta deprecación Node 20 para `checkout@v4`, `setup-node@v4`, `upload-artifact@v4` y los fuerza a Node 24; mantenimiento futuro, no blocker del release validado.

## Próximo paso exacto
```text
NEXT_EXACT_ACTION=EVALUATE_COORDINATED_STORAGE_MIGRATION_BEFORE_PRO_OR_CONCURRENT_WORKSPACES
```
