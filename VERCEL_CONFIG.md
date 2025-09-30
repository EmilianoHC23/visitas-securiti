# Configuración de Variables de Entorno para Vercel

## Variables requeridas en Vercel Dashboard:

### Base de Datos
DATABASE_URL=mongodb+srv://emilianohercha23_db_user:visitasdb@visitassecuriti.aupqtqb.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=VisitasSecuriTI

### Seguridad
JWT_SECRET=tu-clave-jwt-super-secreta-para-produccion-cambiar-por-algo-mas-seguro

### Entorno
NODE_ENV=production
VITE_ENVIRONMENT=production

### URL de la API (actualizar con tu dominio de Vercel)
VITE_PROD_API_URL=https://tu-app-name.vercel.app/api

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