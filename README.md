# LeadX

**Tus clientes. En orden.**

LeadX es una mesa de señales comerciales para ver **a quién prestar atención y qué tiene que pasar después**.

```text
CONTACT → SIGNAL → NEXT ACTION
```

## Producto público
- Demo abierta con datos 100% ficticios.
- Registro/login con email y contraseña.
- Workspace privado por usuario.
- Contactos con empresa, email, teléfono, estado, fuente, notas y próxima acción.
- Próxima acción con **fecha objetivo opcional**.
- **Action Queue:** vistas `Pendientes`, `Sin próxima`, `Clientes` y `Todos`.
- Prioridad temporal explicable: `vencida → hoy → sin próxima acción → próxima → sin fecha`.
- La **última señal comercial** se mantiene separada de una edición administrativa del contacto.
- Búsqueda y filtro por estado dentro de cada vista.
- Exportación CSV con neutralización de fórmulas de spreadsheet.
- Email de contacto no vacío único dentro del workspace.
- Plan Free permanente hasta 100 clientes/contactos.
- Al alcanzar el límite no se borra información; sólo se bloquea la creación de nuevos registros.
- Pro se presenta como próxima capa; todavía no existe billing integrado.

## Signal Desk V2 + Action Queue
La interfaz prioriza `contacto → señal → próxima acción` y usa una dirección editorial, precisa y contenida: neutrales cálidos, tinta, vermellón como señal, reglas en lugar de card soup y una composición mobile propia.

La Action Queue convierte ese sistema visual en una herramienta operativa: hace visible qué relaciones están pendientes, cuáles quedaron sin próximo paso y cuáles vencen primero, sin score opaco ni automatizaciones inventadas.

El sistema evita dependencias visuales remotas innecesarias y conserva accesibilidad, `focus-visible`, `prefers-reduced-motion`, targets táctiles y estados funcionales explícitos.

## Stack
- React + Vite + TypeScript.
- Cloudflare Worker.
- Workers KV.
- Cloudflare Rate Limiting binding.
- Static Assets del Worker.

## Seguridad e integridad
- PBKDF2-HMAC-SHA256 para contraseñas; el work factor actual está versionado en los registros nuevos para permitir una migración posterior segura.
- Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax`.
- CSP y headers defensivos.
- Rate limiting fail-closed para auth y escrituras.
- Persistencia corrupta de contactos falla cerrada y no se reemplaza silenciosamente por una lista vacía.
- Límite Free aplicado server-side.
- La demo pública no contiene datos reales.

## Desarrollo
El frontend local apunta por defecto a un Worker local en `127.0.0.1:8787`; producción requiere `LEADX_DEV_API_TARGET` explícito.

```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
npm --prefix web run typecheck
```

Estado operativo canónico: [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)

Producción: `https://leadx.simondalmasso44.workers.dev/`
