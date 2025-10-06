#!/bin/bash

# 🚀 Script de configuración rápida para desarrollo
# Ejecutar desde el directorio raíz del proyecto

echo "🚀 Configurando Visitas SecuriTI para desarrollo..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm run install:all

echo "📝 Configurando archivos de entorno..."

# Configurar .env principal si no existe
if [ ! -f ".env" ]; then
    echo "NODE_ENV=development" > .env
    echo "✅ Archivo .env creado"
fi

# Configurar frontend/.env si no existe  
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:3001/api
VITE_EMAILJS_SERVICE_ID=service_vxjzajn
VITE_EMAILJS_TEMPLATE_ID=template_5oieypb
VITE_EMAILJS_PUBLIC_KEY=vvtUk70Pk2tlCBQ52
EOF
    echo "✅ Archivo frontend/.env creado con configuración EmailJS"
fi

# Configurar backend/.env si no existe
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/visitas-securiti
JWT_SECRET=desarrollo_jwt_secret_super_largo_y_seguro_para_desarrollo_local_2024
EMAILJS_SERVICE_ID=service_vxjzajn
EMAILJS_TEMPLATE_ID=template_5oieypb
EMAILJS_PUBLIC_KEY=vvtUk70Pk2tlCBQ52
EOF
    echo "✅ Archivo backend/.env creado"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar MongoDB (local o Atlas)"
echo "2. Ejecutar: npm run dev"
echo "3. Abrir: http://localhost:5173"
echo ""
echo "📚 Ver DESARROLLO.md para más detalles"