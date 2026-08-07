#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
BASE_URL="${LEADX_BASE_URL:-https://leadx.simondalmasso44.workers.dev}"
WORKER_NAME="${LEADX_WORKER_NAME:-leadx}"
WRANGLER_VERSION="${WRANGLER_VERSION:-4.111.0}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_DIR="${LEADX_DEPLOY_ARTIFACT_DIR:-$ROOT_DIR/artifacts/workers-first/$RUN_ID}"
BUNDLE_DIR="$ARTIFACT_DIR/bundle"
COOKIE_JAR="$ARTIFACT_DIR/smoke.cookies"
SMOKE_EMAIL="smoke-${RUN_ID}@example.invalid"
SMOKE_PASSWORD="Smoke-${RUN_ID}-A9!"

log(){ printf '[leadx-public] %s\n' "$*"; }
fail(){ printf '[leadx-public] ERROR: %s\n' "$*" >&2; exit 1; }
require_env(){ [[ -n "${!1:-}" ]] || fail "Missing environment variable: $1"; }

for c in curl jq node npm git sha256sum; do command -v "$c" >/dev/null || fail "Missing command: $c"; done
for n in CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN; do require_env "$n"; done
SOURCE_SHA="$(git rev-parse HEAD)"
test -z "$(git status --porcelain)" || fail "Working tree must be clean."
mkdir -p "$ARTIFACT_DIR" "$BUNDLE_DIR"; chmod 700 "$ARTIFACT_DIR"

cloudflare_deployments(){
  curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/deployments" \
    > "$1"
  jq -e '.success==true and (.result|length)>0' "$1" >/dev/null
}
active_version(){ jq -r '.result[0].versions[]? | select(.percentage==100) | .version_id' "$1" | head -1; }
active_deployment(){ jq -r '.result[0].id // empty' "$1"; }

rollback(){
  [[ -n "${PREVIOUS_VERSION_ID:-}" ]] || { log "Rollback unavailable: previous version missing."; return 1; }
  log "Rollback to ${PREVIOUS_VERSION_ID}."
  npx --yes "wrangler@${WRANGLER_VERSION}" rollback "$PREVIOUS_VERSION_ID" --message "LeadX public-v1 automatic rollback"
  for _ in $(seq 1 60); do
    cloudflare_deployments "$ARTIFACT_DIR/rollback-deployments.json"
    [[ "$(active_version "$ARTIFACT_DIR/rollback-deployments.json")" == "$PREVIOUS_VERSION_ID" ]] && break
    sleep 2
  done
  [[ "$(active_version "$ARTIFACT_DIR/rollback-deployments.json")" == "$PREVIOUS_VERSION_ID" ]] || return 1
  curl -fsS "$BASE_URL/api/health?rollback=$RUN_ID" >/dev/null
  printf 'ROLLBACK_STATE=completed\n' >> "$ARTIFACT_DIR/summary.txt"
}

cleanup_smoke_account(){
  [[ -s "$COOKIE_JAR" ]] || return 0
  curl -sS -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/account?cleanup=$RUN_ID" >/dev/null 2>&1 || true
  rm -f "$COOKIE_JAR"
}

production_smoke(){
  log "Smoke: health + public page."
  curl -fsS "$BASE_URL/api/health?smoke=$RUN_ID" -o "$ARTIFACT_DIR/health.json"
  jq -e '.status=="ok" and .service=="leadx" and .version=="leadx-public-v1" and .free_contact_limit==100 and .trial_days==14' "$ARTIFACT_DIR/health.json" >/dev/null
  curl -fsS "$BASE_URL/?smoke=$RUN_ID" -o "$ARTIFACT_DIR/index.html"
  grep -q 'LeadX' "$ARTIFACT_DIR/index.html"

  log "Smoke: disposable public account + isolated CRUD."
  curl -fsS -c "$COOKIE_JAR" -H 'Content-Type: application/json' \
    --data-binary "$(jq -cn --arg email "$SMOKE_EMAIL" --arg password "$SMOKE_PASSWORD" '{email:$email,password:$password}')" \
    "$BASE_URL/api/auth/signup" -o "$ARTIFACT_DIR/signup.json"
  jq -e '.authenticated==true and .effectivePlan=="trial" and .contactCount==0' "$ARTIFACT_DIR/signup.json" >/dev/null
  curl -fsS -b "$COOKIE_JAR" -H 'Content-Type: application/json' \
    --data-binary '{"name":"Smoke Contact","company":"LeadX QA","email":"smoke-contact@example.invalid","phone":"","notes":"synthetic release smoke"}' \
    "$BASE_URL/api/contacts" -o "$ARTIFACT_DIR/contact-create.json"
  jq -e '.contact.name=="Smoke Contact" and .usage.contactCount==1' "$ARTIFACT_DIR/contact-create.json" >/dev/null
  curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/contacts" -o "$ARTIFACT_DIR/contacts.json"
  jq -e '.contacts|length==1' "$ARTIFACT_DIR/contacts.json" >/dev/null

  log "Smoke: legacy product endpoints are retired before any data purge."
  for endpoint in /api/leads /api/ingest /api/admin/import /api/metrics; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL$endpoint?retired=$RUN_ID")"
    [[ "$code" == "410" ]] || return 1
  done

  curl -fsS -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/account" -o "$ARTIFACT_DIR/account-delete.json"
  jq -e '.ok==true' "$ARTIFACT_DIR/account-delete.json" >/dev/null
  rm -f "$COOKIE_JAR"
}

