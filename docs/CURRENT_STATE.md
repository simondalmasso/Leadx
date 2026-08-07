# LeadX — estado operativo

Actualizado: 2026-08-06 · America/Argentina/Cordoba.

Este archivo es el worklog operativo principal. Antes de cualquier release, verificar siempre GitHub, Cloudflare y producción. No usar el historial del chat como fuente de verdad.

## Estado resumido

```text
PROJECT=LeadX
MAIN_SHA=91672001c893815a1f31f9cfdd11b31a18a6968a
PRODUCTION_STATE=REVERIFY_BEFORE_ANY_ACTION
PRODUCTION_TOUCHED_DURING_THIS_WORK=NO
CLOUDFLARE_TOUCHED_DURING_THIS_WORK=NO
KV_TOUCHED_DURING_THIS_WORK=NO
DEPLOY_EXECUTED=NO
ROLLBACK_EXECUTED=NO
MERGE_EXECUTED=NO
OCI_VCN_LEADX_DELETED=YES
```

## Track P0 — seguridad de ingestión

```text
PR=19
BRANCH=fix/ingest-vertical-safety-v1
PR_STATE=DRAFT_OPEN
LAST_VERIFIED_PR_HEAD=5b18e8b33062f13fc29891c4d8d2d87d21438124
PRODUCTION_FIX_ACTIVE=NO_VERIFICADO
RADAR_MANUAL_DISPATCH=PAUSED
```

El candidato de PR #19:

- exige `mode=upsert_vertical`;
- restringe `/api/ingest` a `fotomultas`;
- preserva la vertical no objetivo;
- bloquea colisiones de IDs entre verticales con HTTP 409;
- preserva estado CRM durante el upsert;
- elimina el reemplazo global implícito.

No mergear PR #19 ni afirmar que el fix está activo sin verificar deployment activo, version ID, tráfico y código de esa versión mediante el flujo Cloudflare-first.

## Track aislado — Fotomultas Discovery Lab V1

```text
PR=20
BRANCH=feat/fotomultas-discovery-lab-v1
BASE_BRANCH=fix/ingest-vertical-safety-v1
PR_STATE=DRAFT_OPEN
CURRENT_PR_HEAD=VERIFY_REMOTE_BEFORE_ACTION
LAST_FULL_IMPLEMENTATION_HEAD=3476ccf2bf7dd2d287559731ad9dfac4b0f0cb32
TARGET_VERTICAL=fotomultas
DEBT_THRESHOLD_ARS=1000000
REPUESTOS_AGRICOLAS_ACCESS=NO
PRODUCTION_ACCESS=NO
CLOUDFLARE_ACCESS=NO
KV_READ=NO
KV_WRITE=NO
LEADX_INGEST=NO
```

Objetivo exacto:

```text
CONTACT_REQUIRED=PUBLIC_EMAIL_OR_PUBLIC_PHONE_OR_PUBLIC_WHATSAPP
OFFICIAL_VERIFICATION_REQUIRED=YES
OFFICIAL_PROVIDER=sinai_official
OFFICIAL_SOURCE=https://consultainfracciones.seguridadvial.gob.ar/
ELIGIBILITY=SUM_ACTIVE_UNIQUE_NATIONAL_INFRACTIONS_ARS_GTE_1000000
```

La suma puede estar compuesta por varias infracciones. Las pagadas, anuladas, canceladas, prescritas o sin deuda no se computan. Un estado desconocido bloquea el caso.

### Componentes implementados

- `contacts.py`: normalización conservadora de email y teléfonos argentinos; sólo contactos explícitamente públicos.
- `debt.py`: importes ARS, deduplicación y suma acumulada de infracciones activas.
- `pipeline.py`: gates fail-closed, expiración, autorización, fuente oficial, hash de evidencia y estados de decisión.
- `cli.py`: evaluación artifact-only sin red ni producción.
- `worker.py`: inbox, outbox, processed y dead-letter sin reintento ciego.
- `discovery.py`: ejecuta el radar público existente en sandbox temporal y con credenciales operativas vaciadas.
- `orchestrator.py`: ciclo autónomo discovery → verificación privada → decisiones, con lock y `cycle_id` compartido.
- `healthcheck.py`: exige outputs recientes, misma versión de ciclo, vertical correcta y `production_access=false`.
- `container/Dockerfile`: imagen OCI genérica, no-root, volumen privado y healthcheck.
- `container/entrypoint.sh`: arranque default-deny y supervisor continuo.
- `.dockerignore`: contexto mínimo sin frontend, datos ni archivos ajenos al laboratorio.
- fixtures y tests exclusivamente sintéticos.
- CI de contención con permisos read-only y build real de imagen.

