# LeadX Public SaaS — API inventory

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/health` | No | Health, release y límite Free |
| GET | `/api/auth/session` | Cookie opcional | Estado de sesión |
| POST | `/api/auth/register` | No | Crear cuenta Free |
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/logout` | Cookie | Cerrar sesión |
| GET | `/api/contacts` | Sí | Listar contactos del usuario |
| POST | `/api/contacts` | Sí | Crear contacto; límite Free=100 |
| PATCH | `/api/contacts/:id` | Sí | Actualizar contacto propio |
| DELETE | `/api/contacts/:id` | Sí | Eliminar contacto propio |
| POST | `/api/pro-interest` | Sí | Registrar interés en Pro |

Seguridad activa: PBKDF2-SHA256 150k iteraciones, sesión aleatoria almacenada en KV, cookie `HttpOnly; Secure; SameSite=Lax`, CSP y rate limit de auth/escrituras. No hay endpoint de ingest ni endpoints sectoriales.
