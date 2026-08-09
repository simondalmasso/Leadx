# LeadX — Workers-first public release

El release público se ejecuta sólo desde `feat/public-freemium-v1` mediante `.github/workflows/public-saas-release.yml` cuando el commit comienza con `release(public):`.

Orden:
1. checkout del SHA exacto;
2. `npm ci` + audit de vulnerabilidades high+;
3. build, tests de producto/API, typecheck y `node --check`;
4. Wrangler dry-run;
5. snapshot del deployment/version activo;
6. inspección read-only del namespace KV: cualquier key fuera de `lx:` **bloquea** el release para inventario manual; el pipeline no borra datos;
7. un único deploy;
8. reconciliar el control-plane de Cloudflare incluso si la CLI devuelve un resultado ambiguo antes de decidir fallo/reintento;
9. confirmar una versión nueva al 100% del tráfico;
10. health debe informar `write_protection=ready`;
11. esperar el asset JS exacto del build;
12. smoke HTTP + Chromium desktop/mobile;
13. si un smoke posterior al deploy falla, rollback automático al version ID anterior;
14. volver a verificar de forma read-only que el namespace KV siga sin keys inesperadas;
15. registrar IDs, SHA y evidencia sin incluir nombres de keys de usuario en artefactos.

## Regla de datos

El workflow de release **no ejecuta purges ni `kv bulk delete`**. La limpieza legacy fue un hito histórico ya cerrado. Una key inesperada es una condición de bloqueo que debe investigarse explícitamente, no una autorización implícita para borrarla.

Un rollback de código no revierte KV ni otros recursos persistentes. Por eso cualquier futura migración o eliminación de datos necesita un procedimiento separado, inventariado y con rollback propio.
