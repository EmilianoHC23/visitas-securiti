# 🚀 Despliegue en Vercel

## Configuración de Variables de Entorno

En el dashboard de Vercel, configura estas variables de entorno:

### Base de Datos
```
DATABASE_URL=mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti
MONGODB_URI=mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti
```

### Autenticación
```
JWT_SECRET=Prod_VisitasSecuriTI_2025_Ultra_Secure_JWT_Secret_Key_For_Production_Only!@#$%
```

### Email (Opcional - para envío de correos)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=tu-email@gmail.com
```

### Configuración
```
NODE_ENV=production
FRONTEND_URL=https://visitas-securiti.vercel.app/
```

## Pasos para Desplegar

1. **Conectar repositorio a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar Build Settings**
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (se ejecuta automáticamente)
   - **Output Directory**: `frontend/dist` (para el frontend)

3. **Configurar Environment Variables**
   - Agrega todas las variables mencionadas arriba

4. **Deploy**
   - Vercel detectará automáticamente la configuración del `vercel.json`
   - El backend se desplegará como serverless functions
   - El frontend se construirá y servirá estáticamente

## Verificación del Despliegue

Después del despliegue, verifica:

1. **Health Check**: `https://tu-app.vercel.app/api/health`
2. **Frontend**: `https://tu-app.vercel.app/`
3. **API**: `https://tu-app.vercel.app/api/auth/login`

## Troubleshooting

### Error de Build
- Asegúrate de que todas las dependencias estén en `package.json`
- Verifica que el `vercel.json` esté en la raíz

### Error de API
- Verifica las variables de entorno en Vercel
- Revisa los logs de functions en el dashboard de Vercel

### Error de Base de Datos
- Asegúrate de que la whitelist de MongoDB Atlas incluya `0.0.0.0/0`
- Verifica la cadena de conexión

## URLs de Producción

- **Frontend**: `https://visitas-securiti.vercel.app/`
- **API Base**: `https://visitas-securiti.vercel.app/api/`
- **Health Check**: `https://visitas-securiti.vercel.app/api/health`