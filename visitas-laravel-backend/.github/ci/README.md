# CI helpers

Este archivo explica cómo usar los helpers de CI localmente y en GitHub Actions.

## Services

El fichero `docker-compose.ci.yml` define los servicios mínimos que el pipeline necesita:

- MySQL (puerto 3306)
- Redis (puerto 6379)
- MailHog (puerto 8025 - interfaz web)

### Levantar la pila localmente:

```powershell
# desde la raíz del proyecto
docker compose -f docker-compose.ci.yml up -d --build

# verifica que MySQL esté levantado
docker compose -f docker-compose.ci.yml ps
```

### Ejecutar la colección Postman con Newman (local):

```powershell
npm install -g newman

# Reemplaza las variables por las adecuadas
newman run docs/postman_collection.json --env-var "baseUrl=http://127.0.0.1:8000" --env-var "login_email=admin@example.com" --env-var "login_password=secret"
```

## Notas

- No guardes credenciales reales en el repo. Usa variables de entorno o secrets del CI.
- En GitHub Actions, el workflow `.github/workflows/newman.yml` prioriza `docker-compose.ci.yml` si existe.
