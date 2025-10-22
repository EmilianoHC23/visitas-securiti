# Scripts de Mantenimiento

Esta carpeta contiene scripts de mantenimiento y utilidades para administración del sistema.

## 📜 Scripts Disponibles

### `reset-admin.js`
Resetea la contraseña del usuario administrador.

**Uso:**
```bash
cd backend
node scripts/reset-admin.js
```

**Credenciales por defecto:**
- Email: `admin@securiti.com`
- Password: `Admin2025!`

---

### `init-db-production.js`
Inicializa la base de datos de producción con datos básicos.

**Uso:**
```bash
cd backend
node scripts/init-db-production.js
```

**⚠️ ADVERTENCIA:** Solo ejecutar en primera instalación o para resetear la base de datos.

---

### `init-production-data.js`
Crea datos de ejemplo más completos para producción.

**Uso:**
```bash
cd backend
node scripts/init-production-data.js
```

---

### `test-email.js`
Prueba la configuración de email con Nodemailer.

**Uso:**
```bash
cd backend
node scripts/test-email.js
```

**Requisitos:**
- Variables de entorno: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

---

### `remove-qrcode-index.js`
Elimina el índice obsoleto `qrCode_1` de la colección `accesses`.

**Uso:**
```bash
cd backend
node scripts/remove-qrcode-index.js
```

**Contexto:**
- Este índice era de una versión anterior del modelo Access
- Ya fue ejecutado en producción (22 Oct 2025)
- Solo es necesario si encuentras errores de "duplicate key" con `qrCode: null`

---

## 🔒 Notas de Seguridad

- **NO** ejecutar estos scripts en producción sin revisar el código
- **SIEMPRE** hacer backup de la base de datos antes de ejecutar scripts de inicialización
- Los scripts que modifican usuarios requieren acceso directo a la base de datos

---

## 📝 Desarrollo

Para el desarrollo diario, usa los scripts en `src/init-db.js` que contiene datos de prueba seguros.
