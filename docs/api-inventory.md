# LeadX Public SaaS — API inventory

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/health` | No | Health, release, límite Free y disponibilidad de protección de escrituras |
| GET | `/api/auth/session` | Cookie opcional | Estado de sesión |
| POST | `/api/auth/register` | No | Crear cuenta Free |
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/logout` | Cookie | Cerrar sesión |
| GET | `/api/contacts` | Sí | Listar contactos del usuario |
| POST | `/api/contacts` | Sí | Crear contacto; límite Free=100 |
| PATCH | `/api/contacts/:id` | Sí | Actualizar contacto propio |
| DELETE | `/api/contacts/:id` | Sí | Eliminar contacto propio |
| POST | `/api/pro-interest` | Sí | Registrar interés en Pro |

## Contrato de contacto

Además de identidad/contexto (`name`, `company`, `email`, `phone`, `status`, `source`, `notes`), el producto conserva:

- `next_action`: próximo paso comercial;
- `next_action_due_at`: fecha objetivo opcional `YYYY-MM-DD`; sólo puede existir cuando hay `next_action`;
- `last_signal_at`: timestamp del último cambio comercial (`status`, `next_action` o su fecha), separado de `updated_at`;
- `created_at` / `updated_at`: timestamps técnicos del registro.

Los emails no vacíos se normalizan y no pueden duplicarse dentro del mismo workspace.

## Seguridad activa

- PBKDF2-HMAC-SHA256 con **10.000 iteraciones en el runtime actual**. No se declara 150k: el work factor vigente se mantiene por compatibilidad/presupuesto CPU hasta completar benchmark y migración versionada. Las cuentas nuevas guardan `passwordIterations` para habilitar esa migración sin romper hashes existentes.
- Sesión aleatoria almacenada por hash en KV y cookie `HttpOnly; Secure; SameSite=Lax`.
- CSP y headers defensivos.
- Rate limiting fail-closed para registro, login y escrituras: si el binding no está disponible, las escrituras responden `503 write_protection_unavailable` y `/api/health` pasa a `degraded`.
- Body máximo de 64 KiB y validación server-side.
- Persistencia corrupta de contactos falla cerrada con `data_integrity_error`; nunca se interpreta silenciosamente como lista vacía.
- No hay endpoint de ingest ni endpoints sectoriales.

## Límite arquitectónico vigente

Los contactos de cada usuario continúan almacenados como un array JSON en `lx:contacts:<userId>`. Esta versión mejora integridad y semántica pero **no elimina el riesgo de lost update concurrente de Workers KV**. Una migración a almacenamiento coordinado/consistente se mantiene como cambio arquitectónico separado antes de habilitar colaboración o escala Pro.
