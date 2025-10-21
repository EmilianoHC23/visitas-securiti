# Documentación de la API (Visitas Securiti)

Esta documentación rápida está en español y describe los endpoints principales, formato de datos y notas operativas.

Notas generales
- Todas las rutas están bajo el prefijo `/api`.
- Autenticación: JWT. Obtener token en `POST /api/auth/login` y enviarlo en el header `Authorization: Bearer <token>`.
- Formato de fecha/hora: `YYYY-MM-DD HH:MM:SS` (por ejemplo `2025-10-16 09:30:00`). El backend también acepta `visit_date` + `visit_time` y los mapea a `scheduled_date`.

Endpoints principales

1) Autenticación
- POST /api/auth/register
  - Campos: `name`, `email`, `password`, `role` (opcional), `company_id` (opcional).
  - Respuesta: usuario creado (201) o errores de validación (422).

- POST /api/auth/login
  - Campos: `email`, `password`.
  - Respuesta: `{ "token": "..." }` (200) o 401 si credenciales inválidas.

2) Visits (visitas)
- GET /api/visits
  - Filtros opcionales: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `status`, `company_id`.
  - Respuesta: lista paginada de visitas.

- POST /api/visits
  - Campos:
    - `visitor_name` (string, obligatorio)
    - `visitor_email` (string, opcional)
    - `company_id` (int, opcional). Si se omite y el usuario autenticado pertenece a una empresa, se usará esa company.
    - `visit_date` (YYYY-MM-DD) y `visit_time` (HH:MM), o `scheduled_date` completo (YYYY-MM-DD HH:MM:SS)
    - `access_id` (int, opcional)
  - Respuesta:
    - 201 Created: objeto `visit` creado
    - 422 Unprocessable Entity: validación fallida

- PUT /api/visits/{id}
  - Actualiza una visita. Protegido por políticas (policies). Campos permitidos: `status`, `notes`, etc.

- DELETE /api/visits/{id}
  - Elimina una visita si el usuario tiene permisos.

3) Reports (reportes)
- GET /api/reports/visits-by-date
  - Parámetros opcionales: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
  - Respuesta: `[{ "date": "2025-10-16", "total": 12 }, ...]`

- GET /api/reports/visits-by-company
  - Parámetros opcionales: `from`, `to`, `status`.
  - Respuesta: `[{ "company_id": 1, "company_name": "ACME", "total": 20 }, ...]`.

- GET /api/reports/visits-by-status
  - Respuesta: `[{ "status": "pending", "total": 15 }, ...]`.

Colas y envío de emails
- Los correos se envían mediante Mailables y se encolan en la cola llamada `emails`.
- En desarrollo, el `.env` por defecto usa `MAIL_MAILER=log` (los mails aparecen en `storage/logs/laravel.log`) y `QUEUE_CONNECTION=sync` para ejecutar jobs inmediatamente.
- En staging/producción se recomienda usar `QUEUE_CONNECTION=database` o `redis` y levantar un worker:

```powershell
php artisan migrate
setx QUEUE_CONNECTION database
php artisan queue:work --queue=emails --sleep=3 --tries=3
```

Pruebas
- Ejecutar la suite de tests:

```powershell
php artisan test
```

Notas operativas
- Si cambias el driver de colas a `database`, ejecuta `php artisan migrate` para crear `jobs` y `failed_jobs`.
- Asegúrate de configurar `APP_DEBUG=false` en producción y de proteger las claves (`APP_KEY`, credenciales DB, credenciales SMTP).

Contacto
- Para desarrollo local: revisa el archivo `.env` en la raíz del proyecto para los valores de `MAIL_MAILER` y `QUEUE_CONNECTION`.

---
Generado automáticamente por el asistente. Si quieres, lo incorporo en el `README.md` o creo una versión más corta para la cabecera del repo.

Ejemplos rápidos (curl)

1) Login y obtener token:

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

Respuesta esperada:
```json
{ "token": "eyJ0eXAiOiJKV1QiLCJhbGci..." }
```

2) Crear una visita (usando token):

```bash
curl -X POST http://localhost/api/visits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"visitor_name":"Juan Perez","visit_date":"2025-10-20","visit_time":"09:00"}'
```

3) Obtener reportes por empresa con filtro de estado:

```bash
curl "http://localhost/api/reports/visits-by-company?status=pending" \
  -H "Authorization: Bearer <token>"
```

OpenAPI / Postman
- OpenAPI (YAML): `public/openapi.yaml` — contiene una especificación básica ampliada con schemas para `Visit`, `Company` y `User`.
- Puedes ver la documentación interactiva en: `GET /docs` (abre http://127.0.0.1:8000/docs después de ejecutar `php artisan serve`).
- Colección Postman: `docs/postman_collection.json` (importa en Postman y usa la variable `baseUrl`).

## Uso de la colección Postman con auto-login

La colección incluida en `docs/postman_collection.json` contiene un script de pre-request a nivel de colección que facilita pruebas locales: si la variable de colección `token` está vacía o expirada, el script realiza una petición a `POST /api/auth/login` usando las variables de colección `login_email` y `login_password`, guarda el token en la variable `token` y lo reutiliza en las peticiones siguientes en el header `Authorization: Bearer {{token}}`.

Pasos rápidos para usarla en Postman (GUI):

- Importa `docs/postman_collection.json` en Postman (File → Import).
- Abre la colección y ve a "Variables" (Collection → Variables). Ajusta al menos estas variables:
  - `baseUrl`: URL base de tu API (ej. `http://localhost:8000`)
  - `login_email`: email de un usuario válido (ej. `admin@example.com`)
  - `login_password`: contraseña del usuario (ej. `secret`)
  - `token`: deja vacío para que la colección haga login automáticamente la primera vez

- Importante: comprueba que las peticiones de la colección usan `{{baseUrl}}` y el header `Authorization: Bearer {{token}}` (las peticiones ya vienen configuradas así).

Cómo funciona el auto-login (resumen técnico):

- El script pre-request de la colección comprueba `pm.collectionVariables.get('token')`.
- Si está vacío, hace `pm.sendRequest` a `{{baseUrl}}/api/auth/login` con `login_email` y `login_password`.
- Si la respuesta contiene un token (campo `token`), lo guarda con `pm.collectionVariables.set('token', token)` y las siguientes peticiones usarán ese token.

Ejecutar la colección en CI (Newman)

Puedes ejecutar la colección en pipelines usando Newman. Ejemplo con variables en línea (recomendado usar secretos en CI):

```powershell
# instalar newman (si aún no está):
npm install -g newman

# ejecutar la colección pasando variables de entorno
newman run docs/postman_collection.json --env-var "baseUrl=http://localhost:8000" --env-var "login_email=admin@example.com" --env-var "login_password=secret"
```

Consejos y advertencias

- Enciende o reinicia workers/servicios que sean necesarios antes de ejecutar pruebas que dependan de colas o emails.
- No guardes credenciales reales en la colección dentro del repo. En CI, pasa `login_email`/`login_password` como secretos o variables de entorno.
- El token puede expirar según la configuración de JWT; si ves fallos 401, borra la variable `token` en la colección para forzar un nuevo login.

Si quieres, puedo añadir un pequeño ejemplo de job de GitHub Actions que instala Node.js y ejecuta Newman contra tu servidor de pruebas.

