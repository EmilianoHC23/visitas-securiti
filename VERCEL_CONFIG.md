# Configuración de Variables de Entorno para Vercel

## Variables requeridas en Vercel Dashboard:

### Base de Datos
DATABASE_URL=mongodb+srv://emilianohercha23_db_user:visitasdb@visitassecuriti.aupqtqb.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=VisitasSecuriTI

### Seguridad
JWT_SECRET=Prod_VisitasSecuriTI_2025_Ultra_Secure_JWT_Secret_Key_For_Production_Only!@#$%

### Entorno
NODE_ENV=production
VITE_ENVIRONMENT=production

### URL de la API (actualizar con tu dominio de Vercel)
VITE_PROD_API_URL=https://tu-app-name.vercel.app/api

### Configuración de Email (Nuevas Variables)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tuempresa.com
SMTP_PASS=tu-password-de-aplicacion
FRONTEND_URL=https://tu-app-name.vercel.app
ADMIN_EMAILS=admin@tuempresa.com,supervisor@tuempresa.com

---

## Pasos para configurar en Vercel:

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a Settings > Environment Variables
4. Agrega cada variable de arriba con su valor correspondiente
5. Asegúrate de seleccionar "Production" para las variables de producción

## Comando para deployment:
```bash
vercel --prod
```