log "Install/build/test/typecheck."
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
npm --prefix web run typecheck

log "Verify Cloudflare auth and build exact bundle."
npx --yes "wrangler@${WRANGLER_VERSION}" whoami >/dev/null
npx --yes "wrangler@${WRANGLER_VERSION}" deploy --dry-run --outdir "$BUNDLE_DIR" 2>&1 | tee "$ARTIFACT_DIR/dry-run.log"
BUNDLE_SHA256="$(find "$BUNDLE_DIR" -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')"
[[ "$BUNDLE_SHA256" =~ ^[0-9a-f]{64}$ ]] || fail "Could not calculate bundle SHA256."

log "Capture current deployment/version."
cloudflare_deployments "$ARTIFACT_DIR/previous-deployments.json"
PREVIOUS_VERSION_ID="$(active_version "$ARTIFACT_DIR/previous-deployments.json")"
PREVIOUS_DEPLOYMENT_ID="$(active_deployment "$ARTIFACT_DIR/previous-deployments.json")"
[[ -n "$PREVIOUS_VERSION_ID" && -n "$PREVIOUS_DEPLOYMENT_ID" ]] || fail "Previous production version could not be captured."

log "Deploy exactly once."
if ! npx --yes "wrangler@${WRANGLER_VERSION}" deploy 2>&1 | tee "$ARTIFACT_DIR/deploy.log"; then
  fail "Deploy command failed. No automatic second deploy will be attempted."
fi
NEW_VERSION_ID="$(grep -oE 'Current Version ID: [a-f0-9-]+' "$ARTIFACT_DIR/deploy.log" | awk '{print $4}' | tail -1)"
if [[ -z "$NEW_VERSION_ID" ]]; then
  NEW_VERSION_ID="$(npx --yes "wrangler@${WRANGLER_VERSION}" versions list --json | jq -r '.[0].id // .[0].version_id // empty')"
fi
[[ -n "$NEW_VERSION_ID" ]] || { rollback || true; fail "New version ID unresolved; previous version restored when possible."; }

log "Wait for the new version at 100% traffic."
NEW_DEPLOYMENT_ID=""
for _ in $(seq 1 90); do
  cloudflare_deployments "$ARTIFACT_DIR/current-deployments.json"
  if [[ "$(active_version "$ARTIFACT_DIR/current-deployments.json")" == "$NEW_VERSION_ID" ]] && \
     [[ "$(jq -r '.result[0].versions|length' "$ARTIFACT_DIR/current-deployments.json")" == "1" ]]; then
    NEW_DEPLOYMENT_ID="$(active_deployment "$ARTIFACT_DIR/current-deployments.json")"
    break
  fi
  sleep 2
done
[[ -n "$NEW_DEPLOYMENT_ID" ]] || { rollback || true; fail "New version did not become sole 100% production version."; }

if ! production_smoke; then
  cleanup_smoke_account
  rollback || true
  fail "Post-deploy smoke failed. Previous code version restored; legacy leads:live was NOT purged."
fi

log "All new-product smokes passed. Purging the authorized legacy dataset now."
npx --yes "wrangler@${WRANGLER_VERSION}" kv key delete "leads:live" --binding LEADX_KV --remote

cat > "$ARTIFACT_DIR/summary.txt" <<EOF_SUMMARY
DEPLOY_SOURCE=cloudflare-workers-first
SOURCE_SHA=$SOURCE_SHA
BUNDLE_SHA256=$BUNDLE_SHA256
PREVIOUS_DEPLOYMENT_ID=$PREVIOUS_DEPLOYMENT_ID
PREVIOUS_VERSION_ID=$PREVIOUS_VERSION_ID
NEW_DEPLOYMENT_ID=$NEW_DEPLOYMENT_ID
NEW_VERSION_ID=$NEW_VERSION_ID
PUBLIC_PRODUCT_SMOKE=PASS
LEGACY_ENDPOINTS_RETIRED=PASS
LEGACY_LEADS_LIVE_PURGE_COMMAND=PASS
FREE_CONTACT_LIMIT=100
TRIAL_DAYS=14
EOF_SUMMARY
log "PASS source=$SOURCE_SHA deployment=$NEW_DEPLOYMENT_ID version=$NEW_VERSION_ID"
