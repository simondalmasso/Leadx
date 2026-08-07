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
- **Action Queue:** vistas `Pendientes`, `Sin próxima`, `Clientes` y `Todos`.
- Prioridad de acción explicable: primero relaciones activas sin próxima acción y después las menos recientemente actualizadas.
- Búsqueda y filtro por estado dentro de cada vista, más exportación CSV.
- Plan Free permanente hasta 100 clientes/contactos.
- Al alcanzar el límite no se borra información; sólo se bloquea la creación de nuevos registros.
- Pro se presenta como próxima capa; todavía no existe billing integrado.

## Signal Desk V2 + Action Queue V1
La interfaz prioriza `contacto → señal → próxima acción` y usa una dirección editorial, precisa y contenida: neutrales cálidos, tinta, vermellón como señal, reglas en lugar de card soup y una composición mobile propia.

La Action Queue convierte ese sistema visual en una herramienta operativa: hace visible qué relaciones están pendientes y cuáles quedaron sin próximo paso, sin score opaco ni automatizaciones inventadas.

El sistema evita dependencias visuales remotas innecesarias y conserva accesibilidad, `focus-visible`, `prefers-reduced-motion`, targets táctiles y estados funcionales explícitos.

## Stack
- React + Vite + TypeScript.
- Cloudflare Worker.
- Workers KV.
- Cloudflare Rate Limiting binding.
- Static Assets del Worker.

## Seguridad
- PBKDF2-SHA256 para contraseñas.
- Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax`.
- CSP y headers defensivos.
- No se guardan contraseñas en claro.
- La demo pública no contiene datos reales.

## Desarrollo
```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
npm --prefix web run typecheck
```

Estado operativo canónico: [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)

Producción: `https://leadx.simondalmasso44.workers.dev/`
