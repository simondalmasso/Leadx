# LeadX

LeadX es un CRM web liviano para ordenar contactos comerciales y mantener visible la próxima acción.

## Producto público
- Demo abierta con datos 100% ficticios.
- Registro/login con email y contraseña.
- Espacio privado por usuario.
- Contactos con empresa, email, teléfono, estado, fuente, notas y próxima acción.
- Plan Free permanente hasta 100 contactos.
- Al alcanzar el límite no se borra información; sólo se bloquea la creación de nuevos contactos hasta Pro.
- Exportación CSV.

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
- Los datos demo no son datos reales.

## Desarrollo
```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
npm --prefix web run typecheck
```

Producción: `https://leadx.simondalmasso44.workers.dev/`