### Estados del pipeline

```text
PENDING_VERIFICATION=contacto_publico_valido_sin_constancia_oficial
ELIGIBLE_VERIFIED=contacto_valido_y_deuda_activa_acumulada_gte_1000000
REJECTED=cualquier_gate_fail_closed
```

### Contención del descubrimiento

El runner de búsqueda:

- requiere `--allow-public-network`;
- corre `generate_payload.py` en un directorio temporal;
- vacía credenciales de LeadX y Cloudflare;
- no hereda variables de entorno desconocidas;
- no ejecuta el workflow legacy `radar-cron.yml`;
- elimina registros que no sean `fotomultas`;
- elimina patente, texto crudo y deuda de fuentes no oficiales antes de publicar;
- conserva únicamente un artefacto privado sanitizado;
- no consulta SINAI en vivo.

### Runtime OCI preparado

```text
OCI_IMAGE_STATUS=BUILD_VALIDATED_NOT_PUBLISHED
OCI_BASE=python:3.11-slim-bookworm
OCI_BASE_INDEX_DIGEST=sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098c647482bcad5cba
OCI_USER=10001:10001
OCI_APPLICATION_FILESYSTEM=READ_ONLY_BY_PERMISSIONS
OCI_STATE_VOLUME=/state
OCI_DEFAULT_START=BLOCKED_UNLESS_PUBLIC_NETWORK_FLAG_EQUALS_1
OCI_HEALTHCHECK=CYCLE_ID_MATCH_AND_FRESHNESS
OCI_REGISTRY_PUSHED=NO
OCI_RUNTIME_ACTIVE=NO
```

La imagen es compatible con un host OCI genérico. No está publicada y no existe un runtime externo activo.

## Hito de infraestructura OCI — VCN eliminada

```text
OCI_OPERATION=DELETE_VCN_AND_ASSOCIATED_NETWORK_RESOURCES
OCI_OPERATION_AUTHORIZED_BY_OWNER=YES
OCI_EXECUTION_MODE=MANUAL_OCI_CLOUD_SHELL
OCI_REGION=sa-saopaulo-1
OCI_VCN_NAME=vcn-leadx
OCI_VCN_CIDR=10.0.0.0/16
OCI_VCN_ID=ocid1.vcn.oc1.sa-saopaulo-1.amaaaaaaliyxxwiamzhdcovprncqfqskau7twcicicfsswhtdrryfcgjbwea
OCI_VCN_DELETE_RESULT=YES
OCI_VCN_POST_DELETE_GET=NOT_AUTHORIZED_OR_NOT_FOUND
OCI_VCN_POST_DELETE_VERIFICATION=PASS
OCI_VCN_DELETED_AT=2026-08-06T22:09:00-03:00
OCI_EVIDENCE_SOURCE=OWNER_CLOUD_SHELL_OUTPUT
OCI_DRG_RESOURCE_DELETED=NO
OCI_BUILTIN_DNS_RESOLVER=EXPECTED_DELETED_WITH_VCN_NOT_SEPARATELY_VERIFIED
OCI_PRODUCTION_DEPLOY_EXECUTED=NO
CLOUDFLARE_TOUCHED=NO
LEADX_KV_TOUCHED=NO
```

El proceso tuvo errores de parsing en los scripts auxiliares después de algunas operaciones, pero la verificación final consultó el OCID exacto y devolvió que el recurso ya no existe. Esa consulta posterior es la evidencia de cierre. No volver a ejecutar el script destructivo contra ese OCID.

La eliminación fue exclusiva de infraestructura Oracle asociada a `vcn-leadx`. No constituye deploy de LeadX, merge de GitHub ni cambio de Cloudflare/KV.

## Incidente CI temporal corregido

```text
FAILED_RUN_ID=31137255232
FAILED_RUN_CONCLUSION=failure
FIRST_CAUSAL_ERROR=synthetic_verification_checked_at_expired
PRODUCT_DEFECT=NO
TEST_FIX=runtime_relative_synthetic_timestamps
FIX_HEAD=3476ccf2bf7dd2d287559731ad9dfac4b0f0cb32
FIX_RUN_ID=31137544125
FIX_RUN_CONCLUSION=success
```

