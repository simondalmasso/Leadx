# LeadX — Workers-first public release

El release público se ejecuta sólo desde `feat/public-freemium-v1` mediante `.github/workflows/public-saas-release.yml` cuando el commit comienza con `release(public):`.

Orden:
1. checkout del SHA exacto;
2. `npm ci`;
3. build, tests, typecheck y `node --check`;
4. Wrangler dry-run;
5. snapshot del deployment/version activo y de keys legacy de KV;
6. un único deploy;
7. confirmar una versión al 100% del tráfico;
8. smoke HTTP + Chromium desktop/mobile;
9. si el smoke falla, rollback automático al version ID anterior;
10. sólo después del smoke verde, borrar las keys KV legacy capturadas antes del deploy, excluyendo todo prefijo nuevo `lx:`;
11. smoke final post-purge;
12. registrar IDs, SHA y evidencia.

El purge de KV es deliberadamente posterior a la validación del Worker nuevo porque un rollback de código no revierte datos persistentes.
