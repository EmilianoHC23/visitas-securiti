Integration smoke guide

Este archivo contiene comandos `curl` y pasos rápidos para que el frontend o QA puedan ejecutar "smoke tests" contra el backend localmente.

Requisitos previos
- PHP 8.x y Composer instalados
- Configurar .env en `visitas-laravel-backend` (copiar .env.example)
  - APP_URL=http://127.0.0.1:8000
  - QUEUE_CONNECTION=sync (recomendado en dev)
- CORS: si frontend corre en otro origen, asegurarse que `config/cors.php` permita el origin del frontend o usar `*` en desarrollo.

Levantar backend

```powershell
cd c:\Users\Becario 2\Documents\visitas-securiti\visitas-laravel-backend
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Peticiones de ejemplo (curl)

1) Login (obtener token)

```bash
curl -X POST "http://127.0.0.1:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```
- Respuesta esperada: 200 con un campo `token` o `access_token`.

2) Me (usuario autenticado)

```bash
curl -X GET "http://127.0.0.1:8000/api/auth/me" -H "Authorization: Bearer <TOKEN>"
```

3) Crear visita (protegido)

```bash
curl -X POST "http://127.0.0.1:8000/api/visits" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "host_id": 1,
    "visitor_name": "Visitante Prueba",
    "visitor_email": "visitor@example.com",
    "company_id": 1,
    "visit_date": "2025-10-21",
    "visit_time": "09:00"
  }'
```
- Respuesta esperada: 201 con el objeto visita.

4) Checkin / Checkout (alias id-based)

```bash
curl -X POST "http://127.0.0.1:8000/api/visits/checkin/1" -H "Authorization: Bearer <TOKEN>"
curl -X POST "http://127.0.0.1:8000/api/visits/checkout/1" -H "Authorization: Bearer <TOKEN>"
```

5) Scan QR

```bash
curl -X POST "http://127.0.0.1:8000/api/visits/scan-qr" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"COMPANY-QR-123"}'
```
- Respuesta esperada: 200 con `company` o `visit` si existe.

6) Public visit (sin auth)

```bash
curl -X POST "http://127.0.0.1:8000/api/public/visit" \
  -H "Content-Type: application/json" \
  -d '{
    "host_id": 1,
    "visitor_name": "Public User",
    "visitor_email": "public@example.com",
    "company_id": 1,
    "visit_date": "2025-10-21",
    "visit_time": "10:00"
  }'
```
- Respuesta esperada: 201 con el objeto visita.

7) Invitaciones (crear, verify, complete, resend)

Crear (protegido):
```bash
curl -X POST "http://127.0.0.1:8000/api/invitations" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"invitee@example.com","first_name":"Invite","last_name":"Person","role":"host","company_id":1}'
```

Verify (public):
```bash
curl -X GET "http://127.0.0.1:8000/api/invitations/verify/<TOKEN>"
```

Complete (public):
```bash
curl -X POST "http://127.0.0.1:8000/api/invitations/complete" -H "Content-Type: application/json" -d '{"token":"<TOKEN>"}'
```

Resend (protegido):
```bash
curl -X POST "http://127.0.0.1:8000/api/invitations/resend/<USER_ID>" -H "Authorization: Bearer <TOKEN>"
```

Notas finales
- Si en local usas `QUEUE_CONNECTION=sync`, los mails no requieren workers; en producción usa `database`/`redis` y corre `php artisan queue:work`.
- Si el frontend espera claves de respuesta distintas (ej. `access_token` vs `token`) podemos añadir un wrapper en `AuthController@login` para devolver la forma esperada.
- Si necesitas un archivo Postman/Insomnia exportado, lo genero a partir de estas peticiones.

Si quieres, genero ahora la colección Postman o un archivo `curl.sh` con todos los comandos listos para ejecutar.
