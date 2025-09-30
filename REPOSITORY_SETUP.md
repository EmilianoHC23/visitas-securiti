# Configuración del Repositorio

## 📋 Información del proyecto
- **Nombre**: Visitas SecuriTI
- **Tecnologías**: React, TypeScript, Node.js, Express, MongoDB Atlas
- **Deployment**: Vercel
- **Base de datos**: MongoDB Atlas

## 🚀 Deploy automático con Vercel

### 1. Conectar repositorio a Vercel:
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno

### 2. Variables de entorno requeridas:
```env
DATABASE_URL=mongodb+srv://emilianohercha23_db_user:visitasdb@visitassecuriti.aupqtqb.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=VisitasSecuriTI
JWT_SECRET=tu-clave-jwt-super-secreta-para-produccion
NODE_ENV=production
VITE_ENVIRONMENT=production
```

## 🔄 Flujo de desarrollo

```bash
# Desarrollo local
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Después de aprobar, hacer merge a main
# Vercel desplegará automáticamente
```

## 📱 URLs importantes
- **Producción**: Se generará después del deploy en Vercel
- **Desarrollo**: 
  - Frontend: http://localhost:3000
  - Backend: http://localhost:3001