La CI detectó correctamente que las verificaciones sintéticas del 21 de julio habían vencido según el gate de vigencia. Se corrigieron únicamente los tests y el fixture temporal de CI para generar timestamps recientes durante la ejecución. No se relajó el límite productivo ni la validación de antigüedad.

### Tecnologías externas

```text
GOOGLESCRAPER=NOT_INTEGRATED
OPENPLANTER=NOT_INTEGRATED_AS_DEPENDENCY
OPENPLANTER_PATTERN=SOURCE_ENTITY_EVIDENCE_DECISION_ONLY
INTELX=NOT_INTEGRATED
LIVE_SINAI_AUTOMATION=NOT_INCLUDED
```

El radar existente ya resuelve el descubrimiento público inicial. GoogleScraper duplicaría esa responsabilidad. OpenPlanter es demasiado amplio para incorporarlo como agente con shell. IntelX queda fuera de V1.

## Validaciones ejecutadas

```text
CI_WORKFLOW=LeadX Fotomultas Discovery Lab CI
LAST_FULL_CODE_HEAD_VALIDATED=3476ccf2bf7dd2d287559731ad9dfac4b0f0cb32
LAST_FULL_CODE_RUN_ID=31137544125
LAST_FULL_CODE_CONCLUSION=success
CONTAINMENT=PASS
PYTHON_COMPILE=PASS
UNIT_TESTS=PASS
SYNTHETIC_ARTIFACT_FLOW=PASS
NETWORK_RUNNERS_OPT_IN=PASS
OCI_IMAGE_BUILD=PASS
OCI_IMAGE_TESTS_WITH_NETWORK_NONE=PASS
OCI_NON_ROOT_USER=PASS
OCI_DEFAULT_DENY_STARTUP=PASS
PRODUCTION_ACCESS=NO
CLOUDFLARE_KV_INGEST_ACCESS=NO
OCI_VCN_POST_DELETE_VERIFICATION=PASS
```

La CI sólo usa fixtures sintéticos. No ejecuta descubrimiento web real, no consulta SINAI, no inicia infraestructura externa y no crea artefactos con leads reales.

## Arquitectura de release vigente

```text
RELEASE_MODEL=CLOUDFLARE_FIRST_WORKERS_FIRST
RELEASE_OPERATOR=CLOUDFLARE
GITHUB_ROLE=SOURCE_HISTORY_CI_AND_POST_RELEASE_EVIDENCE
GITHUB_ACTIONS_DEPLOY_OPERATOR=NO
```

Secuencia obligatoria para un release futuro:

1. congelar el source SHA exacto;
2. Cloudflare toma ese source;
3. instalación frozen y build;
4. preview o versión candidata sin promoción;
5. validar Worker, bindings, KV, cron, APIs, UI y logs;
6. promover únicamente esa misma candidata con todos los gates aprobados;
7. repetir smokes productivos;
8. registrar SHA, version ID, deployment ID, tráfico, smokes y rollback en GitHub;
9. actualizar Drive si el cambio constituye un hito material.

## Riesgos y bloqueos abiertos

1. PR #19 todavía no fue validado y reconciliado mediante una candidata Cloudflare del HEAD exacto.
2. El laboratorio está implementado y empaquetado, pero no está ejecutándose en un host continuo.
3. SINAI en vivo no está automatizado: requiere revisión específica de finalidad, autorización, frecuencia, privacidad y condiciones vigentes.
4. Los candidatos reales y verificaciones privadas deben permanecer fuera de GitHub, CI, Drive y artefactos públicos.
5. `radar-cron.yml` sigue pausado y no debe ejecutarse manualmente.
6. `vcn-leadx` fue eliminada; cualquier runtime futuro en Oracle requiere crear una red aislada nueva. La alternativa vigente es utilizar Northflank u otro host OCI no productivo.

## Próximo paso exacto

```text
NEXT_EXACT_ACTION=CHOOSE_NORTHFLANK_OR_AUTHORIZE_CREATION_OF_A_NEW_ISOLATED_ORACLE_NETWORK_BEFORE_PR20_RUNTIME
```

La eliminación de `vcn-leadx` quedó cerrada y verificada. No recrear recursos OCI ni activar el laboratorio sin una nueva autorización explícita. No desplegar LeadX, no tocar Cloudflare, no conectar SINAI en vivo y no modificar Repuestos agrícolas.
