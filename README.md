# LeadX

LeadX es un CRM web simple para equipos comerciales.

## Producto público V1

- preview abierto con datos ficticios;
- cuentas públicas por email + contraseña;
- 14 días de Pro desbloqueado al crear la cuenta;
- Free para siempre hasta 100 contactos;
- al alcanzar el límite Free, los datos permanecen y sólo se bloquean contactos nuevos;
- Pro soportado por modelo de plan, con activación comercial aún sin pasarela de pago;
- contactos privados por cuenta en Cloudflare KV;
- frontend React/Vite + Cloudflare Worker.

Las verticales históricas Fotomultas/Repuestos agrícolas, los datos asociados, ingest y la maquinaria Radar/scraping fueron retirados del producto V1.

## Desarrollo

```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
npm --prefix web run typecheck
```

## Deploy

Flujo canónico Workers-first:

```bash
bash scripts/deploy-workers-first.sh
```

El script hace build/test/typecheck, dry-run, un único deploy, smokes productivos con una cuenta sintética descartable y recién después elimina la clave KV histórica `leads:live`.
